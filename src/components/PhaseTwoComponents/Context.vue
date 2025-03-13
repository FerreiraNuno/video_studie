<script setup lang="ts">
import { defineProps } from 'vue'

const images = [
  `${import.meta.env.BASE_URL}images/bus_outside.png`,
  `${import.meta.env.BASE_URL}images/bus_inside.png`,
]

const emit = defineEmits<{
  (e: 'next'): void
}>()

const props = defineProps<{
  imageNumber: number
  text: string
}>()
</script>

<template>
  <div class="container">
    <div class="context">
      <img
        :src="images[props.imageNumber]"
        alt="Image"
        class="image"
      />
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

.image {
  margin-right: 4rem;
  max-width: 50vw;
  height: auto;
}

.text {
  flex: 1;
  font-size: 1.5rem;
}
</style>