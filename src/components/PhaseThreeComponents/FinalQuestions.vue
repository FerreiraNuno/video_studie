<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '@/useProgress.store'
import { useSupabaseStore } from '@/useSupabase.store'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const exaggerationRating = ref(5)
const fakingRating = ref(5)
const busEmpathyRating = ref(5)
const doctorEmpathyRating = ref(5)
const pensionEmpathyRating = ref(5)
const studyPurpose = ref('')
const currentStep = ref(1)
const countdown = ref(0)
const buttonDisabled = ref(false)

function nextStep () {
  if (currentStep.value < 6) {
    currentStep.value += 1
    resetCountdown()
  } else {
    submitRatings()
  }
}

async function submitRatings () {
  await supabaseStore.saveFinalRatings({
    exaggeration: exaggerationRating.value,
    faking: fakingRating.value,
    bus_empathy: busEmpathyRating.value,
    doctor_empathy: doctorEmpathyRating.value,
    pension_empathy: pensionEmpathyRating.value,
    study_purpose: studyPurpose.value
  })
  progressStore.nextPhase()
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
</script>

<template>
  <div class="final-questions-container">
    <h2>Vielen Dank für Ihre Unterstützung! Wir haben nun noch einige abschließende Fragen.</h2>

    <template v-if="currentStep === 1">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen übertrieben hat?</h3>
      <h4>0-10: überhaupt nicht wahrscheinlich – äußerst wahrscheinlich</h4>
      <input
        type="range"
        min="0"
        max="10"
        v-model="exaggerationRating"
        class="slider"
      />
      <div class="rating-value">{{ exaggerationRating }}</div>
    </template>

    <template v-else-if="currentStep === 2">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen vorgetäuscht hat?</h3>
      <h4>0-10: überhaupt nicht wahrscheinlich – äußerst wahrscheinlich</h4>
      <input
        type="range"
        min="0"
        max="10"
        v-model="fakingRating"
        class="slider"
      />
      <div class="rating-value">{{ fakingRating }}</div>
    </template>

    <template v-else-if="currentStep === 3">
      <h3>Wie gut konnten Sie sich in die Situation als Person im Bus hineinversetzen?</h3>
      <h4>0-10: überhaupt nicht – sehr gut</h4>
      <input
        type="range"
        min="0"
        max="10"
        v-model="busEmpathyRating"
        class="slider"
      />
      <div class="rating-value">{{ busEmpathyRating }}</div>
    </template>

    <template v-else-if="currentStep === 4">
      <h3>Wie gut konnten Sie sich in die Situation als Ärzt:in hineinversetzen?</h3>
      <h4>0-10: überhaupt nicht – sehr gut</h4>
      <input
        type="range"
        min="0"
        max="10"
        v-model="doctorEmpathyRating"
        class="slider"
      />
      <div class="rating-value">{{ doctorEmpathyRating }}</div>
    </template>

    <template v-else-if="currentStep === 5">
      <h3>Wie gut konnten Sie sich in die Situation als Gutachter:in der Rentenversicherung hineinversetzen?</h3>
      <h4>0-10: überhaupt nicht – sehr gut</h4>
      <input
        type="range"
        min="0"
        max="10"
        v-model="pensionEmpathyRating"
        class="slider"
      />
      <div class="rating-value">{{ pensionEmpathyRating }}</div>
    </template>

    <template v-else-if="currentStep === 6">
      <h3>Was denken Sie, wollten wir mit unserer Studie untersuchen?</h3>
      <textarea
        v-model="studyPurpose"
        class="text-input"
        rows="4"
        placeholder="Bitte geben Sie hier Ihre Antwort ein..."
      ></textarea>
    </template>

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
.final-questions-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
}

h3 {
  text-align: center;
  margin-bottom: 0;
}

h4 {
  margin-top: 0;
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

.text-input {
  width: 100%;
  max-width: 40rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  margin: 1rem 0;
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
  margin-top: 2rem;
}

.next-button:hover {
  background-color: #4338CA;
}

.next-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}
</style>