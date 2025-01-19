import { defineStore } from "pinia"
import { ref } from "vue"

export const useStore = defineStore('store', () => {
  const globalPassword = 'klinPsych'

  // auth
  const isAuthenticated = ref(false)
  const user = ref({
    username: '',
    participantNumber: ''
  })
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
      startNextSection()
    }
  }

  function finishStudy () {
    console.log('Finishing study')
    isOver.value = true
  }

  function login (password: string, username: string, participantNumber: string) {
    if (password === globalPassword) {
      isAuthenticated.value = true

      user.value.username = username
      user.value.participantNumber = participantNumber
      startStudy()
    } else {
      throw new Error('Invalid password')
    }
  }


  return {
    isAuthenticated,
    user,
    currentIndex,
    isVideo,
    isOver,
    startNextSection,
    startRating,
    finishSection,
    login,
  }
})