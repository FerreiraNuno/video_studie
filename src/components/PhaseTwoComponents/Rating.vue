<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import RatingScale from '../shared/RatingScale.vue'

const supabaseStore = useSupabaseStore()
const painRating = ref<number | null>(null)
const credibilityRating = ref<number | null>(null)
const difficultyRating = ref<number | null>(null)
const currentStep = ref(1)
const countdown = ref(0)
const buttonDisabled = ref(false)

const props = defineProps<{
  videoIndex: number
  filename: string
}>()

const emit = defineEmits<{
  (e: 'rating-submitted', ratings: { pain: number, credibility: number, difficulty: number }, filename: string): void
}>()

function nextStep () {
  if (currentStep.value < 3) {
    currentStep.value += 1
    resetCountdown()
  } else {
    submitRating()
  }
}

async function submitRating () {
  if (painRating.value === null || credibilityRating.value === null || difficultyRating.value === null) {
    return
  }

  emit('rating-submitted', {
    pain: painRating.value,
    credibility: credibilityRating.value,
    difficulty: difficultyRating.value
  }, props.filename)
}

function resetCountdown () {
  countdown.value = supabaseStore.isDevelopment ? 0 : 2
  buttonDisabled.value = supabaseStore.isDevelopment ? false : true
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
    <template v-if="currentStep === 1">
      <h2>Schmerzintensität</h2>
      <RatingScale
        label=""
        left-label="kein Schmerz"
        right-label="stärkster vorstellbarer Schmerz"
        v-model="painRating"
      />
    </template>

    <template v-else-if="currentStep === 2">
      <h2>Glaubhaftigkeit der Schmerzen</h2>
      <RatingScale
        label=""
        left-label="überhaupt nicht glaubhaft"
        right-label="äußerst glaubhaft"
        v-model="credibilityRating"
      />
    </template>

    <template v-else-if="currentStep === 3">
      <h2>Schwierigkeit der Beurteilung</h2>
      <RatingScale
        label=""
        left-label="überhaupt nicht schwierig"
        right-label="äußerst schwierig"
        v-model="difficultyRating"
      />
    </template>

    <button
      @click="nextStep"
      class="next-button"
      :disabled="buttonDisabled ||
        (currentStep === 1 && painRating === null) ||
        (currentStep === 2 && credibilityRating === null) ||
        (currentStep === 3 && difficultyRating === null)"
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
  margin-bottom: 0;
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

.next-button:hover:not(:disabled) {
  background-color: #4338CA;
}

.next-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}
</style>
