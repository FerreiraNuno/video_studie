<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { getCurrentVideo, getVideoSource, getAudioSource } from '@/utils/videoManager'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  videoIndex: number
  studyGroup: string
}>()

const emit = defineEmits<{
  (e: 'video-ended', filename: string): void
}>()

const videoElement = ref<HTMLVideoElement | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)

const currentVideo = getCurrentVideo(props.videoIndex)
const videoSource = getVideoSource(currentVideo.filename)
const audioSource = currentVideo.audioType ? getAudioSource(currentVideo.audioType, supabaseStore.user.group) : null

// Track if video and instruction audio have finished
const videoEnded = ref(false)


// Track retry attempts
const videoRetryCount = ref(0)
const audioRetryCount = ref(0)
const MAX_RETRIES = 3

// Timer for fallback
let fallbackTimer: number | null = null

const handleVideoError = () => {
  if (videoRetryCount.value < MAX_RETRIES && videoElement.value) {
    videoRetryCount.value++
    console.log(`Retrying video load (attempt ${videoRetryCount.value})`)
    setTimeout(() => {
      videoElement.value?.load()
    }, 2000)
  } else {
    console.error('Video failed to load after maximum retries')
  }
}

const handleAudioError = () => {
  if (audioRetryCount.value < MAX_RETRIES && audioElement.value) {
    audioRetryCount.value++
    console.log(`Retrying audio load (attempt ${audioRetryCount.value})`)
    setTimeout(() => {
      audioElement.value?.load()
    }, 2000)
  } else {
    console.error('Audio failed to load after maximum retries')
  }
}

const startFallbackTimer = () => {
  // Fallback timer as a safety mechanism only
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
  }

  fallbackTimer = window.setTimeout(() => {
    if (!videoEnded.value) {
      console.log('Fallback timer triggered - video did not end naturally')
      videoEnded.value = true
      emit('video-ended', currentVideo.filename)
    }
  }, 8000)
}


const startVideo = () => {
  if (videoElement.value) {
    console.log('Starting video playback')
    videoElement.value.play()
    console.log('Video duration:', videoElement.value.duration)
  }
  if (audioElement.value) {
    console.log('Starting audio playback')
    audioElement.value.play()
    console.log('Audio duration:', audioElement.value.duration)
  }
  startFallbackTimer()
}

onMounted(() => {
  if (videoElement.value) {
    // Ensure video is mute
    videoElement.value.muted = true

    // Ensure video stays muted
    videoElement.value.addEventListener('play', () => {
      videoElement.value!.muted = true
    })

    // Add error handling
    videoElement.value.addEventListener('error', (e) => {
      console.error('Video error:', e)
      console.error('Video error details:', videoElement.value?.error)
      handleVideoError()
    })

    // Add ended event listener - this is the primary trigger
    videoElement.value.addEventListener('ended', () => {
      console.log('Video ended naturally')
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
      }
      videoEnded.value = true
      emit('video-ended', currentVideo.filename)
    })
  }

  if (audioElement.value) {
    audioElement.value.addEventListener('loadedmetadata', () => {
      console.log('Audio duration:', audioElement.value?.duration)
    })
    // Add error handling
    audioElement.value.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      handleAudioError()
    })
  }
})
</script>

<template>
  <div class="video-container">
    <video
      ref="videoElement"
      :src="videoSource"
      playsinline
      :muted="true"
    >
      Ihr Browser unterstützt die Video Wiedergabe nicht.
    </video>
    <audio
      v-if="audioSource"
      ref="audioElement"
      :src="audioSource"
    />
  </div>
</template>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: bold;
}

video {
  height: 500px;
  max-width: 100%;
}

.blank-screen {
  height: 500px;
  width: 100%;
  max-width: 100%;
  background-color: black;
}

.dev-mode-notice {
  background-color: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

audio {
  display: none;
  /* Hide audio controls */
}
</style>
