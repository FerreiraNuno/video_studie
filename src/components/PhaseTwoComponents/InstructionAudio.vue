<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
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

const audioRef = ref<HTMLAudioElement | null>(null)
const audioSource = `${import.meta.env.BASE_URL}video_instructions/${props.context}_${supabaseStore.user.group}.mp3`
const audioEnded = ref(false)

// Track retry attempts
const audioRetryCount = ref(0)
const MAX_RETRIES = 3

// Timer for fallback
let fallbackTimer: number | null = null

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

const playAudio = () => {
  if (audioRef.value) {
    audioRef.value.play()
  }
}

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.addEventListener('ended', () => {
      audioEnded.value = true
      emit('audio-ended', 'bus_cdm')
    })
  }
  playAudio()
  startFallbackTimer()
})

onUnmounted(() => {
  // Clean up the fallback timer
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
})
</script>

<template>
  <audio
    v-if="audioSource"
    ref="audioRef"
    :src="audioSource"
    preload="auto"
  />
</template>

<style scoped>
audio {
  display: none;
  /* Hide audio controls */
}
</style>
