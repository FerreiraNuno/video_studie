/**
 * Shared helpers for component tests (happy-dom).
 *
 * Every component test mocks the Supabase client with the in-memory fake,
 * so the real stores, persister and writer run end to end against it. The
 * mock has to be spelled out in each file (vi.mock is hoisted above imports):
 *
 *   vi.mock('@/lib/supabaseClient', async () => {
 *     const { fakeDb } = await import('@/test/fakeSupabase')
 *     return { supabase: fakeDb, STUDY_SCHEMA: 'study_v2' }
 *   })
 */
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { useSupabaseStore, type StudyGroup } from '@/useSupabase.store'
import { useProgressStore } from '@/useProgress.store'
import { useStimuliStore } from '@/useStimuli.store'

/** Fresh pinia with a logged-in participant; returns the stores. */
export function loginTestParticipant (participantNumber = '101', group: StudyGroup = 'CDM', phase?: number): {
  pinia: Pinia
  supabaseStore: ReturnType<typeof useSupabaseStore>
  progressStore: ReturnType<typeof useProgressStore>
  stimuliStore: ReturnType<typeof useStimuliStore>
} {
  const pinia = createPinia()
  setActivePinia(pinia)
  const supabaseStore = useSupabaseStore()
  const progressStore = useProgressStore()
  const stimuliStore = useStimuliStore()
  supabaseStore.user.participantNumber = participantNumber
  supabaseStore.user.group = group
  supabaseStore.isAuthenticated = true
  if (phase !== undefined) progressStore.phase = phase
  return { pinia, supabaseStore, progressStore, stimuliStore }
}

/** Lets pending promises (mounted hooks, persister writes) settle. */
export async function flushPromises (rounds = 4) {
  for (let i = 0; i < rounds; i++) await new Promise(resolve => setTimeout(resolve, 0))
}

/** A deterministic RNG for reproducible trial plans in tests (mulberry32). */
export function seededRandom (seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fires a DOM event on a media element (happy-dom does not play media). */
export function fireMedia (element: Element | null | undefined, type: string) {
  if (!element) throw new Error(`no element to fire ${type} on`)
  element.dispatchEvent(new Event(type))
}

/** Gives a media element a finite duration (NaN by default in happy-dom). */
export function setDuration (element: Element | null | undefined, seconds: number) {
  if (!element) throw new Error('no media element')
  Object.defineProperty(element, 'duration', { value: seconds, configurable: true })
  Object.defineProperty(element, 'currentTime', { value: 0, configurable: true, writable: true })
}
