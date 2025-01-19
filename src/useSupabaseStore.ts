import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { ref } from "vue"
import { useProgressStore } from './useProgressStore'


export const useSupabaseStore = defineStore('supabaseStore', () => {
  const progressStore = useProgressStore()

  // auth
  const isAuthenticated = ref(false)
  const user = ref({
    username: '',
    participantNumber: ''
  })


  async function saveProgress () {
    const { participantNumber, username } = user.value

    const { error } = await supabase.from('progress').upsert({
      participant_number: participantNumber,
      username: username,
      current_index: progressStore.currentIndex,
      is_over: progressStore.isOver,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Fehler beim Speichern des Fortschritts:', error)
    } else {
      console.log('Fortschritt erfolgreich gespeichert')
    }
  }

  return {
    isAuthenticated,
    user,
    saveProgress,
  }
})