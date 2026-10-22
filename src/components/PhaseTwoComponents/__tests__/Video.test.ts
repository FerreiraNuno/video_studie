// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Video from '../Video.vue'
import { generateTrialPlan } from '@/utils/trialPlan'
import { allVideos, setTrialPlan, getCurrentVideo } from '@/utils/videoManager'
import { loginTestParticipant, seededRandom, fireMedia, setDuration } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

/**
 * Video.vue is driven purely by media events and timers, so the tests fire
 * the events the browser would (`playing`, `ended`, `error`) and advance
 * fake timers – no media is ever decoded.
 */
describe('Video', () => {
  let pinia: ReturnType<typeof loginTestParticipant>['pinia']

  beforeEach(() => {
    vi.useFakeTimers()
    setTrialPlan(generateTrialPlan(allVideos, seededRandom(7)))
    pinia = loginTestParticipant('101', 'CDM').pinia
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function mountVideo (videoIndex = 0) {
    const wrapper = mount(Video, { props: { videoIndex }, global: { plugins: [pinia] } })
    return {
      wrapper,
      video: wrapper.find('video').element,
      audio: wrapper.find('audio').element,
      emitted: () => wrapper.emitted('video-ended') ?? [],
    }
  }

  it('plays the trial video muted and the self-report audio of the participant group', () => {
    const trial = getCurrentVideo(3)
    const { video, audio } = mountVideo(3)
    expect(video.getAttribute('src')).toBe(`/videos/${trial.filename}`)
    expect(video.muted).toBe(true)
    const expectedAudio = { no_pain: 'cdm_sct_kg_no_pain', slight_pain: 'cdm_slight_pain', strong_pain: 'cdm_strong_pain' }[trial.audioType]
    expect(audio.getAttribute('src')).toBe(`/audio/${expectedAudio}.mp3`)
  })

  it('starts the audio only once the video renders, and ends the trial when the audio ends – exactly once', () => {
    // A play() that fires no events, so the test controls when "playing" happens
    // (happy-dom's own play() reports "playing" synchronously).
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const { video, audio, emitted } = mountVideo(0)
    expect(play).toHaveBeenCalledTimes(1)   // the video, at mount
    expect(play.mock.instances[0]).toBe(video)

    fireMedia(video, 'playing')
    fireMedia(video, 'playing')
    expect(play).toHaveBeenCalledTimes(2)   // the audio, once frames render
    expect(play.mock.instances[1]).toBe(audio)
    expect(emitted()).toHaveLength(0)

    fireMedia(audio, 'ended')
    fireMedia(audio, 'ended')
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'audio_ended']])
  })

  it('ends the trial by the hard timer when nothing ever plays', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const { emitted } = mountVideo(0)
    vi.advanceTimersByTime(14999)
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'timer']])
  })

  it('re-arms the timer to the audio duration once the audio plays', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const { video, audio, emitted } = mountVideo(0)
    setDuration(audio, 5)
    fireMedia(video, 'playing')
    fireMedia(audio, 'play')   // timer = 5 s + 1.5 s margin
    vi.advanceTimersByTime(6499)
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'timer']])
  })

  it('retries a failing video once, then gives up with video_error', () => {
    const { video, emitted } = mountVideo(0)
    const load = vi.spyOn(video, 'load')
    fireMedia(video, 'error')
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1500)
    expect(load).toHaveBeenCalledTimes(1)
    fireMedia(video, 'error')
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'video_error']])
  })

  it('retries a failing audio once, then gives up with audio_error', () => {
    const { audio, emitted } = mountVideo(0)
    fireMedia(audio, 'error')
    vi.advanceTimersByTime(1500)
    fireMedia(audio, 'error')
    expect(emitted()).toEqual([[getCurrentVideo(0).filename, 'audio_error']])
  })

  it('never emits after unmount', () => {
    const { wrapper, audio, emitted } = mountVideo(0)
    const pause = vi.spyOn(audio, 'pause')
    wrapper.unmount()
    vi.advanceTimersByTime(20000)
    fireMedia(audio, 'ended')
    expect(emitted()).toHaveLength(0)
    expect(pause).toHaveBeenCalled()
  })
})
