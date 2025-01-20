<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '../useProgress.store'
import { useSupabaseStore } from '@/useSupabase.store'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()
const rating = ref(5)

async function submitRating () {
  console.log('Rating submitted:', rating.value)

  await supabaseStore.saveRating(progressStore.currentIndex + 1, rating.value)

  progressStore.finishSection()
}

</script>

<template>
  <div class="rating-container">
    <h2>Wie bewertest du dieses Video?</h2>
    <input
      type="range"
      min="1"
      max="10"
      v-model="rating"
      class="slider"
    />
    <div class="rating-value">{{ rating }}</div>
    <button
      @click="submitRating"
      class="next-button"
    >Weiter</button>
  </div>
</template>

<style scoped>
.rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.slider {
  width: 100%;
}

.rating-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.next-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  color: #ffffff;
  background-color: #585858;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.next-button:hover {
  background-color: #4338CA;
}
</style>
