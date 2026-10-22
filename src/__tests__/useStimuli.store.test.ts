import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStimuliStore } from '@/useStimuli.store'
import { validateTrialPlan, TrialPlanError, type TrialPlan } from '@/utils/trialPlan'
import { allVideos } from '@/utils/videoManager'
import { allPhotoFilenames } from '@/utils/photoManager'

/**
 * Regression tests for the double-initialization bug of the first
 * collection: the plan must stay balanced however often it is generated, a
 * restored plan is validated, and nothing survives a new store (= a new app
 * or test), because the catalog is never mutated.
 */
describe('useStimuliStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('stays balanced when a plan is generated repeatedly', () => {
    const store = useStimuliStore()
    expect(store.hasTrialPlan).toBe(false)
    expect(store.contextOrder).toEqual([])
    for (let i = 0; i < 50; i++) {
      const plan = store.generatePlan()
      expect(validateTrialPlan(plan, allVideos)).toEqual([])
      for (let idx = 0; idx < 36; idx++) expect(store.trial(idx)).toBe(plan.trials[idx])
      expect(store.contextOrder).toEqual(plan.contextOrder)
    }
    expect(store.hasTrialPlan).toBe(true)
  })

  it('restores a saved plan after validating it, and rejects an unbalanced one', () => {
    const store = useStimuliStore()
    const plan = store.generatePlan()
    const saved = JSON.parse(JSON.stringify(plan)) as TrialPlan
    expect(store.setPlan(saved)).toBe(saved)
    expect(store.trial(0).personId).toBe(plan.trials[0].personId)

    const corrupt = JSON.parse(JSON.stringify(plan)) as TrialPlan
    corrupt.trials[0].audioType = corrupt.trials[1].audioType === 'no_pain' ? 'slight_pain' : 'no_pain'
    corrupt.trials[1].audioType = corrupt.trials[0].audioType
    expect(() => store.setPlan(corrupt)).toThrow(TrialPlanError)
    expect(store.trialPlan).toBe(saved)   // the bad plan did not replace the good one
  })

  it('throws instead of showing a wrong stimulus when no plan or trial exists', () => {
    const store = useStimuliStore()
    expect(() => store.trial(0)).toThrow('Trial plan not initialized')
    store.generatePlan()
    expect(() => store.trial(36)).toThrow('No trial at index 36')
    expect(() => store.photo(0)).toThrow('No photo at index 0')
  })

  it('draws a photo order over the whole catalog, restores a saved one and rejects a partial one', () => {
    const store = useStimuliStore()
    const drawn = store.shufflePhotos()
    expect([...drawn].sort()).toEqual([...allPhotoFilenames].sort())
    expect(store.photoFilenames).toEqual(drawn)
    expect(store.photo(0).filename).toBe(drawn[0])

    const reversed = [...allPhotoFilenames].reverse()
    store.setPhotoOrder(reversed)
    expect(store.photoFilenames).toEqual(reversed)

    expect(() => store.setPhotoOrder(allPhotoFilenames.slice(0, 10))).toThrow('not a permutation')
    expect(() => store.setPhotoOrder([...allPhotoFilenames.slice(1), 'nobody.png'])).toThrow('Unknown photo')
  })

  it('keeps nothing across stores (one per app / test)', () => {
    useStimuliStore().generatePlan()
    setActivePinia(createPinia())
    expect(useStimuliStore().hasTrialPlan).toBe(false)
  })
})
