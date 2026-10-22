import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { ref } from "vue"
import { useProgressStore } from './useProgress.store'
import type { Trial, TrialPlan } from './utils/trialPlan'

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

  /**
   * Saves one video rating. `trial` is the plan entry of the video that was just
   * rated; its position (1..36) is stored as `video_index`, and the design
   * cells (context, facial expression = video_type, self-report = audio_type)
   * are stored explicitly so balance can be verified directly in the data.
   */
  async function saveRating (ratings: { pain: number, credibility: number, difficulty: number, action?: number }, trial: Trial) {
    if (!isAuthenticated.value) {
      console.error('User is not authenticated')
      return { error: 'User is not authenticated' }
    }

    const { participantNumber, group } = user.value
    if (!participantNumber) {
      console.error('No participant number found')
      return { error: 'No participant number found' }
    }

    const row = {
      participant_number: participantNumber,
      video_index: trial.position,
      pain_rating: ratings.pain,
      credibility_rating: ratings.credibility,
      difficulty_rating: ratings.difficulty,
      action_rating: ratings.action,
      video_filename: trial.filename.replace(/\.[^/.]+$/, ''),
      audio_type: trial.audioType,
      study_group: group,
      context: trial.context,
      video_type: trial.videoType,
      person_id: trial.personId,
    }
    console.log('Saving rating with data:', row)

    const { data, error } = await supabase.from('video_ratings').insert([row])

    if (error) {
      console.error('Error saving rating:', error)
      return { error }
    } else {
      console.log('Rating saved successfully')
      return { data }
    }
  }

  /** Persists the participant's trial plan (one row per participant, overwritten on conflict). */
  async function saveTrialPlan (plan: TrialPlan) {
    const { participantNumber, group } = user.value
    const { error } = await supabase.from('trial_plans').upsert(
      {
        participant_number: participantNumber,
        study_group: group,
        context_order: plan.contextOrder.join(','),
        plan: plan,
      },
      { onConflict: 'participant_number' }
    )
    if (error) console.error('Error saving trial plan:', error)
    return { error }
  }

  async function loadTrialPlan () {
    const { participantNumber } = user.value
    const { data, error } = await supabase
      .from('trial_plans')
      .select('plan, context_order')
      .eq('participant_number', participantNumber)
      .maybeSingle()
    if (error) console.error('Error loading trial plan:', error)
    return { plan: (data?.plan ?? null) as TrialPlan | null, error }
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
      empathy: number
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
        empathy: ratings.empathy,
        photo_filename: filename.replace(/\.[^/.]+$/, ''),
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
    saveTrialPlan,
    loadTrialPlan,
    saveUserData,
    savePhotoRating,
    saveFinalRatings,
    saveEndingQuestions,
  }
})