<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const painRating = ref(5)
const credibilityRating = ref(5)
const difficultyRating = ref(5)
const currentStep = ref(1)
const countdown = ref(0)
const buttonDisabled = ref(false)

const props = defineProps<{
  videoIndex: number
}>()

const emit = defineEmits<{
  (e: 'rating-submitted', ratings: { pain: number, credibility: number, difficulty: number }): void
}>()

function nextStep () {
  if (currentStep.value < 3) {
    currentStep.value++
    resetCountdown()
  } else {
    submitRating()
  }
}

async function submitRating () {
  emit('rating-submitted', {
    pain: painRating.value,
    credibility: credibilityRating.value,
    difficulty: difficultyRating.value
  })
}

function resetCountdown () {
  countdown.value = 0 // change to 3
  buttonDisabled.value = false // change to true
  const interval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      buttonDisabled.value = false
      clearInterval(interval)
    }
  }, 1000)
}

onMounted(() => {
  resetCountdown()
})
</script>

<template>
  <div class="rating-container">
    <div v-if="currentStep === 1">
      <h2>Schmerzintensität</h2>
      <input
        type="range"
        min="0"
        max="10"
        v-model="painRating"
        class="slider"
      />
      <div class="rating-value">{{ painRating }}</div>
    </div>

    <div v-else-if="currentStep === 2">
      <h2>Glaubhaftigkeit der Schmerzen</h2>
      <input
        type="range"
        min="0"
        max="10"
        v-model="credibilityRating"
        class="slider"
      />
      <div class="rating-value">{{ credibilityRating }}</div>
    </div>

    <div v-else-if="currentStep === 3">
      <h2>Schwierigkeit der Beurteilung</h2>
      <input
        type="range"
        min="0"
        max="10"
        v-model="difficultyRating"
        class="slider"
      />
      <div class="rating-value">{{ difficultyRating }}</div>
    </div>

    <button
      @click="nextStep"
      class="next-button"
      :disabled="buttonDisabled"
    >
      Weiter <span v-if="buttonDisabled">({{ countdown }})</span>
    </button>
  </div>
</template>

<style scoped>
.rating-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

h2 {
  text-align: center;
}

.slider {
  width: 25rem;
}

.rating-value {
  text-align: center;
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

.next-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}
</style>
