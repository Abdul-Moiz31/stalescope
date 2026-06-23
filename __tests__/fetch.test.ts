import { describe, it, expect, beforeEach, vi } from 'vitest'
import { patchFetch, __resetPatchGuardForTests } from '../src/instrument/fetch'
import { MemoryStore } from '../src/store/memory'

function mockResponse(headers: Record<string, string> = {}, ok = true): Response {
  return new Response('{}', { status: ok ? 200 : 500, headers })
}

describe('patchFetch', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    __resetPatchGuardForTests()
  })

  it('wraps globalThis.fetch', () => {
    const store = new MemoryStore()
    const before = globalThis.fetch
    patchFetch(store, false)
    expect(globalThis.fetch).not.toBe(before)
    globalThis.fetch = originalFetch
  })

  it('pushes a CacheEvent to the store on a successful fetch', async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse())
    patchFetch(store, false)
    await globalThis.fetch('https://example.com')
    expect(store.size()).toBe(1)
    expect(store.getAll()[0].url).toBe('https://example.com')
    globalThis.fetch = originalFetch
  })

  it('pushes an event and re-throws when the fetch fails', async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'))
    patchFetch(store, false)
    await expect(globalThis.fetch('https://example.com')).rejects.toThrow('network down')
    expect(store.size()).toBe(1)
    expect(store.getAll()[0].status).toBe('MISS')
    globalThis.fetch = originalFetch
  })

  it("status is 'HIT' when x-nextjs-cache: HIT header present", async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse({ 'x-nextjs-cache': 'HIT' }))
    patchFetch(store, false)
    await globalThis.fetch('https://example.com')
    expect(store.getAll()[0].status).toBe('HIT')
    globalThis.fetch = originalFetch
  })

  it("status is 'SKIP' when cache: 'no-store' in init", async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse())
    patchFetch(store, false)
    await globalThis.fetch('https://example.com', { cache: 'no-store' })
    expect(store.getAll()[0].status).toBe('SKIP')
    globalThis.fetch = originalFetch
  })

  it("status is 'REVALIDATE' when x-nextjs-cache: STALE", async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse({ 'x-nextjs-cache': 'STALE' }))
    patchFetch(store, false)
    await globalThis.fetch('https://example.com')
    expect(store.getAll()[0].status).toBe('REVALIDATE')
    globalThis.fetch = originalFetch
  })

  it('heapUsed is populated when trackMemory is true', async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse())
    patchFetch(store, true)
    await globalThis.fetch('https://example.com')
    expect(store.getAll()[0].heapUsed).toBeTypeOf('number')
    globalThis.fetch = originalFetch
  })

  it('heapUsed is undefined when trackMemory is false', async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse())
    patchFetch(store, false)
    await globalThis.fetch('https://example.com')
    expect(store.getAll()[0].heapUsed).toBeUndefined()
    globalThis.fetch = originalFetch
  })

  it('calling patchFetch twice does not double-wrap', async () => {
    const store = new MemoryStore()
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse())
    patchFetch(store, false)
    const wrapped = globalThis.fetch
    patchFetch(store, false)
    expect(globalThis.fetch).toBe(wrapped)
    globalThis.fetch = originalFetch
  })
})
