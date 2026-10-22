<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { getCurrentPhoto, getPhotoSource, allPhotoFilenames } from '@/utils/photoManager'

const props = defineProps<{
  photoIndex: number
}>()

const emit = defineEmits<{
  (e: 'photo-ended'): void
}>()

const photo = ref(getCurrentPhoto(props.photoIndex))
const photoSource = ref(getPhotoSource(photo.value.filename))

// The photo is shown for 3 seconds, counted from the moment the image is
// actually displayed (`load`), not from mount: the photos are ~1.4 MB each
// and on a slow line the old mount-based timer could expire before the
// participant saw anything. If the image does not load within LOAD_CAP_MS or
// fails, the step ends anyway. The timer is cleared on unmount so it can
// never fire into a later step.
const DISPLAY_MS = 3000
const LOAD_CAP_MS = 20000
let timer: number | null = null
let displayed = false

function armTimer (ms: number) {
  if (timer !== null) clearTimeout(timer)
  timer = window.setTimeout(() => emit('photo-ended'), ms)
}

function onLoad () {
  if (displayed) return
  displayed = true
  armTimer(DISPLAY_MS)
}

function onError () {
  console.warn(`Photo ${photo.value.filename} could not be loaded`)
  armTimer(0)
}

onMounted(() => {
  armTimer(LOAD_CAP_MS)
  // Fetch the following photo while this one is shown and rated.
  const next = allPhotoFilenames.length > props.photoIndex + 1 ? getCurrentPhoto(props.photoIndex + 1) : null
  if (next) new Image().src = getPhotoSource(next.filename)
})
onUnmounted(() => {
  if (timer !== null) clearTimeout(timer)
})
</script>

<template>
  <div class="photo-container">
    <img
      :src="photoSource"
      :alt="photo.filename"
      class="photo"
      @load="onLoad"
      @error="onError"
    >
  </div>
</template>

<style scoped>
.photo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.photo {
  max-width: 80%;
  max-height: 80vh;
  object-fit: contain;
}

.dev-mode-notice {
  background-color: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>