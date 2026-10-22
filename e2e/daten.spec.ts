/**
 * The evaluators' download page (/daten.html) against a faked Edge Function:
 * a wrong password shows the server's German message, the right one saves
 * the returned file under the server's filename.
 */
import { test, expect } from '@playwright/test'

const FUNCTION_URL = '**/supabase/functions/v1/export-data'
const PASSWORD = 'richtig'

test.beforeEach(async ({ page }) => {
  await page.route(FUNCTION_URL, async route => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 200, body: 'ok' })
    const body = request.postDataJSON() as { password?: string }
    if (body.password !== PASSWORD) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Das Passwort ist nicht richtig.' }) })
    }
    return route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="schmerzbeurteilung_daten_2026-10-23.xlsx"',
      },
      body: Buffer.from('PK\u0003\u0004fake-xlsx'),
    })
  })
  await page.goto('/daten.html')
})

test('shows the German error for a wrong password and keeps the form usable', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Datenexport' })).toBeVisible()
  await page.getByLabel('Passwort für die Auswertung').fill('falsch')
  await page.getByRole('button', { name: 'Daten als Excel herunterladen' }).click()
  await expect(page.getByRole('status')).toHaveText('Das Passwort ist nicht richtig.')
  await expect(page.getByRole('button', { name: 'Daten als Excel herunterladen' })).toBeEnabled()
})

test('downloads the workbook with the right password', async ({ page }) => {
  await page.getByLabel('Passwort für die Auswertung').fill(PASSWORD)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Daten als Excel herunterladen' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('schmerzbeurteilung_daten_2026-10-23.xlsx')
  await expect(page.getByRole('status')).toContainText('wurde heruntergeladen')
})

test('sends the password to the function, never a database key', async ({ page }) => {
  const sent: Array<Record<string, string>> = []
  page.on('request', request => {
    if (request.url().includes('/functions/v1/export-data')) sent.push(request.headers())
  })
  await page.getByLabel('Passwort für die Auswertung').fill(PASSWORD)
  await page.getByRole('button', { name: 'Daten als Excel herunterladen' }).click()
  await expect(page.getByRole('status')).toContainText('wurde heruntergeladen')
  expect(sent.length).toBeGreaterThan(0)
  for (const headers of sent) {
    expect(headers['apikey']).toBe('e2e-anon-key')          // the public anon key only
    expect(JSON.stringify(headers)).not.toContain('service')
  }
})
