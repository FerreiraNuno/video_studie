import { describe, it, expect } from 'vitest'
import {
  phaseTwoResumePoint, phaseTwoVideoIndex, phaseThreeResumePoint, isPhaseTwoRatingStep, isPhaseTwoVideoStep,
  isValidPhotoOrder, PHASE2_CONTEXT_STARTS, PHASE2_LAST_STEP, PHASE3_FINAL_STEP,
} from '../resume'

describe('phase 2 steps', () => {
  it('classifies the 12 video and 12 rating steps of every context block', () => {
    for (const start of PHASE2_CONTEXT_STARTS) {
      const videos = [2, 4, 6, 8, 11, 13, 15, 17, 20, 22, 24, 26].map(o => start + o)
      const ratings = videos.map(v => v + 1)
      for (const v of videos) {
        expect(isPhaseTwoVideoStep(v)).toBe(true)
        expect(isPhaseTwoRatingStep(v)).toBe(false)
      }
      for (const r of ratings) {
        expect(isPhaseTwoRatingStep(r)).toBe(true)
        expect(isPhaseTwoVideoStep(r)).toBe(false)
      }
      // intro, scenario, reminders
      for (const other of [start, start + 1, start + 10, start + 19]) {
        expect(isPhaseTwoVideoStep(other)).toBe(false)
        expect(isPhaseTwoRatingStep(other)).toBe(false)
      }
    }
    for (const intro of [0, 1, 2, 3]) expect(isPhaseTwoRatingStep(intro)).toBe(false)
  })
})

describe('phaseTwoVideoIndex', () => {
  it('counts 12 videos per context block in presentation order', () => {
    for (const intro of [0, 1, 2, 3]) expect(phaseTwoVideoIndex(intro)).toBe(0)
    PHASE2_CONTEXT_STARTS.forEach((start, section) => {
      const base = section * 12
      expect(phaseTwoVideoIndex(start)).toBe(base)          // intro
      expect(phaseTwoVideoIndex(start + 1)).toBe(base)      // scenario
      const videos = [2, 4, 6, 8, 11, 13, 15, 17, 20, 22, 24, 26]
      videos.forEach((o, i) => expect(phaseTwoVideoIndex(start + o)).toBe(base + i))
      expect(phaseTwoVideoIndex(start + 10)).toBe(base + 4) // reminder after 4
      expect(phaseTwoVideoIndex(start + 19)).toBe(base + 8) // reminder after 8
    })
    expect(phaseTwoVideoIndex(PHASE2_LAST_STEP + 1)).toBe(36)
  })
})

describe('phaseTwoResumePoint', () => {
  it('starts from the beginning without a saved position or for another phase', () => {
    expect(phaseTwoResumePoint(null)).toEqual({ progressIndex: 0, videoIndex: 0 })
    expect(phaseTwoResumePoint({ phase: 3, progressIndex: 40, videoIndex: 10 })).toEqual({ progressIndex: 0, videoIndex: 0 })
  })

  it('resumes non-rating steps as saved', () => {
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 3, videoIndex: 0 })).toEqual({ progressIndex: 3, videoIndex: 0 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 32, videoIndex: 12 })).toEqual({ progressIndex: 32, videoIndex: 12 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 34, videoIndex: 12 })).toEqual({ progressIndex: 34, videoIndex: 12 })
  })

  it('rewinds a rating step to its video so the participant re-watches it', () => {
    // second context, first rating: video index was already incremented to 13
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 35, videoIndex: 13 })).toEqual({ progressIndex: 34, videoIndex: 12 })
    // very last rating of the phase
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 87, videoIndex: 36 })).toEqual({ progressIndex: 86, videoIndex: 35 })
  })

  it('derives the video index from the step, ignoring an inconsistent saved value', () => {
    // a saved videoIndex of 36 at a video step would make the video step throw
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 6, videoIndex: 36 })).toEqual({ progressIndex: 6, videoIndex: 0 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 10, videoIndex: 99 })).toEqual({ progressIndex: 10, videoIndex: 2 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 42 })).toEqual({ progressIndex: 42, videoIndex: 16 })
  })

  it('rejects out-of-range or malformed positions', () => {
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 88, videoIndex: 36 })).toEqual({ progressIndex: 0, videoIndex: 0 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: -1 })).toEqual({ progressIndex: 0, videoIndex: 0 })
    expect(phaseTwoResumePoint({ phase: 2, progressIndex: 1.5 })).toEqual({ progressIndex: 0, videoIndex: 0 })
  })
})

describe('phaseThreeResumePoint', () => {
  it('starts from the beginning without a saved position or for another phase', () => {
    expect(phaseThreeResumePoint(undefined)).toEqual({ progressIndex: 0, photoIndex: 0 })
    expect(phaseThreeResumePoint({ phase: 2, progressIndex: 5 })).toEqual({ progressIndex: 0, photoIndex: 0 })
  })

  it('resumes intro and photo steps as saved', () => {
    expect(phaseThreeResumePoint({ phase: 3, progressIndex: 0, photoIndex: 0 })).toEqual({ progressIndex: 0, photoIndex: 0 })
    expect(phaseThreeResumePoint({ phase: 3, progressIndex: 7, photoIndex: 3 })).toEqual({ progressIndex: 7, photoIndex: 3 })
  })

  it('rewinds a rating step to its photo', () => {
    expect(phaseThreeResumePoint({ phase: 3, progressIndex: 8, photoIndex: 3 })).toEqual({ progressIndex: 7, photoIndex: 3 })
  })

  it('resumes the final questions', () => {
    expect(phaseThreeResumePoint({ phase: 3, progressIndex: PHASE3_FINAL_STEP, photoIndex: 36 })).toEqual({ progressIndex: 72, photoIndex: 36 })
    expect(phaseThreeResumePoint({ phase: 3, progressIndex: 71, photoIndex: 36 })).toEqual({ progressIndex: 72, photoIndex: 36 })
  })
})

describe('isValidPhotoOrder', () => {
  const expected = ['a', 'b', 'c']
  it('accepts a permutation and rejects everything else', () => {
    expect(isValidPhotoOrder(['c', 'a', 'b'], expected)).toBe(true)
    expect(isValidPhotoOrder(['a', 'b'], expected)).toBe(false)
    expect(isValidPhotoOrder(['a', 'a', 'b'], expected)).toBe(false)
    expect(isValidPhotoOrder(['a', 'b', 'x'], expected)).toBe(false)
    expect(isValidPhotoOrder('abc', expected)).toBe(false)
    expect(isValidPhotoOrder(null, expected)).toBe(false)
  })
})
