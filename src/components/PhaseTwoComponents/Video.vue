<script setup lang="ts">
import { useProgressStore } from '@/useProgress.store'
import { ref, onMounted, defineProps, defineEmits } from 'vue'


const videoSources = [
  `${import.meta.env.BASE_URL}videos/video_1.mp4`,
  `${import.meta.env.BASE_URL}videos/video_2.mp4`,
  `${import.meta.env.BASE_URL}videos/video_3.mp4`,
  `${import.meta.env.BASE_URL}videos/video_4.mp4`,
  `${import.meta.env.BASE_URL}videos/video_5.mp4`,
  `${import.meta.env.BASE_URL}videos/video_6.mp4`,
  `${import.meta.env.BASE_URL}videos/video_7.mp4`,
  `${import.meta.env.BASE_URL}videos/video_8.mp4`,
  `${import.meta.env.BASE_URL}videos/video_9.mp4`,
]

const props = defineProps<{
  videoIndex: number,
}>()

const emit = defineEmits<{
  (e: 'video-ended'): void
}>()

const videoElement = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  if (videoElement.value) {
    videoElement.value.addEventListener('ended', () => {
      console.log('Video has finished playing')
      emit('video-ended')
    })
  }
})
</script>

<template>
  <div class="video-container">
    <h2>Video Nummer {{ props.videoIndex }}</h2>
    <video
      autoplay
      ref="videoElement"
    >
      <source
        :src="videoSources[props.videoIndex - 1]"
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

video {
  height: 500px;
}
</style>
