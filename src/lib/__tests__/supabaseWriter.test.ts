import { describe, it, expect, vi } from 'vitest'
import { createSupabaseWriter, UNIQUE_VIOLATION, type WriterClient } from '../supabaseWriter'

function fakeClient (result: { error: { message: string, code?: string } | null }) {
  const insert = vi.fn(async () => result)
  const upsert = vi.fn(async () => result)
  const client: WriterClient = { from: () => ({ insert, upsert }) }
  return { client, insert, upsert }
}

describe('createSupabaseWriter', () => {
  it('upserts the resume tables on their key', async () => {
    const { client, insert, upsert } = fakeClient({ error: null })
    const write = createSupabaseWriter(client, ['progress', 'trial_plans'])

    const result = await write('progress', { participant_number: '1', phase: 2 }, 'participant_number')

    expect(result).toEqual({ error: null })
    expect(upsert).toHaveBeenCalledWith({ participant_number: '1', phase: 2 }, { onConflict: 'participant_number' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('plain-inserts write-only data tables', async () => {
    const { client, insert, upsert } = fakeClient({ error: null })
    const write = createSupabaseWriter(client, ['progress'])

    await write('video_ratings', { participant_number: '1', video_index: 3 }, 'participant_number,video_index')

    expect(insert).toHaveBeenCalledTimes(1)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('treats a unique violation as success (the earlier attempt reached the server)', async () => {
    const { client } = fakeClient({ error: { message: 'duplicate key value', code: UNIQUE_VIOLATION } })
    const write = createSupabaseWriter(client, [])

    expect(await write('video_ratings', { participant_number: '1', video_index: 3 }, 'participant_number,video_index'))
      .toEqual({ error: null })
  })

  it('passes other errors through', async () => {
    const { client } = fakeClient({ error: { message: 'row-level security', code: '42501' } })
    const write = createSupabaseWriter(client, [])

    expect(await write('video_ratings', { participant_number: '1', video_index: 3 }, 'participant_number,video_index'))
      .toEqual({ error: { message: 'row-level security', code: '42501' } })
  })
})
