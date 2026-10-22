// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import PhaseThree from '../PhaseThree.vue'
import { PHASE } from '@/useProgress.store'
import { allPhotoFilenames, getPhotoOrder } from '@/utils/photoManager'
import { PHASE3_FINAL_STEP } from '@/utils/resume'
import { fakeDb } from '@/test/fakeSupabase'
import { loginTestParticipant, flushPromises } from '@/test/setup'
import { PhotoStub, PhaseThreeRatingStub, FinalQuestionsStub } from '@/test/stubs'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

// Unmount after each test: a component left mounted keeps reacting to the
// shared plan/photo state the next test resets.
enableAutoUnmount(afterEach)

const stubs = { Photo: PhotoStub, Rating: PhaseThreeRatingStub, FinalQuestions: FinalQuestionsStub }
const RATINGS = { trustworthiness: 1, sympathy: 2, aura: 3, valence: 4, attractiveness: 5, stressLevel: 6, empathy: 7 }

describe('PhaseThree', () => {
  beforeEach(() => {
    fakeDb.reset()
    localStorage.clear()
  })

  it('shows every photo once in a persisted random order, rates each, then the final questions', async () => {
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.photos)
    const savePosition = vi.spyOn(progressStore, 'savePosition')
    const wrapper = mount(PhaseThree, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    const order = getPhotoOrder()
    expect([...order].sort()).toEqual([...allPhotoFilenames].sort())
    expect(savePosition).toHaveBeenLastCalledWith({ phase: 3, progressIndex: 0, photoIndex: 0, photoOrder: order })

    expect(wrapper.text()).toContain('3. Teil')
    await wrapper.find('button.next-button').trigger('click')

    for (let i = 0; i < 36; i++) {
      const photo = wrapper.findComponent(PhotoStub)
      expect(photo.exists(), `photo ${i}`).toBe(true)
      expect(photo.props('photoIndex')).toBe(i)
      expect(wrapper.findComponent(PhaseThreeRatingStub).exists()).toBe(false)
      photo.vm.$emit('photo-ended')
      await wrapper.vm.$nextTick()

      const rating = wrapper.findComponent(PhaseThreeRatingStub)
      expect(rating.exists(), `rating ${i}`).toBe(true)
      expect(rating.props('photoIndex')).toBe(i)
      // a rating step is saved as its photo step, so a reload re-shows the photo
      expect(savePosition).toHaveBeenLastCalledWith({ phase: 3, progressIndex: 2 * i + 1, photoIndex: i, photoOrder: order })
      rating.vm.$emit('rating-submitted', RATINGS)
      await flushPromises()
    }

    expect(wrapper.findComponent(FinalQuestionsStub).exists()).toBe(true)
    expect(wrapper.findComponent(PhotoStub).exists()).toBe(false)
    expect(savePosition).toHaveBeenLastCalledWith({ phase: 3, progressIndex: PHASE3_FINAL_STEP, photoIndex: 36, photoOrder: order })

    const rows = fakeDb.rows('photo_ratings')
    expect(rows).toHaveLength(36)
    rows.forEach((row, i) => {
      expect(row).toMatchObject({
        participant_number: '101',
        photo_index: i + 1,
        photo_filename: order[i].replace(/\.[^/.]+$/, ''),
        trustworthiness: 1, sympathy: 2, aura: 3, valence: 4, attractiveness: 5, stress_level: 6, empathy: 7,
      })
    })
  })

  it('resumes with the saved order at the saved photo, rewinding a rating step to its photo', async () => {
    const savedOrder = [...allPhotoFilenames].reverse()
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.photos)
    progressStore.position = { phase: 3, progressIndex: 8, photoIndex: 3, photoOrder: savedOrder }
    const wrapper = mount(PhaseThree, { global: { plugins: [pinia], stubs } })
    await flushPromises()

    expect(getPhotoOrder()).toEqual(savedOrder)
    const photo = wrapper.findComponent(PhotoStub)
    expect(photo.exists()).toBe(true)
    expect(photo.props('photoIndex')).toBe(3)
  })

  it('resumes the final questions directly', async () => {
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.photos)
    progressStore.position = { phase: 3, progressIndex: PHASE3_FINAL_STEP, photoIndex: 36, photoOrder: [...allPhotoFilenames] }
    const wrapper = mount(PhaseThree, { global: { plugins: [pinia], stubs } })
    await flushPromises()
    expect(wrapper.findComponent(FinalQuestionsStub).exists()).toBe(true)
  })

  it('draws a fresh order when the saved one is not a permutation of the catalog', async () => {
    const { pinia, progressStore } = loginTestParticipant('101', 'CDM', PHASE.photos)
    progressStore.position = { phase: 3, progressIndex: 5, photoIndex: 2, photoOrder: allPhotoFilenames.slice(0, 10) }
    mount(PhaseThree, { global: { plugins: [pinia], stubs } })
    await flushPromises()
    expect([...getPhotoOrder()].sort()).toEqual([...allPhotoFilenames].sort())
  })
})
