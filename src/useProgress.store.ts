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


  async function startStudy () {
    await loadProgress()
    if (!phase.value) phase.value = PHASE.questionnaire
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
      if (error.code === 'PGRST116') { // PGRST116 is the "Row not found" error code
        console.log('Kein Fortschritt gefunden, starte bei Index 0')
        return
      }
      console.error('Fehler beim Laden des Fortschritts:', error)
    } else if (data) {
      phase.value = data.phase
      const saved = data.position as StudyPosition | null
      position.value = saved && saved.phase === data.phase ? saved : null
    }
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
