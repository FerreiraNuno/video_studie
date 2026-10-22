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
  /** phase 2: 0-based index of the next video (= number of rated videos) */
  videoIndex?: number
  /** phase 3: 0-based index of the current photo */
  photoIndex?: number
  /** phase 3: the shuffled photo order (filenames), fixed on first entry */
  photoOrder?: string[]
}

// --- phase 2 --------------------------------------------------------------
// Each context block is 28 steps: intro, scenario, 4×(video, rating),
// reminder, 4×(video, rating), reminder, 4×(video, rating).
export const PHASE2_CONTEXT_STARTS = [4, 32, 60] as const
export const PHASE2_LAST_STEP = 87
const PHASE2_BLOCK_LENGTH = 28
const PHASE2_RATING_OFFSETS = new Set([3, 5, 7, 9, 12, 14, 16, 18, 21, 23, 25, 27])
const PHASE2_VIDEO_OFFSETS = new Set([2, 4, 6, 8, 11, 13, 15, 17, 20, 22, 24, 26])

function phaseTwoOffset (progressIndex: number): number | null {
  for (const start of PHASE2_CONTEXT_STARTS) {
    const offset = progressIndex - start
    if (offset >= 0 && offset < PHASE2_BLOCK_LENGTH) return offset
  }
  return null
}

export function isPhaseTwoRatingStep (progressIndex: number): boolean {
  const offset = phaseTwoOffset(progressIndex)
  return offset !== null && PHASE2_RATING_OFFSETS.has(offset)
}

export function isPhaseTwoVideoStep (progressIndex: number): boolean {
  const offset = phaseTwoOffset(progressIndex)
  return offset !== null && PHASE2_VIDEO_OFFSETS.has(offset)
}

/**
 * Where to resume phase 2 for a saved position. A rating step resumes at the
 * video step before it (the video index was already incremented when the
 * video ended, so it is decremented again). Anything out of range → start.
 */
export function phaseTwoResumePoint (saved: StudyPosition | null | undefined): { progressIndex: number, videoIndex: number } {
  const start = { progressIndex: 0, videoIndex: 0 }
  if (!saved || saved.phase !== 2) return start
  const { progressIndex, videoIndex = 0 } = saved
  if (!Number.isInteger(progressIndex) || progressIndex < 0 || progressIndex > PHASE2_LAST_STEP) return start
  if (!Number.isInteger(videoIndex) || videoIndex < 0 || videoIndex > 36) return start
  if (isPhaseTwoRatingStep(progressIndex)) {
    return { progressIndex: progressIndex - 1, videoIndex: Math.max(0, videoIndex - 1) }
  }
  return { progressIndex, videoIndex }
}

// --- phase 3 --------------------------------------------------------------
// 0 = intro, odd = photo, even > 0 = rating, >= 72 = final questions.
export const PHASE3_FINAL_STEP = 72

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
