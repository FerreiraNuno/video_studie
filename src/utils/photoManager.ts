/**
 * Fixed catalog of the 36 photos shown in phase 3 (the same people as the
 * phase-2 videos) and the URL helper. Pure data: the participant's random
 * photo order lives in src/useStimuli.store.ts.
 */
export interface Photo {
  filename: string
  personId: string
  gender: 'male' | 'female'
  ageGroup: 'young' | 'old'
  photoType: 'pain-specific' | 'unspecific'
}

export const allPhotos: readonly Photo[] = [
  // Young females (5 individuals)
  // Pain-specific
  { filename: 'female_young_pain_01.png', personId: 'f_y_p_1', gender: 'female', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'female_young_pain_02.png', personId: 'f_y_p_2', gender: 'female', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'female_young_pain_03.png', personId: 'f_y_p_3', gender: 'female', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'female_young_pain_04.png', personId: 'f_y_p_4', gender: 'female', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'female_young_pain_05.png', personId: 'f_y_p_5', gender: 'female', ageGroup: 'young', photoType: 'pain-specific' },
  // Unspecific
  { filename: 'female_young_unspecific_06.png', personId: 'f_y_u_6', gender: 'female', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'female_young_unspecific_07.png', personId: 'f_y_u_7', gender: 'female', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'female_young_unspecific_08.png', personId: 'f_y_u_8', gender: 'female', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'female_young_unspecific_09.png', personId: 'f_y_u_9', gender: 'female', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'female_young_unspecific_10.png', personId: 'f_y_u_10', gender: 'female', ageGroup: 'young', photoType: 'unspecific' },

  // Young males (5 individuals)
  // Pain-specific
  { filename: 'male_young_pain_01.png', personId: 'm_y_p_1', gender: 'male', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'male_young_pain_02.png', personId: 'm_y_p_2', gender: 'male', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'male_young_pain_03.png', personId: 'm_y_p_3', gender: 'male', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'male_young_pain_04.png', personId: 'm_y_p_4', gender: 'male', ageGroup: 'young', photoType: 'pain-specific' },
  { filename: 'male_young_pain_05.png', personId: 'm_y_p_5', gender: 'male', ageGroup: 'young', photoType: 'pain-specific' },
  // Unspecific
  { filename: 'male_young_unspecific_06.png', personId: 'm_y_u_6', gender: 'male', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'male_young_unspecific_07.png', personId: 'm_y_u_7', gender: 'male', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'male_young_unspecific_08.png', personId: 'm_y_u_8', gender: 'male', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'male_young_unspecific_09.png', personId: 'm_y_u_9', gender: 'male', ageGroup: 'young', photoType: 'unspecific' },
  { filename: 'male_young_unspecific_10.png', personId: 'm_y_u_10', gender: 'male', ageGroup: 'young', photoType: 'unspecific' },

  // Old females (4 individuals)
  // Pain-specific
  { filename: 'female_old_pain_01.png', personId: 'f_o_p_1', gender: 'female', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'female_old_pain_02.png', personId: 'f_o_p_2', gender: 'female', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'female_old_pain_03.png', personId: 'f_o_p_3', gender: 'female', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'female_old_pain_04.png', personId: 'f_o_p_4', gender: 'female', ageGroup: 'old', photoType: 'pain-specific' },
  // Unspecific
  { filename: 'female_old_unspecific_05.png', personId: 'f_o_u_5', gender: 'female', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'female_old_unspecific_06.png', personId: 'f_o_u_6', gender: 'female', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'female_old_unspecific_07.png', personId: 'f_o_u_7', gender: 'female', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'female_old_unspecific_08.png', personId: 'f_o_u_8', gender: 'female', ageGroup: 'old', photoType: 'unspecific' },

  // Old males (4 individuals)
  // Pain-specific
  { filename: 'male_old_pain_01.png', personId: 'm_o_p_1', gender: 'male', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'male_old_pain_02.png', personId: 'm_o_p_2', gender: 'male', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'male_old_pain_03.png', personId: 'm_o_p_3', gender: 'male', ageGroup: 'old', photoType: 'pain-specific' },
  { filename: 'male_old_pain_04.png', personId: 'm_o_p_4', gender: 'male', ageGroup: 'old', photoType: 'pain-specific' },
  // Unspecific
  { filename: 'male_old_unspecific_05.png', personId: 'm_o_u_5', gender: 'male', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'male_old_unspecific_06.png', personId: 'm_o_u_6', gender: 'male', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'male_old_unspecific_07.png', personId: 'm_o_u_7', gender: 'male', ageGroup: 'old', photoType: 'unspecific' },
  { filename: 'male_old_unspecific_08.png', personId: 'm_o_u_8', gender: 'male', ageGroup: 'old', photoType: 'unspecific' }
]

export const allPhotoFilenames: readonly string[] = allPhotos.map(p => p.filename)

export function getPhotoSource (filename: string): string {
  return `${import.meta.env.BASE_URL}photos/${filename}`
}
