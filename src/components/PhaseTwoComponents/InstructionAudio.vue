<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { getCurrentVideo, getVideoSource, getAudioSource } from '@/utils/videoManager'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  videoIndex: number
  context: string
}>()

const emit = defineEmits<{
  (e: 'audio-ended', filename: string): void
}>()

const audioElement = ref<HTMLAudioElement | null>(null)
const audioSource = `${import.meta.env.BASE_URL}video_instructions/${props.context}_${supabaseStore.user.group}.mp3`
const audioEnded = ref(false)

// Track retry attempts
const audioRetryCount = ref(0)
const MAX_RETRIES = 3

// Timer for fallback
let fallbackTimer: number | null = null


const handleAudioError = () => {
  if (audioRetryCount.value < MAX_RETRIES && audioElement.value) {
    audioRetryCount.value++
    console.log(`Retrying audio load (attempt ${audioRetryCount.value})`)
    setTimeout(() => {
      audioElement.value?.load()
    }, 2000)
  } else {
    console.log('Audio source:', audioSource)
    console.error('Audio failed to load after maximum retries')
  }
}

const startFallbackTimer = () => {
  // Clear any existing timer
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
  }

  // Set new timer
  fallbackTimer = window.setTimeout(() => {
    if (!audioEnded.value) {
      console.log('Fallback timer triggered - audio did not end naturally')
      audioEnded.value = true
      emit('audio-ended', 'bus_cdm')
    }
  }, 14500)
}

onMounted(() => {
  if (audioElement.value) {
    audioElement.value.addEventListener('ended', () => {
      audioEnded.value = true
      emit('audio-ended', 'bus_cdm')
    })

    // Add error handling
    audioElement.value.addEventListener('error', handleAudioError)
  }
  startFallbackTimer()
})
</script>

<template>
  <audio
    v-if="audioSource"
    ref="audioElement"
    :src="audioSource"
    autoplay
    preload="auto"
  />
</template>

<style scoped>
audio {
  display: none;
  /* Hide audio controls */
}
</style>
