import { describe, it, expect } from 'vitest'
import {
  PHASE2_STEPS, PHASE2_LAST_STEP, PHASE2_CONTEXT_STARTS, PHASE2_TOTAL_TRIALS,
  buildPhaseTwoSteps, phaseTwoVideoIndex, isPhaseTwoRatingStep, isPhaseTwoVideoStep,
} from '../phaseTwoSteps'

describe('PHASE2_STEPS', () => {
  it('is deterministic', () => {
    expect(buildPhaseTwoSteps()).toEqual([...PHASE2_STEPS])
  })

  it('keeps the layout that stored positions were written against (88 steps, sections at 4/32/60)', () => {
    expect(PHASE2_STEPS.length).toBe(88)
    expect(PHASE2_LAST_STEP).toBe(87)
    expect([...PHASE2_CONTEXT_STARTS]).toEqual([4, 32, 60])
    expect(PHASE2_STEPS.slice(0, 4).map(s => s.kind)).toEqual(['intro', 'audio_test', 'video_test', 'start'])

    const legacyVideoOffsets = [2, 4, 6, 8, 11, 13, 15, 17, 20, 22, 24, 26]
    PHASE2_CONTEXT_STARTS.forEach((start, section) => {
      expect(PHASE2_STEPS[start]).toEqual({ kind: 'context', section, part: 'intro', imageNumber: 0 })
      expect(PHASE2_STEPS[start + 1]).toEqual({ kind: 'context', section, part: 'scenario', imageNumber: 1 })
      expect(PHASE2_STEPS[start + 10]).toEqual({ kind: 'context', section, part: 'reminder', imageNumber: 1 })
      expect(PHASE2_STEPS[start + 19]).toEqual({ kind: 'context', section, part: 'reminder', imageNumber: 1 })
      legacyVideoOffsets.forEach((offset, i) => {
        const trialIndex = section * 12 + i
        expect(PHASE2_STEPS[start + offset]).toEqual({ kind: 'video', section, trialIndex })
        expect(PHASE2_STEPS[start + offset + 1]).toEqual({ kind: 'rating', section, trialIndex })
      })
    })
  })

  it('shows every trial exactly once, in order, each followed by its rating', () => {
    const videos = PHASE2_STEPS.filter(s => s.kind === 'video')
    const ratings = PHASE2_STEPS.filter(s => s.kind === 'rating')
    expect(videos.length).toBe(PHASE2_TOTAL_TRIALS)
    expect(ratings.length).toBe(PHASE2_TOTAL_TRIALS)
    expect(videos.map(s => s.kind === 'video' && s.trialIndex)).toEqual([...Array(36).keys()])
    PHASE2_STEPS.forEach((s, i) => {
      if (s.kind === 'video') expect(PHASE2_STEPS[i + 1]).toEqual({ ...s, kind: 'rating' })
    })
    expect(PHASE2_STEPS[PHASE2_LAST_STEP].kind).toBe('rating')
  })

  it('classifies steps and counts the videos shown before a step', () => {
    expect(isPhaseTwoVideoStep(6)).toBe(true)
    expect(isPhaseTwoRatingStep(7)).toBe(true)
    expect(isPhaseTwoRatingStep(4)).toBe(false)
    expect(isPhaseTwoVideoStep(88)).toBe(false)

    for (const intro of [0, 1, 2, 3]) expect(phaseTwoVideoIndex(intro)).toBe(0)
    expect(phaseTwoVideoIndex(4)).toBe(0)    // first context intro
    expect(phaseTwoVideoIndex(6)).toBe(0)    // first video
    expect(phaseTwoVideoIndex(7)).toBe(1)    // its rating: one video shown
    expect(phaseTwoVideoIndex(14)).toBe(4)   // reminder after 4
    expect(phaseTwoVideoIndex(23)).toBe(8)   // reminder after 8
    expect(phaseTwoVideoIndex(32)).toBe(12)  // second context intro
    expect(phaseTwoVideoIndex(86)).toBe(35)  // last video
    expect(phaseTwoVideoIndex(87)).toBe(36)  // last rating
    expect(phaseTwoVideoIndex(88)).toBe(36)
  })
})
