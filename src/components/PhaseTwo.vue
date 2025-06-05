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

// Get the current group from the store
const currentGroup = computed(() => supabaseStore.user.group)

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

// Context sections (each context has 28 steps: intro, scenario, 12 videos, 12 ratings, 2 reminders)
const contextSections = [
  { start: 4, end: 31 },    // First context
  { start: 32, end: 59 },   // Second context
  { start: 60, end: 87 }    // Third context
]

// Helper function to get current context section
function getCurrentContextSection () {
  for (let i = 0; i < contextSections.length; i++) {
    const section = contextSections[i]
    if (progressIndex.value >= section.start && progressIndex.value <= section.end) {
      return i
    }
  }
  return -1
}

// Helper function to get current context
function getCurrentContext (): 'bus' | 'doctor' | 'pension' {
  const section = getCurrentContextSection()
  if (section === -1) return 'bus' // Default fallback

  // Get the context order from videoManager
  const contextOrder = ['bus', 'doctor', 'pension'] as const
  return contextOrder[section]
}

// Computed properties for each context section
const showContextIntro = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && progressIndex.value === contextSections[section].start
})

const showContextScenario = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && progressIndex.value === contextSections[section].start + 1
})

const showContextVideosFirstSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 2,
    contextSections[section].start + 4,
    contextSections[section].start + 6,
    contextSections[section].start + 8
  ])
})

const showContextRatingsFirstSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 3,
    contextSections[section].start + 5,
    contextSections[section].start + 7,
    contextSections[section].start + 9
  ])
})

const showContextReminderAfter4 = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && progressIndex.value === contextSections[section].start + 10
})

const showContextVideosSecondSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 11,
    contextSections[section].start + 13,
    contextSections[section].start + 15,
    contextSections[section].start + 17
  ])
})

const showContextRatingsSecondSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 12,
    contextSections[section].start + 14,
    contextSections[section].start + 16,
    contextSections[section].start + 18
  ])
})

const showContextReminderAfter8 = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && progressIndex.value === contextSections[section].start + 19
})

const showContextVideosThirdSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 20,
    contextSections[section].start + 22,
    contextSections[section].start + 24,
    contextSections[section].start + 26
  ])
})

const showContextRatingsThirdSet = computed(() => {
  const section = getCurrentContextSection()
  return section !== -1 && isInList(progressIndex.value, [
    contextSections[section].start + 21,
    contextSections[section].start + 23,
    contextSections[section].start + 25,
    contextSections[section].start + 27
  ])
})

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
      <li>Schmerzintensität (0: kein Schmerz, 10: stärkster vorstellbarer Schmerz)</li>
      <li>Glaubhaftigkeit der berichteten und gezeigten Schmerzen (0: überhaupt nicht glaubhaft,
        10: äußerst glaubhaft)</li>
      <li>Schwierigkeit der Beurteilung (0: überhaupt nicht schwierig, 10: äußerst schwierig)</li>
    </ul>
    <p>Bitte probieren Sie für jede Skala einmal aus, wie der Schieberegler sich mit Ihrer Maus bewegen lässt.</p>
    <Rating
      :videoIndex="0"
      :filename="''"
      context="none"
      @rating-submitted="progressIndex++"
    />
  </div>

  <div
    class="instruction"
    style="text-align: center;"
    v-else-if="showStartMessage"
  >
    <h2>Prima, dass Sie bisher alles so gut gemeistert haben!</h2>
    <p>Dann kann es jetzt mit der Beurteilung der Videos losgehen.</p>
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
    <p>Sie werden gleich eine Reihe von Videos sehen und direkt nach jedem Video in einer
      Audiodatei gesagt bekommen, wie die Person im Video ihre Schmerzen selbst
      einschätzt.</p>
    <p>Damit Sie gleich gut starten können, möchten wir vorher noch testen, ob Ton und
      Videowiedergabe funktionieren.</p>
    <p>Bitte verbinden Sie nun einen Kopfhörer mit Ihrem PC und testen Sie dann, ob Sie
      den Ton der Audiodatei gut hören können! Wenn Sie den Ton gut hören können,
      bestätigen Sie dies und gehen zur nächsten Seite weiter. Falls nicht, setzen Sie sich
      bitte mit der Studienleitung in Verbindung!</p>
    <audio
      volume="1.0"
      loop
      autoplay
      preload="auto"
    >
      <source
        src="/bugle_tune.mp3"
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
    <p>Bitte überprüfen Sie, ob das Video gut wiedergegeben wird.</p>
    <video
      :src="testVideo"
      autoplay
      loop
      :muted="true"
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

  <!-- Context sections -->
  <Context
    v-else-if="showContextIntro"
    :text="context[`${getCurrentContext()}_intro`][currentGroup]"
    :imageNumber="0"
    :context="getCurrentContext()"
    :group="currentGroup"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showContextScenario"
    :text="context[`${getCurrentContext()}_scenario`][currentGroup]"
    :imageNumber="1"
    :context="getCurrentContext()"
    :group="currentGroup"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showContextReminderAfter4"
    :text="context[`${getCurrentContext()}_reminder`][currentGroup]"
    :imageNumber="1"
    :context="getCurrentContext()"
    :group="currentGroup"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showContextReminderAfter8"
    :text="context[`${getCurrentContext()}_reminder`][currentGroup]"
    :imageNumber="1"
    :context="getCurrentContext()"
    :group="currentGroup"
    @next="progressIndex++"
  />

  <!-- Videos and Ratings -->
  <Video
    v-else-if="showContextVideosFirstSet || showContextVideosSecondSet || showContextVideosThirdSet"
    :videoIndex="videoIndex"
    :studyGroup="currentGroup"
    @video-ended="handleVideoEnded"
  />
  <Rating
    v-else-if="showContextRatingsFirstSet || showContextRatingsSecondSet || showContextRatingsThirdSet"
    :videoIndex="videoIndex"
    :filename="currentFilename"
    :context="getCurrentContext()"
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