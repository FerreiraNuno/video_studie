<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseStore } from '../useSupabase.store'

const supabaseStore = useSupabaseStore()

const isInformed = ref('')
const wantsDeletion = ref('')
const agreesSilence = ref('')
const showClosingMessage = ref(false)

async function handleSubmit () {
  if (!isInformed.value || !wantsDeletion.value || !agreesSilence.value) {
    return
  }

  try {
    await supabaseStore.saveEndingQuestions({
      isInformed: isInformed.value,
      wantsDeletion: wantsDeletion.value,
      agreesSilence: agreesSilence.value
    })
    showClosingMessage.value = true
  } catch (error) {
    console.error('Failed to save ending questions:', error)
  }
}
</script>

<template>
  <div class="questions-container">
    <h2>Abschließende Fragen</h2>

    <div class="questions">
      <div class="question">
        <p>Sind Sie schriftlich über den Hintergrund der Studie aufgeklärt worden?</p>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="isInformed"
              value="ja"
            >
            ja (Ich bin über den Hintergrund und eigentlichen Untersuchungszweck der Studie aufgeklärt worden und haben
            mit Hilfe des Hintergrundwissens den Zweck der Täuschung verstanden.)
          </label>
          <label>
            <input
              type="radio"
              v-model="isInformed"
              value="nein"
            >
            nein
          </label>
        </div>
      </div>

      <div class="question">
        <p>Möchten Sie, dass Ihre gesamten Daten nach dieser Aufklärung gelöscht werden?</p>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="wantsDeletion"
              value="nein"
            >
            nein (Ich weiß, dass ich auch zum jetzigen Zeitpunkt noch die Löschung meiner gesamten Daten fordern kann,
            und ich verzichte darauf.)
          </label>
          <label>
            <input
              type="radio"
              v-model="wantsDeletion"
              value="ja"
            >
            ja
          </label>
        </div>
      </div>

      <div class="question">
        <p>Erklären Sie sich bereit, Stillschweigen über den Versuchszweck zu bewahren?</p>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="agreesSilence"
              value="ja"
            >
            ja (Ich werde Stillschweigen über den Versuchszweck bewahren und keinerlei Informationen an Dritte
            weitergeben.)
          </label>
          <label>
            <input
              type="radio"
              v-model="agreesSilence"
              value="nein"
            >
            nein
          </label>
        </div>
      </div>
    </div>

    <div
      v-if="!showClosingMessage"
      class="button-container"
    >
      <button
        class="submit-button"
        @click="handleSubmit"
        :disabled="!isInformed || !wantsDeletion || !agreesSilence"
      >
        Absenden
      </button>
    </div>

    <p
      v-else
      class="closing-message"
    >Die Studie ist nun beendet. Sie können das Fenster nun schließen.</p>
  </div>
</template>

<style scoped>
.questions-container {
  padding: 2rem;
}

.questions {
  margin: 2rem 0;
}

.question {
  margin-bottom: 2rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.radio-group label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.radio-group input[type="radio"] {
  margin-top: 0.3rem;
}

.button-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.submit-button {
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

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;

}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.closing-message {
  margin-top: 2rem;
  font-weight: bold;
  font-size: 1.2rem;
  text-align: center;
}
</style>