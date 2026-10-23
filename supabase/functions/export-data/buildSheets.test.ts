import { describe, it, expect } from 'vitest'
import { buildSheets, toCsv, describePerson, personIdFromFilename, trialValidity, type StudyData } from './buildSheets'

const data: StudyData = {
  form_data: [{
    participant_number: '101', study_group: 'CDM', gender: 'weiblich', age: 30, education: 'abitur', ethnicity: 'x',
    current_activity: 'studierende', current_activity_detail: 'Biologie', chronic_pain: false, pain_location: null,
    private_pain_experience: true, private_pain_relation: 'Mutter', professional_pain_experience: false, professional_pain_activity: null,
    wants_vp_hours: true, sona_id: '12345', context_order: 'doctor,bus,pension', created_at: '2026-10-23T08:00:00+00:00',
  }],
  progress: [{ participant_number: '101', study_group: 'CDM', phase: 5, updated_at: '2026-10-23T10:30:00+00:00', position: null }],
  trial_plans: [{
    participant_number: '101', study_group: 'CDM', context_order: 'doctor,bus,pension',
    plan: { contextOrder: ['doctor', 'bus', 'pension'], trials: [
      { position: 2, context: 'doctor', personId: 'm_o_u_5', videoType: 'unspecific', audioType: 'strong_pain', filename: 'male_old_unspecific_05.mp4' },
      { position: 1, context: 'doctor', personId: 'f_y_p_1', videoType: 'pain-specific', audioType: 'no_pain', filename: 'female_young_pain_01.mp4' },
    ] },
  }],
  video_ratings: [
    { participant_number: '101', study_group: 'CDM', video_index: 13, context: 'bus', person_id: 'f_o_u_6', video_type: 'unspecific', audio_type: 'slight_pain',
      pain_rating: 3, credibility_rating: 4, difficulty_rating: 5, action_rating: 6, instruction_end_reason: 'ended', trial_end_reason: 'audio_ended',
      video_filename: 'female_old_unspecific_06', created_at: '2026-10-23T09:00:00+00:00' },
    { participant_number: '101', study_group: 'CDM', video_index: 1, context: 'doctor', person_id: 'f_y_p_1', video_type: 'pain-specific', audio_type: 'no_pain',
      pain_rating: 1, credibility_rating: 2, difficulty_rating: 3, action_rating: null, instruction_end_reason: 'ended', trial_end_reason: 'timer',
      video_filename: 'female_young_pain_01', created_at: '2026-10-23T08:10:00+00:00' },
    { participant_number: '101', study_group: 'CDM', video_index: 2, context: 'doctor', person_id: 'm_o_u_5', video_type: 'unspecific', audio_type: 'strong_pain',
      pain_rating: 9, credibility_rating: 9, difficulty_rating: 1, action_rating: 2, instruction_end_reason: null, trial_end_reason: null,
      video_filename: 'male_old_unspecific_05', created_at: '2026-10-23T08:11:00+00:00' },
    { participant_number: '199', study_group: 'CDM', video_index: 1, context: 'bus', person_id: 'f_y_p_2', video_type: 'pain-specific', audio_type: 'no_pain',
      pain_rating: 5, credibility_rating: 5, difficulty_rating: 5, action_rating: 5, instruction_end_reason: 'dev_fast', trial_end_reason: 'dev_fast',
      video_filename: 'female_young_pain_02', created_at: '2026-10-23T08:12:00+00:00' },
  ],
  photo_ratings: [{
    participant_number: '101', photo_index: 1, photo_filename: 'male_young_unspecific_07', trustworthiness: 1, sympathy: 2, aura: 3, valence: 4,
    attractiveness: 5, stress_level: 6, empathy: 7, created_at: '2026-10-23T10:00:00+00:00',
  }],
  final_ratings: [{ participant_number: '101', exaggeration: 1, faking: 2, understating: 3, suppression: 4, bus_empathy: 5, doctor_empathy: 6, pension_empathy: 7, study_purpose: 'Kontext', created_at: '2026-10-23T10:20:00+00:00' }],
  ending_questions: [{ participant_number: '101', is_informed: 'ja', wants_deletion: 'nein', agrees_silence: 'ja', created_at: '2026-10-23T10:30:00+00:00' }],
}

