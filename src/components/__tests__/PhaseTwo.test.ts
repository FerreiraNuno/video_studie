// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, enableAutoUnmount, type VueWrapper } from '@vue/test-utils'
import PhaseTwo from '../PhaseTwo.vue'
import { PHASE } from '@/useProgress.store'
import { generateTrialPlan, type TrialPlan } from '@/utils/trialPlan'
import { allVideos } from '@/utils/videoManager'
import { PHASE2_STEPS } from '@/utils/phaseTwoSteps'
import { phaseTwoResumePoint } from '@/utils/resume'
import contextText from '@/text/context.json'
import { fakeDb } from '@/test/fakeSupabase'
import { loginTestParticipant, seededRandom, flushPromises } from '@/test/setup'
import { ContextStub, InstructionAudioStub, VideoStub, PhaseTwoRatingStub } from '@/test/stubs'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

// Unmount after each test: a component left mounted keeps reacting to the
// shared plan/photo state the next test resets.
enableAutoUnmount(afterEach)

const stubs = { Context: ContextStub, InstructionAudio: InstructionAudioStub, Video: VideoStub, Rating: PhaseTwoRatingStub }
const RATINGS = { pain: 7, credibility: 4, difficulty: 2, action: 9 }

/**
 * Walks the mounted phase through every step of PHASE2_STEPS, asserting at
 * each step that the right component is shown with the right trial/context,
 * and returns the positions the phase asked the progress store to save.
 */
async function driveWholePhase (wrapper: VueWrapper, plan: TrialPlan, group: string) {
  for (const step of PHASE2_STEPS) {
    switch (step.kind) {
      case 'intro': {
        const rating = wrapper.findComponent(PhaseTwoRatingStub)
        expect(rating.props('context')).toBe('none')
        rating.vm.$emit('rating-submitted', RATINGS, '', 0)
        break
      }
      case 'audio_test':
      case 'video_test': {
        const button = wrapper.find('button.next-button')
        expect(button.attributes('disabled')).toBeDefined()
        await wrapper.find('input[type=checkbox]').setValue(true)
        expect(button.attributes('disabled')).toBeUndefined()
        await button.trigger('click')
        break
      }
      case 'start':
        expect(wrapper.text()).toContain('Prima')
        await wrapper.find('button.next-button').trigger('click')
        break
      case 'context': {
        const context = plan.contextOrder[step.section]
        const stub = wrapper.findComponent(ContextStub)
        expect(stub.exists(), `context screen at step ${PHASE2_STEPS.indexOf(step)}`).toBe(true)
        expect(stub.props()).toMatchObject({
          context,
          group,
          imageNumber: step.imageNumber,
          text: (contextText as Record<string, Record<string, string>>)[`${context}_${step.part}`][group],
        })
        stub.vm.$emit('next')
        break
      }
      case 'video': {
        const trial = plan.trials[step.trialIndex]
        expect(trial.context).toBe(plan.contextOrder[step.section])
        const instruction = wrapper.findComponent(InstructionAudioStub)
        expect(instruction.exists(), `instruction audio for trial ${step.trialIndex}`).toBe(true)
        expect(instruction.props()).toEqual({ videoIndex: step.trialIndex, context: trial.context })
        expect(wrapper.findComponent(VideoStub).exists()).toBe(false)
        instruction.vm.$emit('audio-ended', trial.filename, 'ended')
        await wrapper.vm.$nextTick()

        const video = wrapper.findComponent(VideoStub)
        expect(video.exists(), `video for trial ${step.trialIndex}`).toBe(true)
        expect(video.props('videoIndex')).toBe(step.trialIndex)
        expect(wrapper.findComponent(InstructionAudioStub).exists()).toBe(false)
        video.vm.$emit('video-ended', trial.filename, 'audio_ended')
        video.vm.$emit('video-ended', trial.filename, 'audio_ended')  // a duplicate emit must not skip a step
        break
      }
      case 'rating': {
        const trial = plan.trials[step.trialIndex]
        const rating = wrapper.findComponent(PhaseTwoRatingStub)
        expect(rating.exists(), `rating for trial ${step.trialIndex}`).toBe(true)
        expect(rating.props()).toEqual({
          videoIndex: step.trialIndex,
          context: trial.context,
          filename: trial.filename.replace(/\.[^/.]+$/, ''),
        })
        rating.vm.$emit('rating-submitted', RATINGS, rating.props('filename'), step.trialIndex)
        break
      }
    }
    await flushPromises()
  }
}

