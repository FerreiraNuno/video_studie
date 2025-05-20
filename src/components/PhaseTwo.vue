<script setup lang="ts">
import Rating from './PhaseTwoComponents/Rating.vue'
import Video from './PhaseTwoComponents/Video.vue'
import Loading from './PhaseTwoComponents/Loading.vue'
import Context from './PhaseTwoComponents/Context.vue'
import { useProgressStore } from '../useProgress.store'
import { computed, ref, onMounted } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import { initializeVideoOrder, getCurrentVideo } from '@/utils/videoManager'
import context from '../text/context.json'

const testVideo = `${import.meta.env.BASE_URL}videos/testvideo.mp4`

// Import the test video
const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const progressIndex = ref(0)
const currentFilename = ref('')
const currentAudioType = ref<'no_pain' | 'slight_pain' | 'strong_pain' | null>(null)
const audioHeard = ref(false)
const videoSeen = ref(false)
const videoIndex = ref(0)  // Simple counter for videos

// Initialize video order when component is mounted
onMounted(() => {
  initializeVideoOrder()
})

// Helper function to check if current index is in a list
const isInList = (index: number, list: number[]) => {
  return list.includes(index)
}

const showIntro = computed(() => progressIndex.value === 0)
const showAudio = computed(() => progressIndex.value === 1)
const showTestVideo = computed(() => progressIndex.value === 2)
const showStartMessage = computed(() => progressIndex.value === 3)

// Bus context
const showBusIntro = computed(() => progressIndex.value === 4)
const showBusScenario = computed(() => progressIndex.value === 5)
const showBusVideosFirstSet = computed(() => isInList(progressIndex.value, [6, 8, 10, 12]))
const showBusRatingsFirstSet = computed(() => isInList(progressIndex.value, [7, 9, 11, 13]))
const showBusReminderAfter4 = computed(() => progressIndex.value === 14)
const showBusVideosSecondSet = computed(() => isInList(progressIndex.value, [15, 17, 19, 21]))
const showBusRatingsSecondSet = computed(() => isInList(progressIndex.value, [16, 18, 20, 22]))
const showBusReminderAfter8 = computed(() => progressIndex.value === 23)
const showBusVideosThirdSet = computed(() => isInList(progressIndex.value, [24, 26, 28, 30]))
const showBusRatingsThirdSet = computed(() => isInList(progressIndex.value, [25, 27, 29, 31]))

// Doctor context
const showDoctorIntro = computed(() => progressIndex.value === 32)
const showDoctorScenario = computed(() => progressIndex.value === 33)
const showDoctorVideosFirstSet = computed(() => isInList(progressIndex.value, [34, 36, 38, 40]))
const showDoctorRatingsFirstSet = computed(() => isInList(progressIndex.value, [35, 37, 39, 41]))
const showDoctorReminderAfter4 = computed(() => progressIndex.value === 42)
const showDoctorVideosSecondSet = computed(() => isInList(progressIndex.value, [43, 45, 47, 49]))
const showDoctorRatingsSecondSet = computed(() => isInList(progressIndex.value, [44, 46, 48, 50]))
const showDoctorReminderAfter8 = computed(() => progressIndex.value === 51)
const showDoctorVideosThirdSet = computed(() => isInList(progressIndex.value, [52, 54, 56, 58]))
const showDoctorRatingsThirdSet = computed(() => isInList(progressIndex.value, [53, 55, 57, 59]))

// Pension context
const showPensionIntro = computed(() => progressIndex.value === 60)
const showPensionScenario = computed(() => progressIndex.value === 61)
const showPensionVideosFirstSet = computed(() => isInList(progressIndex.value, [62, 64, 66, 68]))
const showPensionRatingsFirstSet = computed(() => isInList(progressIndex.value, [63, 65, 67, 69]))
const showPensionReminderAfter4 = computed(() => progressIndex.value === 70)
const showPensionVideosSecondSet = computed(() => isInList(progressIndex.value, [71, 73, 75, 77]))
const showPensionRatingsSecondSet = computed(() => isInList(progressIndex.value, [72, 74, 76, 78]))
const showPensionReminderAfter8 = computed(() => progressIndex.value === 79)
const showPensionVideosThirdSet = computed(() => isInList(progressIndex.value, [80, 82, 84, 86]))
const showPensionRatingsThirdSet = computed(() => isInList(progressIndex.value, [81, 83, 85, 87]))

const phase2Finished = computed(() => progressIndex.value >= 87)

function submitRating (ratings: { pain: number, credibility: number, difficulty: number }, filename: string) {
  console.log('Submitting rating with audio type:', currentAudioType.value)
  if (!currentAudioType.value) {
    console.error('No audio type found for video')
    return
  }
  supabaseStore.saveRating(videoIndex.value, ratings, filename, currentAudioType.value)
  finishSection()
}

function handleVideoEnded (filename: string) {
  const currentVideo = getCurrentVideo(videoIndex.value)
  console.log('Current video:', currentVideo)
  console.log('Current video audio type:', currentVideo.audioType)
  currentFilename.value = filename
  currentAudioType.value = currentVideo.audioType || null
  console.log('Stored audio type:', currentAudioType.value)
  videoIndex.value++  // Increment video index after each video
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
    style="text-align: center;"
    v-else-if="showStartMessage"
  >
    <h2>Prima, dass Sie bisher alles so gut gemeistert haben!</h2>
    <p>Nun beginnt der 2. Teil der Studie.</p>
    <button
      @click="progressIndex++"
      class="next-button"
    >Weiter</button>
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
    <audio
      controls
      volume="1.0"
      loop
      autoplay
    >
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
    <p>Bitte überprüfen Sie, ob das Video gut wiedergegeben wird.</p>
    <video
      :src="testVideo"
      autoplay
      loop
      muted
      playsinline
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