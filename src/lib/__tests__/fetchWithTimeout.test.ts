import { describe, it, expect, vi } from 'vitest'
import { createFetchWithTimeout } from '../fetchWithTimeout'

function hangingFetch () {
  return (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal!.reason))
  })
}

describe('createFetchWithTimeout', () => {
  it('passes a successful response through', async () => {
    const base = vi.fn(async () => new Response('ok'))
    const f = createFetchWithTimeout(base, 50)
    const res = await f('https://example.test')
    expect(await res.text()).toBe('ok')
    expect(base.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('rejects once the timeout elapses', async () => {
    vi.useFakeTimers()
    try {
      const f = createFetchWithTimeout(hangingFetch(), 100)
      const pending = f('https://example.test')
      const result = pending.then(() => 'resolved', e => e)
      await vi.advanceTimersByTimeAsync(100)
      const err = await result
      expect(err).toBeInstanceOf(DOMException)
      expect((err as DOMException).name).toBe('TimeoutError')
    } finally {
      vi.useRealTimers()
    }
  })

  it('honours an abort from the caller', async () => {
    const f = createFetchWithTimeout(hangingFetch(), 10000)
    const controller = new AbortController()
    const pending = f('https://example.test', { signal: controller.signal }).then(() => 'resolved', e => e)
    controller.abort(new Error('caller'))
    expect(await pending).toEqual(new Error('caller'))
  })
})
