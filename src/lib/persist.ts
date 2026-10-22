/**
 * Reliable, idempotent writes for study data.
 *
 * Background: in the first data collection single ratings went missing and
 * 96 participants lost all photo ratings, because every save was a plain
 * `insert` that was fired and forgotten – one failed request (network hiccup,
 * schema mismatch) silently dropped the row while the participant moved on.
 *
 * This module fixes the root cause:
 *   1. Write-ahead outbox: the row is stored in localStorage *before* the
 *      request is sent and removed only after the server confirmed it. A
 *      closed tab or a reload never loses data – the outbox is flushed on the
 *      next login / successful write / `online` event.
 *   2. Retries with exponential back-off for transient failures.
 *   3. Idempotency: every write is an `upsert` keyed on the row's natural key
 *      (e.g. participant_number + video_index), so a retry after a timed-out
 *      request that actually succeeded cannot create a duplicate. The matching
 *      unique indexes live in supabase/migrations/20261022_03_*.sql.
 */

export type Row = Record<string, unknown>

export interface WriteError {
  message: string
  code?: string
}

/** Performs one upsert. Resolves with `{ error: null }` on success. */
export type Writer = (table: string, row: Row, onConflict: string) => Promise<{ error: WriteError | null }>

export interface PendingWrite {
  table: string
  row: Row
  onConflict: string
  queuedAt: string
}

export interface KeyValueStorage {
  getItem (key: string): string | null
  setItem (key: string, value: string): void
  removeItem (key: string): void
}

export interface PersisterOptions {
  writer: Writer
  storage?: KeyValueStorage | null
  /** Back-off delays between attempts; attempts = delays.length + 1 */
  retryDelaysMs?: number[]
  sleep?: (ms: number) => Promise<void>
  log?: Pick<Console, 'warn' | 'error' | 'info'>
}

export interface PersistResult {
  error: WriteError | null
  /** true when the row could not be written yet and waits in the outbox */
  queued: boolean
}

const OUTBOX_PREFIX = 'studyOutbox:'
const DEFAULT_DELAYS_MS = [500, 1000, 2000, 4000, 8000]

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

function defaultStorage (): KeyValueStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const probe = `${OUTBOX_PREFIX}__probe`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return null
  }
}

/** Identity of a row within its table: the values of the conflict columns. */
export function rowKey (table: string, row: Row, onConflict: string): string {
  const keyValues = onConflict.split(',').map(column => String(row[column.trim()] ?? ''))
  return `${table}|${keyValues.join('|')}`
}

export function createPersister (options: PersisterOptions) {
  const writer = options.writer
  const storage = options.storage === undefined ? defaultStorage() : options.storage
  const delays = options.retryDelaysMs ?? DEFAULT_DELAYS_MS
  const sleep = options.sleep ?? defaultSleep
  const log = options.log ?? console

  const outboxKey = (participant: string) => `${OUTBOX_PREFIX}${participant}`

  function readOutbox (participant: string): PendingWrite[] {
    if (!storage) return []
    try {
      const raw = storage.getItem(outboxKey(participant))
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function writeOutbox (participant: string, pending: PendingWrite[]) {
    if (!storage) return
    try {
      if (pending.length === 0) storage.removeItem(outboxKey(participant))
      else storage.setItem(outboxKey(participant), JSON.stringify(pending))
    } catch (e) {
      log.warn('Outbox could not be written:', e)
    }
  }

  function enqueue (participant: string, entry: PendingWrite) {
    const key = rowKey(entry.table, entry.row, entry.onConflict)
    const rest = readOutbox(participant).filter(p => rowKey(p.table, p.row, p.onConflict) !== key)
    writeOutbox(participant, [...rest, entry])
  }

  function dequeue (participant: string, entry: PendingWrite) {
    const key = rowKey(entry.table, entry.row, entry.onConflict)
    writeOutbox(participant, readOutbox(participant).filter(p => rowKey(p.table, p.row, p.onConflict) !== key))
  }

  async function attemptWithRetries (entry: PendingWrite): Promise<WriteError | null> {
    let lastError: WriteError | null = null
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const { error } = await writer(entry.table, entry.row, entry.onConflict)
        if (!error) return null
        lastError = error
      } catch (e) {
        lastError = { message: e instanceof Error ? e.message : String(e) }
      }
      if (attempt < delays.length) {
        log.warn(`Write to ${entry.table} failed (attempt ${attempt + 1}/${delays.length + 1}): ${lastError.message} – retrying`)
        await sleep(delays[attempt])
      }
    }
    return lastError
  }

  /**
   * Persists `row` into `table`. The row is parked in the outbox first, the
   * write is retried on failure, and the entry leaves the outbox only once the
   * server confirmed it. Never throws.
   */
  async function persist (participant: string, table: string, row: Row, onConflict: string): Promise<PersistResult> {
    const entry: PendingWrite = { table, row, onConflict, queuedAt: new Date().toISOString() }
    enqueue(participant, entry)

    const error = await attemptWithRetries(entry)
    if (error) {
      log.error(`Write to ${table} failed after ${delays.length + 1} attempts, kept in outbox:`, error)
      return { error, queued: true }
    }

    dequeue(participant, entry)
    // A successful write means the connection works: drain older leftovers.
    void flush(participant)
    return { error: null, queued: false }
  }

  let flushing = false

  /** Tries once more to write every outbox entry of `participant`. Returns the number still pending. */
  async function flush (participant: string): Promise<number> {
    if (flushing) return readOutbox(participant).length
    flushing = true
    try {
      const pending = readOutbox(participant)
      for (const entry of pending) {
        try {
          const { error } = await writer(entry.table, entry.row, entry.onConflict)
          if (!error) {
            dequeue(participant, entry)
            log.info(`Outbox: recovered write to ${entry.table} queued at ${entry.queuedAt}`)
          }
        } catch {
          // stays in the outbox
        }
      }
      return readOutbox(participant).length
    } finally {
      flushing = false
    }
  }

  function pendingCount (participant: string): number {
    return readOutbox(participant).length
  }

  return { persist, flush, pendingCount, readOutbox }
}

export type Persister = ReturnType<typeof createPersister>
