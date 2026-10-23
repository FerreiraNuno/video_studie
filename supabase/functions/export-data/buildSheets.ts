/**
 * Turns the raw study_v2 rows into one CSV table per database table.
 *
 * Table names, column names and values are exactly those of the database
 * (the evaluators know them from the first collection); nothing is
 * relabelled or derived. The only filtering: rows written by the dev fast
 * mode (`dev_fast` end reasons) are test data and never exported.
 *
 * Pure and dependency-free so it can be unit-tested with Vitest; the Deno
 * entry point index.ts only adds the HTTP handling and the ZIP.
 */

export type Cell = string | number | boolean | null
export type Row = Record<string, unknown>

export interface Sheet {
  /** file name without extension = table name */
  name: string
  /** header row first */
  rows: Cell[][]
}

export const TABLES = ['form_data', 'progress', 'trial_plans', 'video_ratings', 'photo_ratings', 'final_ratings', 'ending_questions'] as const
export type TableName = typeof TABLES[number]
export type StudyData = Record<TableName, Row[]>

/** Column order as in the database; columns a row has beyond these are appended. */
const COLUMNS: Record<TableName, string[]> = {
  form_data: ['id', 'participant_number', 'study_group', 'gender', 'age', 'education', 'ethnicity', 'current_activity', 'current_activity_detail',
    'chronic_pain', 'pain_location', 'private_pain_experience', 'private_pain_relation', 'professional_pain_experience', 'professional_pain_activity',
    'context_order', 'wants_vp_hours', 'sona_id', 'created_at'],
  progress: ['participant_number', 'study_group', 'phase', 'position', 'updated_at'],
  trial_plans: ['participant_number', 'study_group', 'context_order', 'plan', 'created_at'],
  video_ratings: ['id', 'participant_number', 'study_group', 'video_index', 'video_filename', 'person_id', 'context', 'video_type', 'audio_type',
    'pain_rating', 'credibility_rating', 'difficulty_rating', 'action_rating', 'instruction_end_reason', 'trial_end_reason', 'created_at'],
  photo_ratings: ['id', 'participant_number', 'photo_index', 'photo_filename', 'trustworthiness', 'sympathy', 'aura', 'valence', 'attractiveness',
    'stress_level', 'empathy', 'created_at'],
  final_ratings: ['id', 'participant_number', 'exaggeration', 'faking', 'understating', 'suppression', 'bus_empathy', 'doctor_empathy', 'pension_empathy',
    'study_purpose', 'created_at'],
  ending_questions: ['id', 'participant_number', 'is_informed', 'wants_deletion', 'agrees_silence', 'created_at'],
}

/** Sort key per table: participant first, then the position within the participant's data. */
const ORDER: Record<TableName, string[]> = {
  form_data: ['participant_number'],
  progress: ['participant_number'],
  trial_plans: ['participant_number'],
  video_ratings: ['participant_number', 'video_index'],
  photo_ratings: ['participant_number', 'photo_index'],
  final_ratings: ['participant_number'],
  ending_questions: ['participant_number'],
}

/** Rows written by the dev fast mode are test data and never exported. */
export function isTestRow (row: Row): boolean {
  return row.instruction_end_reason === 'dev_fast' || row.trial_end_reason === 'dev_fast'
}

function toCell (v: unknown): Cell {
  if (v === null || v === undefined) return null
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v
  return JSON.stringify(v)   // jsonb columns (progress.position, trial_plans.plan)
}

function compareBy (keys: string[]) {
  return (a: Row, b: Row) => {
    for (const key of keys) {
      const x = a[key], y = b[key]
      if (typeof x === 'number' && typeof y === 'number') {
        if (x !== y) return x - y
      } else {
        const c = String(x ?? '').localeCompare(String(y ?? ''), 'en', { numeric: true })
        if (c !== 0) return c
      }
    }
    return 0
  }
}

export function buildSheets (data: StudyData): Sheet[] {
  return TABLES.map(table => {
    const rows = data[table].filter(r => !isTestRow(r)).sort(compareBy(ORDER[table]))
    const columns = [...COLUMNS[table]]
    for (const row of rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key)
    return {
      name: table,
      rows: [columns, ...rows.map(row => columns.map(column => toCell(row[column])))],
    }
  })
}

/**
 * CSV as German Excel opens it by double-click: UTF-8 with BOM, semicolon
 * separated, CRLF line ends, fields quoted when needed.
 */
export function toCsv (sheet: Sheet): string {
  const cell = (v: Cell): string => {
    if (v === null) return ''
    const text = String(v)
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return '﻿' + sheet.rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n'
}
