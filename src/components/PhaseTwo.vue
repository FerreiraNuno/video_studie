<script setup lang="ts">
import Rating from './PhaseTwoComponents/Rating.vue'
import Video from './PhaseTwoComponents/Video.vue'
import Loading from './PhaseTwoComponents/Loading.vue'
import Context from './PhaseTwoComponents/Context.vue'
import { useProgressStore } from '../useProgress.store'
import { computed, ref, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import { initializeVideoOrder } from '@/utils/videoManager'
import context from '../text/context.json'

const testVideo = `${import.meta.env.BASE_URL}videos/testvideo.mp4`

// Import the test video
const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const progressIndex = ref(0)
const videoIndex = ref(0) // which video is currently being shown
const currentFilename = ref('')

// Initialize video order when component is mounted
onMounted(() => {
  initializeVideoOrder()
})

// Helper function to check if current index is in a list
const isInList = (index: number, list: number[]) => {
  return list.includes(index)
}

// Phase 2 flow:
// 0: Intro
// 1: Audio test
// 2-3: Bus context intro
// 4-11: First 4 bus videos and ratings
// 12: Bus reminder after video 4
// 13-20: Next 4 bus videos and ratings
// 21: Bus reminder after video 8
// 22-29: Last 4 bus videos and ratings
// 30-31: Doctor context intro
// 32-39: First 4 doctor videos and ratings
// 40: Doctor reminder after video 4
// 41-48: Next 4 doctor videos and ratings
// 49: Doctor reminder after video 8
// 50-57: Last 4 doctor videos and ratings
// 58-59: Pension context intro
// 60-67: First 4 pension videos and ratings
// 68: Pension reminder after video 4
// 69-76: Next 4 pension videos and ratings
// 77: Pension reminder after video 8
// 78-85: Last 4 pension videos and ratings
// 86: Phase 2 finished

const showIntro = computed(() => progressIndex.value === 0)
const showAudio = computed(() => progressIndex.value === 1)

// Bus context
const showBusIntro = computed(() => progressIndex.value === 2)
const showBusScenario = computed(() => progressIndex.value === 3)
const showBusVideosFirstSet = computed(() => isInList(progressIndex.value, [4, 6, 8, 10]))
const showBusRatingsFirstSet = computed(() => isInList(progressIndex.value, [5, 7, 9, 11]))
const showBusReminderAfter4 = computed(() => progressIndex.value === 12)
const showBusVideosSecondSet = computed(() => isInList(progressIndex.value, [13, 15, 17, 19]))
const showBusRatingsSecondSet = computed(() => isInList(progressIndex.value, [14, 16, 18, 20]))
const showBusReminderAfter8 = computed(() => progressIndex.value === 21)
const showBusVideosThirdSet = computed(() => isInList(progressIndex.value, [22, 24, 26, 28]))
const showBusRatingsThirdSet = computed(() => isInList(progressIndex.value, [23, 25, 27, 29]))

// Doctor context
const showDoctorIntro = computed(() => progressIndex.value === 30)
const showDoctorScenario = computed(() => progressIndex.value === 31)
const showDoctorVideosFirstSet = computed(() => isInList(progressIndex.value, [32, 34, 36, 38]))
const showDoctorRatingsFirstSet = computed(() => isInList(progressIndex.value, [33, 35, 37, 39]))
const showDoctorReminderAfter4 = computed(() => progressIndex.value === 40)
const showDoctorVideosSecondSet = computed(() => isInList(progressIndex.value, [41, 43, 45, 47]))
const showDoctorRatingsSecondSet = computed(() => isInList(progressIndex.value, [42, 44, 46, 48]))
const showDoctorReminderAfter8 = computed(() => progressIndex.value === 49)
const showDoctorVideosThirdSet = computed(() => isInList(progressIndex.value, [50, 52, 54, 56]))
const showDoctorRatingsThirdSet = computed(() => isInList(progressIndex.value, [51, 53, 55, 57]))

// Pension context
const showPensionIntro = computed(() => progressIndex.value === 58)
const showPensionScenario = computed(() => progressIndex.value === 59)
const showPensionVideosFirstSet = computed(() => isInList(progressIndex.value, [60, 62, 64, 66]))
const showPensionRatingsFirstSet = computed(() => isInList(progressIndex.value, [61, 63, 65, 67]))
const showPensionReminderAfter4 = computed(() => progressIndex.value === 68)
const showPensionVideosSecondSet = computed(() => isInList(progressIndex.value, [69, 71, 73, 75]))
const showPensionRatingsSecondSet = computed(() => isInList(progressIndex.value, [70, 72, 74, 76]))
const showPensionReminderAfter8 = computed(() => progressIndex.value === 77)
const showPensionVideosThirdSet = computed(() => isInList(progressIndex.value, [78, 80, 82, 84]))
const showPensionRatingsThirdSet = computed(() => isInList(progressIndex.value, [79, 81, 83, 85]))

const phase2Finished = computed(() => progressIndex.value === 85)

function submitRating (ratings: { pain: number, credibility: number, difficulty: number }, filename: string) {
  supabaseStore.saveRating(videoIndex.value, ratings, filename)
  finishSection()
}

function handleVideoEnded (filename: string) {
  currentFilename.value = filename
  progressIndex.value++
}

function finishSection () {
  videoIndex.value++
  if (phase2Finished.value) {
    finishPhaseTwo()
  } else {
    progressIndex.value++
  }
}

function finishPhaseTwo () {
  progressStore.nextPhase()
}
</script>

<template>
  <div
    class="instruction"
    v-if="showIntro"
  >
    <h2>Nun beginnt der 2. Teil der Studie.</h2>
    <p>Sie sehen gleich eine Reihe von Videos mit verschiedenen Personen. Ihre Aufgabe ist es, die Schmerzen der
      Personen auf den folgenden Skalen einzuschätzen:</p>
    <ul>
      <li>Schmerzintensität (0-10: kein Schmerz, stärkster vorstellbarer Schmerz)</li>
      <li>Glaubhaftigkeit der Schmerzen (0-10: überhaupt nicht glaubhaft, äußerst glaubhaft)</li>
      <li>Schwierigkeit der Beurteilung (0-10: überhaupt nicht schwierig, äußerst schwierig)</li>
    </ul>
    <p>Bitte probieren Sie für jede Skala einmal aus, wie der Schieberegler sich mit Ihrer Maus bewegen lässt.</p>
    <Rating
      :videoIndex="0"
      :filename="''"
      @rating-submitted="progressIndex++"
    />
  </div>

  <div
    class="instruction"
    v-else-if="showAudio"
  >
    <h2>Das hat ja sehr gut geklappt.</h2>
    <p>Damit Sie den Ablauf schon einmal kennenlernen, zeigen wir Ihnen nun gleich ein Video.</p>
    <p>Zuerst müssen wir noch testen, ob der Ton über Ihren Kopfhörer gut zu hören ist. Über Ihren Kopfhörer bekommen
      Sie direkt nach dem Video zusätzliche Informationen. Diese beziehen sich darauf, wie die Person aus dem Video
      jeweils selbst ihre Schmerzen einschätzt.</p>
    <audio controls>
      <source
        src="/bugle_tune.ogg"
        type="audio/ogg"
      >
      Your browser does not support the audio element.
    </audio>
    <br>
    <button
      @click="progressIndex++"
      class="next-button"
    >Weiter</button>
  </div>

  <!-- Bus Context -->
  <Context
    v-else-if="showBusIntro"
    :text="context.bus_intro.cdm"
    :imageNumber="0"
    context="bus"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showBusScenario"
    :text="context.bus_scenario.cdm"
    :imageNumber="1"
    context="bus"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showBusReminderAfter4"
    :text="context.bus_reminder.cdm"
    :imageNumber="1"
    context="bus"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showBusReminderAfter8"
    :text="context.bus_reminder.cdm"
    :imageNumber="1"
    context="bus"
    @next="progressIndex++"
  />

  <!-- Doctor Context -->
  <Context
    v-else-if="showDoctorIntro"
    :text="context.doctor_intro.cdm"
    :imageNumber="0"
    context="doctor"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showDoctorScenario"
    :text="context.doctor_scenario.cdm"
    :imageNumber="0"
    context="doctor"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showDoctorReminderAfter4"
    :text="context.doctor_reminder.cdm"
    :imageNumber="0"
    context="doctor"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showDoctorReminderAfter8"
    :text="context.doctor_reminder.cdm"
    :imageNumber="0"
    context="doctor"
    @next="progressIndex++"
  />

  <!-- Pension Context -->
  <Context
    v-else-if="showPensionIntro"
    :text="context.pension_intro.cdm"
    :imageNumber="0"
    context="pension"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showPensionScenario"
    :text="context.pension_scenario.cdm"
    :imageNumber="0"
    context="pension"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showPensionReminderAfter4"
    :text="context.pension_reminder.cdm"
    :imageNumber="0"
    context="pension"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showPensionReminderAfter8"
    :text="context.pension_reminder.cdm"
    :imageNumber="0"
    context="pension"
    @next="progressIndex++"
  />

  <!-- Videos and Ratings -->
  <Video
    v-else-if="showBusVideosFirstSet || showBusVideosSecondSet || showBusVideosThirdSet ||
      showDoctorVideosFirstSet || showDoctorVideosSecondSet || showDoctorVideosThirdSet ||
      showPensionVideosFirstSet || showPensionVideosSecondSet || showPensionVideosThirdSet"
    :videoIndex="videoIndex"
    @video-ended="handleVideoEnded"
  />
  <Rating
    v-else-if="showBusRatingsFirstSet || showBusRatingsSecondSet || showBusRatingsThirdSet ||
      showDoctorRatingsFirstSet || showDoctorRatingsSecondSet || showDoctorRatingsThirdSet ||
      showPensionRatingsFirstSet || showPensionRatingsSecondSet || showPensionRatingsThirdSet"
    :videoIndex="videoIndex"
    :filename="currentFilename"
    @rating-submitted="submitRating"
  />
  <Loading v-else />
</template>

<style scoped>
p {
  font-size: 1.2rem;
}

.instruction {
  max-width: 65rem;
}

audio {
  width: 30rem;
}

.next-button:hover {
  background-color: #4338CA;
}
</style>