<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '../useProgress.store'
import { useSupabaseStore } from '../useSupabase.store'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

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
  if (!gender.value || !age.value || !education.value || !ethnicity.value || !currentActivity.value) {
    errorMessage.value = 'Bitte füllen Sie alle Pflichtfelder aus.'
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
        <option value="studium">Abgeschlossenes Studium</option>
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
      <label>Haben oder hatten Sie in Ihrem privaten Umfeld Menschen, die unter Schmerzen leiden, die bereits seit sechs
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
      <label>Haben oder hatten Sie in Ihrem beruflichen Umfeld Kontakt mit Menschen, die Schmerzen haben (z.B. als
        Pflegekraft, Physiotherapeut:in)?</label>
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
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
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
  color: red;
  font-weight: bold;
}
</style>