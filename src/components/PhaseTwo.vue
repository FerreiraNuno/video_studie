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
const currentFilename = ref('')
const audioHeard = ref(false)
const videoSeen = ref(false)

// Initialize video order when component is mounted
onMounted(() => {
  initializeVideoOrder()
})

// Helper function to check if current index is in a list
const isInList = (index: number, list: number[]) => {
  return list.includes(index)
}

// Calculate video index based on progress index
const videoIndex = computed(() => {
  // Skip intro screens (0-2)
  if (progressIndex.value <= 2) return 0

  // Calculate video index for each context
  const busVideos = [5, 7, 9, 11, 14, 16, 18, 20, 23, 25, 27, 29]
  const doctorVideos = [33, 35, 37, 39, 42, 44, 46, 48, 51, 53, 55, 57]
  const pensionVideos = [61, 63, 65, 67, 70, 72, 74, 76, 79, 81, 83, 85]

  const allVideoIndices = [...busVideos, ...doctorVideos, ...pensionVideos]
  const currentVideoIndex = allVideoIndices.indexOf(progressIndex.value)

  return currentVideoIndex >= 0 ? currentVideoIndex : 0
})

const showIntro = computed(() => progressIndex.value === 0)
const showAudio = computed(() => progressIndex.value === 1)
const showTestVideo = computed(() => progressIndex.value === 2)

// Bus context
const showBusIntro = computed(() => progressIndex.value === 3)
const showBusScenario = computed(() => progressIndex.value === 4)
const showBusVideosFirstSet = computed(() => isInList(progressIndex.value, [5, 7, 9, 11]))
const showBusRatingsFirstSet = computed(() => isInList(progressIndex.value, [6, 8, 10, 12]))
const showBusReminderAfter4 = computed(() => progressIndex.value === 13)
const showBusVideosSecondSet = computed(() => isInList(progressIndex.value, [14, 16, 18, 20]))
const showBusRatingsSecondSet = computed(() => isInList(progressIndex.value, [15, 17, 19, 21]))
const showBusReminderAfter8 = computed(() => progressIndex.value === 22)
const showBusVideosThirdSet = computed(() => isInList(progressIndex.value, [23, 25, 27, 29]))
const showBusRatingsThirdSet = computed(() => isInList(progressIndex.value, [24, 26, 28, 30]))

// Doctor context
const showDoctorIntro = computed(() => progressIndex.value === 31)
const showDoctorScenario = computed(() => progressIndex.value === 32)
const showDoctorVideosFirstSet = computed(() => isInList(progressIndex.value, [33, 35, 37, 39]))
const showDoctorRatingsFirstSet = computed(() => isInList(progressIndex.value, [34, 36, 38, 40]))
const showDoctorReminderAfter4 = computed(() => progressIndex.value === 41)
const showDoctorVideosSecondSet = computed(() => isInList(progressIndex.value, [42, 44, 46, 48]))
const showDoctorRatingsSecondSet = computed(() => isInList(progressIndex.value, [43, 45, 47, 49]))
const showDoctorReminderAfter8 = computed(() => progressIndex.value === 50)
const showDoctorVideosThirdSet = computed(() => isInList(progressIndex.value, [51, 53, 55, 57]))
const showDoctorRatingsThirdSet = computed(() => isInList(progressIndex.value, [52, 54, 56, 58]))

// Pension context
const showPensionIntro = computed(() => progressIndex.value === 59)
const showPensionScenario = computed(() => progressIndex.value === 60)
const showPensionVideosFirstSet = computed(() => isInList(progressIndex.value, [61, 63, 65, 67]))
const showPensionRatingsFirstSet = computed(() => isInList(progressIndex.value, [62, 64, 66, 68]))
const showPensionReminderAfter4 = computed(() => progressIndex.value === 69)
const showPensionVideosSecondSet = computed(() => isInList(progressIndex.value, [70, 72, 74, 76]))
const showPensionRatingsSecondSet = computed(() => isInList(progressIndex.value, [71, 73, 75, 77]))
const showPensionReminderAfter8 = computed(() => progressIndex.value === 78)
const showPensionVideosThirdSet = computed(() => isInList(progressIndex.value, [79, 81, 83, 85]))
const showPensionRatingsThirdSet = computed(() => isInList(progressIndex.value, [80, 82, 84, 86]))

const phase2Finished = computed(() => progressIndex.value >= 86)

function submitRating (ratings: { pain: number, credibility: number, difficulty: number }, filename: string) {
  supabaseStore.saveRating(videoIndex.value, ratings, filename)
  finishSection()
}

function handleVideoEnded (filename: string) {
  currentFilename.value = filename
  progressIndex.value++
}

function finishSection () {
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
      <li>Glaubhaftigkeit des Vorhandenseins oder Nichtvohandenseins der Schmerzen (0-10: überhaupt nicht glaubhaft,
        äußerst glaubhaft)</li>
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
    <p>Bitte verbinden Sie nun einen Kopfhörer mit Ihrem PC und testen Sie dann, ob Sie den Ton der Audiodaten gut hören
      können!</p>
    <audio controls>
      <source
        src="/bugle_tune.ogg"
        type="audio/ogg"
      >
      Your browser does not support the audio element.
    </audio>
    <br>
    <label>
      <input
        type="checkbox"
        v-model="audioHeard"
      />
      Ja, ich kann die Audio hören
    </label>
    <br>
    <button
      @click="progressIndex++"
      class="next-button"
      :disabled="!audioHeard"
    >Weiter</button>
  </div>

  <div
    class="instruction"
    v-else-if="showTestVideo"
  >
    <h2>Test Video</h2>
    <p>Bitte überprüfen Sie, ob die Videos korrekt wiedergegeben werden.</p>
    <video
      :src="testVideo"
      controls
      autoplay
      loop
      class="test-video"
    ></video>
    <br>
    <label>
      <input
        type="checkbox"
        v-model="videoSeen"
      />
      Ja, ich habe das Video gesehen
    </label>
    <br>
    <button
      :disabled="!videoSeen"
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
    :imageNumber="1"
    context="doctor"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showDoctorReminderAfter4"
    :text="context.doctor_reminder.cdm"
    :imageNumber="1"
    context="doctor"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showDoctorReminderAfter8"
    :text="context.doctor_reminder.cdm"
    :imageNumber="1"
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
    :imageNumber="1"
    context="pension"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showPensionReminderAfter4"
    :text="context.pension_reminder.cdm"
    :imageNumber="1"
    context="pension"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showPensionReminderAfter8"
    :text="context.pension_reminder.cdm"
    :imageNumber="1"
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

.next-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.test-video {
  width: 100%;
  max-width: 800px;
  margin: 1rem 0;
}
</style>