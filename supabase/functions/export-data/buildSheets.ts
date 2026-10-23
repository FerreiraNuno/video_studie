/**
 * Turns the raw study_v2 rows into the evaluators' tables, one CSV each.
 *
 * Pure and dependency-free so it can be unit-tested with Vitest (the Deno
 * entry point index.ts only adds the HTTP handling and the ZIP). Everything
 * the evaluators see is German and self-explanatory: labels instead of
 * codes and one "Gültig" column instead of two end-reason codes.
 */

export type Cell = string | number | boolean | null
export type Row = Record<string, unknown>

export interface Sheet {
  /** file name without extension */
  name: string
  /** header row first */
  rows: Cell[][]
}

export interface StudyData {
  form_data: Row[]
  progress: Row[]
  trial_plans: Row[]
  video_ratings: Row[]
  photo_ratings: Row[]
  final_ratings: Row[]
  ending_questions: Row[]
}

const GROUP_LABEL: Record<string, string> = { CDM: 'CDM (1xx)', SCT: 'SCT (2xx)', KG: 'KG (3xx)' }
const CONTEXT_LABEL: Record<string, string> = { bus: 'Bus', doctor: 'Arztpraxis', pension: 'Rentenstelle' }
const AUDIO_LABEL: Record<string, string> = { no_pain: 'kein Schmerz', slight_pain: 'leichter Schmerz', strong_pain: 'starker Schmerz' }
const VIDEO_TYPE_LABEL: Record<string, string> = { 'pain-specific': 'ja', unspecific: 'nein' }
const PHASE_LABEL: Record<number, string> = {
  1: 'Fragebogen (Teil 1)',
  2: 'Videos (Teil 2)',
  3: 'Fotos (Teil 3)',
  4: 'Aufklärung',
  5: 'abgeschlossen',
}

const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v))
const num = (v: unknown): number | null => (typeof v === 'number' ? v : v === null || v === undefined || v === '' ? null : Number(v))
const bool = (v: unknown): string | null => (v === null || v === undefined ? null : v ? 'ja' : 'nein')
const label = (map: Record<string, string>, v: unknown): string | null => (v === null || v === undefined ? null : (map[String(v)] ?? String(v)))

