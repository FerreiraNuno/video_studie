import { shallowRef, computed } from 'vue'
import {
  generateTrialPlan,
  assertValidTrialPlan,
  describeTrialPlan,
  type CatalogVideo,
  type Trial,
  type TrialPlan,
  type Context,
  type AudioType
} from './trialPlan'

export type { Trial, TrialPlan, Context, AudioType }

// Fixed catalog of the 36 people shown in phase 2 (and as photos in phase 3).
// videoType 'pain-specific' = facial pain expression YES, 'unspecific' = NO.
export const allVideos: CatalogVideo[] = [
  // Young females (5 individuals)
  // Pain-specific
  { filename: 'female_young_pain_01.mp4', personId: 'f_y_p_1', gender: 'female', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'female_young_pain_02.mp4', personId: 'f_y_p_2', gender: 'female', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'female_young_pain_03.mp4', personId: 'f_y_p_3', gender: 'female', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'female_young_pain_04.mp4', personId: 'f_y_p_4', gender: 'female', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'female_young_pain_05.mp4', personId: 'f_y_p_5', gender: 'female', ageGroup: 'young', videoType: 'pain-specific' },
  // Unspecific
  { filename: 'female_young_unspecific_06.mp4', personId: 'f_y_u_6', gender: 'female', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'female_young_unspecific_07.mp4', personId: 'f_y_u_7', gender: 'female', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'female_young_unspecific_08.mp4', personId: 'f_y_u_8', gender: 'female', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'female_young_unspecific_09.mp4', personId: 'f_y_u_9', gender: 'female', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'female_young_unspecific_10.mp4', personId: 'f_y_u_10', gender: 'female', ageGroup: 'young', videoType: 'unspecific' },

  // Young males (5 individuals)
  // Pain-specific
  { filename: 'male_young_pain_01.mp4', personId: 'm_y_p_1', gender: 'male', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'male_young_pain_02.mp4', personId: 'm_y_p_2', gender: 'male', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'male_young_pain_03.mp4', personId: 'm_y_p_3', gender: 'male', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'male_young_pain_04.mp4', personId: 'm_y_p_4', gender: 'male', ageGroup: 'young', videoType: 'pain-specific' },
  { filename: 'male_young_pain_05.mp4', personId: 'm_y_p_5', gender: 'male', ageGroup: 'young', videoType: 'pain-specific' },
  // Unspecific
  { filename: 'male_young_unspecific_06.mp4', personId: 'm_y_u_6', gender: 'male', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'male_young_unspecific_07.mp4', personId: 'm_y_u_7', gender: 'male', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'male_young_unspecific_08.mp4', personId: 'm_y_u_8', gender: 'male', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'male_young_unspecific_09.mp4', personId: 'm_y_u_9', gender: 'male', ageGroup: 'young', videoType: 'unspecific' },
  { filename: 'male_young_unspecific_10.mp4', personId: 'm_y_u_10', gender: 'male', ageGroup: 'young', videoType: 'unspecific' },

  // Old females (4 individuals)
  // Pain-specific
  { filename: 'female_old_pain_01.mp4', personId: 'f_o_p_1', gender: 'female', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'female_old_pain_02.mp4', personId: 'f_o_p_2', gender: 'female', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'female_old_pain_03.mp4', personId: 'f_o_p_3', gender: 'female', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'female_old_pain_04.mp4', personId: 'f_o_p_4', gender: 'female', ageGroup: 'old', videoType: 'pain-specific' },
  // Unspecific
  { filename: 'female_old_unspecific_05.mp4', personId: 'f_o_u_5', gender: 'female', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'female_old_unspecific_06.mp4', personId: 'f_o_u_6', gender: 'female', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'female_old_unspecific_07.mp4', personId: 'f_o_u_7', gender: 'female', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'female_old_unspecific_08.mp4', personId: 'f_o_u_8', gender: 'female', ageGroup: 'old', videoType: 'unspecific' },

  // Old males (4 individuals)
  // Pain-specific
  { filename: 'male_old_pain_01.mp4', personId: 'm_o_p_1', gender: 'male', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'male_old_pain_02.mp4', personId: 'm_o_p_2', gender: 'male', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'male_old_pain_03.mp4', personId: 'm_o_p_3', gender: 'male', ageGroup: 'old', videoType: 'pain-specific' },
  { filename: 'male_old_pain_04.mp4', personId: 'm_o_p_4', gender: 'male', ageGroup: 'old', videoType: 'pain-specific' },
  // Unspecific
  { filename: 'male_old_unspecific_05.mp4', personId: 'm_o_u_5', gender: 'male', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'male_old_unspecific_06.mp4', personId: 'm_o_u_6', gender: 'male', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'male_old_unspecific_07.mp4', personId: 'm_o_u_7', gender: 'male', ageGroup: 'old', videoType: 'unspecific' },
  { filename: 'male_old_unspecific_08.mp4', personId: 'm_o_u_8', gender: 'male', ageGroup: 'old', videoType: 'unspecific' }
]

