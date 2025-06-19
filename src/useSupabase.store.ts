import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { ref } from "vue"
import { useProgressStore } from './useProgress.store'

export type StudyGroup = 'CDM' | 'SCT' | 'KG'

export const useSupabaseStore = defineStore('supabaseStore', () => {
  // auth
  const isAuthenticated = ref(false)
  const user = ref({
    participantNumber: '',
    group: '' as StudyGroup
  })


  async function saveProgress (phase: number) {
    const { participantNumber, group } = user.value

    const { error } = await supabase.from('progress').upsert(
      {
        phase: phase,
        participant_number: participantNumber,
        study_group: group,
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
    const { participantNumber, group } = user.value

    const { data, error } = await supabase
      .from('progress')
      .select('phase, study_group')
      .eq('participant_number', participantNumber)
      .eq('study_group', group)
      .maybeSingle()

    return { data, error }
  }

  async function saveRating (videoIndex: number, ratings: { pain: number, credibility: number, difficulty: number, action?: number }, filename: string, audioType: 'no_pain' | 'slight_pain' | 'strong_pain') {
    if (!isAuthenticated.value) {
      console.error('User is not authenticated')
      return { error: 'User is not authenticated' }
    }

    const { participantNumber, group } = user.value
    if (!participantNumber) {
      console.error('No participant number found')
      return { error: 'No participant number found' }
    }

    console.log('Saving rating with data:', {
      participant_number: participantNumber,
      video_index: videoIndex,
      pain_rating: ratings.pain,
      credibility_rating: ratings.credibility,
      difficulty_rating: ratings.difficulty,
      action_rating: ratings.action,
      video_filename: filename,
      audio_type: audioType,
      study_group: group
    })

    const { data, error } = await supabase.from('video_ratings').insert([
      {
        participant_number: participantNumber,
        video_index: videoIndex,
        pain_rating: ratings.pain,
        credibility_rating: ratings.credibility,
        difficulty_rating: ratings.difficulty,
        action_rating: ratings.action,
        video_filename: filename,
        audio_type: audioType,
        study_group: group,
      },
    ])

    if (error) {
      console.error('Error saving rating:', error)
      return { error }
    } else {
      console.log('Rating saved successfully')
      return { data }
    }
  }

  async function saveUserData (formData: any, contextOrder?: string) {
    const { participantNumber, group } = user.value

    console.log('Saving form data with context order:', contextOrder)

    const { error } = await supabase.from('form_data').insert([
      {
        participant_number: participantNumber,
        study_group: group,
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
        context_order: contextOrder,
      },
    ])

    if (error) {
      console.error('Error saving form data:', error)
      return error
    } else {
      console.log('Form data saved successfully')
    }
  }

  async function savePhotoRating (
    photoIndex: number,
    ratings: {
      trustworthiness: number
      sympathy: number
      aura: number
      valence: number
      attractiveness: number
      stressLevel: number
    },
    filename: string
  ) {
    if (!user.value) return

    const { data, error } = await supabase
      .from('photo_ratings')
      .insert({
        participant_number: user.value.participantNumber,
        photo_index: photoIndex + 1,
        trustworthiness: ratings.trustworthiness,
        sympathy: ratings.sympathy,
        aura: ratings.aura,
        valence: ratings.valence,
        attractiveness: ratings.attractiveness,
        stress_level: ratings.stressLevel,
        photo_filename: filename,
      })

    if (error) {
      console.error('Error saving photo rating:', error)
    }
  }

  async function saveFinalRatings (ratings: {
    exaggeration: number
    faking: number
    understating: number
    suppression: number
    bus_empathy: number
    doctor_empathy: number
    pension_empathy: number
    study_purpose: string
  }) {
    const { data, error } = await supabase
      .from('final_ratings')
      .insert([
        {
          participant_number: user.value.participantNumber,
          exaggeration: ratings.exaggeration,
          faking: ratings.faking,
          understating: ratings.understating,
          suppression: ratings.suppression,
          bus_empathy: ratings.bus_empathy,
          doctor_empathy: ratings.doctor_empathy,
          pension_empathy: ratings.pension_empathy,
          study_purpose: ratings.study_purpose
        }
      ])

    if (error) {
      console.error('Error saving final ratings:', error)
      throw error
    }

    return data
  }

  async function saveEndingQuestions (answers: {
    isInformed: string
    wantsDeletion: string
    agreesSilence: string
  }) {
    const { data, error } = await supabase
      .from('ending_questions')
      .insert([
        {
          participant_number: user.value.participantNumber,
          is_informed: answers.isInformed,
          wants_deletion: answers.wantsDeletion,
          agrees_silence: answers.agreesSilence
        }
      ])

    if (error) {
      console.error('Error saving ending questions:', error)
      throw error
    }

    return data
  }

  return {
    isAuthenticated,
    user,
    saveProgress,
    loadProgress,
    saveRating,
    saveUserData,
    savePhotoRating,
    saveFinalRatings,
    saveEndingQuestions,
  }
})