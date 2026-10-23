/**
 * Edge Function `export-data`: the evaluators' data download.
 *
 *   POST { password }  →  schmerzbeurteilung_daten_<date>.zip
 *                         (one CSV per table: video_ratings.csv, …)
 *
 * The browser never sees a database key: this function holds the service
 * role key (injected by Supabase as SUPABASE_SERVICE_ROLE_KEY) and compares
 * the typed password with the EXPORT_PASSWORD secret. On success it reads
 * every study_v2 table and returns one ZIP with a CSV per table (built in
 * buildSheets.ts). The page that calls it is /daten.html of the study app.
 *
 * Deploy:   npx supabase functions deploy export-data --project-ref ctsptoeoypyrtoxuujlv
 * Password: npx supabase secrets set EXPORT_PASSWORD='…' --project-ref ctsptoeoypyrtoxuujlv
 */
import { createClient } from 'npm:@supabase/supabase-js@2.47.16'
import { zipSync, strToU8 } from 'npm:fflate@0.8.2'
import { buildSheets, toCsv, TABLES, type Row, type StudyData } from './buildSheets.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PAGE = 1000

function json (status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

/** Compares two strings without leaking their length or position of difference through timing. */
async function passwordsMatch (given: string, expected: string): Promise<boolean> {
  const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function fetchAll (client: ReturnType<typeof createClient>, table: string): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select('*').range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data as Row[]))
    if (data.length < PAGE) return rows
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json(405, { error: 'Nur POST.' })

  const expected = Deno.env.get('EXPORT_PASSWORD')
  if (!expected) return json(500, { error: 'Der Export ist nicht eingerichtet (EXPORT_PASSWORD fehlt).' })

  let given = ''
  try {
    const body = await req.json()
    given = String(body?.password ?? '')
  } catch {
    return json(400, { error: 'Ungültige Anfrage.' })
  }

  if (!given || !(await passwordsMatch(given, expected))) {
    await new Promise(resolve => setTimeout(resolve, 800))   // slows down guessing
    return json(401, { error: 'Das Passwort ist nicht richtig.' })
  }

  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    db: { schema: 'study_v2' },
    auth: { persistSession: false },
  })

  const data = {} as StudyData
  try {
    for (const table of TABLES) data[table] = await fetchAll(client, table)
  } catch (e) {
    console.error('export-data: read failed', e)
    return json(502, { error: 'Die Daten konnten nicht gelesen werden. Bitte später erneut versuchen.' })
  }

  const files: Record<string, Uint8Array> = {}
  for (const sheet of buildSheets(data)) files[`${sheet.name}.csv`] = strToU8(toCsv(sheet))
  const bytes = zipSync(files, { level: 6 })
  const filename = `schmerzbeurteilung_daten_${new Date().toISOString().slice(0, 10)}.zip`

  return new Response(bytes, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
})
