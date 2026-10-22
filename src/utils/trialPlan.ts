/**
 * Trial plan generation for phase 2 (video ratings).
 *
 * Design requirement (per participant, guaranteed – not just on average):
 *   Within each of the 3 contexts, every combination of
 *     self-report      (audioType: no_pain / slight_pain / strong_pain)
 *   × facial expression (videoType: pain-specific = "yes" / unspecific = "no")
 *   appears EXACTLY twice → 6 combinations × 2 = 12 trials per context.
 *
 * Additional constraints kept from the original implementation:
 *   - the two trials of a combination are one male and one female person
 *     (→ 6 male / 6 female per context)
 *   - every person is shown exactly once
 *   - per context, young people ≥ old people
 *   - context order, person→context assignment, audio assignment and the
 *     trial order within a context are randomized.
 *
 * This module is pure (no Vue, no DOM) so it can be unit-tested.
 */

export const CONTEXTS = ['bus', 'doctor', 'pension'] as const
export const AUDIO_TYPES = ['no_pain', 'slight_pain', 'strong_pain'] as const
export const VIDEO_TYPES = ['pain-specific', 'unspecific'] as const
export const GENDERS = ['male', 'female'] as const

export type Context = typeof CONTEXTS[number]
export type AudioType = typeof AUDIO_TYPES[number]
export type VideoType = typeof VIDEO_TYPES[number]
export type Gender = typeof GENDERS[number]
export type AgeGroup = 'young' | 'old'

export const TRIALS_PER_COMBINATION = 2
export const TRIALS_PER_CONTEXT = AUDIO_TYPES.length * VIDEO_TYPES.length * TRIALS_PER_COMBINATION // 12
export const TOTAL_TRIALS = TRIALS_PER_CONTEXT * CONTEXTS.length // 36

export type CatalogVideo = {
  filename: string
  personId: string
  gender: Gender
  ageGroup: AgeGroup
  videoType: VideoType
}

export type Trial = CatalogVideo & {
  context: Context
  audioType: AudioType
  /** 1-based position in the whole phase (1..36); matches `video_index` in the ratings table */
  position: number
}

export type TrialPlan = {
  contextOrder: Context[]
  trials: Trial[]
}

export class TrialPlanError extends Error {
  constructor (public readonly violations: string[]) {
    super(`Invalid trial plan:\n - ${violations.join('\n - ')}`)
    this.name = 'TrialPlanError'
  }
}

type Rng = () => number

function shuffle<T> (array: readonly T[], random: Rng): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const MAX_ATTEMPTS = 1000

/**
 * Generates a fresh, validated trial plan. Throws if the catalog cannot be
 * balanced or (defensively) if the generated plan fails validation.
 */
export function generateTrialPlan (catalog: readonly CatalogVideo[], random: Rng = Math.random): TrialPlan {
  const contextOrder = shuffle(CONTEXTS, random)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 1. Assign people to contexts, balanced per (gender × videoType) cell:
    //    each cell has 9 people → 3 per context.
    const byContext: Record<Context, CatalogVideo[]> = { bus: [], doctor: [], pension: [] }
    for (const gender of GENDERS) {
      for (const videoType of VIDEO_TYPES) {
        const cell = catalog.filter(v => v.gender === gender && v.videoType === videoType)
        if (cell.length !== CONTEXTS.length * AUDIO_TYPES.length) {
          throw new TrialPlanError([
            `catalog has ${cell.length} ${gender}/${videoType} videos, expected ${CONTEXTS.length * AUDIO_TYPES.length}`
          ])
        }
        shuffle(cell, random).forEach((video, i) => {
          byContext[CONTEXTS[i % CONTEXTS.length]].push(video)
        })
      }
    }

    // 2. Age constraint: young ≥ old in every context (rejection sampling).
    const ageOk = CONTEXTS.every(context => {
      const young = byContext[context].filter(v => v.ageGroup === 'young').length
      return young >= byContext[context].length - young
    })
    if (!ageOk) continue

    // 3. Audio (self-report) assignment: within each context, each
    //    (videoType × gender) cell has exactly 3 people → one per audio type.
    //    Hence every (videoType × audioType) combination appears exactly twice
    //    (once male, once female) per context.
    const trials: Omit<Trial, 'position'>[] = []
    for (const context of CONTEXTS) {
      for (const videoType of VIDEO_TYPES) {
        for (const gender of GENDERS) {
          const cell = byContext[context].filter(v => v.videoType === videoType && v.gender === gender)
          const audios = shuffle(AUDIO_TYPES, random)
          cell.forEach((video, i) => trials.push({ ...video, context, audioType: audios[i] }))
        }
      }
    }

    // 4. Order: contexts in contextOrder, random order within a context.
    const ordered: Trial[] = contextOrder
      .flatMap(context => shuffle(trials.filter(t => t.context === context), random))
      .map((trial, i) => ({ ...trial, position: i + 1 }))

    const plan: TrialPlan = { contextOrder, trials: ordered }
    assertValidTrialPlan(plan, catalog)
    return plan
  }

  throw new TrialPlanError([`no age-balanced assignment found after ${MAX_ATTEMPTS} attempts`])
}

