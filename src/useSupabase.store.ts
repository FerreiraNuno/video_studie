import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { ref } from "vue"
import { useProgressStore } from './useProgress.store'


export const useSupabaseStore = defineStore('supabaseStore', () => {
  // auth
  const isAuthenticated = ref(false)
  const user = ref({
    username: '',
    participantNumber: ''
  })


  async function saveProgress (phase: number) {
    const { participantNumber, username } = user.value

    const { error } = await supabase.from('progress').upsert(
      {
        phase: phase,
        participant_number: participantNumber,
        username: username,
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
      .select('phase')
      .eq('participant_number', participantNumber)
      .eq('username', username)
      .single()

    return { data, error }
  }

  async function saveRating (videoIndex: number, ratings: { pain: number, credibility: number, difficulty: number }) {
    const { participantNumber } = user.value

    const { error } = await supabase.from('ratings').insert([
      {
        participant_number: participantNumber,
        video_index: videoIndex,
        pain_rating: ratings.pain,
        credibility_rating: ratings.credibility,
        difficulty_rating: ratings.difficulty,
      },
    ])

    if (error) {
      console.error('Error saving rating:', error)
    } else {
      console.log('Rating saved successfully')
    }
  }

  async function saveUserData (formData: any) {
    const { participantNumber } = user.value

    const { error } = await supabase.from('form_data').insert([
      {
        participant_number: participantNumber,
        gender: formData.gender,
        age: formData.age,
        education: formData.education,
        ethnicity: formData.ethnicity,
        current_activity: formData.currentActivity,
        current_activity_detail: formData.currentActivityDetail,
        chronic_pain: formData.chronicPain,
        pain_location: formData.painLocation,
        private_pain_experience: formData.privatePainExperience,
        private_pain_relation: formData.privatePainRelation,
        professional_pain_experience: formData.professionalPainExperience,
        professional_pain_activity: formData.professionalPainActivity,
      },
    ])

    if (error) {
      console.error('Error saving form data:', error)
      return error
    } else {
      console.log('Form data saved successfully')
    }
  }

  return {
    isAuthenticated,
    user,
    saveProgress,
    loadProgress,
    saveRating,
    saveUserData,
  }
})