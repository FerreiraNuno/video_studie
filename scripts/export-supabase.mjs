#!/usr/bin/env node
/**
 * Exports every study table from Supabase as JSON files.
 *
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=<anon key> \
 *     node scripts/export-supabase.mjs <output directory>
 *
 * Locally the values from .env.local can be reused:
 *   set -a; . ./.env.local; set +a
 *   SUPABASE_URL=$VITE_API_BACKEND_URL SUPABASE_KEY=$VITE_API_BACKEND_KEY node scripts/export-supabase.mjs backups/$(date +%F)
 *
 * The anon key is enough because RLS is disabled on the study tables (see CLAUDE.md).
 * Output: <dir>/<schema>/<table>.json (array of rows) plus <dir>/manifest.json with row counts.
 * Rows are fetched in pages of 1000 ordered by the table's key, so tables of any size are complete.
 * Exits non-zero on the first error so a CI job fails loudly instead of uploading a partial backup.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SCHEMAS = {
  // active collection
  study_v2: {
    form_data: 'id',
    progress: 'participant_number',
    trial_plans: 'participant_number',
    video_ratings: 'id',
    photo_ratings: 'id',
    final_ratings: 'id',
    ending_questions: 'id',
  },
  // archive of the first collection (June 2025 – Oct 2026); static, but cheap to keep
  public: {
    form_data: 'id',
    progress: 'participant_number',
    video_ratings: 'id',
    photo_ratings: 'id',
    final_ratings: 'id',
    ending_questions: 'id',
  },
}

const PAGE = 1000

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY
const outDir = process.argv[2]

if (!url || !key || !outDir) {
  console.error('usage: SUPABASE_URL=... SUPABASE_KEY=... node scripts/export-supabase.mjs <output directory>')
  process.exit(2)
}

async function fetchTable (schema, table, orderBy) {
  const rows = []
  for (let offset = 0; ; offset += PAGE) {
    const query = `${url}/rest/v1/${table}?select=*&order=${orderBy}&offset=${offset}&limit=${PAGE}`
    const res = await fetch(query, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': schema },
    })
    if (!res.ok) {
      throw new Error(`${schema}.${table}: HTTP ${res.status} ${await res.text()}`)
    }
    const page = await res.json()
    rows.push(...page)
    if (page.length < PAGE) return rows
  }
}

const manifest = { exported_at: new Date().toISOString(), source: url, tables: {} }

for (const [schema, tables] of Object.entries(SCHEMAS)) {
  await mkdir(join(outDir, schema), { recursive: true })
  for (const [table, orderBy] of Object.entries(tables)) {
    const rows = await fetchTable(schema, table, orderBy)
    await writeFile(join(outDir, schema, `${table}.json`), JSON.stringify(rows, null, 1))
    manifest.tables[`${schema}.${table}`] = rows.length
    console.log(`${schema}.${table}: ${rows.length} rows`)
  }
}

await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`done → ${outDir}`)
