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
console.log('props.videoIndex', props.videoIndex)
console.log('currentVideo', currentVideo)
const videoSource = getVideoSource(currentVideo.filename)
const audioSource = currentVideo.audioType ? getAudioSource(currentVideo.audioType) : null

// Track if we're in audio playback phase
const isAudioPlaying = ref(false)

onMounted(() => {
  console.log('Video.vue mounted')
  console.log('isDevelopment', supabaseStore.isDevelopment)
  console.log('filename video', currentVideo.filename)
  console.log('audioType', currentVideo.audioType)

  if (videoElement.value) {
    if (supabaseStore.isDevelopment) {
      // In development mode, set the video duration to 1 second
      videoElement.value.addEventListener('loadedmetadata', () => {
        videoElement.value!.currentTime = videoElement.value!.duration - 1
      })
    }

    videoElement.value.addEventListener('ended', () => {
      if (audioSource && audioElement.value) {
        isAudioPlaying.value = true
        if (supabaseStore.isDevelopment) {
          // In development mode, set the audio duration to 6 seconds
          audioElement.value.currentTime = audioElement.value.duration - 3
        }
        audioElement.value.play()
      } else {
        emit('video-ended', currentVideo.filename)
      }
    })
  }

  if (audioElement.value) {
    audioElement.value.addEventListener('ended', () => {
      isAudioPlaying.value = false
      emit('video-ended', currentVideo.filename)
    })
  }
})
</script>

<template>
  <div class="video-container">
    <div class="dev-mode-notice">
      <div>Video {{ props.videoIndex + 1 }}</div>
    </div>
    <div class="dev-mode-notice">
      <div>{{ currentVideo.filename.slice(0, -4) }}</div>
    </div>
    <video
      v-if="!isAudioPlaying"
      ref="videoElement"
      :src="videoSource"
      autoplay
      playsinline
    >
      Your browser does not support the video tag.
    </video>
    <div
      v-else
      class="blank-screen"
    >
      <!-- Blank screen during audio playback -->
    </div>
    <audio
      v-if="audioSource"
      ref="audioElement"
      :src="audioSource"
      preload="auto"
    />
    <div
      v-if="supabaseStore.isDevelopment"
      class="dev-mode-notice"
    >
      {{ isAudioPlaying ? 'Audio gekürzt auf 3 Sekunden' : 'Video gekürzt auf 1 Sekunde' }}
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
