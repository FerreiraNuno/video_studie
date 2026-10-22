<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getCurrentVideo, getVideoSource, getAudioSource } from '@/utils/videoManager'
import { useSupabaseStore } from '@/useSupabase.store'

/**
 * One trial: the muted video plays while the self-report audio is heard.
 * The trial ends when the audio has ended (unchanged study semantics).
 *
 * Robustness rules (the old version could leave a participant stuck forever
 * when the audio never started, and could emit twice):
 *   - `finish()` emits exactly once and is the only way out.
 *   - A hard timer runs from mount, independent of playback; once the audio
 *     plays, it is re-armed to the audio's remaining duration + margin.
 *   - Media errors retry once, then finish. play() rejections are caught.
 *   - Everything is cleaned up on unmount.
 */

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  videoIndex: number
}>()

const emit = defineEmits<{
  (e: 'video-ended', filename: string): void
}>()

/** Longest self-report audio is 6.3 s, longest video 10 s. */
const HARD_CAP_MS = 15000
const END_MARGIN_MS = 1500

const videoElement = ref<HTMLVideoElement | null>(null)
const audioElement = ref<HTMLAudioElement | null>(null)
const currentVideo = getCurrentVideo(props.videoIndex)
const videoSource = getVideoSource(currentVideo.filename)
const audioSource = getAudioSource(currentVideo.audioType, supabaseStore.user.group)

const isLoading = ref(true)

let finished = false
let timer: number | null = null
let videoRetried = false
let audioRetried = false

function clearTimer () {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function armTimer (ms: number) {
  clearTimer()
  timer = window.setTimeout(() => finish('timer'), ms)
}

function finish (reason: string) {
  if (finished) return
  finished = true
  clearTimer()
  if (reason !== 'audio ended') console.warn(`Trial ${props.videoIndex + 1} ended by ${reason}`)
  emit('video-ended', currentVideo.filename)
}

function onVideoPlay () {
  const video = videoElement.value
  if (video) video.muted = true
  isLoading.value = false
  const audio = audioElement.value
  if (audio && audio.paused) {
    audio.play().catch(e => console.warn('Self-report audio could not start:', e))
  }
}

function onVideoError () {
  const video = videoElement.value
  if (!videoRetried && video) {
    videoRetried = true
    window.setTimeout(() => video.load(), 1500)
  } else {
    finish('video error')
  }
}

function onAudioPlay () {
  const audio = audioElement.value
  if (audio && Number.isFinite(audio.duration)) {
    armTimer((audio.duration - audio.currentTime) * 1000 + END_MARGIN_MS)
  }
}

function onAudioEnded () {
  finish('audio ended')
}

function onAudioError () {
  const audio = audioElement.value
  if (!audioRetried && audio) {
    audioRetried = true
    window.setTimeout(() => {
      audio.load()
      audio.play().catch(() => { /* hard timer finishes the trial */ })
    }, 1500)
  } else {
    finish('audio error')
  }
}

onMounted(() => {
  armTimer(HARD_CAP_MS)

  const video = videoElement.value
  if (video) {
    video.muted = true
    video.addEventListener('play', onVideoPlay)
    video.addEventListener('error', onVideoError)
    video.play().catch(() => { /* autoplay attribute will retry; the hard timer covers the rest */ })
  }

  const audio = audioElement.value
  if (audio) {
    audio.addEventListener('play', onAudioPlay)
    audio.addEventListener('ended', onAudioEnded)
    audio.addEventListener('error', onAudioError)
  }
})

onUnmounted(() => {
  finished = true
  clearTimer()
  videoElement.value?.removeEventListener('play', onVideoPlay)
  videoElement.value?.removeEventListener('error', onVideoError)
  audioElement.value?.removeEventListener('play', onAudioPlay)
  audioElement.value?.removeEventListener('ended', onAudioEnded)
  audioElement.value?.removeEventListener('error', onAudioError)
  audioElement.value?.pause()
})
</script>

<template>
  <div class="video-container">
    <div class="video-wrapper">
      <div
        v-if="isLoading"
        class="loading-spinner"
      ></div>
      <video
        ref="videoElement"
        :src="videoSource"
        autoplay
        playsinline
        :muted="true"
      >
        Ihr Browser unterstützt die Video Wiedergabe nicht.
      </video>
    </div>
    <audio
      ref="audioElement"
      :src="audioSource"
      preload="auto"
    />
  </div>
</template>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 1;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

video {
  height: 500px;
  max-width: 100%;
}

audio {
  display: none;
}
</style>