describe('PhaseTwo', () => {
  beforeEach(() => {
    fakeDb.reset()
    localStorage.clear()
  })

  it('runs all 88 steps in plan order, stores one rating per trial and hands over to phase 3', async () => {
    const plan = generateTrialPlan(allVideos, seededRandom(42))
    const { pinia, progressStore, stimuliStore } = loginTestParticipant('101', 'CDM', PHASE.videos)
    stimuliStore.setPlan(plan)
    const savePosition = vi.spyOn(progressStore, 'savePosition')

    const wrapper = mount(PhaseTwo, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    await driveWholePhase(wrapper, plan, 'CDM')

    expect(progressStore.phase).toBe(PHASE.photos)

    const ratings = fakeDb.rows('video_ratings')
    expect(ratings).toHaveLength(36)
    plan.trials.forEach((trial, i) => {
      expect(ratings[i]).toMatchObject({
        participant_number: '101',
        study_group: 'CDM',
        video_index: trial.position,
        video_filename: trial.filename.replace(/\.[^/.]+$/, ''),
        person_id: trial.personId,
        context: trial.context,
        video_type: trial.videoType,
        audio_type: trial.audioType,
        pain_rating: 7,
        credibility_rating: 4,
        difficulty_rating: 2,
        action_rating: 9,
        instruction_end_reason: 'ended',
        trial_end_reason: 'audio_ended',
      })
    })

    // Every step except the final one saved the position the resume helper maps it to.
    const saved = savePosition.mock.calls.map(([position]) => position)
    const expected = PHASE2_STEPS.slice(1, -1).map((_, i) => ({ phase: 2, ...phaseTwoResumePoint({ phase: 2, progressIndex: i + 1 }) }))
    expect(saved).toEqual(expected)

    // The hand-over wrote phase 3 with no position.
    const progress = fakeDb.rows('progress')
    expect(progress).toHaveLength(1)
    expect(progress[0]).toMatchObject({ participant_number: '101', phase: 3, position: null })
  })

  it('resumes a saved rating step at its video, with the trial derived from the step', async () => {
    const plan = generateTrialPlan(allVideos, seededRandom(5))
    const { pinia, progressStore, stimuliStore } = loginTestParticipant('301', 'KG', PHASE.videos)
    stimuliStore.setPlan(plan)
    progressStore.position = { phase: 2, progressIndex: 35, videoIndex: 99 }  // second context, first rating; stale videoIndex
    const savePosition = vi.spyOn(progressStore, 'savePosition')

    const wrapper = mount(PhaseTwo, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    const instruction = wrapper.findComponent(InstructionAudioStub)
    expect(instruction.exists()).toBe(true)
    expect(instruction.props()).toEqual({ videoIndex: 12, context: plan.contextOrder[1] })
    expect(savePosition).toHaveBeenCalledWith({ phase: 2, progressIndex: 34, videoIndex: 12 })
  })

  it('loads the saved plan after a reload instead of generating a new one', async () => {
    const plan = generateTrialPlan(allVideos, seededRandom(11))
    fakeDb.seed('trial_plans', [{ participant_number: '102', study_group: 'CDM', context_order: plan.contextOrder.join(','), plan }])
    const { pinia, stimuliStore } = loginTestParticipant('102', 'CDM', PHASE.videos)

    const wrapper = mount(PhaseTwo, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    expect(stimuliStore.trialPlan).toEqual(plan)
    expect(wrapper.text()).toContain('Nun beginnt der 2. Teil')
    expect(fakeDb.calls.filter(c => c.table === 'trial_plans' && c.op === 'upsert')).toHaveLength(0)
  })

  it('shows the reload message when the plan cannot be read, and never regenerates it', async () => {
    fakeDb.failNext('trial_plans', 'select')
    const { pinia, stimuliStore } = loginTestParticipant('103', 'SCT', PHASE.videos)

    const wrapper = mount(PhaseTwo, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Videozuteilung konnte nicht geladen werden')
    expect(stimuliStore.trialPlan).toBeNull()
    expect(fakeDb.calls.filter(c => c.table === 'trial_plans' && c.op === 'upsert')).toHaveLength(0)
  })

  it('generates and saves a plan only when the database confirmed none exists', async () => {
    const { pinia, stimuliStore } = loginTestParticipant('104', 'KG', PHASE.videos)
    mount(PhaseTwo, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    expect(stimuliStore.trialPlan).not.toBeNull()
    const saved = fakeDb.rows('trial_plans')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ participant_number: '104', study_group: 'KG', plan: stimuliStore.trialPlan })
  })
})
