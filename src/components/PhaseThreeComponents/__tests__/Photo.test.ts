// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Photo from '../Photo.vue'
import { allPhotoFilenames } from '@/utils/photoManager'
import { loginTestParticipant } from '@/test/setup'

vi.mock('@/lib/supabaseClient', async () => {
  const { fakeDb } = await import('@/test/fakeSupabase')
  return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
})

describe('Photo', () => {
  let pinia: ReturnType<typeof loginTestParticipant>['pinia']

  beforeEach(() => {
    vi.useFakeTimers()
    const session = loginTestParticipant()
    pinia = session.pinia
    session.stimuliStore.setPhotoOrder(allPhotoFilenames)
  })
  afterEach(() => vi.useRealTimers())

  function mountPhoto (photoIndex = 0) {
    const wrapper = mount(Photo, { props: { photoIndex }, global: { plugins: [pinia] } })
    return { wrapper, img: wrapper.find('img'), emitted: () => wrapper.emitted('photo-ended') ?? [] }
  }

  it('shows the photo of the order and ends 3 s after the image loaded, once', async () => {
    const { img, emitted } = mountPhoto(4)
    expect(img.attributes('src')).toBe(`/photos/${allPhotoFilenames[4]}`)
    vi.advanceTimersByTime(5000)
    expect(emitted()).toHaveLength(0)  // not loaded yet: nothing shown, nothing counted

    await img.trigger('load')
    await img.trigger('load')
    vi.advanceTimersByTime(2999)
    expect(emitted()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(emitted()).toHaveLength(1)
    vi.advanceTimersByTime(5000)
    expect(emitted()).toHaveLength(1)
  })

  it('ends after the load cap when the image never loads, and immediately on error', async () => {
    const stuck = mountPhoto(0)
    vi.advanceTimersByTime(20000)
    expect(stuck.emitted()).toHaveLength(1)

    const broken = mountPhoto(1)
    await broken.img.trigger('error')
    vi.advanceTimersByTime(0)
    expect(broken.emitted()).toHaveLength(1)
  })

  it('does not fire into a later step after unmount', () => {
    const { wrapper, emitted } = mountPhoto(0)
    wrapper.unmount()
    vi.advanceTimersByTime(30000)
    expect(emitted()).toHaveLength(0)
  })
})
