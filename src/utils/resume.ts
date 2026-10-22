import { PHASE2_LAST_STEP, isPhaseTwoRatingStep, phaseTwoVideoIndex } from './phaseTwoSteps'

/**
 * In-phase resume points (pure, unit-tested).
 *
 * Phases 2 and 3 are long (up to ~50 min) and their state lives in component
 * refs. The components persist their position through the progress store
 * after every step; on mount they restore it. A position is normalized so the
 * participant never resumes in the middle of a rating for a stimulus they can
 * no longer see – they re-watch the video / re-see the photo first.
 */

export interface StudyPosition {
  /** phase the position belongs to; positions of another phase are ignored */
  phase: number
  progressIndex: number
  /** phase 2: 0-based index of the next video (= number of rated videos); informational, derived from progressIndex on resume */
  videoIndex?: number
  /** phase 3: 0-based index of the current photo */
  photoIndex?: number
  /** phase 3: the shuffled photo order (filenames), fixed on first entry */
  photoOrder?: string[]
}

// --- phase 2 --------------------------------------------------------------
// The step layout lives in phaseTwoSteps.ts; the helpers are re-exported so
// callers of this module keep working.
export {
  PHASE2_CONTEXT_STARTS, PHASE2_LAST_STEP, isPhaseTwoRatingStep, isPhaseTwoVideoStep, phaseTwoVideoIndex,
} from './phaseTwoSteps'

/**
 * Where to resume phase 2 for a saved position. A rating step resumes at the
 * video step before it, so the participant re-watches the video. The video
 * index is derived from the step rather than taken from the saved row: the
 * two must agree, and a row where they do not (a hand-edited or partially
 * written position) would otherwise crash the video step. Anything out of
 * range → start.
 */
export function phaseTwoResumePoint (saved: StudyPosition | null | undefined): { progressIndex: number, videoIndex: number } {
  const start = { progressIndex: 0, videoIndex: 0 }
  if (!saved || saved.phase !== 2) return start
  const { progressIndex } = saved
  if (!Number.isInteger(progressIndex) || progressIndex < 0 || progressIndex > PHASE2_LAST_STEP) return start
  const step = isPhaseTwoRatingStep(progressIndex) ? progressIndex - 1 : progressIndex
  return { progressIndex: step, videoIndex: phaseTwoVideoIndex(step) }
}

// --- phase 3 --------------------------------------------------------------
// 0 = intro, odd = photo i at 2i+1, even > 0 = rating of photo i at 2i+2,
// >= PHASE3_FINAL_STEP = final questions. The sentinel sits after the last
// rating step (photo 35 is rated at step 72); an earlier value of 72 made a
// reload during the last rating resume at the final questions, losing it.
export const PHASE3_FINAL_STEP = 73

/**
 * Where to resume phase 3. A rating step resumes at the photo step before it
 * (same photo index). The final questions resume as such.
 */
export function phaseThreeResumePoint (saved: StudyPosition | null | undefined): { progressIndex: number, photoIndex: number } {
  const start = { progressIndex: 0, photoIndex: 0 }
  if (!saved || saved.phase !== 3) return start
  const { progressIndex, photoIndex = 0 } = saved
  if (!Number.isInteger(progressIndex) || progressIndex < 0) return start
  if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex > 36) return start
  if (progressIndex >= PHASE3_FINAL_STEP || photoIndex >= 36) return { progressIndex: PHASE3_FINAL_STEP, photoIndex: 36 }
  if (progressIndex > 0 && progressIndex % 2 === 0) return { progressIndex: progressIndex - 1, photoIndex }
  return { progressIndex, photoIndex }
}

/** True when `order` is a permutation of `expected` (same filenames, each once). */
export function isValidPhotoOrder (order: unknown, expected: readonly string[]): order is string[] {
  if (!Array.isArray(order) || order.length !== expected.length) return false
  const set = new Set(order)
  return set.size === expected.length && expected.every(f => set.has(f))
}
