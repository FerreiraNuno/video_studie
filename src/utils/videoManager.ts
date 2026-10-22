import type { CatalogVideo, Trial, TrialPlan, Context, AudioType } from './trialPlan'

export type { Trial, TrialPlan, Context, AudioType }

/**
 * Fixed catalog of the 36 people shown in phase 2 (and as photos in phase 3),
 * plus the URL helpers for their media. Pure data: the participant's trial
 * plan lives in src/useStimuli.store.ts.
 * videoType 'pain-specific' = facial pain expression YES, 'unspecific' = NO.
 */
export const allVideos: readonly CatalogVideo[] = [
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

export function getVideoSource (filename: string): string {
  return `${import.meta.env.BASE_URL}videos/${filename}`
}

/** Self-report audio for a trial; the CDM group has its own slight/strong files. */
export function getAudioSource (audioType: AudioType, studyGroup: string): string {
  const base = `${import.meta.env.BASE_URL}audio/`
  if (studyGroup === 'CDM') {
    switch (audioType) {
      case 'no_pain': return `${base}cdm_sct_kg_no_pain.mp3`
      case 'slight_pain': return `${base}cdm_slight_pain.mp3`
      case 'strong_pain': return `${base}cdm_strong_pain.mp3`
    }
  }
  switch (audioType) {
    case 'no_pain': return `${base}cdm_sct_kg_no_pain.mp3`
    case 'slight_pain': return `${base}sct_kg_stlight_pain.mp3`
    case 'strong_pain': return `${base}sct_kg_strong_pain.mp3`
  }
}
