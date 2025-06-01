<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProgressStore } from '../useProgress.store'
import { useSupabaseStore } from '../useSupabase.store'
import Photo from './PhaseThreeComponents/Photo.vue'
import Rating from './PhaseThreeComponents/Rating.vue'
import FinalQuestions from './PhaseThreeComponents/FinalQuestions.vue'
import { initializePhotoOrder, getCurrentPhoto } from '@/utils/photoManager'

const progressStore = useProgressStore()
const supabaseStore = useSupabaseStore()

const progressIndex = ref(0)
const photoIndex = ref(0)

// Initialize photo order when component is mounted
onMounted(() => {
  initializePhotoOrder()
})

const showIntro = computed(() => progressIndex.value === 0)
const showPhoto = computed(() => progressIndex.value % 2 === 1 && photoIndex.value < 36)
const showRating = computed(() => progressIndex.value % 2 === 0 && progressIndex.value > 0 && photoIndex.value < 36)
const showFinalQuestions = computed(() => photoIndex.value >= 36)

function submitRating (ratings: {
  trustworthiness: number
  sympathy: number
  aura: number
  valence: number
  attractiveness: number
  stressLevel: number
}) {
  const photo = getCurrentPhoto(photoIndex.value)
  supabaseStore.savePhotoRating(photoIndex.value, ratings, photo.filename)
  finishSection()
}

function finishSection () {
  photoIndex.value++
  if (photoIndex.value >= 36) { // Total number of photos
    progressIndex.value = 72 // Set to a value that will trigger showFinalQuestions
  } else {
    progressIndex.value++
  }
  console.log("progressIndex", progressIndex.value)
  console.log("photoIndex", photoIndex.value)
}

function finishPhaseThree () {
  progressStore.nextPhase()
}
</script>

<template>
  <div
    class="instruction"
    v-if="showIntro"
  >
    <h2>Nun folgt der 3. Teil der Studie.</h2>
    <p>Sie sehen gleich eine Reihe von Fotos. Auf den Fotos sind die Personen abgebildet, die Sie eben auf den Videos
      gesehen haben.</p>
    <p>Ihre Aufgabe ist es, die Personen auf den folgenden Skalen einzuschätzen.</p>
    <ul>
      <li>Vertrauenswürdigkeit (0-10: überhaupt nicht vertrauenswürdig - äußerst vertrauenswürdig)</li>
      <li>Sympathie (0-10: sehr unsympathisch – äußerst sympathisch)</li>
      <li>Ausstrahlung (0-10: sehr unangenehm – äußerst angenehm)</li>
      <li>Eindruck (0-10: sehr negativ – äußerst positiv)</li>
      <li>Attraktivität (0-10: sehr unattraktiv - äußerst attraktiv)</li>
      <li>Stresslevel (0-10: sehr gestresst vs. äußerst gelassen)</li>
    </ul>
    <p>Wie Sie den Schieberegler mit Ihrer Maus bewegen und so Ihre Einschätzung abgeben können, wissen Sie ja bereits.
    </p>
    <button
      @click="progressIndex++"
      class="next-button"
    >Weiter</button>
  </div>

  <Photo
    v-else-if="showPhoto"
    :photoIndex="photoIndex"
    @photo-ended="progressIndex++"
  />

  <Rating
    v-else-if="showRating"
    :photoIndex="photoIndex"
    @rating-submitted="submitRating"
  />

  <FinalQuestions v-else-if="showFinalQuestions" />
</template>

<style scoped>
.instruction {
  max-width: 65rem;
  margin: 0 auto;
  padding: 2rem;
}

ul {
  margin: 1rem 0;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.5rem;
}

.next-button {
  display: block;
  margin: 2rem auto 0;
  padding: 0.75rem 2rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.next-button:hover {
  background-color: #0056b3;
}
</style>