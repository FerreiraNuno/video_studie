import { describe, it, expect } from 'vitest'
import {
  generateTrialPlan,
  validateTrialPlan,
  assertValidTrialPlan,
  TrialPlanError,
  CONTEXTS,
  AUDIO_TYPES,
  VIDEO_TYPES,
  TRIALS_PER_COMBINATION,
  type TrialPlan
} from '../trialPlan'
import { allVideos } from '../videoManager'

/** Independent re-implementation of the requirement, so the test does not rely on validateTrialPlan. */
function countPerCombination (plan: TrialPlan) {
  const counts = new Map<string, number>()
  for (const t of plan.trials) {
    const key = `${t.context}|${t.videoType}|${t.audioType}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

// deterministic PRNG so failures are reproducible
function mulberry32 (seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

describe('generateTrialPlan', () => {
  it('has exactly 2 trials per (context × facial expression × self-report) for 2000 seeds', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const plan = generateTrialPlan(allVideos, mulberry32(seed))
      const counts = countPerCombination(plan)
      expect(counts.size, `seed ${seed}`).toBe(CONTEXTS.length * VIDEO_TYPES.length * AUDIO_TYPES.length)
      for (const context of CONTEXTS) {
        for (const videoType of VIDEO_TYPES) {
          for (const audioType of AUDIO_TYPES) {
            expect(counts.get(`${context}|${videoType}|${audioType}`), `seed ${seed} ${context} ${videoType} ${audioType}`).toBe(TRIALS_PER_COMBINATION)
          }
        }
      }
      expect(validateTrialPlan(plan, allVideos), `seed ${seed}`).toEqual([])
    }
  })

  it('shows every person exactly once, 12 trials per context, 6 male / 6 female, young ≥ old', () => {
    const plan = generateTrialPlan(allVideos, mulberry32(42))
    expect(plan.trials).toHaveLength(36)
    expect(new Set(plan.trials.map(t => t.personId)).size).toBe(36)
    for (const context of CONTEXTS) {
      const inContext = plan.trials.filter(t => t.context === context)
      expect(inContext).toHaveLength(12)
      expect(inContext.filter(t => t.gender === 'male')).toHaveLength(6)
      const young = inContext.filter(t => t.ageGroup === 'young').length
      expect(young).toBeGreaterThanOrEqual(12 - young)
    }
  })

  it('randomizes context order and trial order between participants', () => {
    const orders = new Set<string>()
    const firstTrials = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const plan = generateTrialPlan(allVideos, mulberry32(seed))
      orders.add(plan.contextOrder.join(','))
      firstTrials.add(plan.trials[0].personId + plan.trials[0].audioType)
    }
    expect(orders.size).toBe(6) // all permutations of 3 contexts occur
    expect(firstTrials.size).toBeGreaterThan(20)
  })

  it('positions are 1..36 and grouped by context in contextOrder', () => {
    const plan = generateTrialPlan(allVideos, mulberry32(7))
    plan.trials.forEach((t, i) => {
      expect(t.position).toBe(i + 1)
      expect(t.context).toBe(plan.contextOrder[Math.floor(i / 12)])
    })
  })

  it('does not mutate the catalog', () => {
    const before = JSON.stringify(allVideos)
    generateTrialPlan(allVideos, mulberry32(3))
    expect(JSON.stringify(allVideos)).toBe(before)
  })
})

describe('validateTrialPlan', () => {
  it('accepts a generated plan', () => {
    expect(() => assertValidTrialPlan(generateTrialPlan(allVideos, mulberry32(1)), allVideos)).not.toThrow()
  })

  it('rejects a plan where one combination appears 3 times and another once', () => {
    const plan = generateTrialPlan(allVideos, mulberry32(1))
    const broken: TrialPlan = { ...plan, trials: plan.trials.map(t => ({ ...t })) }
    const a = broken.trials.find(t => t.context === 'bus' && t.videoType === 'unspecific' && t.audioType === 'no_pain')!
    a.audioType = 'strong_pain'
    const violations = validateTrialPlan(broken, allVideos)
    expect(violations.some(v => v.includes('unspecific × no_pain appears 1'))).toBe(true)
    expect(violations.some(v => v.includes('unspecific × strong_pain appears 3'))).toBe(true)
    expect(() => assertValidTrialPlan(broken, allVideos)).toThrow(TrialPlanError)
  })

  it('rejects a plan that reproduces the old bug (stale audio types after re-assignment)', () => {
    // old behaviour: contexts re-shuffled, audio types kept from a previous run
    const first = generateTrialPlan(allVideos, mulberry32(10))
    const second = generateTrialPlan(allVideos, mulberry32(11))
    const audioByPerson = new Map(first.trials.map(t => [t.personId, t.audioType]))
    const stale: TrialPlan = { ...second, trials: second.trials.map(t => ({ ...t, audioType: audioByPerson.get(t.personId)! })) }
    expect(validateTrialPlan(stale, allVideos).length).toBeGreaterThan(0)
  })

  it('rejects duplicate persons, wrong trial counts and wrong context order', () => {
    const plan = generateTrialPlan(allVideos, mulberry32(5))
    const dup: TrialPlan = { ...plan, trials: plan.trials.map((t, i) => i === 0 ? { ...plan.trials[1], position: 1, context: t.context } : t) }
    expect(validateTrialPlan(dup, allVideos).length).toBeGreaterThan(0)
    const short: TrialPlan = { ...plan, trials: plan.trials.slice(0, 35) }
    expect(validateTrialPlan(short, allVideos).some(v => v.includes('expected 36'))).toBe(true)
    const badOrder: TrialPlan = { ...plan, contextOrder: ['bus', 'bus', 'doctor'] }
    expect(validateTrialPlan(badOrder, allVideos).some(v => v.includes('permutation'))).toBe(true)
  })
})
