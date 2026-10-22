import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import {
  generateTrialPlan,
  assertValidTrialPlan,
  describeTrialPlan,
  type Trial,
  type TrialPlan,
  type Context,
} from './utils/trialPlan'
import { allVideos } from './utils/videoManager'
import { allPhotos, type Photo } from './utils/photoManager'

/**
 * The current participant's stimulus assignment: the phase-2 trial plan and
 * the phase-3 photo order. Both are drawn once per participant and persisted
 * (plan → `trial_plans`, photo order → `progress.position`), and this store
 * is the only place that holds them in memory.
 *
 * Before October 2026 this state lived in module-level refs of the catalog
 * files, and the catalog objects themselves were mutated – which is how a
 * second initialisation carried stale assignments into a fresh one and broke
 * the balance for the first collection. A pinia store is created per app
 * (and per test), so there is no hidden state to leak between participants.
 */
export const useStimuliStore = defineStore('stimuliStore', () => {
  const trialPlan = shallowRef<TrialPlan | null>(null)
  const photoOrder = ref<Photo[]>([])

  /** Order in which the three contexts are shown (empty until a plan exists). */
  const contextOrder = computed<Context[]>(() => trialPlan.value?.contextOrder ?? [])
  const hasTrialPlan = computed(() => trialPlan.value !== null)

  /** Generates a NEW validated plan (throws TrialPlanError if it cannot be balanced). */
  function generatePlan (): TrialPlan {
    const plan = generateTrialPlan(allVideos)
    trialPlan.value = plan
    console.log('Trial plan generated and validated\n' + describeTrialPlan(plan))
    return plan
  }

  /** Restores a saved plan (loaded from Supabase); it is re-validated against the catalog. */
  function setPlan (plan: TrialPlan): TrialPlan {
    assertValidTrialPlan(plan, allVideos)
    trialPlan.value = plan
    console.log('Trial plan restored and validated\n' + describeTrialPlan(plan))
    return plan
  }

  /** Trial at 0-based index (0..35) in presentation order. */
  function trial (index: number): Trial {
    const plan = trialPlan.value
    if (!plan) throw new Error('Trial plan not initialized')
    const t = plan.trials[index]
    if (!t) throw new Error(`No trial at index ${index}`)
    return t
  }

  /** Draws a new random photo order and returns its filenames. */
  function shufflePhotos (): string[] {
    const photos = [...allPhotos]
    for (let i = photos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [photos[i], photos[j]] = [photos[j], photos[i]]
    }
    photoOrder.value = photos
    return photos.map(p => p.filename)
  }

  /** Restores a saved order (filenames; must be a permutation of the catalog). */
  function setPhotoOrder (filenames: readonly string[]): void {
    const byName = new Map(allPhotos.map(p => [p.filename, p]))
    const photos = filenames.map(f => {
      const photo = byName.get(f)
      if (!photo) throw new Error(`Unknown photo ${f}`)
      return photo
    })
    if (photos.length !== allPhotos.length || new Set(photos).size !== allPhotos.length) {
      throw new Error('Photo order is not a permutation of the catalog')
    }
    photoOrder.value = photos
  }

  const photoFilenames = computed(() => photoOrder.value.map(p => p.filename))

  /** Photo at 0-based index in the participant's order. */
  function photo (index: number): Photo {
    const p = photoOrder.value[index]
    if (!p) throw new Error(`No photo at index ${index}`)
    return p
  }

  return {
    trialPlan,
    contextOrder,
    hasTrialPlan,
    generatePlan,
    setPlan,
    trial,
    photoOrder,
    photoFilenames,
    shufflePhotos,
    setPhotoOrder,
    photo,
  }
})
