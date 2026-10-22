import { ref } from 'vue'

// Define the photo structure
interface Photo {
  filename: string
  personId: string  // Unique identifier for each person
  gender: 'male' | 'female'
  ageGroup: 'young' | 'old'
  photoType: 'pain-specific' | 'unspecific'
}

// Create a list of all photos with their metadata
const allPhotos: Photo[] = [
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

// The participant's photo order. It is randomized ONCE when phase 3 is first
// entered and persisted (progress.position.photoOrder) so a reload shows the
// same order; see PhaseThree.vue.
const shuffledPhotos = ref<Photo[]>([])

export const allPhotoFilenames: readonly string[] = allPhotos.map(p => p.filename)

/** Generates a new random order and returns its filenames. */
export function initializePhotoOrder (): string[] {
  const photos = [...allPhotos]
  for (let i = photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[photos[i], photos[j]] = [photos[j], photos[i]]
  }
  shuffledPhotos.value = photos
  return photos.map(p => p.filename)
}

/** Restores a saved order (filenames, must be a permutation of the catalog). */
export function setPhotoOrder (filenames: readonly string[]): void {
  const byName = new Map(allPhotos.map(p => [p.filename, p]))
  const photos = filenames.map(f => {
    const photo = byName.get(f)
    if (!photo) throw new Error(`Unknown photo ${f}`)
    return photo
  })
  if (photos.length !== allPhotos.length || new Set(photos).size !== allPhotos.length) {
    throw new Error('Photo order is not a permutation of the catalog')
  }
  shuffledPhotos.value = photos
}

export function getPhotoOrder (): string[] {
  return shuffledPhotos.value.map(p => p.filename)
}

// Function to get the current photo
export function getCurrentPhoto (index: number): Photo {
  const photo = shuffledPhotos.value[index]
  if (!photo) throw new Error(`No photo at index ${index}`)
  return photo
}

// Function to get the photo source URL
export function getPhotoSource (filename: string): string {
  return `${import.meta.env.BASE_URL}photos/${filename}`
} 