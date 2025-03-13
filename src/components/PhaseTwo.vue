<script setup lang="ts">
import Rating from './PhaseTwoComponents/Rating.vue'
import Video from './PhaseTwoComponents/Video.vue'
import Loading from './PhaseTwoComponents/Loading.vue'
import Context from './PhaseTwoComponents/Context.vue'
import { useProgressStore } from '../useProgress.store'
import { computed, ref } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import context from '../text/context.json'

const testVideo = `${import.meta.env.BASE_URL}videos/testvideo.mp4`

// Import the test video
const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const progressIndex = ref(0)
const videoIndex = ref(1) // which video is currently being shown

const showIntro = computed(() => progressIndex.value === 0)
const showAudio = computed(() => progressIndex.value === 1)
const showContext1_1 = computed(() => progressIndex.value === 2)
const showContext1_2 = computed(() => progressIndex.value === 3)
const showVideo = computed(() => [4, 6, 8, 10, 13, 15, 17, 19, 22].includes(progressIndex.value))
const showRating = computed(() => [5, 7, 9, 11, 14, 16, 18, 20, 23].includes(progressIndex.value))
const showContext1_3 = computed(() => [12, 21].includes(progressIndex.value))
const phase2Finished = computed(() => progressIndex.value === 24)


function submitRating (ratings: { pain: number, credibility: number, difficulty: number }) {
  supabaseStore.saveRating(videoIndex.value, ratings)
  finishSection()
}

function finishSection () {
  videoIndex.value++
  if (phase2Finished) {
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

  <Context
    v-else-if="showContext1_1"
    :text="context.context1_1.cdm"
    :imageNumber="0"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showContext1_2"
    :text="context.context1_2.cdm"
    :imageNumber="1"
    @next="progressIndex++"
  />

  <Context
    v-else-if="showContext1_3"
    :text="context.context1_3.cdm"
    :imageNumber="1"
    @next="progressIndex++"
  />

  <!-- Loop through Videos -->
  <Video
    v-else-if="showVideo"
    :videoIndex="videoIndex"
    @video-ended="progressIndex++"
  />
  <Rating
    v-else-if="showRating"
    :videoIndex="videoIndex"
    @rating-submitted="submitRating"
  />
  <Loading v-else />
</template>

<style scoped>
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