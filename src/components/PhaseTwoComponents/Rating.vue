<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, computed } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import RatingScale from '../shared/RatingScale.vue'

const painRating = ref<number | null>(null)
const credibilityRating = ref<number | null>(null)
const difficultyRating = ref<number | null>(null)
const actionRating = ref<number | null>(null)
const currentStep = ref(1)
const buttonDisabled = ref(false)

const supabaseStore = useSupabaseStore()
const isCDM = computed(() => supabaseStore.user.group === 'CDM' && props.context !== 'none')

const props = defineProps<{
  videoIndex: number
  filename: string
  context: 'bus' | 'doctor' | 'pension' | 'none'
}>()

const emit = defineEmits<{
  (e: 'rating-submitted', ratings: { pain: number, credibility: number, difficulty: number, action?: number }, filename: string, videoIndex: number): void
}>()

function nextStep () {
  if (currentStep.value < (isCDM.value ? 4 : 3)) {
    currentStep.value += 1
  } else {
    submitRating()
  }
}

async function submitRating () {
  if (painRating.value === null || credibilityRating.value === null || difficultyRating.value === null) {
    return
  }

  if (isCDM.value && actionRating.value === null) {
    return
  }

  const ratings = {
    pain: painRating.value,
    credibility: credibilityRating.value,
    difficulty: difficultyRating.value,
    ...(isCDM.value && actionRating.value !== null ? { action: actionRating.value } : {})
  }

  emit('rating-submitted', ratings, props.filename, props.videoIndex)
}

const actionQuestion = computed(() => {
  switch (props.context) {
    case 'bus':
      return 'Wie wahrscheinlich ist es, dass Sie für diese Person den Platz im Bus freigemacht hätten?'
    case 'doctor':
      return 'Wie wahrscheinlich ist es, dass Sie dieser Person das teure Schmerzmittel verschrieben hätten?'
    case 'pension':
      return 'Wie wahrscheinlich ist es, dass Sie dem Rentenwunsch dieser Person zugestimmt hätten?'
    default:
      return ''
  }
})
</script>

<template>
  <div class="rating-container">
    <template v-if="currentStep === 1">
      <RatingScale
        label="Wie stark sind die Schmerzen?"
        left-label="0: kein Schmerz"
        right-label="10: stärkster vorstellbarer Schmerz"
        v-model="painRating"
      />
    </template>

    <template v-else-if="currentStep === 2">
      <RatingScale
        label="Wie glaubwürdig werden die Schmerzen berichtet und gezeigt?"
        left-label="0: überhaupt nicht glaubhaft"
        right-label="10: äußerst glaubhaft"
        v-model="credibilityRating"
      />
    </template>

    <template v-else-if="currentStep === 3">
      <RatingScale
        label="Wie schwierig war die Beurteilung der Schmerzen?"
        left-label="0: überhaupt nicht schwierig"
        right-label="10: äußerst schwierig"
        v-model="difficultyRating"
      />
    </template>

    <template v-else-if="currentStep === 4 && isCDM">
      <RatingScale
        :label="actionQuestion"
        left-label="0: sehr unwahrscheinlich"
        right-label="10: sehr wahrscheinlich"
        v-model="actionRating"
      />
    </template>

    <button
      @click="nextStep"
      class="next-button"
      :disabled="buttonDisabled ||
        (currentStep === 1 && painRating === null) ||
        (currentStep === 2 && credibilityRating === null) ||
        (currentStep === 3 && difficultyRating === null) ||
        (currentStep === 4 && isCDM && actionRating === null)"
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
