/**
 * Dev-only fast mode for clicking through the study by hand.
 *
 * On the dev server, open the app with `?fast=1` once: every media step
 * (context instruction, trial instruction audio, video + self-report, photo
 * display) then ends after FAST_MEDIA_MS instead of when the file ends, and
 * a badge marks the session. `?fast=0` turns it off again. The choice is
 * kept in localStorage so it survives reloads and re-logins.
 *
 * `import.meta.env.DEV` is a build-time constant, so in the production
 * bundle every `isFastMode()` call is `false` and the branches are removed.
 * Trials ended this way are stored with the end reason `dev_fast`, so they
 * can never be mistaken for real data.
 */
export const FAST_MEDIA_MS = 1000

const STORAGE_KEY = 'devFastMode'

export function isFastMode (): boolean {
  if (!import.meta.env.DEV) return false
  try {
    const flag = new URLSearchParams(window.location.search).get('fast')
    if (flag !== null) {
      if (flag === '0' || flag === 'false' || flag === 'off') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, '1')
    }
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
