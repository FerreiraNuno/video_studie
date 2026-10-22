// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Context from '../Context.vue'
import { loginTestParticipant, fireMedia, setDuration } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

describe('Context', () => {
  let pinia: ReturnType<typeof loginTestParticipant>['pinia']

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = loginTestParticipant('201', 'SCT').pinia
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function mountContext (props: Partial<InstanceType<typeof Context>['$props']> = {}) {
    const wrapper = mount(Context, {
      props: { imageNumber: 0, text: 'new_context_instructions/x.mp3', context: 'doctor', group: 'SCT', ...props },
      global: { plugins: [pinia] },
    })
    return { wrapper, audio: wrapper.find('audio').element, button: wrapper.find('button') }
  }

  it('shows the still for imageNumber 0 and the group-specific muted clip for imageNumber 1', () => {
    const still = mountContext({ imageNumber: 0 })
    expect(still.wrapper.find('img').attributes('src')).toBe('/context/praxis.jpg')
    expect(still.wrapper.find('video').exists()).toBe(false)

    const clip = mountContext({ imageNumber: 1, group: 'SCT' })
    const video = clip.wrapper.find('video')
    expect(video.attributes('src')).toBe('/context/it_firma.mp4')
    expect(video.element.muted).toBe(true)

    expect(mountContext({ imageNumber: 1, context: 'pension', group: 'KG' }).wrapper.find('video').attributes('src')).toBe('/context/renten_weg.mp4')
    expect(mountContext({ imageNumber: 1, context: 'bus', group: 'CDM' }).wrapper.find('video').attributes('src')).toBe('/context/bus_inside.mp4')
  })

  it('plays the instruction audio and unlocks "Weiter" only when it has ended', async () => {
    const { audio, button, wrapper } = mountContext()
    expect(audio.getAttribute('src')).toBe('/new_context_instructions/x.mp3')
    expect(audio.paused).toBe(false)
    expect(button.attributes('disabled')).toBeDefined()

    fireMedia(audio, 'ended')
    await wrapper.vm.$nextTick()
    expect(button.attributes('disabled')).toBeUndefined()
    await button.trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('unlocks after the duration-derived timer, or the hard cap while the duration is unknown', async () => {
    const capped = mountContext()
    vi.advanceTimersByTime(44999)
    await capped.wrapper.vm.$nextTick()
    expect(capped.button.attributes('disabled')).toBeDefined()
    vi.advanceTimersByTime(1)
    await capped.wrapper.vm.$nextTick()
    expect(capped.button.attributes('disabled')).toBeUndefined()

    const derived = mountContext()
    setDuration(derived.audio, 38.6)
    fireMedia(derived.audio, 'play')
    vi.advanceTimersByTime(39599)
    await derived.wrapper.vm.$nextTick()
    expect(derived.button.attributes('disabled')).toBeDefined()
    vi.advanceTimersByTime(1)
    await derived.wrapper.vm.$nextTick()
    expect(derived.button.attributes('disabled')).toBeUndefined()
  })

  it('unlocks right away when the audio errors or autoplay is blocked', async () => {
    const errored = mountContext()
    fireMedia(errored.audio, 'error')
    await errored.wrapper.vm.$nextTick()
    expect(errored.button.attributes('disabled')).toBeUndefined()

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('NotAllowedError'))
    const blocked = mountContext()
    await blocked.wrapper.vm.$nextTick()
    await blocked.wrapper.vm.$nextTick()
    expect(blocked.button.attributes('disabled')).toBeUndefined()
  })

  it('pauses the audio on unmount', () => {
    const { wrapper, audio } = mountContext()
    wrapper.unmount()
    expect(audio.paused).toBe(true)
  })
})
