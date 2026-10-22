<script setup lang="ts">
import Rating from './PhaseTwoComponents/Rating.vue'
import Video, { type TrialEndReason } from './PhaseTwoComponents/Video.vue'
import InstructionAudio, { type InstructionEndReason } from './PhaseTwoComponents/InstructionAudio.vue'
import Loading from './PhaseTwoComponents/Loading.vue'
import Context from './PhaseTwoComponents/Context.vue'
import { useProgressStore, PHASE } from '../useProgress.store'
import { computed, ref, onMounted, watch } from 'vue'
import { useSupabaseStore } from '@/useSupabase.store'
import { getVideoSource } from '@/utils/videoManager'
import { useStimuliStore } from '@/useStimuli.store'
import contextText from '../text/context.json'
import { PHASE2_STEPS, PHASE2_LAST_STEP, PHASE2_TOTAL_TRIALS, type ContextPart } from '@/utils/phaseTwoSteps'
import { phaseTwoResumePoint } from '@/utils/resume'

/**
 * Phase 2 walks through PHASE2_STEPS (src/utils/phaseTwoSteps.ts); the only
 * progress state is `progressIndex` (plus `audioCompleted` inside a video
 * step). Everything else – which trial, which context, how many videos were
 * shown – is read off the step table, so the sequence is defined in one place
 * and a saved position can never disagree with it.
 */

const baseUrl = import.meta.env.BASE_URL
const testVideo = `${baseUrl}videos/testvideo.mp4`

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()
const stimuliStore = useStimuliStore()

const progressIndex = ref(0)
/** inside a video step: the instruction audio has ended and the video is showing */
const audioCompleted = ref(false)
// How the instruction audio and the video of the current trial ended; saved
// with the rating so trials without a proper stimulus can be excluded.
const instructionEndReason = ref<InstructionEndReason | null>(null)
const trialEndReason = ref<TrialEndReason | null>(null)
const planReady = ref(false)
const planError = ref('')
const audioHeard = ref(false)
const videoSeen = ref(false)

const currentGroup = computed(() => supabaseStore.user.group)
const step = computed(() => PHASE2_STEPS[progressIndex.value])
/** context shown by the current step (undefined outside the context sections) */
const currentContext = computed(() => {
  const s = step.value
  return s && 'section' in s ? stimuliStore.contextOrder[s.section] : undefined
})
/** trial of the current video / rating step */
const currentTrial = computed(() => {
  const s = step.value
  return s && (s.kind === 'video' || s.kind === 'rating') ? stimuliStore.trial(s.trialIndex) : null
})
const phase2Finished = computed(() => progressIndex.value >= PHASE2_LAST_STEP)

function contextAudio (context: string, part: ContextPart): string {
  return (contextText as Record<string, Record<string, string>>)[`${context}_${part}`][currentGroup.value]
}

// Make sure the participant's trial plan is available:
// 1. still in memory from phase 1 (normal flow), else
// 2. the plan saved in Supabase (resume after reload), else
// 3. generate a new one and save it – ONLY when the database confirmed that
//    no plan exists (legacy participants). A failed read must never fall
//    through to this branch: the upsert would replace the saved plan and the
//    ratings already stored under it would no longer match.
onMounted(async () => {
  try {
    if (!stimuliStore.hasTrialPlan) {
      const { plan, error: loadError } = await supabaseStore.loadTrialPlan()
      if (loadError) throw loadError
      if (plan) {
        stimuliStore.setPlan(plan)
      } else {
        const newPlan = stimuliStore.generatePlan()
        const { error } = await supabaseStore.saveTrialPlan(newPlan)
        if (error) throw error
      }
    }
    // Resume inside the phase after a reload (position saved after every step).
    progressIndex.value = phaseTwoResumePoint(progressStore.position).progressIndex
    audioCompleted.value = false
    planReady.value = true
  } catch (e) {
    console.error('Could not prepare trial plan:', e)
    planError.value = 'Die Videozuteilung konnte nicht geladen werden. Bitte laden Sie die Seite neu oder wenden Sie sich an die Studienleitung.'
  }
})

const showingVideo = computed(() => step.value?.kind === 'video' && audioCompleted.value)

