<script setup lang="ts">
import Login from './components/Login.vue'
import Main from './components/Main.vue'
import { useSupabaseStore } from './useSupabase.store'

const supabaseStore = useSupabaseStore()

// window.onbeforeunload = () => {
//   return 'Sind Sie sicher, dass Sie die Studie verlassen möchten? Ihr Fortschritt wird gespeichert.'
// }
</script>

<template>
  <div>
    <Login v-if="!supabaseStore.isAuthenticated" />
    <Main v-else />
  </div>
</template>

<style scoped></style>
