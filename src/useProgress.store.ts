import { defineStore } from "pinia"
import { useSupabaseStore } from './useSupabase.store'
import { ref, type Ref } from "vue"
import type { StudyPosition } from './utils/resume'

export const PHASE = {
  questionnaire: 1,
  videos: 2,
  photos: 3,
  ending: 4,
} as const

export const useProgressStore = defineStore('progressStore', () => {
  const supabaseStore = useSupabaseStore()

  // state
  const phase: Ref<number | undefined> = ref(undefined)
  /** Resume point inside the current phase (phases 2/3), null at a phase start. */
  const position: Ref<StudyPosition | null> = ref(null)


  /**
   * Loads the resume point and enters the study. Returns the read error, if
   * any – the caller must not proceed then: an earlier version fell back to
   * phase 1 on a failed read, which would show a participant in phase 2/3 the
   * questionnaire again and overwrite their trial plan on submit.
   */
  async function startStudy (): Promise<{ error: { message: string, code?: string } | null }> {
    const { error } = await loadProgress()
    if (error) return { error }
    if (!phase.value) phase.value = PHASE.questionnaire
    return { error: null }
  }

  /**
   * Moves the participant to an explicit phase. Components name the phase they
   * hand over to instead of blindly incrementing, so a double-click or a
   * repeated call can never skip a phase (the first collection has a
   * participant parked at the non-existent phase 5 for that reason).
   */
  async function setPhase (next: number) {
    if (phase.value === next) return
    phase.value = next
    position.value = null
    await supabaseStore.saveProgress(next, null)
  }

  /** Persists the position inside the current phase (called by PhaseTwo/PhaseThree after every step). */
  async function savePosition (next: StudyPosition) {
    if (phase.value === undefined || next.phase !== phase.value) return
    position.value = next
    await supabaseStore.saveProgress(phase.value, next)
  }

  async function nextPhase () {
    if (phase.value === undefined) return
    await setPhase(phase.value + 1)
  }


  // helpers
  async function loadProgress () {
    const { data, error } = await supabaseStore.loadProgress()
    if (error) {
      console.error('Fehler beim Laden des Fortschritts:', error)
      return { error }
    }
    if (data) {
      phase.value = data.phase
      const saved = data.position as StudyPosition | null
      position.value = saved && saved.phase === data.phase ? saved : null
    }
    return { error: null }
  }

  return {
    phase,
    position,
    startStudy,
    setPhase,
    savePosition,
    nextPhase,
    loadProgress,
  }
})
