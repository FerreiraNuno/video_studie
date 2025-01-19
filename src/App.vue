<script setup lang="ts">
import Login from './components/Login.vue'
import Rating from './components/Rating.vue'
import Video from './components/Video.vue'
import Ending from './components/Ending.vue'
import { useProgressStore } from './useProgressStore'
import { useSupabaseStore } from './useSupabaseStore'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

// window.onbeforeunload = () => {
//   return 'Sind Sie sicher, dass Sie die Studie verlassen möchten? Ihr Fortschritt wird gespeichert.'
// }
</script>

<template>
  <div v-if="!supabaseStore.isAuthenticated">
    <Login />
  </div>

  <div v-else>
    <Ending v-if="progressStore.isOver" />
    <Video v-else-if="progressStore.isVideo" />
    <Rating v-else />
  </div>
</template>

<style scoped></style>
