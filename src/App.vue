<script setup lang="ts">
import Login from './components/Login.vue'
import Main from './components/Main.vue'
import { useSupabaseStore } from './useSupabase.store'
import { isFastMode, FAST_MEDIA_MS } from './lib/devFast'

const supabaseStore = useSupabaseStore()
// Dev-only: media steps are cut to FAST_MEDIA_MS (`?fast=1` / `?fast=0`); never true in a production build.
const fastMode = isFastMode()

// window.onbeforeunload = () => {
//   return 'Sind Sie sicher, dass Sie die Studie verlassen möchten? Ihr Fortschritt wird gespeichert.'
// }
</script>

<template>
  <div>
    <div
      v-if="fastMode"
      class="dev-fast-badge"
      title="Entwicklungsmodus, bleibt in diesem Browser aktiv bis er ausgeschaltet wird"
    >DEV: Medien auf {{ FAST_MEDIA_MS / 1000 }} s verkürzt – <a href="?fast=0">ausschalten</a></div>
    <Login v-if="!supabaseStore.isAuthenticated" />
    <Main v-else />
  </div>
</template>

<style scoped>
.dev-fast-badge {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  padding: 0.25rem 0.75rem;
  background: #b45309;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-bottom-left-radius: 6px;
}

.dev-fast-badge a {
  color: #fff;
  text-decoration: underline;
}
</style>
