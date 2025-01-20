import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { ref } from "vue"
import { useProgressStore } from './useProgress.store'


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

    const { error } = await supabase.from('progress').upsert(
      {
        participant_number: participantNumber,
        username: username,
        current_index: progressStore.currentIndex,
        is_over: progressStore.isOver,
      },
      { onConflict: 'participant_number' } // Match rows based on the unique constraint
    )

    if (error) {
      console.error('Error saving progress:', error)
    } else {
      console.log('Progress saved successfully')
    }
  }

  async function loadProgress () {
    const { participantNumber, username } = user.value

    const { data, error } = await supabase
      .from('progress')
      .select('current_index, is_over')
      .eq('participant_number', participantNumber)
      .eq('username', username)
      .single()

    return { data, error }
  }

  async function saveRating (videoIndex: number, rating: number) {
    const { participantNumber } = user.value

    const { error } = await supabase.from('ratings').insert([
      {
        participant_number: participantNumber,
        video_index: videoIndex,
        rating: rating,
      },
    ])

    if (error) {
      console.error('Error saving rating:', error)
    } else {
      console.log('Rating saved successfully')
    }
  }



  return {
    isAuthenticated,
    user,
    saveProgress,
    loadProgress,
    saveRating,
  }
})