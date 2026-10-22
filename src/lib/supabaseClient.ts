import { createClient } from '@supabase/supabase-js'

/**
 * All study data collected after the balancing fix (October 2026) lives in the
 * Postgres schema `study_v2`. The original tables in `public` are kept
 * untouched as the archive of the first data collection.
 * The schema must exist (see supabase/migrations) and be listed under
 * "Exposed schemas" in the Supabase API settings.
 */
export const STUDY_SCHEMA = 'study_v2'

export const supabase = createClient(import.meta.env.VITE_API_BACKEND_URL, import.meta.env.VITE_API_BACKEND_KEY, {
  db: { schema: STUDY_SCHEMA }
})