// While the participant hears the instruction or rates the previous video,
// the next video is fetched by a hidden player so it starts without buffering.
const nextVideoSource = computed(() => {
  if (!planReady.value || showingVideo.value) return null
  const next = phaseTwoResumePoint({ phase: PHASE.videos, progressIndex: progressIndex.value }).videoIndex
  if (next >= PHASE2_TOTAL_TRIALS) return null
  return getVideoSource(stimuliStore.trial(next).filename)
})

// Persist the position after every step. A rating step is stored as the video
// step before it (see utils/resume.ts), so a reload replays that video first.
watch(progressIndex, (p) => {
  if (!planReady.value || phase2Finished.value) return
  const point = phaseTwoResumePoint({ phase: PHASE.videos, progressIndex: p })
  void progressStore.savePosition({ phase: PHASE.videos, ...point })
})

function submitRating (ratings: { pain: number, credibility: number, difficulty: number, action?: number }) {
  const trial = currentTrial.value
  if (!trial) {
    console.error('No trial found for rating')
    return
  }
  // Retries + outbox happen inside the store; the participant continues immediately.
  void supabaseStore.saveRating(ratings, trial, {
    instructionEndReason: instructionEndReason.value,
    trialEndReason: trialEndReason.value,
  })
  finishSection()
}

// Both handlers are idempotent: a second emit for the same step (a media
// component firing twice) must not advance twice, which would skip a trial.
function handleAudioEnded (_filename: string, reason: InstructionEndReason) {
  if (audioCompleted.value) return
  audioCompleted.value = true
  instructionEndReason.value = reason
  trialEndReason.value = null
}

function handleVideoEnded (_filename: string, reason: TrialEndReason) {
  if (!audioCompleted.value) return
  trialEndReason.value = reason
  audioCompleted.value = false  // Reset for the next video step
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
  progressStore.setPhase(PHASE.photos)
}
</script>

<template>
  <div
    class="instruction"
    v-if="planError"
  >
    <p>{{ planError }}</p>
  </div>

  <Loading v-else-if="!planReady || !step" />

  <div
    class="instruction"
    v-else-if="step.kind === 'intro'"
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
    v-else-if="step.kind === 'audio_test'"
  >
    <h2>Das hat ja sehr gut geklappt.</h2>
    <p>Sie werden gleich eine Reihe von Videos sehen und jeweils in einer Audiodatei dazu gesagt bekommen, was die
      Person im Video über ihre Schmerzen berichtet.</p>
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
        :src="`${baseUrl}bugle_tune.mp3`"
        type="audio/mpeg"
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
    v-else-if="step.kind === 'video_test'"
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

  <div
    class="instruction"
    style="text-align: center;"
    v-else-if="step.kind === 'start'"
  >
    <h2>Prima, dass Sie bisher alles so gut gemeistert haben!</h2>
    <p>Dann kann es jetzt mit der Beurteilung der Videos losgehen.</p>
    <button
      @click="progressIndex++"
      class="next-button"
    >Weiter</button>
  </div>

  <!-- Context screens (intro, scenario, reminders). Consecutive context steps
       render through this one branch, so the key forces a fresh instance per
       step – Context.vue sets up its media once on mount. -->
  <Context
    v-else-if="step.kind === 'context' && currentContext"
    :key="progressIndex"
    :text="contextAudio(currentContext, step.part)"
    :imageNumber="step.imageNumber"
    :context="currentContext"
    :group="currentGroup"
    @next="progressIndex++"
  />

  <!-- Video step: instruction audio, then the video with the self-report -->
  <InstructionAudio
    v-else-if="step.kind === 'video' && currentContext && !audioCompleted"
    :key="`instruction-${progressIndex}`"
    :videoIndex="step.trialIndex"
    :context="currentContext"
    @audio-ended="handleAudioEnded"
  />
  <Video
    v-else-if="step.kind === 'video'"
    :key="`video-${progressIndex}`"
    :videoIndex="step.trialIndex"
    @video-ended="handleVideoEnded"
  />
  <Rating
    v-else-if="step.kind === 'rating' && currentContext && currentTrial"
    :key="`rating-${progressIndex}`"
    :videoIndex="step.trialIndex"
    :filename="currentTrial.filename.replace(/\.[^/.]+$/, '')"
    :context="currentContext"
    @rating-submitted="submitRating"
  />
  <Loading v-else />

  <video
    v-if="nextVideoSource"
    :src="nextVideoSource"
    preload="auto"
    muted
    playsinline
    class="preload"
  ></video>
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

.preload {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>