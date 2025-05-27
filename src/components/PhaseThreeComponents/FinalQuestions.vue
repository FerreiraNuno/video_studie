<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProgressStore } from '@/useProgress.store'
import { useSupabaseStore } from '@/useSupabase.store'
import RatingScale from '../shared/RatingScale.vue'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const group = computed(() => supabaseStore.user.group)

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
  if (currentStep.value < 3) {
    currentStep.value += 1
  } else {
    submitRatings()
  }
}

async function submitRatings () {
  await supabaseStore.saveFinalRatings({
    exaggeration: exaggerationRating.value,
    faking: fakingRating.value,
    understating: understatingRating.value,
    suppression: suppressionRating.value,
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
    <h2>Vielen Dank für Ihre Unterstützung! Wir haben nun noch ein paar abschließende Fragen.</h2>

    <template v-if="currentStep === 1">
      <h3>Für wie wahrscheinlich halten Sie es, dass mindestens eine der Personen, die Sie auf den Videos gesehen haben,
        ihre Schmerzen...</h3>

      <div class="ratings-group">
        <h3 class="sub-question">...übertrieben hat?</h3>
        <RatingScale
          label=""
          left-label="überhaupt nicht wahrscheinlich"
          right-label="äußerst wahrscheinlich"
          v-model="exaggerationRating"
        />

        <h3 class="sub-question">...vorgetäuscht hat?</h3>
        <RatingScale
          label=""
          left-label="überhaupt nicht wahrscheinlich"
          right-label="äußerst wahrscheinlich"
          v-model="fakingRating"
        />

        <h3 class="sub-question">...untertrieben hat?</h3>
        <RatingScale
          label=""
          left-label="überhaupt nicht wahrscheinlich"
          right-label="äußerst wahrscheinlich"
          v-model="understatingRating"
        />

        <h3 class="sub-question">...unterdrückt hat?</h3>
        <RatingScale
          label=""
          left-label="überhaupt nicht wahrscheinlich"
          right-label="äußerst wahrscheinlich"
          v-model="suppressionRating"
        />
      </div>
    </template>

    <template v-else-if="currentStep === 2">
      <h3>Wie gut konnten Sie sich in die Situation als...</h3>

      <div class="ratings-group">
        <h3 class="sub-question">...Person im Bus hineinversetzen?</h3>
        <RatingScale
          label=""
          left-label="überhaupt nicht"
          right-label="sehr gut"
          v-model="busEmpathyRating"
        />

        <template v-if="group === 'SCT'">
          <h3 class="sub-question">...Mitarbeiter:in eines IT-Support Unternehmens hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="doctorEmpathyRating"
          />

          <h3 class="sub-question">...Reinigungskraft hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="pensionEmpathyRating"
          />
        </template>

        <template v-else-if="group === 'KG'">
          <h3 class="sub-question">...Person, die an einer Arztpraxis vorbeiläuft, hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="doctorEmpathyRating"
          />

          <h3 class="sub-question">...Person, die am Gebäude der Rentenversicherung vorbeiläuft, hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="pensionEmpathyRating"
          />
        </template>

        <template v-else>
          <h3 class="sub-question">...Arzt/Ärztin hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="doctorEmpathyRating"
          />

          <h3 class="sub-question">...Gutachter:in der Rentenversicherung hineinversetzen?</h3>
          <RatingScale
            label=""
            left-label="überhaupt nicht"
            right-label="sehr gut"
            v-model="pensionEmpathyRating"
          />
        </template>
      </div>
    </template>

    <template v-else-if="currentStep === 3">
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
      :disabled="currentStep === 3 && studyPurpose.length === 0"
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

.ratings-group {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 50rem;
}

.sub-question {
  margin-top: 0;
  margin-bottom: 0cqmax;
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