/** `2026-10-22T23:26:32.257642+00:00` → `2026-10-22 23:26` (UTC) */
function timestamp (v: unknown): string | null {
  if (!v) return null
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

/** Person attributes encoded in the catalog id, e.g. `f_y_p_1` → weiblich, jung, Schmerzmimik. */
export function describePerson (personId: unknown): { gender: string | null, age: string | null } {
  const m = /^([fm])_([yo])_([pu])_\d+$/.exec(String(personId ?? ''))
  if (!m) return { gender: null, age: null }
  return { gender: m[1] === 'f' ? 'weiblich' : 'männlich', age: m[2] === 'y' ? 'jung' : 'alt' }
}

/** Human verdict on how the stimulus ended. */
export function trialValidity (instructionEnd: unknown, trialEnd: unknown): string {
  if (instructionEnd === 'dev_fast' || trialEnd === 'dev_fast') return 'Testlauf'
  if (instructionEnd === null && trialEnd === null) return 'unklar (Seite neu geladen)'
  if (instructionEnd === 'ended' && trialEnd === 'audio_ended') return 'ja'
  return 'nein'
}

const byParticipant = (a: Row, b: Row) => String(a.participant_number).localeCompare(String(b.participant_number))
const byParticipantAndIndex = (key: string) => (a: Row, b: Row) =>
  byParticipant(a, b) || (num(a[key]) ?? 0) - (num(b[key]) ?? 0)

/** Rows written by the dev fast mode are test data and never exported. */
export function isTestRow (row: Row): boolean {
  return row.instruction_end_reason === 'dev_fast' || row.trial_end_reason === 'dev_fast'
}

export function buildSheets (data: StudyData): Sheet[] {
  const progressByParticipant = new Map(data.progress.map(p => [String(p.participant_number), p]))
  const videoRatings = data.video_ratings.filter(r => !isTestRow(r)).sort(byParticipantAndIndex('video_index'))

  const teilnehmende: Sheet = {
    name: 'Teilnehmende',
    rows: [[
      'Probandennummer', 'Gruppe', 'Geschlecht', 'Alter', 'Bildungsabschluss', 'Ethnizität', 'Tätigkeit', 'Tätigkeit (Detail)',
      'Chronische Schmerzen', 'Schmerzort', 'Schmerzen im privaten Umfeld', 'Beziehung zur Person',
      'Beruflicher Kontakt mit Schmerzpatient:innen', 'Berufliche Tätigkeit', 'VP-Stunden gewünscht', 'SONA-ID',
      'Kontextreihenfolge', 'Stand', 'Fragebogen ausgefüllt', 'Letzte Aktivität',
    ]],
  }
  for (const f of [...data.form_data].sort(byParticipant)) {
    const p = progressByParticipant.get(String(f.participant_number))
    const phase = num(p?.phase)
    teilnehmende.rows.push([
      str(f.participant_number), label(GROUP_LABEL, f.study_group), str(f.gender), num(f.age), str(f.education), str(f.ethnicity),
      str(f.current_activity), str(f.current_activity_detail), bool(f.chronic_pain), str(f.pain_location),
      bool(f.private_pain_experience), str(f.private_pain_relation), bool(f.professional_pain_experience), str(f.professional_pain_activity),
      bool(f.wants_vp_hours), str(f.sona_id),
      str(f.context_order)?.split(',').map(c => CONTEXT_LABEL[c] ?? c).join(' → ') ?? null,
      phase === null ? null : (PHASE_LABEL[phase] ?? `Phase ${phase}`), timestamp(f.created_at), timestamp(p?.updated_at),
    ])
  }

  const videobewertungen: Sheet = {
    name: 'Videobewertungen',
    rows: [[
      'Probandennummer', 'Gruppe', 'Position', 'Kontextblock', 'Kontext', 'Person', 'Geschlecht Person', 'Alter Person',
      'Mimik (Schmerz im Gesicht)', 'Selbstbericht', 'Schmerzintensität', 'Glaubhaftigkeit', 'Schwierigkeit', 'Handlung (nur CDM)',
      'Gültig', 'Video (Datei)', 'Zeitpunkt',
    ]],
  }
  for (const r of videoRatings) {
    const person = describePerson(r.person_id)
    const position = num(r.video_index)
    videobewertungen.rows.push([
      str(r.participant_number), label(GROUP_LABEL, r.study_group), position, position === null ? null : Math.floor((position - 1) / 12) + 1,
      label(CONTEXT_LABEL, r.context), str(r.person_id), person.gender, person.age,
      label(VIDEO_TYPE_LABEL, r.video_type), label(AUDIO_LABEL, r.audio_type),
      num(r.pain_rating), num(r.credibility_rating), num(r.difficulty_rating), num(r.action_rating),
      trialValidity(r.instruction_end_reason ?? null, r.trial_end_reason ?? null), str(r.video_filename), timestamp(r.created_at),
    ])
  }

  const fotobewertungen: Sheet = {
    name: 'Fotobewertungen',
    rows: [[
      'Probandennummer', 'Position', 'Person', 'Geschlecht Person', 'Alter Person',
      'Vertrauenswürdigkeit', 'Sympathie', 'Ausstrahlung', 'Eindruck', 'Attraktivität', 'Stresslevel', 'Mitleid', 'Zeitpunkt', 'Foto (Datei)',
    ]],
  }
  for (const r of [...data.photo_ratings].sort(byParticipantAndIndex('photo_index'))) {
    const personId = personIdFromFilename(r.photo_filename)
    const person = describePerson(personId)
    fotobewertungen.rows.push([
      str(r.participant_number), num(r.photo_index), personId, person.gender, person.age,
      num(r.trustworthiness), num(r.sympathy), num(r.aura), num(r.valence), num(r.attractiveness), num(r.stress_level), num(r.empathy),
      timestamp(r.created_at), str(r.photo_filename),
    ])
  }

  const abschlussfragen: Sheet = {
    name: 'Abschlussfragen',
    rows: [[
      'Probandennummer', 'Übertrieben', 'Vorgetäuscht', 'Untertrieben', 'Unterdrückt',
      'Hineinversetzen: Bus', 'Hineinversetzen: Arztpraxis / IT-Firma', 'Hineinversetzen: Rentenstelle / Reinigungskraft',
      'Vermuteter Studienzweck', 'Zeitpunkt',
    ]],
  }
  for (const r of [...data.final_ratings].sort(byParticipant)) {
    abschlussfragen.rows.push([
      str(r.participant_number), num(r.exaggeration), num(r.faking), num(r.understating), num(r.suppression),
      num(r.bus_empathy), num(r.doctor_empathy), num(r.pension_empathy), str(r.study_purpose), timestamp(r.created_at),
    ])
  }

  const nachbefragung: Sheet = {
    name: 'Nachbefragung',
    rows: [['Probandennummer', 'Über Hintergrund aufgeklärt', 'Löschung gewünscht', 'Stillschweigen zugesagt', 'Zeitpunkt']],
  }
  for (const r of [...data.ending_questions].sort(byParticipant)) {
    nachbefragung.rows.push([str(r.participant_number), str(r.is_informed), str(r.wants_deletion), str(r.agrees_silence), timestamp(r.created_at)])
  }

  const videoplan: Sheet = {
    name: 'Videoplan',
    rows: [['Probandennummer', 'Position', 'Kontext', 'Person', 'Mimik (Schmerz im Gesicht)', 'Selbstbericht', 'Video (Datei)']],
  }
  for (const t of [...data.trial_plans].sort(byParticipant)) {
    const plan = t.plan as { trials?: Row[] } | null
    for (const trial of [...(plan?.trials ?? [])].sort((a, b) => (num(a.position) ?? 0) - (num(b.position) ?? 0))) {
      videoplan.rows.push([
        str(t.participant_number), num(trial.position), label(CONTEXT_LABEL, trial.context), str(trial.personId),
        label(VIDEO_TYPE_LABEL, trial.videoType), label(AUDIO_LABEL, trial.audioType), str(trial.filename),
      ])
    }
  }

  return [teilnehmende, videobewertungen, fotobewertungen, abschlussfragen, nachbefragung, videoplan]
}

/** `female_young_pain_01` → `f_y_p_1` (same rule as the carry-over migration). */
export function personIdFromFilename (filename: unknown): string | null {
  const m = /^(female|male)_(young|old)_(pain|unspecific)_(\d+)/.exec(String(filename ?? ''))
  if (!m) return null
  return `${m[1][0]}_${m[2][0]}_${m[3][0]}_${Number(m[4])}`
}

/**
 * CSV as German Excel opens it by double-click: UTF-8 with BOM, semicolon
 * separated, CRLF line ends, fields quoted when needed. Numbers keep the
 * decimal point (ratings are integers, so this never matters).
 */
export function toCsv (sheet: Sheet): string {
  const cell = (v: Cell): string => {
    if (v === null) return ''
    const text = typeof v === 'boolean' ? (v ? 'ja' : 'nein') : String(v)
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return '\uFEFF' + sheet.rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n'
}
