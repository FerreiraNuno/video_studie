// @vitest-environment happy-dom
/**
 * Every column the app writes must exist in the migrations.
 *
 * The first collection lost 96 participants' photo ratings because the app
 * inserted a column (`empathy`) the table did not have yet. Until the client
 * is typed from the database, this test is the guard: it runs every save
 * function of the store against the in-memory fake and checks the keys of
 * the resulting rows against the columns declared in supabase/migrations.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateTrialPlan } from '@/utils/trialPlan'
import { allVideos } from '@/utils/videoManager'
import { fakeDb } from '@/test/fakeSupabase'
import { loginTestParticipant, seededRandom, flushPromises } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

const MIGRATIONS_DIR = join(__dirname, '../../supabase/migrations')
const SQL_TYPES = /^(bigint|integer|text|boolean|timestamptz|jsonb)\b/

/** Columns per study_v2 table, from `create table` bodies and `add column` statements, in file order. */
function columnsFromMigrations (): Map<string, Set<string>> {
  const columns = new Map<string, Set<string>>()
  const add = (table: string, column: string) => {
    if (!columns.has(table)) columns.set(table, new Set())
    columns.get(table)!.add(column)
  }
  const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    for (const match of sql.matchAll(/create table if not exists study_v2\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
      const [, table, body] = match
      for (const line of body.split('\n')) {
        const m = line.trim().match(/^(\w+)\s+(.*)$/)
        if (m && SQL_TYPES.test(m[2])) add(table, m[1])
      }
    }
    for (const match of sql.matchAll(/alter table study_v2\.(\w+)([^;]*);/g)) {
      const [, table, body] = match
      for (const col of body.matchAll(/add column if not exists (\w+)/g)) add(table, col[1])
    }
  }
  return columns
}

describe('store writes vs. migrations', () => {
  it('parses the migrations', () => {
    const columns = columnsFromMigrations()
    expect([...columns.keys()].sort()).toEqual(['ending_questions', 'final_ratings', 'form_data', 'photo_ratings', 'progress', 'trial_plans', 'video_ratings'])
    expect(columns.get('video_ratings')).toContain('trial_end_reason')
    expect(columns.get('form_data')).toContain('sona_id')
  })

  it('writes only columns that exist, and the natural key of every table', async () => {
    fakeDb.reset()
    const { supabaseStore } = loginTestParticipant('101', 'CDM')
    const plan = generateTrialPlan(allVideos, seededRandom(1))

    await supabaseStore.saveUserData({
      wantsVPHours: true, sonaId: '12345', gender: 'weiblich', age: 30, education: 'abitur', ethnicity: 'x',
      currentActivity: 'studierende', currentActivityDetail: 'Biologie', chronicPain: false, painLocation: '',
      privatePainExperience: true, privatePainRelation: 'Mutter', professionalPainExperience: false, professionalPainActivity: '',
    }, plan.contextOrder.join(','))
    await supabaseStore.saveTrialPlan(plan)
    await supabaseStore.saveProgress(2, { phase: 2, progressIndex: 6, videoIndex: 0 })
    await supabaseStore.saveRating({ pain: 1, credibility: 2, difficulty: 3, action: 4 }, plan.trials[0], { instructionEndReason: 'ended', trialEndReason: 'audio_ended' })
    await supabaseStore.savePhotoRating(0, { trustworthiness: 1, sympathy: 2, aura: 3, valence: 4, attractiveness: 5, stressLevel: 6, empathy: 7 }, 'female_young_pain_01.png')
    await supabaseStore.saveFinalRatings({ exaggeration: 1, faking: 2, understating: 3, suppression: 4, bus_empathy: 5, doctor_empathy: 6, pension_empathy: 7, study_purpose: 'x' })
    await supabaseStore.saveEndingQuestions({ isInformed: 'ja', wantsDeletion: 'nein', agreesSilence: 'ja' })
    await flushPromises()

    const columns = columnsFromMigrations()
    const written = fakeDb.calls.filter(c => c.row)
    expect(written.map(c => c.table).sort()).toEqual(['ending_questions', 'final_ratings', 'form_data', 'photo_ratings', 'progress', 'trial_plans', 'video_ratings'])
    for (const { table, row } of written) {
      const declared = columns.get(table)
      expect(declared, `table ${table} is not in the migrations`).toBeDefined()
      const unknown = Object.keys(row!).filter(column => !declared!.has(column))
      expect(unknown, `columns written to ${table} that no migration declares`).toEqual([])
      expect(row).toHaveProperty('participant_number', '101')
    }
  })
})
