import { defineStore } from "pinia"
import { useSupabaseStore } from './useSupabase.store'
import { ref, type Ref } from "vue"

export const useProgressStore = defineStore('progressStore', () => {
  const supabaseStore = useSupabaseStore()

  // state
  const phase: Ref<number | undefined> = ref(undefined) // 0 = intro, 1 = videos, 2 = images


  async function startStudy () {
    await loadProgress()
    if (!phase.value) phase.value = 1
  }

  async function nextPhase () {
    if (phase.value === undefined) return
    phase.value++
    await supabaseStore.saveProgress(phase.value)
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
    }
  }

  return {
    phase,
    startStudy,
    nextPhase,
    loadProgress,
  }
})