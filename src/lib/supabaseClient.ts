import { createClient } from '@supabase/supabase-js'
import { createFetchWithTimeout } from './fetchWithTimeout'
import type { Database } from './database.types'

/**
 * All study data collected after the balancing fix (October 2026) lives in the
 * Postgres schema `study_v2`. The original tables in `public` are kept
 * untouched as the archive of the first data collection.
 * The schema must exist (see supabase/migrations) and be listed under
 * "Exposed schemas" in the Supabase API settings.
 */
export const STUDY_SCHEMA = 'study_v2'

// Typed from the generated schema (src/lib/database.types.ts, `npm run types:db`):
// table and column names in queries are checked at compile time.
export const supabase = createClient<Database, typeof STUDY_SCHEMA>(import.meta.env.VITE_API_BACKEND_URL, import.meta.env.VITE_API_BACKEND_KEY, {
  db: { schema: STUDY_SCHEMA },
  // Every request gives up after a fixed time (see fetchWithTimeout.ts), so a
  // stalled connection becomes an error that is retried instead of a hang.
  global: { fetch: createFetchWithTimeout((input, init) => fetch(input, init)) },
})
