/**
 * One participant completes the whole study in a real browser.
 *
 * Nothing in the app is changed for the test: media requests are answered
 * with sub-second fixtures (so the real <audio>/<video> elements fire real
 * `playing`/`ended` events, just quickly), photo display timers are skipped
 * with Playwright's clock, and Supabase is an in-memory PostgREST behind
 * request interception. The test then checks what the app sent: a valid
 * trial plan, 36 balanced video ratings, 36 photo ratings, final and
 * debrief answers, and the resume behaviour across reloads.
 */
import { test, expect, type Page } from '@playwright/test'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installFakePostgrest } from './fakePostgrest'
import { PHASE2_STEPS } from '../src/utils/phaseTwoSteps'
import { validateTrialPlan, type TrialPlan } from '../src/utils/trialPlan'
import { allVideos } from '../src/utils/videoManager'

const PARTICIPANT = '199'       // 1xx → CDM: the group with the extra action rating
const PASSWORD = 'klinPsych'    // the study password hard-coded in Login.vue
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

async function installMediaFixtures (page: Page) {
  await page.route(/\.(mp3)(\?.*)?$/, route => route.fulfill({ path: join(FIXTURES, 'short.mp3'), contentType: 'audio/mpeg' }))
  await page.route(/\.(mp4)(\?.*)?$/, route => route.fulfill({ path: join(FIXTURES, 'short.mp4'), contentType: 'video/mp4' }))
  await page.route(/\/photos\/.*\.png$/, route => route.fulfill({ path: join(FIXTURES, 'photo.png'), contentType: 'image/png' }))
}

async function login (page: Page) {
  await page.goto('/')
  await page.locator('#participantNumber').fill(PARTICIPANT)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log In' }).click()
}

const weiter = (page: Page) => page.getByRole('button', { name: 'Weiter' })

/** Answers `count` consecutive single-slider rating screens. */
async function rate (page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    const slider = page.locator('input[type=range]')
    await expect(slider).toHaveCount(1)
    await slider.click()
    await weiter(page).click()
  }
}

/** Answers one screen that shows several sliders at once. */
async function rateAll (page: Page, count: number) {
  const sliders = page.locator('input[type=range]')
  await expect(sliders).toHaveCount(count)
  for (let i = 0; i < count; i++) await sliders.nth(i).click()
  await weiter(page).click()
}

