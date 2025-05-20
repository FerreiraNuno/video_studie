<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import RatingScale from '../shared/RatingScale.vue'

const painRating = ref<number | null>(null)
const credibilityRating = ref<number | null>(null)
const difficultyRating = ref<number | null>(null)
const currentStep = ref(1)
const buttonDisabled = ref(false)

const props = defineProps<{
  videoIndex: number
  filename: string
}>()

const emit = defineEmits<{
  (e: 'rating-submitted', ratings: { pain: number, credibility: number, difficulty: number }, filename: string, videoIndex: number): void
}>()

function nextStep () {
  if (currentStep.value < 3) {
    currentStep.value += 1
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
  }, props.filename, props.videoIndex)
}
</script>

<template>
  <div class="rating-container">
    <template v-if="currentStep === 1">
      <RatingScale
        label=""
        left-label="0: kein Schmerz"
        right-label="10: stärkster vorstellbarer Schmerz"
        v-model="painRating"
      />
    </template>

    <template v-else-if="currentStep === 2">
      <RatingScale
        label=""
        left-label="0: überhaupt nicht glaubhaft"
        right-label="10: äußerst glaubhaft"
        v-model="credibilityRating"
      />
    </template>

    <template v-else-if="currentStep === 3">
      <RatingScale
        label=""
        left-label="0: überhaupt nicht schwierig"
        right-label="10: äußerst schwierig"
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
      Weiter
    </button>
  </div>
</template>

<style scoped>
.rating-container {
  margin-top: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  @media screen and (max-width: 1280px) {
    width: 100vw;
  }
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