/**
 * Checks a plan against every requirement and returns a list of violations
 * (empty = valid).
 */
export function validateTrialPlan (plan: TrialPlan, catalog: readonly CatalogVideo[]): string[] {
  const violations: string[] = []
  const { contextOrder, trials } = plan

  if (contextOrder.length !== CONTEXTS.length || [...CONTEXTS].some(c => !contextOrder.includes(c))) {
    violations.push(`contextOrder ${JSON.stringify(contextOrder)} is not a permutation of ${JSON.stringify(CONTEXTS)}`)
  }

  if (trials.length !== TOTAL_TRIALS) {
    violations.push(`expected ${TOTAL_TRIALS} trials, got ${trials.length}`)
  }

  // every person exactly once
  const seen = new Map<string, number>()
  trials.forEach(t => seen.set(t.personId, (seen.get(t.personId) ?? 0) + 1))
  for (const video of catalog) {
    const n = seen.get(video.personId) ?? 0
    if (n !== 1) violations.push(`person ${video.personId} appears ${n} times, expected 1`)
  }
  for (const personId of seen.keys()) {
    if (!catalog.some(v => v.personId === personId)) violations.push(`unknown person ${personId}`)
  }

  // positions 1..N, grouped by context in contextOrder
  const positions = trials.map(t => t.position).sort((a, b) => a - b)
  if (positions.some((p, i) => p !== i + 1)) {
    violations.push('positions are not 1..N without gaps or duplicates')
  }
  for (const t of trials) {
    const expectedContext = contextOrder[Math.floor((t.position - 1) / TRIALS_PER_CONTEXT)]
    if (expectedContext !== undefined && t.context !== expectedContext) {
      violations.push(`position ${t.position} is ${t.context} but context block is ${expectedContext}`)
    }
  }

  // THE core requirement: per context, 2 trials per (videoType × audioType),
  // one male + one female; plus gender/age balance.
  for (const context of CONTEXTS) {
    const inContext = trials.filter(t => t.context === context)
    if (inContext.length !== TRIALS_PER_CONTEXT) {
      violations.push(`context ${context} has ${inContext.length} trials, expected ${TRIALS_PER_CONTEXT}`)
    }
    for (const videoType of VIDEO_TYPES) {
      for (const audioType of AUDIO_TYPES) {
        const combo = inContext.filter(t => t.videoType === videoType && t.audioType === audioType)
        if (combo.length !== TRIALS_PER_COMBINATION) {
          violations.push(`context ${context}: ${videoType} × ${audioType} appears ${combo.length} times, expected ${TRIALS_PER_COMBINATION}`)
        }
        for (const gender of GENDERS) {
          const n = combo.filter(t => t.gender === gender).length
          if (n !== 1) violations.push(`context ${context}: ${videoType} × ${audioType} has ${n} ${gender} trials, expected 1`)
        }
      }
    }
    const young = inContext.filter(t => t.ageGroup === 'young').length
    const old = inContext.length - young
    if (young < old) violations.push(`context ${context}: ${young} young < ${old} old`)
  }

  return violations
}

export function assertValidTrialPlan (plan: TrialPlan, catalog: readonly CatalogVideo[]): void {
  const violations = validateTrialPlan(plan, catalog)
  if (violations.length > 0) throw new TrialPlanError(violations)
}

/** Compact, human-readable summary (used for console logging in the app). */
export function describeTrialPlan (plan: TrialPlan): string {
  const lines = [`context order: ${plan.contextOrder.join(' → ')}`]
  for (const context of plan.contextOrder) {
    lines.push(`${context}:`)
    for (const t of plan.trials.filter(t => t.context === context)) {
      lines.push(`  ${String(t.position).padStart(2)}  ${t.personId.padEnd(8)} ${t.videoType.padEnd(13)} ${t.audioType}`)
    }
  }
  return lines.join('\n')
}
