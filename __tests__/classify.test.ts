import { describe, it, expect } from 'vitest'
import { classifyCacheLayer } from '../src/utils/classify'

describe('classifyCacheLayer', () => {
  it("returns 'bypass' for cache: 'no-store'", () => {
    const headers = new Headers()
    expect(classifyCacheLayer(headers, { cache: 'no-store' })).toBe('bypass')
  })

  it("returns 'bypass' for cache: 'no-cache'", () => {
    const headers = new Headers()
    expect(classifyCacheLayer(headers, { cache: 'no-cache' })).toBe('bypass')
  })

  it("returns 'data-cache' when x-nextjs-cache header present", () => {
    const headers = new Headers({ 'x-nextjs-cache': 'HIT' })
    expect(classifyCacheLayer(headers)).toBe('data-cache')
  })

  it("returns 'full-route' for content-type: text/x-component", () => {
    const headers = new Headers({ 'content-type': 'text/x-component' })
    expect(classifyCacheLayer(headers)).toBe('full-route')
  })

  it("returns 'data-cache' when next: { revalidate } in init", () => {
    const headers = new Headers()
    expect(classifyCacheLayer(headers, { next: { revalidate: 60 } } as RequestInit)).toBe(
      'data-cache'
    )
  })

  it("returns 'unknown' for plain responses with no signals", () => {
    const headers = new Headers()
    expect(classifyCacheLayer(headers)).toBe('unknown')
  })
})
