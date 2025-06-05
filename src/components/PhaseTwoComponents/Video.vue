<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { getCurrentVideo, getVideoSource, getAudioSource } from '@/utils/videoManager'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  videoIndex: number
}>()

const emit = defineEmits<{
  (e: 'video-ended', filename: string): void
}>()

const videoElement = ref<HTMLVideoElement | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)
const currentVideo = getCurrentVideo(props.videoIndex)
const videoSource = getVideoSource(currentVideo.filename)
const audioSource = currentVideo.audioType ? getAudioSource(currentVideo.audioType) : null

// Track if both media elements have finished
const videoEnded = ref(false)
const audioEnded = ref(false)

// Track retry attempts
const videoRetryCount = ref(0)
const audioRetryCount = ref(0)
const MAX_RETRIES = 3

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

onMounted(() => {
  if (videoElement.value) {
    // Ensure video is muted
    videoElement.value.muted = true

    if (supabaseStore.isDevelopment) {
      // In development mode, set the video duration to 3 second
      videoElement.value.addEventListener('loadedmetadata', () => {
        videoElement.value!.currentTime = videoElement.value!.duration - 3
      })
    }

    // Ensure video stays muted
    videoElement.value.addEventListener('play', () => {
      videoElement.value!.muted = true
    })

    // Add error handling
    videoElement.value.addEventListener('error', handleVideoError)
  }

  if (audioElement.value) {
    if (supabaseStore.isDevelopment) {
      // In development mode, set the audio duration to 3 seconds
      audioElement.value.addEventListener('loadedmetadata', () => {
        audioElement.value!.currentTime = audioElement.value!.duration - 3
      })
    }
    audioElement.value.addEventListener('ended', () => {
      audioEnded.value = true
      emit('video-ended', currentVideo.filename)
    })

    // Add error handling
    audioElement.value.addEventListener('error', handleAudioError)
  }
})
</script>

<template>
  <div class="video-container">
    <div
      class="dev-mode-notice"
      v-if="supabaseStore.isDevelopment"
    >
      <div>Video {{ props.videoIndex + 1 }}</div>
    </div>
    <div
      v-if="supabaseStore.isDevelopment"
      class="dev-mode-notice"
    >
      <div>{{ currentVideo.filename.slice(0, -4) }}</div>
    </div>
    <video
      ref="videoElement"
      :src="videoSource"
      autoplay
      playsinline
      :muted="true"
    >
      Ihr Browser unterstützt die Video Wiedergabe nicht.
    </video>
    <audio
      v-if="audioSource"
      ref="audioElement"
      :src="audioSource"
      autoplay
      preload="auto"
    />
    <div
      v-if="supabaseStore.isDevelopment"
      class="dev-mode-notice"
    >
      {{ 'Video gekürzt auf 3 Sekunden' }}
    </div>
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
