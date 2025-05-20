<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '@/useProgress.store'
import { useSupabaseStore } from '@/useSupabase.store'
import RatingScale from '../shared/RatingScale.vue'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const exaggerationRating = ref(5)
const fakingRating = ref(5)
const understatingRating = ref(5)
const suppressionRating = ref(5)
const busEmpathyRating = ref(5)
const doctorEmpathyRating = ref(5)
const pensionEmpathyRating = ref(5)
const studyPurpose = ref('')
const currentStep = ref(1)

function nextStep () {
  if (currentStep.value < 8) {
    currentStep.value += 1
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
</script>

<template>
  <div class="final-questions-container">
    <h2>Vielen Dank für Ihre Unterstützung! Wir haben nun noch einige abschließende Fragen.</h2>

    <template v-if="currentStep === 1">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen...</h3>
      <RatingScale
        label="Übertreibung"
        left-label="überhaupt nicht wahrscheinlich"
        right-label="äußerst wahrscheinlich"
        v-model="exaggerationRating"
      />
      <h3 class="sub-question">...übertrieben hat?</h3>
    </template>

    <template v-else-if="currentStep === 2">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen...</h3>
      <RatingScale
        label="Vortäuschung"
        left-label="überhaupt nicht wahrscheinlich"
        right-label="äußerst wahrscheinlich"
        v-model="fakingRating"
      />
      <h3 class="sub-question">...vorgetäuscht hat?</h3>
    </template>

    <template v-else-if="currentStep === 3">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen...</h3>
      <RatingScale
        label="Untertriebung"
        left-label="überhaupt nicht wahrscheinlich"
        right-label="äußerst wahrscheinlich"
        v-model="understatingRating"
      />
      <h3 class="sub-question">...untertrieben hat?</h3>
    </template>

    <template v-else-if="currentStep === 4">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen...</h3>
      <RatingScale
        label="Unterdrückung"
        left-label="überhaupt nicht wahrscheinlich"
        right-label="äußerst wahrscheinlich"
        v-model="suppressionRating"
      />
      <h3 class="sub-question">...unterdrückt hat?</h3>
    </template>

    <template v-else-if="currentStep === 5">
      <h3>Wie gut konnten Sie sich in die Situation als...</h3>
      <RatingScale
        label="Empathie Bus"
        left-label="überhaupt nicht"
        right-label="sehr gut"
        v-model="busEmpathyRating"
      />
      <h3 class="sub-question">...Person im Bus hineinversetzen?</h3>
    </template>

    <template v-else-if="currentStep === 6">
      <h3>Wie gut konnten Sie sich in die Situation als...</h3>
      <RatingScale
        label="Empathie Arzt"
        left-label="überhaupt nicht"
        right-label="sehr gut"
        v-model="doctorEmpathyRating"
      />
      <h3 class="sub-question">...Person im Arzt's Büro hineinversetzen?</h3>
    </template>

    <template v-else-if="currentStep === 7">
      <h3>Wie gut konnten Sie sich in die Situation als...</h3>
      <RatingScale
        label="Empathie Gutachter"
        left-label="überhaupt nicht"
        right-label="sehr gut"
        v-model="pensionEmpathyRating"
      />
      <h3 class="sub-question">...Person im Gutachter's Büro hineinversetzen?</h3>
    </template>

    <template v-else-if="currentStep === 8">
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
      :disabled="currentStep === 8 && studyPurpose.length === 0"
    >
      Weiter
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
  margin-bottom: 1rem;
}

.sub-question {
  margin-top: -2rem;
}

h4 {
  margin-top: 0;
  text-align: center;
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