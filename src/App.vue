<script setup lang="ts">
import { ref, computed } from 'vue'
import Login from './components/Login.vue'
import Rating from './components/Rating.vue'
import Video from './components/Video.vue'
import Ending from './components/Ending.vue'
import { useStore } from './useStore'

const store = useStore()

</script>

<template>
  <div v-if="!store.isAuthenticated">
    <Login />
  </div>

  <div v-else>
    <Ending v-if="store.isOver" />
    <Video v-else-if="store.isVideo" />
    <Rating v-else />
  </div>
</template>

<style scoped></style>
