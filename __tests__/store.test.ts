import { describe, it, expect } from 'vitest'
import { MemoryStore } from '../src/store/memory'
import type { CacheEvent } from '../src/instrument/types'

function makeEvent(overrides: Partial<CacheEvent> = {}): CacheEvent {
  return {
    id: Math.random().toString(36),
    timestamp: Date.now(),
    type: 'fetch',
    url: 'https://example.com',
    layer: 'unknown',
    status: 'MISS',
    ...overrides,
  }
}

describe('MemoryStore', () => {
  it('push() adds events', () => {
    const store = new MemoryStore(10)
    store.push(makeEvent())
    expect(store.size()).toBe(1)
  })

  it('push() drops oldest when maxSize exceeded (ring buffer)', () => {
    const store = new MemoryStore(3)
    const events = [makeEvent({ id: 'a' }), makeEvent({ id: 'b' }), makeEvent({ id: 'c' }), makeEvent({ id: 'd' })]
    events.forEach((e) => store.push(e))
    expect(store.size()).toBe(3)
    expect(store.getAll().map((e) => e.id)).toEqual(['b', 'c', 'd'])
  })

  it('getRecent(n) returns last n events', () => {
    const store = new MemoryStore(10)
    ;['a', 'b', 'c', 'd'].forEach((id) => store.push(makeEvent({ id })))
    expect(store.getRecent(2).map((e) => e.id)).toEqual(['c', 'd'])
  })

  it('getSince(ts) returns only events after timestamp', () => {
    const store = new MemoryStore(10)
    store.push(makeEvent({ id: 'old', timestamp: 1000 }))
    store.push(makeEvent({ id: 'new', timestamp: 5000 }))
    expect(store.getSince(2000).map((e) => e.id)).toEqual(['new'])
  })

  it('clear() empties the store', () => {
    const store = new MemoryStore(10)
    store.push(makeEvent())
    store.clear()
    expect(store.size()).toBe(0)
  })

  it('size() returns current count', () => {
    const store = new MemoryStore(10)
    store.push(makeEvent())
    store.push(makeEvent())
    expect(store.size()).toBe(2)
  })
})
