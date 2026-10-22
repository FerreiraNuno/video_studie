/**
 * Runs an async write one at a time, keeping only the most recent value.
 *
 * Used for the resume point (`progress`): every step upserts the row, and two
 * requests in flight at once – a retried write for step N and the write for
 * step N+1 – can reach the server in either order, leaving an older position
 * behind. With this wrapper a write starts only after the previous one
 * finished; values that arrive meanwhile collapse into the newest one, so a
 * slow or retrying request never delays the position by more than one write
 * and intermediate positions are skipped rather than queued.
 *
 * Callers whose value was superseded resolve with the result of the write
 * that replaced it.
 */
export function serializeLatest<T, R> (write: (value: T) => Promise<R>): (value: T) => Promise<R> {
  let inFlight: Promise<R> | null = null
  let next: { value: T, promise: Promise<R>, resolve: (r: R | PromiseLike<R>) => void } | null = null

  function run (value: T): Promise<R> {
    const promise = write(value).finally(() => {
      inFlight = null
      const queued = next
      next = null
      if (queued) queued.resolve(run(queued.value))
    })
    inFlight = promise
    return promise
  }

  return (value: T) => {
    if (!inFlight) return run(value)
    if (next) {
      next.value = value
      return next.promise
    }
    let resolve!: (r: R | PromiseLike<R>) => void
    const promise = new Promise<R>(res => { resolve = res })
    next = { value, promise, resolve }
    return promise
  }
}