describe('buildSheets', () => {
  const sheets = buildSheets(data)
  const sheet = (name: string) => sheets.find(s => s.name === name)!

  it('produces the six German tables', () => {
    expect(sheets.map(s => s.name)).toEqual(['Teilnehmende', 'Videobewertungen', 'Fotobewertungen', 'Abschlussfragen', 'Nachbefragung', 'Videoplan'])
  })

  it('encodes CSV the way German Excel opens it: BOM, semicolons, CRLF, quoting', () => {
    const csv = toCsv({ name: 'x', rows: [['Probandennummer', 'Text'], ['101', 'mit; Semikolon und "Anführung"'], ['102', null]] })
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv.slice(1)).toBe('Probandennummer;Text\r\n101;"mit; Semikolon und ""Anführung"""' + '\r\n102;\r\n')
    const nachbefragung = toCsv(sheet('Nachbefragung')).split('\r\n')
    expect(nachbefragung[0]).toBe('\uFEFFProbandennummer;Über Hintergrund aufgeklärt;Löschung gewünscht;Stillschweigen zugesagt;Zeitpunkt')
    expect(nachbefragung[1]).toBe('101;ja;nein;ja;2026-10-23 10:30')
  })

  it('joins the questionnaire with the participant\'s progress and spells out codes', () => {
    const [header, row] = sheet('Teilnehmende').rows
    const col = (name: string) => row[header.indexOf(name)]
    expect(col('Probandennummer')).toBe('101')
    expect(col('Gruppe')).toBe('CDM (1xx)')
    expect(col('Alter')).toBe(30)
    expect(col('Chronische Schmerzen')).toBe('nein')
    expect(col('Schmerzen im privaten Umfeld')).toBe('ja')
    expect(col('Kontextreihenfolge')).toBe('Arztpraxis → Bus → Rentenstelle')
    expect(col('Stand')).toBe('abgeschlossen')
    expect(col('Letzte Aktivität')).toBe('2026-10-23 10:30')
  })

  it('lists video ratings in presentation order, labelled, with a validity verdict, without test rows', () => {
    const [header, ...rows] = sheet('Videobewertungen').rows
    const col = (r: typeof rows[number], name: string) => r[header.indexOf(name)]
    expect(rows).toHaveLength(3)   // the dev_fast row of 199 is gone
    expect(rows.map(r => col(r, 'Position'))).toEqual([1, 2, 13])
    expect(rows.map(r => col(r, 'Kontextblock'))).toEqual([1, 1, 2])
    expect(col(rows[0], 'Kontext')).toBe('Arztpraxis')
    expect(col(rows[0], 'Geschlecht Person')).toBe('weiblich')
    expect(col(rows[0], 'Alter Person')).toBe('jung')
    expect(col(rows[0], 'Mimik (Schmerz im Gesicht)')).toBe('ja')
    expect(col(rows[0], 'Selbstbericht')).toBe('kein Schmerz')
    expect(col(rows[0], 'Gültig')).toBe('nein')                        // ended by timer
    expect(col(rows[1], 'Gültig')).toBe('unklar (Seite neu geladen)')  // both reasons null
    expect(col(rows[2], 'Gültig')).toBe('ja')
    expect(col(rows[2], 'Handlung (nur CDM)')).toBe(6)
    expect(col(rows[0], 'Handlung (nur CDM)')).toBeNull()
  })

  it('derives the person from the photo filename and flattens the plan', () => {
    const [header, row] = sheet('Fotobewertungen').rows
    expect(row[header.indexOf('Person')]).toBe('m_y_u_7')
    expect(row[header.indexOf('Mitleid')]).toBe(7)

    const plan = sheet('Videoplan').rows
    expect(plan).toHaveLength(3)
    expect(plan[1].slice(0, 4)).toEqual(['101', 1, 'Arztpraxis', 'f_y_p_1'])
    expect(plan[2].slice(0, 4)).toEqual(['101', 2, 'Arztpraxis', 'm_o_u_5'])
  })

  it('exports the final and debrief answers', () => {
    expect(sheet('Abschlussfragen').rows[1]).toEqual(['101', 1, 2, 3, 4, 5, 6, 7, 'Kontext', '2026-10-23 10:20'])
    expect(sheet('Nachbefragung').rows[1]).toEqual(['101', 'ja', 'nein', 'ja', '2026-10-23 10:30'])
  })
})

describe('helpers', () => {
  it('describePerson / personIdFromFilename / trialValidity', () => {
    expect(describePerson('m_o_p_3')).toEqual({ gender: 'männlich', age: 'alt' })
    expect(describePerson('nonsense')).toEqual({ gender: null, age: null })
    expect(personIdFromFilename('female_old_unspecific_05.png')).toBe('f_o_u_5')
    expect(personIdFromFilename('male_young_pain_01')).toBe('m_y_p_1')
    expect(trialValidity('ended', 'audio_ended')).toBe('ja')
    expect(trialValidity('timer', 'audio_ended')).toBe('nein')
    expect(trialValidity('ended', 'dev_fast')).toBe('Testlauf')
    expect(trialValidity(null, null)).toBe('unklar (Seite neu geladen)')
  })
})
