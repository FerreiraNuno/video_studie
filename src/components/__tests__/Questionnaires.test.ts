// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, enableAutoUnmount, type VueWrapper } from '@vue/test-utils'
import Login from '../Login.vue'
import PhaseOne from '../PhaseOne.vue'
import FinalQuestions from '../PhaseThreeComponents/FinalQuestions.vue'
import EndingQuestions from '../EndingQuestions.vue'
import Ending from '../Ending.vue'
import { PHASE } from '@/useProgress.store'
import { generateTrialPlan } from '@/utils/trialPlan'
import { allVideos, clearTrialPlan, getTrialPlan } from '@/utils/videoManager'
import { fakeDb } from '@/test/fakeSupabase'
import { loginTestParticipant, seededRandom, flushPromises } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

// Unmount after each test: a component left mounted keeps reacting to the
// shared plan/photo state the next test resets.
enableAutoUnmount(afterEach)

beforeEach(() => {
  fakeDb.reset()
  localStorage.clear()
  clearTrialPlan()
})

describe('Login', () => {
  async function login (wrapper: VueWrapper, number: string, password = 'klinPsych') {
    await wrapper.find('#participantNumber').setValue(number)
    await wrapper.find('#password').setValue(password)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('derives the group from the first digit and enters the saved phase', async () => {
    fakeDb.seed('progress', [{ participant_number: '245', study_group: 'SCT', phase: 3, position: { phase: 3, progressIndex: 9, photoIndex: 4 } }])
    const { pinia, supabaseStore, progressStore } = loginTestParticipant()
    supabaseStore.isAuthenticated = false
    const wrapper = mount(Login, { global: { plugins: [pinia] } })
    await login(wrapper, '245')

    expect(supabaseStore.isAuthenticated).toBe(true)
    expect(supabaseStore.user).toEqual({ participantNumber: '245', group: 'SCT' })
    expect(progressStore.phase).toBe(3)
    expect(progressStore.position).toEqual({ phase: 3, progressIndex: 9, photoIndex: 4 })
  })

  it('starts a new participant at the questionnaire and rejects a wrong password or number', async () => {
    const { pinia, supabaseStore, progressStore } = loginTestParticipant()
    supabaseStore.isAuthenticated = false
    const wrapper = mount(Login, { global: { plugins: [pinia] } })

    await login(wrapper, '123', 'wrong')
    expect(wrapper.text()).toContain('Passwort ist ungültig')
    expect(supabaseStore.isAuthenticated).toBe(false)

    await login(wrapper, '923')
    expect(wrapper.text()).toContain('gültige 3-stellige Probandennummer')

    await login(wrapper, '123')
    expect(supabaseStore.isAuthenticated).toBe(true)
    expect(progressStore.phase).toBe(PHASE.questionnaire)
  })

  it('keeps the participant on the login page when progress cannot be read', async () => {
    fakeDb.failNext('progress', 'select')
    const { pinia, supabaseStore, progressStore } = loginTestParticipant()
    supabaseStore.isAuthenticated = false
    const wrapper = mount(Login, { global: { plugins: [pinia] } })
    await login(wrapper, '123')

    expect(supabaseStore.isAuthenticated).toBe(false)
    expect(progressStore.phase).toBeUndefined()
    expect(wrapper.text()).toContain('Verbindung zum Server ist fehlgeschlagen')
  })

  it('delivers an outbox left by an earlier session before reading the resume point', async () => {
    fakeDb.seed('progress', [{ participant_number: '123', study_group: 'CDM', phase: 2, position: { phase: 2, progressIndex: 6, videoIndex: 0 } }])
    const newer = { participant_number: '123', study_group: 'CDM', phase: 2, position: { phase: 2, progressIndex: 60, videoIndex: 24 } }
    localStorage.setItem('studyOutbox:123', JSON.stringify([
      { table: 'progress', row: newer, onConflict: 'participant_number', queuedAt: '2026-10-22T10:00:00.000Z' },
      { table: 'video_ratings', row: { participant_number: '123', video_index: 24, pain_rating: 1 }, onConflict: 'participant_number,video_index', queuedAt: '2026-10-22T10:00:00.000Z' },
    ]))
    const { pinia, supabaseStore, progressStore } = loginTestParticipant()
    supabaseStore.isAuthenticated = false
    const wrapper = mount(Login, { global: { plugins: [pinia] } })
    await login(wrapper, '123')

    const ops = fakeDb.calls.map(c => `${c.op}:${c.table}`)
    expect(ops.indexOf('upsert:progress')).toBeLessThan(ops.indexOf('select:progress'))
    expect(progressStore.position).toEqual(newer.position)
    expect(fakeDb.rows('video_ratings')).toHaveLength(1)
    expect(localStorage.getItem('studyOutbox:123')).toBeNull()
  })
})

describe('PhaseOne', () => {
  async function fillAndSubmit (wrapper: VueWrapper, overrides: { age?: string } = {}) {
    const radios = wrapper.findAll('input[type=radio]')
    await radios[0].setValue(true)                        // consent: yes
    await wrapper.find('select').setValue('weiblich')
    await wrapper.find('input[type=number]').setValue(overrides.age ?? '30')
    const selects = wrapper.findAll('select')
    await selects[1].setValue('abitur')
    await wrapper.find('input[type=text]').setValue('keine Angabe')   // ethnicity
    await selects[2].setValue('auszubildende')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('saves the questionnaire with a balanced plan and moves to phase 2', async () => {
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.questionnaire)
    const wrapper = mount(PhaseOne, { global: { plugins: [pinia] } })
    await fillAndSubmit(wrapper)

    expect(progressStore.phase).toBe(PHASE.videos)
    const plan = getTrialPlan()
    expect(plan).not.toBeNull()
    expect(fakeDb.rows('trial_plans')[0]).toMatchObject({ participant_number: '101', plan, context_order: plan!.contextOrder.join(',') })
    expect(fakeDb.rows('form_data')[0]).toMatchObject({
      participant_number: '101', study_group: 'CDM', gender: 'weiblich', age: 30, education: 'abitur',
      current_activity: 'auszubildende', wants_vp_hours: false, sona_id: null, context_order: plan!.contextOrder.join(','),
    })
  })

  it('rejects an age that is not an integer between 18 and 64', async () => {
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.questionnaire)
    const wrapper = mount(PhaseOne, { global: { plugins: [pinia] } })
    await fillAndSubmit(wrapper, { age: '25.5' })
    expect(wrapper.text()).toContain('ganze Zahl zwischen 18 und 64')
    expect(progressStore.phase).toBe(PHASE.questionnaire)
    expect(fakeDb.rows('form_data')).toHaveLength(0)
  })

  it('reuses a plan already saved for the participant number', async () => {
    const saved = generateTrialPlan(allVideos, seededRandom(9))
    fakeDb.seed('trial_plans', [{ participant_number: '101', study_group: 'CDM', context_order: saved.contextOrder.join(','), plan: saved }])
    const { pinia } = loginTestParticipant('101', 'CDM', PHASE.questionnaire)
    const wrapper = mount(PhaseOne, { global: { plugins: [pinia] } })
    await fillAndSubmit(wrapper)

    expect(getTrialPlan()).toEqual(saved)
    expect(fakeDb.rows('trial_plans')[0].plan).toEqual(saved)
    expect(fakeDb.rows('form_data')[0].context_order).toBe(saved.contextOrder.join(','))
  })

  it('does not generate a plan when the existing one cannot be read', async () => {
    fakeDb.failNext('trial_plans', 'select')
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.questionnaire)
    const wrapper = mount(PhaseOne, { global: { plugins: [pinia] } })
    await fillAndSubmit(wrapper)

    expect(wrapper.text()).toContain('Fehler beim Laden der Videozuteilung')
    expect(getTrialPlan()).toBeNull()
    expect(fakeDb.rows('trial_plans')).toHaveLength(0)
    expect(progressStore.phase).toBe(PHASE.questionnaire)
  })
})

