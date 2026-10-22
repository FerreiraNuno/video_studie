// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isFastMode, FAST_MEDIA_MS } from '../devFast'

function setSearch (search: string) {
  window.history.replaceState(null, '', `/${search}`)
}

describe('isFastMode', () => {
  beforeEach(() => {
    localStorage.clear()
    setSearch('')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('is off by default', () => {
    expect(isFastMode()).toBe(false)
  })

  it('is switched on with ?fast=1, remembered without the parameter, and switched off with ?fast=0', () => {
    setSearch('?fast=1')
    expect(isFastMode()).toBe(true)
    setSearch('')
    expect(isFastMode()).toBe(true)
    setSearch('?fast=0')
    expect(isFastMode()).toBe(false)
    setSearch('')
    expect(isFastMode()).toBe(false)
  })

  it('is never on outside a dev build, whatever the URL or storage say', () => {
    setSearch('?fast=1')
    localStorage.setItem('devFastMode', '1')
    vi.stubEnv('DEV', false)
    expect(isFastMode()).toBe(false)
  })

  it('cuts media to one second', () => {
    expect(FAST_MEDIA_MS).toBe(1000)
  })
})
