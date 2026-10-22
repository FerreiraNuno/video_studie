import type { Writer } from './persist'

/**
 * Minimal subset of the Supabase client used by the writer (keeps tests free of the real client).
 */
export interface WriterClient {
  from (table: string): {
    insert (row: Record<string, unknown>): PromiseLike<{ error: { message: string, code?: string } | null }>
    upsert (row: Record<string, unknown>, options: { onConflict: string }): PromiseLike<{ error: { message: string, code?: string } | null }>
  }
}

/** Postgres: unique_violation */
export const UNIQUE_VIOLATION = '23505'

/**
 * Builds the persister's writer on top of the Supabase client.
 *
 * Two kinds of tables (see supabase/migrations/20261022_04_row_level_security.sql):
 *
 *  - `upsertTables` (progress, trial_plans) are readable for the anon key and
 *    legitimately change over the session → `upsert` on their key.
 *  - every other table is write-only for the anon key: no SELECT policy. An
 *    `INSERT … ON CONFLICT DO UPDATE` is refused there, so these rows are
 *    written with a plain insert. A unique violation on a retry means the
 *    earlier attempt did reach the server (only its response was lost), so it
 *    is reported as success – that is exactly the idempotency the retry needs.
 */
export function createSupabaseWriter (client: WriterClient, upsertTables: Iterable<string>): Writer {
  const upsert = new Set(upsertTables)
  return async (table, row, onConflict) => {
    const query = client.from(table)
    const { error } = upsert.has(table)
      ? await query.upsert(row, { onConflict })
      : await query.insert(row)
    if (!error || error.code === UNIQUE_VIOLATION) return { error: null }
    return { error: { message: error.message, code: error.code } }
  }
}
