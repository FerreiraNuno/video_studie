<script setup lang="ts">
import { defineProps } from 'vue'

const images = {
  bus: [
    `${import.meta.env.BASE_URL}context/bus_outside.png`,
    `${import.meta.env.BASE_URL}context/bus_inside.mp4`
  ],
  doctor: [
    `${import.meta.env.BASE_URL}context/praxis.png`
  ],
  pension: [
    `${import.meta.env.BASE_URL}context/rentenstelle.png`
  ]
}

const emit = defineEmits<{
  (e: 'next'): void
}>()

const props = defineProps<{
  imageNumber: number
  text: string
  context: 'bus' | 'doctor' | 'pension'
}>()

const isVideo = (url: string) => {
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')
}
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
      <p class="text">{{ props.text }}</p>
    </div>
    <button
      @click="emit('next')"
      class="next-button"
    >Weiter</button>
  </div>
</template>

<style scoped>
.container {
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

.text {
  flex: 1;
  font-size: 1.5rem;
  white-space: pre-line;
}
</style>