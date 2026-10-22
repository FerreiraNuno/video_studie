/**
 * The step sequence of phase 2 (pure, unit-tested).
 *
 * PhaseTwo.vue renders `PHASE2_STEPS[progressIndex]`, and the resume helpers
 * interpret a saved `progressIndex` through the same table, so the layout of
 * the phase is defined in exactly one place. The table does not depend on
 * the participant's trial plan: it refers to context *sections* (0..2) and
 * trial indexes (0..35); which context a section shows comes from the plan's
 * `contextOrder` at render time.
 *
 * Layout (88 steps, identical to the hand-coded indexes used before, so
 * positions stored in `progress.position` stay valid):
 *
 *   0 intro (practice rating)   1 audio test   2 video test   3 start message
 *   per section (28 steps): intro, scenario, 4 × (video, rating),
 *                           reminder, 4 × (video, rating),
 *                           reminder, 4 × (video, rating)
 */

export const PHASE2_SECTIONS = 3
export const PHASE2_TRIALS_PER_SECTION = 12
export const PHASE2_TOTAL_TRIALS = PHASE2_SECTIONS * PHASE2_TRIALS_PER_SECTION
/** videos between two context reminders */
const PHASE2_BLOCK_SIZE = 4

export type ContextPart = 'intro' | 'scenario' | 'reminder'

export type PhaseTwoStep =
  | { kind: 'intro' }
  | { kind: 'audio_test' }
  | { kind: 'video_test' }
  | { kind: 'start' }
  /** context instruction screen; `imageNumber` selects the still (0) or the clip (1) in Context.vue */
  | { kind: 'context', section: number, part: ContextPart, imageNumber: 0 | 1 }
  /** instruction audio followed by the muted video + self-report audio of trial `trialIndex` (0..35) */
  | { kind: 'video', section: number, trialIndex: number }
  /** rating of trial `trialIndex` */
  | { kind: 'rating', section: number, trialIndex: number }

export function buildPhaseTwoSteps (): PhaseTwoStep[] {
  const steps: PhaseTwoStep[] = [
    { kind: 'intro' },
    { kind: 'audio_test' },
    { kind: 'video_test' },
    { kind: 'start' },
  ]
  let trialIndex = 0
  for (let section = 0; section < PHASE2_SECTIONS; section++) {
    steps.push({ kind: 'context', section, part: 'intro', imageNumber: 0 })
    steps.push({ kind: 'context', section, part: 'scenario', imageNumber: 1 })
    for (let block = 0; block < PHASE2_TRIALS_PER_SECTION / PHASE2_BLOCK_SIZE; block++) {
      if (block > 0) steps.push({ kind: 'context', section, part: 'reminder', imageNumber: 1 })
      for (let i = 0; i < PHASE2_BLOCK_SIZE; i++) {
        steps.push({ kind: 'video', section, trialIndex })
        steps.push({ kind: 'rating', section, trialIndex })
        trialIndex++
      }
    }
  }
  return steps
}

export const PHASE2_STEPS: readonly PhaseTwoStep[] = Object.freeze(buildPhaseTwoSteps())
export const PHASE2_LAST_STEP = PHASE2_STEPS.length - 1

/** Step indexes at which a context section starts (its intro screen). */
export const PHASE2_CONTEXT_STARTS: readonly number[] = PHASE2_STEPS
  .map((step, index) => (step.kind === 'context' && step.part === 'intro' ? index : -1))
  .filter(index => index >= 0)

export function phaseTwoStep (progressIndex: number): PhaseTwoStep | undefined {
  return PHASE2_STEPS[progressIndex]
}

export function isPhaseTwoRatingStep (progressIndex: number): boolean {
  return phaseTwoStep(progressIndex)?.kind === 'rating'
}

export function isPhaseTwoVideoStep (progressIndex: number): boolean {
  return phaseTwoStep(progressIndex)?.kind === 'video'
}

/**
 * Number of videos shown before `progressIndex` – i.e. the 0-based index of
 * the next video (at a video step: that step's own trial). 36 after the last
 * video.
 */
export function phaseTwoVideoIndex (progressIndex: number): number {
  for (let i = Math.max(0, progressIndex); i < PHASE2_STEPS.length; i++) {
    const step = PHASE2_STEPS[i]
    if (step.kind === 'video') return step.trialIndex
  }
  return PHASE2_TOTAL_TRIALS
}
