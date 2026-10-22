/**
 * In-memory PostgREST behind `page.route`, covering what supabase-js sends
 * for the app's calls: insert and upsert (POST), filtered selects (GET).
 * Rows live in the Node test process, so they survive page reloads within a
 * test. Natural keys mirror the unique indexes of the migrations; a duplicate
 * insert answers 409 with Postgres' 23505 exactly like the real API.
 */
import type { Page, Route } from '@playwright/test'

export type Row = Record<string, unknown>

const UNIQUE_KEYS: Record<string, string[]> = {
  form_data: ['participant_number'],
  progress: ['participant_number'],
  trial_plans: ['participant_number'],
  video_ratings: ['participant_number', 'video_index'],
  photo_ratings: ['participant_number', 'photo_filename'],
  final_ratings: ['participant_number'],
  ending_questions: ['participant_number'],
}

export interface FakePostgrest {
  rows (table: string): Row[]
  /** every request handled, in order */
  log: Array<{ method: string, table: string, status: number }>
}

export async function installFakePostgrest (page: Page): Promise<FakePostgrest> {
  const tables = new Map<string, Row[]>()
  const log: FakePostgrest['log'] = []
  const rowsOf = (table: string) => {
    if (!tables.has(table)) tables.set(table, [])
    return tables.get(table)!
  }
  const keyOf = (columns: string[], row: Row) => columns.map(c => String(row[c])).join('|')

  async function handle (route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/rest/v1/')[1]?.split('/')[0] ?? ''
    const method = request.method()
    const reply = (status: number, body: unknown) => {
      log.push({ method, table, status })
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    }

    if (method === 'GET') {
      const result = rowsOf(table).filter(row =>
        [...url.searchParams.entries()].every(([column, filter]) => {
          if (['select', 'limit', 'offset', 'order', 'on_conflict'].includes(column)) return true
          const [op, ...rest] = filter.split('.')
          const value = rest.join('.')
          if (op !== 'eq') throw new Error(`fake PostgREST: unsupported filter ${column}=${filter}`)
          return String(row[column]) === value
        }))
      return reply(200, result)
    }

    if (method === 'POST') {
      const body = request.postDataJSON()
      const incoming: Row[] = Array.isArray(body) ? body : [body]
      const prefer = request.headers()['prefer'] ?? ''
      const rows = rowsOf(table)
      if (prefer.includes('resolution=merge-duplicates')) {
        const columns = (url.searchParams.get('on_conflict') ?? 'id').split(',')
        for (const row of incoming) {
          const index = rows.findIndex(r => keyOf(columns, r) === keyOf(columns, row))
          if (index >= 0) rows[index] = { ...rows[index], ...row }
          else rows.push({ ...row })
        }
        return reply(200, incoming)
      }
      const columns = UNIQUE_KEYS[table] ?? ['id']
      for (const row of incoming) {
        if (rows.some(r => keyOf(columns, r) === keyOf(columns, row))) {
          return reply(409, {
            code: '23505',
            message: `duplicate key value violates unique constraint "${table}_uidx"`,
            details: `Key (${columns.join(', ')})=(${columns.map(c => row[c]).join(', ')}) already exists.`,
            hint: null,
          })
        }
        rows.push({ ...row })
      }
      return reply(201, incoming)
    }

    return reply(405, { message: `fake PostgREST: ${method} not supported` })
  }

  await page.route('**/supabase/rest/v1/**', handle)
  return { rows: table => rowsOf(table).map(r => ({ ...r })), log }
}
