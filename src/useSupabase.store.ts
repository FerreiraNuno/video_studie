import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { createPersister, type Row, type Writer } from './lib/persist'
import { ref } from "vue"
import type { Trial, TrialPlan } from './utils/trialPlan'

export type StudyGroup = 'CDM' | 'SCT' | 'KG'

/**
 * Every write goes through the persister (see src/lib/persist.ts): write-ahead
 * outbox in localStorage, retries, and idempotent upserts on the row's natural
 * key. Study data is therefore never lost to a single failed request, and a
 * retry can never duplicate a row. The unique indexes behind the `onConflict`
 * keys are created by supabase/migrations/20261022_03_*.sql.
 */
const supabaseWriter: Writer = async (table, row, onConflict) => {
  const { error } = await supabase.from(table).upsert(row, { onConflict })
  return { error: error ? { message: error.message, code: error.code } : null }
}

export const persister = createPersister({ writer: supabaseWriter })

export const useSupabaseStore = defineStore('supabaseStore', () => {
  // auth
  const isAuthenticated = ref(false)
  const user = ref({
    participantNumber: '',
    group: '' as StudyGroup
  })

  function persist (table: string, row: Row, onConflict: string) {
    return persister.persist(user.value.participantNumber, table, row, onConflict)
  }

  /** Re-sends writes that could not be delivered earlier (called after login and when the browser comes back online). */
  async function flushOutbox () {
    if (!user.value.participantNumber) return 0
    return persister.flush(user.value.participantNumber)
  }

  async function saveProgress (phase: number) {
    const { participantNumber, group } = user.value
    return persist('progress', {
      phase: phase,
      participant_number: participantNumber,
      study_group: group,
    }, 'participant_number')
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
    const { participantNumber, group } = user.value
    if (!isAuthenticated.value || !participantNumber) {
      console.error('Cannot save rating: not authenticated')
      return { error: { message: 'not authenticated' }, queued: false }
    }

    return persist('video_ratings', {
      participant_number: participantNumber,
      video_index: trial.position,
      pain_rating: ratings.pain,
      credibility_rating: ratings.credibility,
      difficulty_rating: ratings.difficulty,
      action_rating: ratings.action ?? null,
      video_filename: trial.filename.replace(/\.[^/.]+$/, ''),
      audio_type: trial.audioType,
      study_group: group,
      context: trial.context,
      video_type: trial.videoType,
      person_id: trial.personId,
    }, 'participant_number,video_index')
  }

  /** Persists the participant's trial plan (one row per participant, overwritten on conflict). */
  async function saveTrialPlan (plan: TrialPlan) {
    const { participantNumber, group } = user.value
    return persist('trial_plans', {
      participant_number: participantNumber,
      study_group: group,
      context_order: plan.contextOrder.join(','),
      plan: plan,
    }, 'participant_number')
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
    return persist('form_data', {
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
    }, 'participant_number')
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
    return persist('photo_ratings', {
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
    }, 'participant_number,photo_index')
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
    return persist('final_ratings', {
      participant_number: user.value.participantNumber,
      exaggeration: ratings.exaggeration,
      faking: ratings.faking,
      understating: ratings.understating,
      suppression: ratings.suppression,
      bus_empathy: ratings.bus_empathy,
      doctor_empathy: ratings.doctor_empathy,
      pension_empathy: ratings.pension_empathy,
      study_purpose: ratings.study_purpose
    }, 'participant_number')
  }

  async function saveEndingQuestions (answers: {
    isInformed: string
    wantsDeletion: string
    agreesSilence: string
  }) {
    return persist('ending_questions', {
      participant_number: user.value.participantNumber,
      is_informed: answers.isInformed,
      wants_deletion: answers.wantsDeletion,
      agrees_silence: answers.agreesSilence
    }, 'participant_number')
  }

  return {
    isAuthenticated,
    user,
    flushOutbox,
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
