/**
 * /daten.html – the evaluators' download page.
 *
 * One password field, one button. The password goes to the Edge Function
 * `export-data` (supabase/functions/export-data), which holds the database
 * key and answers with the Excel workbook; this page only saves the file.
 * No Vue, no study code: the page must stay trivially simple.
 */
import './assets/daten.css'

const FUNCTION_URL = `${import.meta.env.VITE_API_BACKEND_URL}/functions/v1/export-data`
const ANON_KEY = import.meta.env.VITE_API_BACKEND_KEY as string

const form = document.getElementById('export-form') as HTMLFormElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const button = document.getElementById('download') as HTMLButtonElement
const status = document.getElementById('status') as HTMLParagraphElement

function show (message: string, kind: 'info' | 'error' | 'success') {
  status.textContent = message
  status.className = `status ${kind}`
}

/** Filename from the Content-Disposition header, with a dated fallback. */
export function filenameFrom (contentDisposition: string | null, today = new Date()): string {
  const match = /filename="?([^";]+)"?/.exec(contentDisposition ?? '')
  return match?.[1] ?? `schmerzbeurteilung_daten_${today.toISOString().slice(0, 10)}.xlsx`
}

async function download (password: string) {
  button.disabled = true
  show('Die Daten werden zusammengestellt, bitte einen Moment …', 'info')
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ password }),
    })
    if (!response.ok) {
      let message = `Der Download ist fehlgeschlagen (Fehler ${response.status}).`
      try {
        const body = await response.json()
        if (body?.error) message = body.error
      } catch { /* keep the generic message */ }
      show(message, 'error')
      return
    }
    const blob = await response.blob()
    const filename = filenameFrom(response.headers.get('Content-Disposition'))
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    show(`Die Datei „${filename}“ wurde heruntergeladen. Sie finden sie in Ihrem Download-Ordner.`, 'success')
  } catch (e) {
    console.error('export failed', e)
    show('Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.', 'error')
  } finally {
    button.disabled = false
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  const password = passwordInput.value.trim()
  if (!password) {
    show('Bitte geben Sie das Passwort ein.', 'error')
    return
  }
  void download(password)
})
