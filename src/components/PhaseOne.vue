<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '../useProgress.store'
import { useSupabaseStore } from '../useSupabase.store'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const wantsVPHours = ref(false)
const sonaId = ref('')
const hasConsented = ref(false)
const gender = ref('')
const age = ref('')
const education = ref('')
const ethnicity = ref('')
const currentActivity = ref('')
const currentActivityDetail = ref('')
const chronicPain = ref(false)
const painLocation = ref('')
const privatePainExperience = ref(false)
const privatePainRelation = ref('')
const professionalPainExperience = ref(false)
const professionalPainActivity = ref('')

const errorMessage = ref('')

const validateForm = () => {
  if (!hasConsented.value) {
    errorMessage.value = 'Bitte stimmen Sie der Teilnahme zu.'
    return false
  }
  if (wantsVPHours.value && (!sonaId.value || sonaId.value.length !== 4)) {
    errorMessage.value = 'Bitte geben Sie Ihre vierstellige SONA ID ein.'
    return false
  }
  if (!gender.value || !age.value || !education.value || !ethnicity.value || !currentActivity.value) {
    errorMessage.value = 'Bitte füllen Sie alle Pflichtfelder aus.'
    return false
  }
  if ((currentActivity.value === 'studierende' || currentActivity.value === 'berufstätig') && !currentActivityDetail.value) {
    errorMessage.value = 'Bitte geben Sie Ihre Tätigkeit/Studienfach an.'
    return false
  }
  if (chronicPain.value && !painLocation.value) {
    errorMessage.value = 'Bitte geben Sie den Ort der Schmerzen an.'
    return false
  }
  if (privatePainExperience.value && !privatePainRelation.value) {
    errorMessage.value = 'Bitte geben Sie die Beziehung zur Person an.'
    return false
  }
  if (professionalPainExperience.value && !professionalPainActivity.value) {
    errorMessage.value = 'Bitte geben Sie die Tätigkeit an.'
    return false
  }
  return true
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  const formData = {
    wantsVPHours: wantsVPHours.value,
    sonaId: sonaId.value,
    gender: gender.value,
    age: age.value,
    education: education.value,
    ethnicity: ethnicity.value,
    currentActivity: currentActivity.value,
    currentActivityDetail: currentActivityDetail.value,
    chronicPain: chronicPain.value,
    painLocation: painLocation.value,
    privatePainExperience: privatePainExperience.value,
    privatePainRelation: privatePainRelation.value,
    professionalPainExperience: professionalPainExperience.value,
    professionalPainActivity: professionalPainActivity.value,
  }

  const response = await supabaseStore.saveUserData(formData)
  if (response?.code) {
    errorMessage.value = `Fehler beim Absenden des Formulars: ${response.message}`
  } else {
    progressStore.nextPhase()
  }
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <div class="consent-section">
      <h2>Einverständniserklärung zur Teilnahme an der Studie</h2>
      <div class="intro-text">
        <p>Liebe Teilnehmerin, lieber Teilnehmer,</p>
        <p>wir freuen uns sehr, dass Sie Interesse haben, an der Online-Studie zur Beurteilung Schmerzen anderer
          teilzunehmen. Die Studie besteht aus drei Teilen. Erfasst werden zunächst demographische Daten (z.B. Alter).
          In einem zweiten Teil sehen Sie eine Reihe von Videoclips und bekommen zusätzliche Informationen zu den
          Menschen in den Videoclips. Basierend auf diesen Informationen sollen Sie jeweils die Schmerzen der Menschen
          (z.B. hinsichtlich der Intensität) beurteilen. In einem dritten Teil sehen Sie eine Reihe von Fotos und sollen
          basierend auf diesen Fotos den Eindruck, den Sie von diesen Menschen haben (z.B. wie sympathisch Sie sie
          empfinden), einschätzen.</p>
        <p>Planen Sie sich für die Teilnahme an der Studie insgesamt ca. 150 min ein. Haben Sie einen Kopfhörer bereit,
          da Sie auch Tonaufnahmen hören werden. Und stellen Sie sicher, dass Sie für die gesamte Dauer eine stabile
          Internetverbindung haben, damit Sie die Video- und Tonaufnahmen gut sehen und hören können.</p>
        <p>Um an der Online-Studie teilnehmen zu können, sollten Sie zwischen 18 und 64 Jahre alt sein und nicht
          Psychologie studieren bzw. keinen Studienabschluss in Psychologie haben.</p>
        <p>Die Teilnahme an der Studie ist freiwillig. Sie können jederzeit und ohne Angabe von Gründen die Teilnahme an
          dieser Studie beenden, ohne dass Ihnen daraus Nachteile entstehen. Auch wenn Sie die Studie vorzeitig
          abbrechen, haben Sie Anspruch auf eine anteilige Vergütung in Höhe von max. 3 VP-Stunden.</p>
        <p>Die im Rahmen dieser Studie erhobenen Daten werden vertraulich behandelt und pseudonymisiert, d.h. unter
          Verwendung eines Codes gespeichert und weiterverarbeitet.</p>
        <p>Sollten Sie Fragen haben, wenden Sie sich gerne an die Studienmitarbeiter*innen per Mail unter <a
            href="mailto:schmerzbeurteilung@psychol.uni-giessen.de"
          >schmerzbeurteilung@psychol.uni-giessen.de</a></p>
        <p>Unter folgendem Link stehen Ihnen weitere Informationen zum Datenschutz zum Download bereit:<br>
          <a
            href="https://jlubox.uni-giessen.de/getlink/fiSU6dtWTSUowv4zKftHBMVM/Probandeninfo%20VOR%20Experiment.pdf"
            target="_blank"
          >Datenschutzinformationen</a>
        </p>
      </div>
      <div class="consent-options">
        <p>Sind Sie mit der Teilnahme an der Studie einverstanden?</p>
        <div class="radio-group">
          <label>
            <input
              type="radio"
              v-model="hasConsented"
              :value="true"
            >
            Ja, ich bin einverstanden und bestätige, dass ich zwischen 18 und 64 Jahre alt bin und nicht Psychologie
            studiere bzw. keinen Studienabschluss in Psychologie habe.
          </label>
          <label>
            <input
              type="radio"
              v-model="hasConsented"
              :value="false"
            >
            Nein, ich bin nicht einverstanden.
          </label>
        </div>
      </div>
    </div>

    <div v-if="hasConsented">
      <div>
        <label>Ich möchte für die Teilnahme an der Studie 3 VP Stunden erhalten.</label>
        <br>
        <input
          type="radio"
          v-model="wantsVPHours"
          :value="true"
        /> Ja
        <input
          type="radio"
          v-model="wantsVPHours"
          :value="false"
        /> Nein
        <br>
        <input
          v-if="wantsVPHours"
          type="text"
          placeholder="SONA ID (4-stellig)"
          v-model="sonaId"
          maxlength="4"
          pattern="[0-9]{4}"
        />
      </div>

      <div>
        <label>Welchem Geschlecht fühlen Sie sich zugehörig?</label>
        <br>
        <select v-model="gender">
          <option value="männlich">Männlich</option>
          <option value="weiblich">Weiblich</option>
          <option value="non-binär">Non-binär</option>
        </select>
      </div>

      <div>
        <label>Wie alt sind Sie (in Jahren)?</label>
        <br>
        <input
          type="number"
          v-model="age"
        />
      </div>

      <div>
        <label>Was ist Ihr höchster Bildungsabschluss?</label>
        <br>
        <select v-model="education">
          <option value="kein">Kein Schulabschluss</option>
          <option value="hauptschule">Hauptschulabschluss</option>
          <option value="realschule">Realschulabschluss</option>
          <option value="fachhochschulreife">Fachhochschulreife</option>
          <option value="abitur">Abitur</option>
          <option value="ausbildung">Abgeschlossene Ausbildung</option>
          <option value="studium">Abgeschlossenes Studium (z.B. BSc)</option>
          <option value="promotion">Abgeschlossene Promotion</option>
        </select>
      </div>

      <div>
        <label>Welcher Ethnizität fühlen Sie sich zugehörig?</label>
        <br>
        <input
          type="text"
          v-model="ethnicity"
        />
      </div>

      <div>
        <label>Welcher aktuellen Tätigkeit gehen Sie nach?</label>
        <br>
        <select v-model="currentActivity">
          <option value="schüler">Schüler:in</option>
          <option value="auszubildende">Auszubildende:r</option>
          <option value="studierende">Studierende:r</option>
          <option value="berufstätig">Berufstätig</option>
        </select>
        <input
          v-if="currentActivity === 'studierende'"
          type="text"
          placeholder="Studienfach"
          v-model="currentActivityDetail"
        />
        <input
          v-if="currentActivity === 'berufstätig'"
          type="text"
          placeholder="Tätigkeit"
          v-model="currentActivityDetail"
        />
      </div>

      <div>
        <label>Leiden Sie unter Schmerzen, die seit sechs Monaten oder länger bestehen?</label>
        <br>
        <input
          type="radio"
          v-model="chronicPain"
          :value="true"
        /> Ja
        <input
          type="radio"
          v-model="chronicPain"
          :value="false"
        /> Nein
        <br>
        <input
          v-if="chronicPain"
          type="text"
          placeholder="Ort der Schmerzen"
          v-model="painLocation"
        />
      </div>

      <div>
        <label>Haben oder hatten Sie in Ihrem privaten Umfeld (z.B. Freunde, Familie) Menschen, die unter Schmerzen
          leiden, die bereits seit
          sechs
          Monaten oder länger andauern?</label>
        <br>
        <input
          type="radio"
          v-model="privatePainExperience"
          :value="true"
        /> Ja
        <input
          type="radio"
          v-model="privatePainExperience"
          :value="false"
        /> Nein
        <br>
        <input
          v-if="privatePainExperience"
          type="text"
          placeholder="Beziehung zur Person"
          v-model="privatePainRelation"
        />
      </div>

      <div>
        <label>Haben oder hatten Sie (z.B. als Pflegekraft, Physiotherapeut:in) in Ihrem beruflichen Umfeld Kontakt mit
          Menschen, die Schmerzen haben?</label>
        <br>
        <input
          type="radio"
          v-model="professionalPainExperience"
          :value="true"
        /> Ja
        <input
          type="radio"
          v-model="professionalPainExperience"
          :value="false"
        /> Nein
        <br>
        <input
          v-if="professionalPainExperience"
          type="text"
          placeholder="Tätigkeit"
          v-model="professionalPainActivity"
        />
      </div>

      <button type="submit">Weiter</button>
      <p v-if="errorMessage">{{ errorMessage }}</p>
    </div>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.consent-section {
  margin-bottom: 2rem;
}

.intro-text {
  text-align: left;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.intro-text p {
  margin-bottom: 1rem;
}

.consent-options {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 4px;
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
  font-weight: normal;
}

.radio-group input[type="radio"] {
  margin-top: 0.25rem;
}

a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

label {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

input[type="text"],
input[type="number"] {
  width: 10rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

select {
  width: 11rem;
  padding: 0.5rem;
  margin-right: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input[type="radio"] {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

button {
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

div {
  margin-bottom: 0.5rem;
}

p {
  font-weight: bold;
}
</style>