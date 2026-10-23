import { describe, it, expect } from 'vitest'
import { buildSheets, toCsv, isTestRow, TABLES, type StudyData } from './buildSheets'

const data: StudyData = {
  form_data: [{ id: 7, participant_number: '101', study_group: 'CDM', gender: 'weiblich', age: 30, chronic_pain: false, sona_id: null, created_at: '2026-10-23T08:00:00+00:00' }],
  progress: [{ participant_number: '101', study_group: 'CDM', phase: 2, position: { phase: 2, progressIndex: 6, videoIndex: 0 }, updated_at: '2026-10-23T10:30:00+00:00' }],
  trial_plans: [{ participant_number: '101', study_group: 'CDM', context_order: 'doctor,bus,pension', plan: { contextOrder: ['doctor', 'bus', 'pension'], trials: [] }, created_at: '2026-10-23T08:00:00+00:00' }],
  video_ratings: [
    { id: 3, participant_number: '101', study_group: 'CDM', video_index: 13, context: 'bus', pain_rating: 3, instruction_end_reason: 'ended', trial_end_reason: 'audio_ended', created_at: 'c' },
    { id: 1, participant_number: '101', study_group: 'CDM', video_index: 1, context: 'doctor', pain_rating: 1, instruction_end_reason: 'ended', trial_end_reason: 'timer', created_at: 'a' },
    { id: 2, participant_number: '101', study_group: 'CDM', video_index: 2, context: 'doctor', pain_rating: 9, instruction_end_reason: null, trial_end_reason: null, created_at: 'b' },
    { id: 4, participant_number: '199', study_group: 'CDM', video_index: 1, context: 'bus', pain_rating: 5, instruction_end_reason: 'dev_fast', trial_end_reason: 'dev_fast', created_at: 'd' },
    { id: 5, participant_number: '99', study_group: 'CDM', video_index: 1, context: 'bus', pain_rating: 5, instruction_end_reason: 'ended', trial_end_reason: 'audio_ended', created_at: 'e' },
  ],
  photo_ratings: [],
  final_ratings: [],
  ending_questions: [{ id: 1, participant_number: '101', is_informed: 'ja', wants_deletion: 'nein', agrees_silence: 'ja', created_at: '2026-10-23T10:30:00+00:00', extra_column: 'x' }],
}

describe('buildSheets', () => {
  const sheets = buildSheets(data)
  const sheet = (name: string) => sheets.find(s => s.name === name)!

  it('exports every database table under its own name with its own column names', () => {
    expect(sheets.map(s => s.name)).toEqual([...TABLES])
    expect(sheet('video_ratings').rows[0]).toEqual([
      'id', 'participant_number', 'study_group', 'video_index', 'video_filename', 'person_id', 'context', 'video_type', 'audio_type',
      'pain_rating', 'credibility_rating', 'difficulty_rating', 'action_rating', 'instruction_end_reason', 'trial_end_reason', 'created_at',
    ])
  })

  it('keeps raw values, orders by participant and index, drops dev_fast rows, appends unknown columns', () => {
    const [header, ...rows] = sheet('video_ratings').rows
    const col = (r: typeof rows[number], name: string) => r[header.indexOf(name)]
    expect(rows.map(r => [col(r, 'participant_number'), col(r, 'video_index')])).toEqual([['99', 1], ['101', 1], ['101', 2], ['101', 13]])
    expect(col(rows[1], 'trial_end_reason')).toBe('timer')
    expect(col(rows[2], 'instruction_end_reason')).toBeNull()
    expect(col(rows[1], 'video_filename')).toBeNull()   // column missing in the row → empty, not an error

    const [formHeader, formRow] = sheet('form_data').rows
    expect(formRow[formHeader.indexOf('chronic_pain')]).toBe(false)
    expect(formRow[formHeader.indexOf('age')]).toBe(30)

    const [endingHeader] = sheet('ending_questions').rows
    expect(endingHeader.at(-1)).toBe('extra_column')
  })

  it('writes jsonb columns as JSON text and header-only files for empty tables', () => {
    const [header, row] = sheet('progress').rows
    expect(row[header.indexOf('position')]).toBe('{"phase":2,"progressIndex":6,"videoIndex":0}')
    expect(sheet('photo_ratings').rows).toHaveLength(1)
    expect(sheet('photo_ratings').rows[0][0]).toBe('id')
  })

  it('encodes CSV the way German Excel opens it: BOM, semicolons, CRLF, quoting', () => {
    const csv = toCsv({ name: 'x', rows: [['participant_number', 'text'], ['101', 'mit; Semikolon und "Anführung"'], ['102', null], ['103', true]] })
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv.slice(1)).toBe('participant_number;text\r\n101;"mit; Semikolon und ""Anführung"""\r\n102;\r\n103;true\r\n')
    const progress = toCsv(sheet('progress')).split('\r\n')
    expect(progress[0]).toBe('﻿participant_number;study_group;phase;position;updated_at')
    expect(progress[1]).toBe('101;CDM;2;"{""phase"":2,""progressIndex"":6,""videoIndex"":0}";2026-10-23T10:30:00+00:00')
  })

  it('isTestRow', () => {
    expect(isTestRow({ trial_end_reason: 'dev_fast' })).toBe(true)
    expect(isTestRow({ trial_end_reason: 'audio_ended' })).toBe(false)
  })
})
