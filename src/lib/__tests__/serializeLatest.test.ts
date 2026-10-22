import { describe, it, expect } from 'vitest'
import { serializeLatest } from '../serializeLatest'

function deferredWriter () {
  const calls: { value: number, resolve: (r: string) => void }[] = []
  const write = (value: number) => new Promise<string>(resolve => { calls.push({ value, resolve }) })
  return { calls, write }
}

describe('serializeLatest', () => {
  it('runs a single write immediately', async () => {
    const { calls, write } = deferredWriter()
    const save = serializeLatest(write)
    const p = save(1)
    expect(calls.map(c => c.value)).toEqual([1])
    calls[0].resolve('ok')
    expect(await p).toBe('ok')
  })

  it('starts the next write only after the previous one finished, keeping the newest value', async () => {
    const { calls, write } = deferredWriter()
    const save = serializeLatest(write)
    const p1 = save(1)
    const p2 = save(2)
    const p3 = save(3)
    expect(calls.map(c => c.value)).toEqual([1])

    calls[0].resolve('first')
    expect(await p1).toBe('first')
    await Promise.resolve()
    expect(calls.map(c => c.value)).toEqual([1, 3]) // 2 was superseded by 3

    calls[1].resolve('third')
    expect(await p2).toBe('third')
    expect(await p3).toBe('third')
  })

  it('continues after a rejected write', async () => {
    const { calls, write } = deferredWriter()
    const save = serializeLatest((v: number) => (v === 1 ? Promise.reject(new Error('boom')) : write(v)))
    const p1 = save(1).catch(e => e.message)
    const p2 = save(2)
    expect(await p1).toBe('boom')
    await Promise.resolve()
    expect(calls.map(c => c.value)).toEqual([2])
    calls[0].resolve('ok')
    expect(await p2).toBe('ok')
  })
})