// ---------------------------------------------------------------------------
// Session state: the trial plan of the current participant.
//
// The plan is generated ONCE per participant (in phase 1), persisted to the
// `trial_plans` table and re-used in phase 2 – so a page reload or the
// phase 1 → phase 2 transition never re-randomizes it. The old implementation
// mutated the shared catalog objects and re-ran the assignment on every
// mount, which carried stale audio assignments into a new context assignment
// and broke the 2-per-combination balance.
// ---------------------------------------------------------------------------
const trialPlan = shallowRef<TrialPlan | null>(null)

/** Order in which the three contexts are shown (empty until a plan exists). */
export const contextOrder = computed<Context[]>(() => trialPlan.value?.contextOrder ?? [])

export function isVideoOrderInitialized (): boolean {
  return trialPlan.value !== null
}

export function getTrialPlan (): TrialPlan | null {
  return trialPlan.value
}

/** Generates a NEW validated plan (throws TrialPlanError if it cannot be balanced). */
export function initializeVideoOrder (): TrialPlan {
  const plan = generateTrialPlan(allVideos)
  trialPlan.value = plan
  console.log('Trial plan generated and validated\n' + describeTrialPlan(plan))
  return plan
}

/** Returns the existing plan, generating one only if none exists yet. */
export function ensureVideoOrder (): TrialPlan {
  return trialPlan.value ?? initializeVideoOrder()
}

/** Restores a previously saved plan (e.g. loaded from Supabase); it is re-validated. */
export function setTrialPlan (plan: TrialPlan): TrialPlan {
  assertValidTrialPlan(plan, allVideos)
  trialPlan.value = plan
  console.log('Trial plan restored and validated\n' + describeTrialPlan(plan))
  return plan
}

/** Trial at 0-based index (0..35) in presentation order. */
export function getCurrentVideo (index: number): Trial {
  const plan = trialPlan.value
  if (!plan) throw new Error('Trial plan not initialized')
  const trial = plan.trials[index]
  if (!trial) throw new Error(`No trial at index ${index}`)
  return trial
}

// Function to get the video source URL
export function getVideoSource (filename: string): string {
  return `${import.meta.env.BASE_URL}videos/${filename}`
}

// Function to get the audio source URL
export function getAudioSource (audioType: 'no_pain' | 'slight_pain' | 'strong_pain', studyGroup: string): string {
  // For CDM group
  if (studyGroup === 'CDM') {
    switch (audioType) {
      case 'no_pain':
        return `${import.meta.env.BASE_URL}audio/cdm_sct_kg_no_pain.mp3`
      case 'slight_pain':
        return `${import.meta.env.BASE_URL}audio/cdm_slight_pain.mp3`
      case 'strong_pain':
        return `${import.meta.env.BASE_URL}audio/cdm_strong_pain.mp3`
    }
  }

  // For SCT and KG groups
  switch (audioType) {
    case 'no_pain':
      return `${import.meta.env.BASE_URL}audio/cdm_sct_kg_no_pain.mp3`
    case 'slight_pain':
      return `${import.meta.env.BASE_URL}audio/sct_kg_stlight_pain.mp3`
    case 'strong_pain':
      return `${import.meta.env.BASE_URL}audio/sct_kg_strong_pain.mp3`
  }
} 