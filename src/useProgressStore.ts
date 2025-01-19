import { defineStore } from "pinia"
import { useSupabaseStore } from './useSupabaseStore'
import { ref } from "vue"

export const useProgressStore = defineStore('progressStore', () => {
  const supabaseStore = useSupabaseStore()

  // state
  const currentIndex = ref(0)
  const isVideo = ref(false)
  const isOver = ref(false)

  function startStudy () {
    currentIndex.value = 0
    console.log('Starting study')
    startNextSection()
  }

  function startNextSection () {
    console.log('Moving to next video, current index:', currentIndex.value)
    isVideo.value = true
  }

  function startRating () {
    console.log('Starting rating')
    isVideo.value = false
  }

  function finishSection () {
    console.log('Finishing section')
    currentIndex.value++
    if (currentIndex.value === 2) {
      finishStudy()
    } else {
      supabaseStore.saveProgress()
      startNextSection()
    }
  }

  function finishStudy () {
    console.log('Finishing study')
    isOver.value = true
  }

  return {
    currentIndex,
    isVideo,
    isOver,
    startStudy,
    startNextSection,
    startRating,
    finishSection,
  }
})