describe('FinalQuestions', () => {
  async function setAllSliders (wrapper: VueWrapper, value: number) {
    for (const input of wrapper.findAll('input[type=range]')) await input.setValue(String(value))
  }

  it('gates each step on its answers, asks the group-specific empathy questions and saves everything', async () => {
    const { pinia, progressStore } = loginTestParticipant('201', 'SCT', PHASE.photos)
    const wrapper = mount(FinalQuestions, { global: { plugins: [pinia] } })
    const button = () => wrapper.find('button.next-button')

    expect(wrapper.findAll('input[type=range]')).toHaveLength(4)
    expect(button().attributes('disabled')).toBeDefined()
    await setAllSliders(wrapper, 3)
    expect(button().attributes('disabled')).toBeUndefined()
    await button().trigger('click')

    expect(wrapper.text()).toContain('IT-Support')
    expect(wrapper.text()).toContain('Reinigungskraft')
    expect(wrapper.findAll('input[type=range]')).toHaveLength(3)
    await setAllSliders(wrapper, 8)
    await button().trigger('click')

    expect(button().attributes('disabled')).toBeDefined()
    await wrapper.find('textarea').setValue('  Einfluss des Kontexts  ')
    await button().trigger('click')
    await flushPromises()

    expect(fakeDb.rows('final_ratings')[0]).toMatchObject({
      participant_number: '201', exaggeration: 3, faking: 3, understating: 3, suppression: 3,
      bus_empathy: 8, doctor_empathy: 8, pension_empathy: 8, study_purpose: 'Einfluss des Kontexts',
    })
    expect(progressStore.phase).toBe(PHASE.ending)
  })
})

describe('Ending', () => {
  it('saves the debrief answers, marks the study completed and shows only the closing text afterwards', async () => {
    const { pinia, progressStore } = loginTestParticipant('301', 'KG', PHASE.ending)
    const wrapper = mount(EndingQuestions, { global: { plugins: [pinia] } })
    const button = () => wrapper.find('button.submit-button')
    expect(button().attributes('disabled')).toBeDefined()

    const radios = wrapper.findAll('input[type=radio]')
    await radios[0].setValue(true)   // informed: ja
    await radios[2].setValue(true)   // deletion: nein
    await radios[4].setValue(true)   // silence: ja
    await button().trigger('click')
    await flushPromises()

    expect(fakeDb.rows('ending_questions')[0]).toMatchObject({ participant_number: '301', is_informed: 'ja', wants_deletion: 'nein', agrees_silence: 'ja' })
    expect(progressStore.phase).toBe(PHASE.completed)
    expect(wrapper.text()).toContain('Die Studie ist nun beendet')

    const ending = mount(Ending, { global: { plugins: [pinia] } })
    expect(ending.text()).toContain('Die Studie ist nun beendet')
    expect(ending.text()).not.toContain('Abschließend möchten wir')
  })
})
