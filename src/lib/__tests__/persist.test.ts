import { describe, it, expect, vi } from 'vitest'
import { createPersister, rowKey, type KeyValueStorage, type Writer, type Row } from '../persist'

function memoryStorage (): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: k => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v) },
    removeItem: k => { map.delete(k) },
  }
}

const silentLog = { warn: () => {}, error: () => {}, info: () => {} }
const noSleep = async () => {}

/** Writer that fails the first `failures` calls, then records every successful row. */
function flakyWriter (failures: number) {
  const written: Array<{ table: string, row: Row, onConflict: string }> = []
  let calls = 0
  const writer: Writer = async (table, row, onConflict) => {
    calls++
    if (calls <= failures) return { error: { message: 'network down' } }
    written.push({ table, row, onConflict })
    return { error: null }
  }
  return { writer, written, calls: () => calls }
}

describe('persister', () => {
  it('writes immediately when the backend works and leaves no outbox', async () => {
    const storage = memoryStorage()
    const w = flakyWriter(0)
    const p = createPersister({ writer: w.writer, storage, sleep: noSleep, log: silentLog })

    const result = await p.persist('101', 'video_ratings', { participant_number: '101', video_index: 1 }, 'participant_number,video_index')

    expect(result).toEqual({ error: null, queued: false })
    expect(w.written).toHaveLength(1)
    expect(p.pendingCount('101')).toBe(0)
    expect(storage.map.size).toBe(0)
  })

  it('retries transient failures and succeeds without touching the outbox afterwards', async () => {
    const storage = memoryStorage()
    const w = flakyWriter(2)
    const p = createPersister({ writer: w.writer, storage, sleep: noSleep, retryDelaysMs: [1, 1, 1], log: silentLog })

    const result = await p.persist('101', 'video_ratings', { participant_number: '101', video_index: 7 }, 'participant_number,video_index')

    expect(result.error).toBeNull()
    expect(w.calls()).toBe(3)
    expect(w.written).toHaveLength(1)
    expect(p.pendingCount('101')).toBe(0)
  })

  it('keeps the row in the outbox when every attempt fails, and recovers it on flush', async () => {
    const storage = memoryStorage()
    const w = flakyWriter(10)
    const p = createPersister({ writer: w.writer, storage, sleep: noSleep, retryDelaysMs: [1, 1], log: silentLog })

    const row = { participant_number: '202', photo_index: 3, sympathy: 5 }
    const result = await p.persist('202', 'photo_ratings', row, 'participant_number,photo_index')

    expect(result.queued).toBe(true)
    expect(result.error?.message).toBe('network down')
    expect(p.pendingCount('202')).toBe(1)
    expect(w.written).toHaveLength(0)

    // Simulate a later session: the same outbox contents, backend healthy again.
    const w2 = flakyWriter(0)
    const p2 = createPersister({ writer: w2.writer, storage, sleep: noSleep, log: silentLog })
    const remaining = await p2.flush('202')

    expect(remaining).toBe(0)
    expect(w2.written).toEqual([{ table: 'photo_ratings', row, onConflict: 'participant_number,photo_index' }])
    expect(p2.pendingCount('202')).toBe(0)
  })

  it('parks the row in the outbox before the first request is sent', async () => {
    const storage = memoryStorage()
    let outboxSizeDuringWrite = -1
    const writer: Writer = async () => {
      outboxSizeDuringWrite = storage.map.size
      return { error: null }
    }
    const p = createPersister({ writer, storage, sleep: noSleep, log: silentLog })

    await p.persist('303', 'progress', { participant_number: '303', phase: 2 }, 'participant_number')

    expect(outboxSizeDuringWrite).toBe(1)
    expect(storage.map.size).toBe(0)
  })

  it('deduplicates outbox entries by natural key so a re-submit cannot double a row', async () => {
    const storage = memoryStorage()
    const w = flakyWriter(100)
    const p = createPersister({ writer: w.writer, storage, sleep: noSleep, retryDelaysMs: [], log: silentLog })

    await p.persist('404', 'video_ratings', { participant_number: '404', video_index: 5, pain_rating: 3 }, 'participant_number,video_index')
    await p.persist('404', 'video_ratings', { participant_number: '404', video_index: 5, pain_rating: 4 }, 'participant_number,video_index')
    await p.persist('404', 'video_ratings', { participant_number: '404', video_index: 6, pain_rating: 4 }, 'participant_number,video_index')

    const outbox = p.readOutbox('404')
    expect(outbox).toHaveLength(2)
    expect(outbox.map(e => e.row.video_index)).toEqual([5, 6])
    expect(outbox[0].row.pain_rating).toBe(4)
  })

  it('isolates outboxes per participant', async () => {
    const storage = memoryStorage()
    const w = flakyWriter(100)
    const p = createPersister({ writer: w.writer, storage, sleep: noSleep, retryDelaysMs: [], log: silentLog })

    await p.persist('111', 'progress', { participant_number: '111', phase: 2 }, 'participant_number')
    await p.persist('222', 'progress', { participant_number: '222', phase: 3 }, 'participant_number')

    expect(p.pendingCount('111')).toBe(1)
    expect(p.pendingCount('222')).toBe(1)
    expect(p.readOutbox('111')[0].row.phase).toBe(2)
  })

  it('works without storage (private mode) by still retrying', async () => {
    const w = flakyWriter(1)
    const p = createPersister({ writer: w.writer, storage: null, sleep: noSleep, retryDelaysMs: [1], log: silentLog })

    const result = await p.persist('101', 'progress', { participant_number: '101', phase: 2 }, 'participant_number')

    expect(result.error).toBeNull()
    expect(w.written).toHaveLength(1)
  })

  it('treats a throwing writer like a failed attempt', async () => {
    const storage = memoryStorage()
    const writer = vi.fn<Writer>()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({ error: null })
    const p = createPersister({ writer, storage, sleep: noSleep, retryDelaysMs: [1], log: silentLog })

    const result = await p.persist('101', 'progress', { participant_number: '101', phase: 2 }, 'participant_number')

    expect(result.error).toBeNull()
    expect(writer).toHaveBeenCalledTimes(2)
  })
})

describe('rowKey', () => {
  it('is built from the conflict columns only', () => {
    expect(rowKey('video_ratings', { participant_number: '1', video_index: 2, pain_rating: 9 }, 'participant_number, video_index'))
      .toBe('video_ratings|1|2')
  })
})
