<script setup lang="ts">
import { ref } from 'vue'
import RatingScale from '../shared/RatingScale.vue'

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

const trustworthiness = ref<number | null>(null)
const sympathy = ref<number | null>(null)
const aura = ref<number | null>(null)
const valence = ref<number | null>(null)
const attractiveness = ref<number | null>(null)
const stressLevel = ref<number | null>(null)

function submitRatings () {
  if (trustworthiness.value === null || sympathy.value === null ||
    aura.value === null || valence.value === null ||
    attractiveness.value === null || stressLevel.value === null) {
    return
  }

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

    <RatingScale
      label="Vertrauenswürdigkeit"
      left-label="überhaupt nicht vertrauenswürdig"
      right-label="äußerst vertrauenswürdig"
      v-model="trustworthiness"
    />

    <RatingScale
      label="Sympathie"
      left-label="sehr unsympathisch"
      right-label="äußerst sympathisch"
      v-model="sympathy"
    />

    <RatingScale
      label="Ausstrahlung"
      left-label="sehr unangenehm"
      right-label="äußerst angenehm"
      v-model="aura"
    />

    <RatingScale
      label="Valenz"
      left-label="sehr negativ"
      right-label="äußerst positiv"
      v-model="valence"
    />

    <RatingScale
      label="Attraktivität"
      left-label="sehr unattraktiv"
      right-label="äußerst attraktiv"
      v-model="attractiveness"
    />

    <RatingScale
      label="Stresslevel"
      left-label="sehr gestresst"
      right-label="äußerst gelassen"
      v-model="stressLevel"
    />

    <button
      @click="submitRatings"
      :disabled="trustworthiness === null || sympathy === null ||
        aura === null || valence === null ||
        attractiveness === null || stressLevel === null"
    >
      Weiter
    </button>
  </div>
</template>

<style scoped>
h2 {
  text-align: center;
  margin-bottom: 2rem;
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

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>