test('a participant completes the whole study, with reloads in phase 2 and 3', async ({ page }) => {
  const db = await installFakePostgrest(page)
  await installMediaFixtures(page)
  await page.clock.install()

  // --- login + phase 1 ----------------------------------------------------
  await login(page)
  await expect(page.getByText('Einverständniserklärung')).toBeVisible()
  const radios = page.locator('input[type=radio]')
  await radios.nth(0).check()                       // consent: ja
  await radios.nth(3).check()                       // VP-Stunden: nein
  await page.locator('select').nth(0).selectOption('weiblich')
  await page.locator('input[type=number]').fill('30')
  await page.locator('select').nth(1).selectOption('abitur')
  await page.locator('input[type=text]').first().fill('keine Angabe')
  await page.locator('select').nth(2).selectOption('auszubildende')
  await radios.nth(5).check()                       // chronische Schmerzen: nein
  await radios.nth(7).check()                       // privates Umfeld: nein
  await radios.nth(9).check()                       // berufliches Umfeld: nein
  await weiter(page).click()

  await expect(page.getByText('Nun beginnt der 2. Teil')).toBeVisible()
  expect(db.rows('form_data')).toHaveLength(1)
  const plans = db.rows('trial_plans')
  expect(plans).toHaveLength(1)
  const plan = plans[0].plan as TrialPlan
  expect(validateTrialPlan(plan, allVideos)).toEqual([])

  // --- phase 2: every step of the generated table, one reload at a rating ---
  const RELOAD_AT = PHASE2_STEPS.findIndex((s, i) => s.kind === 'rating' && i > 20)
  for (let i = 0; i < PHASE2_STEPS.length; i++) {
    const step = PHASE2_STEPS[i]
    switch (step.kind) {
      case 'intro':
        await rate(page, 3)
        break
      case 'audio_test':
      case 'video_test':
        await expect(weiter(page)).toBeDisabled()
        await page.locator('input[type=checkbox]').check()
        await weiter(page).click()
        break
      case 'start':
        await expect(page.getByText('Prima')).toBeVisible()
        await weiter(page).click()
        break
      case 'context':
        // the button unlocks when the (0.2 s) instruction audio has ended
        await expect(weiter(page)).toBeEnabled()
        await weiter(page).click()
        break
      case 'video':
        // instruction audio → video + self-report audio → rating; nothing to click
        break
      case 'rating': {
        if (i === RELOAD_AT) {
          // A reload during a rating resumes at the video before it: the
          // participant re-watches the stimulus and then rates it.
          await page.reload()
          await login(page)
        }
        await rate(page, 4)   // pain, credibility, difficulty, action (CDM)
        break
      }
    }
  }

  await expect(page.getByText('Nun folgt der 3. Teil')).toBeVisible()
  // Ratings are written in the background; the last one may still be in flight.
  await expect.poll(() => db.rows('video_ratings').length).toBe(36)
  const ratings = db.rows('video_ratings')
  for (const trial of plan.trials) {
    expect(ratings.find(r => r.video_index === trial.position)).toMatchObject({
      participant_number: PARTICIPANT,
      context: trial.context,
      video_type: trial.videoType,
      audio_type: trial.audioType,
      person_id: trial.personId,
      instruction_end_reason: 'ended',
      trial_end_reason: 'audio_ended',
    })
    expect(typeof ratings.find(r => r.video_index === trial.position)!.action_rating).toBe('number')
  }
  // The balance the study design requires: 2 trials per context × expression × self-report.
  const cells = new Map<string, number>()
  for (const r of ratings) {
    const key = `${r.context}|${r.video_type}|${r.audio_type}`
    cells.set(key, (cells.get(key) ?? 0) + 1)
  }
  expect(cells.size).toBe(18)
  expect([...cells.values()].every(n => n === 2)).toBe(true)

  // --- phase 3: 36 photos (3 s display skipped with the clock), reload once ---
  await weiter(page).click()
  for (let i = 0; i < 36; i++) {
    if (i === 10) {
      await page.reload()
      await login(page)
    }
    const photo = page.locator('img.photo')
    await expect(photo).toHaveJSProperty('complete', true)   // the 3 s display timer starts on `load`
    await page.clock.fastForward(3_100)
    await rateAll(page, 7)
  }

  await expect.poll(() => db.rows('photo_ratings').length).toBe(36)
  const photoRatings = db.rows('photo_ratings')
  expect(new Set(photoRatings.map(r => r.photo_filename)).size).toBe(36)
  expect(photoRatings.map(r => r.photo_index).sort((a, b) => Number(a) - Number(b))).toEqual([...Array(36).keys()].map(i => i + 1))

  // --- final questions ----------------------------------------------------
  await expect(page.getByText('abschließende Fragen')).toBeVisible()
  await rateAll(page, 4)
  await expect(page.getByText('Ärzt:in')).toBeVisible()   // CDM wording
  await rateAll(page, 3)
  await expect(weiter(page)).toBeDisabled()
  await page.locator('textarea').fill('Einfluss des Kontexts auf die Schmerzbeurteilung')
  await weiter(page).click()

  // --- debrief ------------------------------------------------------------
  await expect(page.getByText('Vielen Dank für Ihre Teilnahme an unserer Online-Studie')).toBeVisible()
  await weiter(page).click()
  const debrief = page.locator('input[type=radio]')
  await debrief.nth(0).check()   // aufgeklärt: ja
  await debrief.nth(2).check()   // Löschung: nein
  await debrief.nth(4).check()   // Stillschweigen: ja
  await page.getByRole('button', { name: 'Absenden' }).click()
  await expect(page.getByText('Die Studie ist nun beendet')).toBeVisible()

  await expect.poll(() => db.rows('final_ratings').length).toBe(1)
  await expect.poll(() => db.rows('ending_questions').length).toBe(1)
  await expect.poll(() => db.rows('progress')[0]?.phase).toBe(5)
  expect(db.rows('final_ratings')[0]).toMatchObject({ participant_number: PARTICIPANT, study_purpose: 'Einfluss des Kontexts auf die Schmerzbeurteilung' })
  expect(db.rows('ending_questions')[0]).toMatchObject({ is_informed: 'ja', wants_deletion: 'nein', agrees_silence: 'ja' })
  expect(db.rows('progress')[0]).toMatchObject({ participant_number: PARTICIPANT, phase: 5 })

  // Every write reached the fake API; the only non-2xx answers are the
  // refused duplicates of ratings re-submitted after the reloads.
  const failed = db.log.filter(e => e.status >= 400)
  expect(failed.every(e => e.status === 409 && (e.table === 'video_ratings' || e.table === 'photo_ratings'))).toBe(true)

  // --- a later login shows only the closing message -----------------------
  await page.reload()
  await login(page)
  await expect(page.getByText('Die Studie ist nun beendet')).toBeVisible()
  await expect(page.getByText('Abschließend möchten wir')).toHaveCount(0)
})
