import { defineStore } from "pinia"
import { supabase } from './lib/supabaseClient'
import { createPersister, type Row } from './lib/persist'
import { createSupabaseWriter } from './lib/supabaseWriter'
import { serializeLatest } from './lib/serializeLatest'
import { ref } from "vue"
import type { Trial, TrialPlan } from './utils/trialPlan'
import type { StudyPosition } from './utils/resume'

export type StudyGroup = 'CDM' | 'SCT' | 'KG'

/**
 * Every write goes through the persister (see src/lib/persist.ts): write-ahead
 * outbox in localStorage, retries, and idempotent writes on the row's natural
 * key. Study data is therefore never lost to a single failed request, and a
 * retry can never duplicate a row. The unique indexes behind the keys are
 * created by supabase/migrations/20261022_03_*.sql; which tables are upserted
 * and which are insert-only is explained in src/lib/supabaseWriter.ts.
 */
const UPSERT_TABLES = ['progress', 'trial_plans']

export const persister = createPersister({ writer: createSupabaseWriter(supabase, UPSERT_TABLES) })

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

  // Progress writes run one at a time, newest value wins (see serializeLatest):
  // two upserts of the same row in flight at once could land in either order.
  const writeProgress = serializeLatest((row: Row) => persist('progress', row, 'participant_number'))

  /** Upserts the resume point: the phase and, within phases 2/3, the position inside it. */
  async function saveProgress (phase: number, position: StudyPosition | null = null) {
    const { participantNumber, group } = user.value
    return writeProgress({
      phase: phase,
      position: position,
      participant_number: participantNumber,
      study_group: group,
    })
  }

  async function loadProgress () {
    const { participantNumber, group } = user.value

    const { data, error } = await supabase
      .from('progress')
      .select('phase, study_group, position')
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
  async function saveRating (
    ratings: { pain: number, credibility: number, difficulty: number, action?: number },
    trial: Trial,
    /** how the instruction audio / the trial ended (see Video.vue, InstructionAudio.vue); null after a reload during the rating */
    media: { instructionEndReason: string | null, trialEndReason: string | null } = { instructionEndReason: null, trialEndReason: null }
  ) {
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
      instruction_end_reason: media.instructionEndReason,
      trial_end_reason: media.trialEndReason,
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
      wants_vp_hours: formData.wantsVPHours ?? null,
      sona_id: formData.wantsVPHours && formData.sonaId ? String(formData.sonaId).trim() : null,
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
    }, 'participant_number,photo_filename')
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
