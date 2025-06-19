<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCurrentPhoto, getPhotoSource } from '@/utils/photoManager'
import { useSupabaseStore } from '@/useSupabase.store'

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  photoIndex: number
}>()

const emit = defineEmits<{
  (e: 'photo-ended'): void
}>()

const photo = ref(getCurrentPhoto(props.photoIndex))
const photoSource = ref(getPhotoSource(photo.value.filename))

onMounted(() => {
  // Photo is shown for 3 seconds
  const duration = 3000
  setTimeout(() => {
    emit('photo-ended')
  }, duration)
})
</script>

<template>
  <div class="photo-container">
    <img
      :src="photoSource"
      :alt="photo.filename"
      class="photo"
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