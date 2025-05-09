<script setup lang="ts">
import PhaseThree from './PhaseThree.vue'
import PhaseOne from './PhaseOne.vue'
import PhaseTwo from './PhaseTwo.vue'
import Ending from './Ending.vue'
import { useProgressStore } from '../useProgress.store'

const progressStore = useProgressStore()
</script>

<template>
  <!-- Phase 1 -->
  <PhaseOne v-if="progressStore.phase == 1" />

  <!-- Phase 2 -->
  <PhaseTwo v-else-if="progressStore.phase == 2" />

  <!-- Phase 3 -->
  <PhaseThree v-else-if="progressStore.phase == 3" />

  <!-- Phase 4 -->
  <Ending v-else-if="progressStore.phase == 4" />

  <div v-else></div>
</template>

<style scoped></style>