<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '../useProgress.store'
import { useSupabaseStore, type StudyGroup } from '@/useSupabase.store'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const password = ref('')
const username = ref('')
const participantNumber = ref('')
const selectedGroup = ref<StudyGroup>('KG')
const errorMessage = ref('')
const loading = ref(false)
const isDevelopment = ref(true)

const globalPassword = 'klinPsych'

async function handleLogin () {
  if (password.value === globalPassword) {
    supabaseStore.user.username = username.value
    supabaseStore.user.participantNumber = participantNumber.value
    supabaseStore.user.group = selectedGroup.value
    supabaseStore.isDevelopment = isDevelopment.value
    loading.value = true
    const response = await supabaseStore.loadProgress()
    loading.value = false
    if (response.error && response.error.code !== 'PGRST116') {
      errorMessage.value = response.error.message
    } else {
      supabaseStore.isAuthenticated = true
      await progressStore.startStudy()
    }
  } else {
    errorMessage.value = "Passwort ist ungültig"
  }
}
</script>

<template>
  <div class="container">
    <div class="form-container">
      <h2 class="title">Log In</h2>
    </div>

    <div class="form-wrapper">
      <form
        class="form"
        @submit.prevent="handleLogin"
      >
        <div class="form-group">
          <label
            class="label"
            for="username"
          >Vor und Nachname:</label>
          <input
            class="input"
            id="username"
            v-model="username"
            type="text"
            required
          />
        </div>
        <div class="form-group">
          <label
            class="label"
            for="participantNumber"
          >Probandennummer:</label>
          <input
            class="input"
            id="participantNumber"
            v-model="participantNumber"
            type="text"
            required
          />
        </div>
        <div class="form-group">
          <label
            class="label"
            for="group"
          >Studiengruppe:</label>
          <select
            class="input"
            id="group"
            v-model="selectedGroup"
            required
          >
            <option value="CDM">CDM</option>
            <option value="SCT">SCT</option>
            <option value="KG">KG</option>
          </select>
        </div>
        <div class="form-group">
          <label
            class="label"
            for="password"
          >Studienpasswort:</label>
          <input
            class="input"
            id="password"
            v-model="password"
            type="password"
            required
          />
        </div>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="isDevelopment"
              class="checkbox"
            />
            Entwicklungsmodus
          </label>
        </div>

        <div class="submit-group">
          <button
            v-if="!loading"
            type="submit"
            class="submit-button"
          >Log In</button>
          <button
            v-else
            type="submit"
            class="submit-button"
            disabled
          >Loading...</button>
          <div
            v-if="errorMessage"
            class="error-message"
          >
            {{ errorMessage }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.container {
  height: 100%;
  width: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-container {
  margin: 0 auto;
  width: 100%;
}

.title {
  margin-top: 40px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
}

.form-wrapper {
  margin-top: 40px;
  margin: 0 auto;
  width: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.875rem;
  font-weight: medium;
  color: #111827;
}

.input {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #D1D5DB;
  font-size: 0.875rem;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.input:focus {
  border-color: #6366F1;
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.submit-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.submit-button {
  width: 100%;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #585858;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: #4338CA;
}

.error-message {
  margin-top: 8px;
  text-align: center;
  font-size: 0.875rem;
  color: #EF4444;
}

.register-prompt {
  margin-top: 40px;
  text-align: center;
  font-size: 0.875rem;
  color: #4B5563;
}

.register-link {
  margin-left: 4px;
  font-weight: bold;
  color: #6366F1;
  cursor: pointer;
}

.register-link:hover {
  color: #4338CA;
}

.checkbox-group {
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #111827;
}

.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #D1D5DB;
}

select.input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  background-size: 1em;
  padding-right: 2.5rem;
}
</style>
