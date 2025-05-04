<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  photoIndex: number
}>()

const emit = defineEmits<{
  (e: 'rating-submitted', ratings: {
    trustworthiness: number
    sympathy: number
    aura: number
    valence: number
    attractiveness: number
    stressLevel: number
  }): void
}>()

const trustworthiness = ref(5)
const sympathy = ref(5)
const aura = ref(5)
const valence = ref(5)
const attractiveness = ref(5)
const stressLevel = ref(5)

function submitRatings () {
  emit('rating-submitted', {
    trustworthiness: trustworthiness.value,
    sympathy: sympathy.value,
    aura: aura.value,
    valence: valence.value,
    attractiveness: attractiveness.value,
    stressLevel: stressLevel.value
  })
}
</script>

<template>
  <div class="rating-container">
    <h2>Bitte bewerten Sie die Person auf folgenden Skalen:</h2>

    <div class="rating-item">
      <label>Vertrauenswürdigkeit:</label>
      <input
        type="range"
        v-model="trustworthiness"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ trustworthiness }}</span>
    </div>

    <div class="rating-item">
      <label>Sympathie:</label>
      <input
        type="range"
        v-model="sympathy"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ sympathy }}</span>
    </div>

    <div class="rating-item">
      <label>Ausstrahlung:</label>
      <input
        type="range"
        v-model="aura"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ aura }}</span>
    </div>

    <div class="rating-item">
      <label>Valenz:</label>
      <input
        type="range"
        v-model="valence"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ valence }}</span>
    </div>

    <div class="rating-item">
      <label>Attraktivität:</label>
      <input
        type="range"
        v-model="attractiveness"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ attractiveness }}</span>
    </div>

    <div class="rating-item">
      <label>Stresslevel:</label>
      <input
        type="range"
        v-model="stressLevel"
        min="0"
        max="10"
        step="1"
      >
      <span>{{ stressLevel }}</span>
    </div>

    <button @click="submitRatings">Weiter</button>
  </div>
</template>

<style scoped>
.rating-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.rating-item {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

label {
  min-width: 200px;
  font-weight: bold;
}

input[type="range"] {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 4px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
}

span {
  min-width: 30px;
  text-align: center;
}

button {
  display: block;
  margin: 2rem auto 0;
  padding: 0.75rem 2rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>