<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const emit = defineEmits<{
  (e: 'next'): void
}>()

const props = defineProps<{
  imageNumber: number
  text: string
  context: 'bus' | 'doctor' | 'pension'
  group?: 'CDM' | 'SCT' | 'KG'
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isAudioComplete = ref(false)

const audioSrc = computed(() => `${import.meta.env.BASE_URL}${props.text}`)

const images = {
  bus: [
    `${import.meta.env.BASE_URL}context/bus_outside.jpg`,
    `${import.meta.env.BASE_URL}context/bus_inside.mp4`
  ],
  doctor: [
    `${import.meta.env.BASE_URL}context/praxis.jpg`,
    `${import.meta.env.BASE_URL}context/${props.context === 'doctor' ?
      props.group === 'SCT' ? 'it_firma.mp4' :
        props.group === 'KG' ? 'arbeit.mp4' :
          'praxis.mp4' : 'praxis.mp4'}`
  ],
  pension: [
    `${import.meta.env.BASE_URL}context/rentenstelle.jpg`,
    `${import.meta.env.BASE_URL}context/${props.context === 'pension' ?
      props.group === 'SCT' ? 'putzkraft.mp4' :
        props.group === 'KG' ? 'renten_weg.mp4' :
          'rentenstelle.mp4' : 'rentenstelle.mp4'}`
  ]
}

const isVideo = (url: string) => {
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')
}

// The "Weiter" button unlocks when the instruction audio has ended. The
// unlock timer is derived from the audio's real duration (the old fixed 38 s
// was shorter than one of the files); the cap only matters while metadata is
// unknown. If the audio cannot play at all, the button unlocks right away.
const HARD_CAP_MS = 45000
const END_MARGIN_MS = 1000
let timer: number | null = null

function unlock () {
  isAudioComplete.value = true
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function armTimer (ms: number) {
  if (timer !== null) clearTimeout(timer)
  timer = window.setTimeout(unlock, ms)
}

function onPlay () {
  const audio = audioRef.value
  if (audio && Number.isFinite(audio.duration)) {
    armTimer((audio.duration - audio.currentTime) * 1000 + END_MARGIN_MS)
  }
}

onMounted(() => {
  armTimer(HARD_CAP_MS)
  const audio = audioRef.value
  if (!audio) {
    unlock()
    return
  }
  audio.addEventListener('play', onPlay)
  audio.addEventListener('ended', unlock)
  audio.addEventListener('error', unlock)
  audio.play().catch(e => {
    console.warn('Context audio could not start:', e)
    unlock()
  })
})

onUnmounted(() => {
  if (timer !== null) clearTimeout(timer)
  const audio = audioRef.value
  if (audio) {
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('ended', unlock)
    audio.removeEventListener('error', unlock)
    audio.pause()
  }
})
</script>

<template>
  <div class="container">
    <div class="context">
      <div class="image-container">
        <img
          v-if="!isVideo(images[props.context][props.imageNumber])"
          :src="images[props.context][props.imageNumber]"
          :alt="`${props.context} context image`"
          class="media"
        />
        <video
          v-else
          :src="images[props.context][props.imageNumber]"
          class="media"
          autoplay
          loop
          muted
          playsinline
        ></video>
      </div>
      <audio
        ref="audioRef"
        :src="audioSrc"
        preload="auto"
      ></audio>
    </div>
    <div class="button-container">
      <button
        @click="emit('next')"
        class="next-button"
        :disabled="!isAudioComplete"
      >Weiter</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.context {
  display: flex;
  align-items: center;
}

.image-container {
  margin-right: 2rem;
  max-width: 45vw;
  min-width: 30rem;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dev-mode-text {
  color: #92400e;
  font-size: 0.875rem;
  text-align: center;
}

.next-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>