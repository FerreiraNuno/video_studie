/**
 * `fetch` that gives up after `timeoutMs`.
 *
 * supabase-js sends every request without a timeout, so a stalled connection
 * (Wi-Fi hand-over, captive portal, dead TCP socket) left the participant on
 * "Loading…" or a disabled "Weiter" button for minutes with no feedback, and
 * the persister's retries never started because no error ever came back.
 * An aborted request rejects with an AbortError, which supabase-js turns into
 * a normal `{ error }` result → retried by the persister / shown by Login.
 */
export const REQUEST_TIMEOUT_MS = 20000

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export function createFetchWithTimeout (baseFetch: FetchLike, timeoutMs = REQUEST_TIMEOUT_MS): FetchLike {
  return (input, init) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, 'TimeoutError')), timeoutMs)
    const outer = init?.signal
    if (outer) {
      if (outer.aborted) controller.abort(outer.reason)
      else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true })
    }
    return baseFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
  }
}
