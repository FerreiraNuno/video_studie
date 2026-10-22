// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InstructionAudio from '../InstructionAudio.vue'
import { generateTrialPlan } from '@/utils/trialPlan'
import { allVideos, setTrialPlan, getCurrentVideo } from '@/utils/videoManager'
import { loginTestParticipant, seededRandom, fireMedia, setDuration } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

describe('InstructionAudio', () => {
  let pinia: ReturnType<typeof loginTestParticipant>['pinia']

  beforeEach(() => {
    vi.useFakeTimers()
    setTrialPlan(generateTrialPlan(allVideos, seededRandom(3)))
    pinia = loginTestParticipant('201', 'SCT').pinia
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function mountAudio (videoIndex = 0, context = 'bus') {
    const wrapper = mount(InstructionAudio, { props: { videoIndex, context }, global: { plugins: [pinia] } })
    return { wrapper, audio: wrapper.find('audio').element, emitted: () => wrapper.emitted('audio-ended') ?? [] }
  }

  it('plays the instruction of the context for the participant group and emits once when it ends', () => {
    const { audio, emitted } = mountAudio(5, 'pension')
    expect(audio.getAttribute('src')).toBe('/video_instructions/pension_SCT.mp3')
    expect(audio.paused).toBe(false)
    fireMedia(audio, 'ended')
    fireMedia(audio, 'ended')
    expect(emitted()).toEqual([[getCurrentVideo(5).filename, 'ended']])
  })

  it('falls back to the hard cap while the duration is unknown', () => {
    const { emitted } = mountAudio()
    vi.advanceTimersByTime(24999)
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'timer']])
  })

  it('derives the timer from the real duration once known', () => {
    const { audio, emitted } = mountAudio()
    setDuration(audio, 14.7)
    fireMedia(audio, 'play')   // metadata known now → 14.7 s + 1 s margin
    vi.advanceTimersByTime(15699)
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(emitted()[0][1]).toBe('timer')
  })

  it('reports a media error and a blocked autoplay without hanging', async () => {
    const { audio, emitted } = mountAudio()
    fireMedia(audio, 'error')
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'error']])

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('NotAllowedError'))
    const blocked = mountAudio()
    await Promise.resolve()
    await Promise.resolve()
    expect(blocked.emitted()).toEqual([[getCurrentVideo(0).filename, 'blocked']])
  })

  it('stops the audio and the timer on unmount', () => {
    const { wrapper, audio, emitted } = mountAudio()
    wrapper.unmount()
    expect(audio.paused).toBe(true)
    vi.advanceTimersByTime(30000)
    expect(emitted()).toHaveLength(0)
  })
})
