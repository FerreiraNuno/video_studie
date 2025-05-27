<script setup lang="ts">
import { defineProps, ref, onMounted, computed } from 'vue'
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
    `${import.meta.env.BASE_URL}context/bus_outside.png`,
    `${import.meta.env.BASE_URL}context/bus_inside.mp4`
  ],
  doctor: [
    `${import.meta.env.BASE_URL}context/praxis.png`,
    `${import.meta.env.BASE_URL}context/${props.context === 'doctor' ?
      props.group === 'SCT' ? 'it_firma.mp4' :
        props.group === 'KG' ? 'arbeit.mp4' :
          'praxis.mp4' : 'praxis.mp4'}`
  ],
  pension: [
    `${import.meta.env.BASE_URL}context/rentenstelle.png`,
    `${import.meta.env.BASE_URL}context/${props.context === 'pension' ?
      props.group === 'SCT' ? 'putzkraft.mp4' :
        props.group === 'KG' ? 'renten_weg.mp4' :
          'rentenstelle.mp4' : 'rentenstelle.mp4'}`
  ]
}

const isVideo = (url: string) => {
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')
}

const playAudio = () => {
  if (audioRef.value) {
    audioRef.value.play()
  }
}

onMounted(() => {
  playAudio()
  if (audioRef.value) {
    audioRef.value.addEventListener('ended', () => {
      isAudioComplete.value = true
    })
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
        :disabled="!isAudioComplete && !supabaseStore.isDevelopment"
      >Weiter</button>
      <p
        v-if="supabaseStore.isDevelopment"
        class="dev-mode-text"
      >
        Im Entwicklungsmodus kann die Audiowiedergabe mit 'Weiter' übersprungen werden
      </p>
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