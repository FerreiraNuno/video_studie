<script setup lang="ts">
import { useProgressStore } from '@/useProgress.store'
import { ref, onMounted } from 'vue'

const progressStore = useProgressStore()

const videoElement = ref<HTMLVideoElement | null>(null)

const videoSources = [
  '/videos/video_1.mp4',
  '/videos/video_2.mp4',
  '/videos/video_3.mp4',
  '/videos/video_4.mp4',
  '/videos/video_5.mp4',
  '/videos/video_6.mp4',
  '/videos/video_7.mp4',
  '/videos/video_8.mp4',
  '/videos/video_9.mp4',
]

onMounted(() => {
  if (videoElement.value) {
    videoElement.value.addEventListener('ended', () => {
      console.log('Video has finished playing')
      progressStore.startRating()
    })
  }
})
</script>

<template>
  <div class="video-container">
    <h2>Video Nummer {{ progressStore.currentIndex + 1 }}</h2>
    <video
      autoplay
      ref="videoElement"
    >
      <source
        :src="videoSources[progressStore.currentIndex]"
        type="video/mp4"
      >
      Your browser does not support the video tag.
    </video>
  </div>
</template>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: bold;
}

p {
  font-size: 1.25rem;
  color: #585858;
}
</style>
