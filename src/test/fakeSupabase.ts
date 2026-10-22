/**
 * In-memory stand-in for the Supabase client, covering exactly the surface
 * the app uses (see src/useSupabase.store.ts):
 *
 *   from(t).insert(row)                       → { error }
 *   from(t).upsert(row, { onConflict })       → { error }
 *   from(t).select(cols).eq(k, v)…maybeSingle → { data, error }
 *
 * Rows are kept per table; the natural keys mirror the unique indexes of
 * supabase/migrations/20261022_03 and _06, so an insert of a duplicate key
 * fails with Postgres' 23505 like the real database does. Failures can be
 * injected per table and operation to exercise retry and error paths.
 *
 * Component tests get it through `vi.mock('@/lib/supabaseClient', …)`; the
 * module-level `fakeDb` is the instance those mocks hand to the app.
 */

export type FakeRow = Record<string, unknown>

export interface FakeError { message: string, code?: string }

export const FAKE_UNIQUE_KEYS: Record<string, string[]> = {
  form_data: ['participant_number'],
  progress: ['participant_number'],
  trial_plans: ['participant_number'],
  video_ratings: ['participant_number', 'video_index'],
  photo_ratings: ['participant_number', 'photo_filename'],
  final_ratings: ['participant_number'],
  ending_questions: ['participant_number'],
}

type Op = 'insert' | 'upsert' | 'select'

export interface FakeSupabase {
  from (table: string): FakeQuery
  /** all rows of a table, in insertion order (upserts keep their slot) */
  rows (table: string): FakeRow[]
  /** replaces the rows of a table */
  seed (table: string, rows: FakeRow[]): void
  /** every call made so far, in order */
  calls: Array<{ table: string, op: Op, row?: FakeRow }>
  /** makes the next `times` operations of that kind on the table fail */
  failNext (table: string, op: Op, times?: number, error?: FakeError): void
  reset (): void
}

interface FakeQuery {
  insert (row: FakeRow): PromiseLike<{ error: FakeError | null }>
  upsert (row: FakeRow, options: { onConflict: string }): PromiseLike<{ error: FakeError | null }>
  select (columns?: string): FakeSelect
}

interface FakeSelect {
  eq (column: string, value: unknown): FakeSelect
  maybeSingle (): Promise<{ data: FakeRow | null, error: FakeError | null }>
}

function keyOf (table: string, row: FakeRow): string {
  const columns = FAKE_UNIQUE_KEYS[table] ?? ['id']
  return columns.map(c => String(row[c])).join('|')
}

export function createFakeSupabase (): FakeSupabase {
  const tables = new Map<string, FakeRow[]>()
  const failures: Array<{ table: string, op: Op, times: number, error: FakeError }> = []
  const calls: FakeSupabase['calls'] = []

  function rowsOf (table: string): FakeRow[] {
    let rows = tables.get(table)
    if (!rows) {
      rows = []
      tables.set(table, rows)
    }
    return rows
  }

  function takeFailure (table: string, op: Op): FakeError | null {
    const i = failures.findIndex(f => f.table === table && f.op === op && f.times > 0)
    if (i < 0) return null
    failures[i].times--
    return failures[i].error
  }

  function from (table: string): FakeQuery {
    return {
      insert (row) {
        calls.push({ table, op: 'insert', row })
        const failure = takeFailure(table, 'insert')
        if (failure) return Promise.resolve({ error: failure })
        const rows = rowsOf(table)
        const key = keyOf(table, row)
        if (rows.some(r => keyOf(table, r) === key)) {
          return Promise.resolve({ error: { message: `duplicate key value violates unique constraint (${table})`, code: '23505' } })
        }
        rows.push({ ...row })
        return Promise.resolve({ error: null })
      },
      upsert (row, options) {
        calls.push({ table, op: 'upsert', row })
        const failure = takeFailure(table, 'upsert')
        if (failure) return Promise.resolve({ error: failure })
        const rows = rowsOf(table)
        const columns = options.onConflict.split(',').map(c => c.trim())
        const key = columns.map(c => String(row[c])).join('|')
        const index = rows.findIndex(r => columns.map(c => String(r[c])).join('|') === key)
        if (index >= 0) rows[index] = { ...rows[index], ...row }
        else rows.push({ ...row })
        return Promise.resolve({ error: null })
      },
      select () {
        const filters: Array<[string, unknown]> = []
        const query: FakeSelect = {
          eq (column, value) {
            filters.push([column, value])
            return query
          },
          async maybeSingle () {
            calls.push({ table, op: 'select' })
            const failure = takeFailure(table, 'select')
            if (failure) return { data: null, error: failure }
            const match = rowsOf(table).find(r => filters.every(([c, v]) => r[c] === v))
            return { data: match ? { ...match } : null, error: null }
          },
        }
        return query
      },
    }
  }

  return {
    from,
    rows: table => rowsOf(table).map(r => ({ ...r })),
    seed: (table, rows) => { tables.set(table, rows.map(r => ({ ...r }))) },
    calls,
    failNext (table, op, times = 1, error = { message: `injected ${op} failure on ${table}`, code: 'XX000' }) {
      failures.push({ table, op, times, error })
    },
    reset () {
      tables.clear()
      failures.length = 0
      calls.length = 0
    },
  }
}

/** Shared instance for `vi.mock('@/lib/supabaseClient', …)` factories. */
export const fakeDb = createFakeSupabase()
