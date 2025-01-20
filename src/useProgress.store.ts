import { defineStore } from "pinia"
import { useSupabaseStore } from './useSupabase.store'
import { ref } from "vue"

export const useProgressStore = defineStore('progressStore', () => {
  const supabaseStore = useSupabaseStore()

  // state
  const currentIndex = ref(0)
  const isVideo = ref(false)
  const isOver = ref(false)
  const isRating = ref(false)

  async function startStudy () {
    console.log('Starting study')
    await loadProgress()
    if (isOver.value) finishStudy()
    else startNextSection()
  }

  function startNextSection () {
    console.log('Moving to next video, current index:', currentIndex.value)
    isVideo.value = true
    isRating.value = false
  }

  function startRating () {
    console.log('Starting rating')
    isVideo.value = false
    isRating.value = true
  }

  function finishSection () {
    console.log('Finishing section with index:', currentIndex.value)
    currentIndex.value++
    if (currentIndex.value === 3) {
      finishStudy()
      supabaseStore.saveProgress()
    } else {
      supabaseStore.saveProgress()
      startNextSection()
    }
  }

  function finishStudy () {
    console.log('Finishing study')
    isVideo.value = false
    isRating.value = false
    isOver.value = true
  }

  async function loadProgress () {
    const { data, error } = await supabaseStore.loadProgress()
    if (error) {
      if (error.code === 'PGRST116') { // PGRST116 is the "Row not found" error code
        console.log('Kein Fortschritt gefunden, starte bei Index 0')
        currentIndex.value = 0
        isOver.value = false
        isVideo.value = true
        return
      }
      console.error('Fehler beim Laden des Fortschritts:', error)
    } else if (data) {
      currentIndex.value = data.current_index
      isOver.value = data.is_over
      isVideo.value = data.current_index < 3
      console.log('Fortschritt erfolgreich geladen bei Index:', currentIndex.value)
      console.log('isOver:', isOver.value)

    }
  }

  return {
    currentIndex,
    isVideo,
    isOver,
    isRating,
    startStudy,
    startNextSection,
    startRating,
    finishSection,
    loadProgress,
  }
})