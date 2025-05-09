import { ref } from 'vue'

// Define the video structure
interface Video {
  filename: string
  personId: string  // Unique identifier for each person
  gender: 'male' | 'female'
  ageGroup: 'young' | 'old'
  videoType: 'pain-specific' | 'unspecific'
  context?: 'bus' | 'doctor' | 'pension'  // Optional since it will be assigned during initialization
  audioType?: 'no_pain' | 'slight_pain' | 'strong_pain'  // Optional since it will be assigned during initialization
}

// Create a list of all videos with their metadata
const allVideos: Video[] = [
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

// Create a shuffled list of videos for each context
const shuffledVideos = ref<Video[]>([])

// Function to initialize the video order
export function initializeVideoOrder () {
  // Create a copy of all videos
  const videos = [...allVideos]

  // Group videos by context
  const contextGroups = {
    bus: [] as Video[],
    doctor: [] as Video[],
    pension: [] as Video[]
  }

  // Track gender distribution per context
  const genderCounts = {
    bus: { male: 0, female: 0 },
    doctor: { male: 0, female: 0 },
    pension: { male: 0, female: 0 }
  }

  // Helper function to shuffle an array
  const shuffleArray = <T> (array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Helper function to get available contexts
  const getAvailableContexts = (excludeContext?: 'bus' | 'doctor' | 'pension'): ('bus' | 'doctor' | 'pension')[] => {
    const contexts: ('bus' | 'doctor' | 'pension')[] = ['bus', 'doctor', 'pension']
    return excludeContext ? contexts.filter(c => c !== excludeContext) : contexts
  }

  // Helper function to get context with fewest videos of specific gender
  const getContextWithFewestVideos = (
    gender: 'male' | 'female',
    excludeContext?: 'bus' | 'doctor' | 'pension'
  ): 'bus' | 'doctor' | 'pension' => {
    const availableContexts = getAvailableContexts(excludeContext)
    return availableContexts.reduce((minContext, context) =>
      genderCounts[context][gender] < genderCounts[minContext][gender] ? context : minContext
      , availableContexts[0])
  }

  // Helper function to check if age distribution is valid
  const isValidAgeDistribution = (): boolean => {
    return Object.entries(contextGroups).every(([context, videos]) => {
      const youngCount = videos.filter(v => v.ageGroup === 'young').length
      const oldCount = videos.filter(v => v.ageGroup === 'old').length
      return youngCount >= oldCount
    })
  }

  // Helper function to distribute videos
  const distributeVideos = () => {
    // Reset context groups and gender counts
    Object.keys(contextGroups).forEach(context => {
      contextGroups[context as keyof typeof contextGroups] = []
      genderCounts[context as keyof typeof genderCounts] = { male: 0, female: 0 }
    })

    // First, separate videos by type
    const painSpecificVideos = videos.filter(v => v.videoType === 'pain-specific')
    const unspecificVideos = videos.filter(v => v.videoType === 'unspecific')

    // Shuffle both groups
    const shuffledPainSpecific = shuffleArray([...painSpecificVideos])
    const shuffledUnspecific = shuffleArray([...unspecificVideos])

    // Distribute pain-specific videos first
    shuffledPainSpecific.forEach(video => {
      const context = getContextWithFewestVideos(video.gender)
      video.context = context
      contextGroups[context].push(video)
      genderCounts[context][video.gender]++
    })

    // Then distribute unspecific videos
    shuffledUnspecific.forEach(video => {
      const context = getContextWithFewestVideos(video.gender)
      video.context = context
      contextGroups[context].push(video)
      genderCounts[context][video.gender]++
    })

    // Shuffle videos within each context
    Object.keys(contextGroups).forEach(context => {
      contextGroups[context as keyof typeof contextGroups] = shuffleArray(contextGroups[context as keyof typeof contextGroups])
    })
  }

  // Helper function to assign audio files
  const assignAudioFiles = () => {
    const audioTypes: ('no_pain' | 'slight_pain' | 'strong_pain')[] = ['no_pain', 'slight_pain', 'strong_pain']
    const videoTypes: ('pain-specific' | 'unspecific')[] = ['pain-specific', 'unspecific']

    // For each context
    Object.entries(contextGroups).forEach(([context, videos]) => {
      // For each video type
      videoTypes.forEach(videoType => {
        // Get videos of this type
        const typeVideos = videos.filter(v => v.videoType === videoType)

        // Shuffle the videos to randomize audio assignment
        const shuffledVideos = shuffleArray([...typeVideos])

        // Get male and female videos
        const maleVideos = shuffledVideos.filter(v => v.gender === 'male')
        const femaleVideos = shuffledVideos.filter(v => v.gender === 'female')

        // Assign each audio type to one male and one female video
        audioTypes.forEach(audioType => {
          // Find an unassigned male video
          const maleVideo = maleVideos.find(v => !v.audioType)
          if (maleVideo) {
            maleVideo.audioType = audioType
          }

          // Find an unassigned female video
          const femaleVideo = femaleVideos.find(v => !v.audioType)
          if (femaleVideo) {
            femaleVideo.audioType = audioType
          }
        })
      })
    })
  }

  // Keep redistributing until we get a valid age distribution
  let attempts = 0
  const maxAttempts = 1000
  do {
    distributeVideos()
    attempts++
    if (attempts >= maxAttempts) {
      console.error('Failed to find a valid distribution after', maxAttempts, 'attempts')
      break
    }
  } while (!isValidAgeDistribution())

  // Assign audio files after we have a valid distribution
  assignAudioFiles()

  // Combine all videos in the order: bus, doctor, pension
  shuffledVideos.value = [
    ...contextGroups.bus,
    ...contextGroups.doctor,
    ...contextGroups.pension
  ]

  // Log distribution for verification
  const contexts: (keyof typeof contextGroups)[] = ['bus', 'doctor', 'pension']
  for (const context of contexts) {
    contextGroups[context].forEach((video: Video) => {
      console.log(`${context.charAt(0).toUpperCase() + context.slice(1)} video: ${video.personId}---${video.videoType}---${video.audioType || 'no audio'}`)
    })
    console.log("--------------------------------")
  }
  console.log("--------------------------------")

  // Log how many pain-specific and unspecific videos there are for each context
  console.log('Bus pain-specific:', contextGroups.bus.filter(v => v.videoType === 'pain-specific').length)
  console.log('Bus unspecific:', contextGroups.bus.filter(v => v.videoType === 'unspecific').length)
  console.log('Doctor pain-specific:', contextGroups.doctor.filter(v => v.videoType === 'pain-specific').length)
  console.log('Doctor unspecific:', contextGroups.doctor.filter(v => v.videoType === 'unspecific').length)
  console.log('Pension pain-specific:', contextGroups.pension.filter(v => v.videoType === 'pain-specific').length)
  console.log('Pension unspecific:', contextGroups.pension.filter(v => v.videoType === 'unspecific').length)
  console.log("--------------------------------")

  // Log how many young and old videos there are for each context
  console.log('Bus young:', contextGroups.bus.filter(v => v.ageGroup === 'young').length)
  console.log('Bus old:', contextGroups.bus.filter(v => v.ageGroup === 'old').length)
  console.log('Doctor young:', contextGroups.doctor.filter(v => v.ageGroup === 'young').length)
  console.log('Doctor old:', contextGroups.doctor.filter(v => v.ageGroup === 'old').length)
  console.log('Pension young:', contextGroups.pension.filter(v => v.ageGroup === 'young').length)
  console.log('Pension old:', contextGroups.pension.filter(v => v.ageGroup === 'old').length)
  console.log("--------------------------------")

  // Log how many male and female videos there are for each context
  console.log('Bus male:', contextGroups.bus.filter(v => v.gender === 'male').length)
  console.log('Bus female:', contextGroups.bus.filter(v => v.gender === 'female').length)
  console.log('Doctor male:', contextGroups.doctor.filter(v => v.gender === 'male').length)
  console.log('Doctor female:', contextGroups.doctor.filter(v => v.gender === 'female').length)
  console.log('Pension male:', contextGroups.pension.filter(v => v.gender === 'male').length)
  console.log('Pension female:', contextGroups.pension.filter(v => v.gender === 'female').length)
  console.log("--------------------------------")

  // Log audio distribution for each context
  contexts.forEach(context => {
    console.log(`${context.charAt(0).toUpperCase() + context.slice(1)} audio distribution:`)
    const contextVideos = contextGroups[context]
    const audioTypes = ['no_pain', 'slight_pain', 'strong_pain'] as const
    const videoTypes = ['pain-specific', 'unspecific'] as const

    videoTypes.forEach(videoType => {
      console.log(`\n${videoType}:`)
      audioTypes.forEach(audioType => {
        const maleWithAudio = contextVideos.filter(v =>
          v.gender === 'male' &&
          v.videoType === videoType &&
          v.audioType === audioType
        ).length
        const femaleWithAudio = contextVideos.filter(v =>
          v.gender === 'female' &&
          v.videoType === videoType &&
          v.audioType === audioType
        ).length
        console.log(`${audioType}: ${maleWithAudio} male, ${femaleWithAudio} female`)
      })
    })
    console.log("--------------------------------")
  })
}

// Function to get the current video
export function getCurrentVideo (index: number): Video {
  return shuffledVideos.value[index]
}

// Function to get the video source URL
export function getVideoSource (filename: string): string {
  return `${import.meta.env.BASE_URL}videos/${filename}`
}

// Function to get the audio source URL
export function getAudioSource (audioType: 'no_pain' | 'slight_pain' | 'strong_pain'): string {
  return `${import.meta.env.BASE_URL}audio/audio_${audioType}.mp3`
} 