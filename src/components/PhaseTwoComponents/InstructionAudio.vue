<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getCurrentVideo } from '@/utils/videoManager'
import { useSupabaseStore } from '@/useSupabase.store'

/**
 * Plays the context's instruction audio before each video. Emits exactly once:
 * when the audio ended, or when it cannot play (error / blocked), or when a
 * timer derived from the audio's real duration expires. The old fixed 14.5 s
 * timer cut off the SCT bus instruction (14.7 s) for every SCT participant.
 */

const supabaseStore = useSupabaseStore()
const props = defineProps<{
  videoIndex: number
  context: string
}>()

/** Why the instruction step ended; stored with the rating of the following video. */
export type InstructionEndReason = 'ended' | 'timer' | 'error' | 'blocked' | 'no_element'

const emit = defineEmits<{
  (e: 'audio-ended', filename: string, reason: InstructionEndReason): void
}>()

/** Longest instruction audio is 14.7 s; the cap only matters while metadata is unknown. */
const HARD_CAP_MS = 25000
const END_MARGIN_MS = 1000

const audioRef = ref<HTMLAudioElement | null>(null)
const audioSource = `${import.meta.env.BASE_URL}video_instructions/${props.context}_${supabaseStore.user.group}.mp3`

let finished = false
let timer: number | null = null

function clearTimer () {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function finish (reason: InstructionEndReason) {
  if (finished) return
  finished = true
  clearTimer()
  if (reason !== 'ended') console.warn(`Instruction audio for video ${props.videoIndex + 1} ended by ${reason}`)
  emit('audio-ended', getCurrentVideo(props.videoIndex).filename, reason)
}

function onPlay () {
  const audio = audioRef.value
  if (audio && Number.isFinite(audio.duration)) {
    clearTimer()
    timer = window.setTimeout(() => finish('timer'), (audio.duration - audio.currentTime) * 1000 + END_MARGIN_MS)
  }
}

function onEnded () {
  finish('ended')
}

function onError () {
  finish('error')
}

onMounted(() => {
  timer = window.setTimeout(() => finish('timer'), HARD_CAP_MS)
  const audio = audioRef.value
  if (!audio) {
    finish('no_element')
    return
  }
  audio.addEventListener('play', onPlay)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('error', onError)
  audio.play().catch(e => {
    console.warn('Instruction audio could not start:', e)
    finish('blocked')
  })
})

// Before unmount, not after: Vue clears template refs while unmounting, so an
// onUnmounted hook would find them null and a detached element would play on.
onBeforeUnmount(() => {
  finished = true
  clearTimer()
  const audio = audioRef.value
  if (audio) {
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('ended', onEnded)
    audio.removeEventListener('error', onError)
    audio.pause()
  }
})
</script>

<template>
  <audio
    ref="audioRef"
    :src="audioSource"
    preload="auto"
  />
</template>

<style scoped>
audio {
  display: none;
}
</style>
