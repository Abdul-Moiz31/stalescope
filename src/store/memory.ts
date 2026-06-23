import type { CacheEvent, EventStore } from '../instrument/types'

// Fixed-size ring buffer. When full, oldest events are dropped — never
// grows unbounded, since unbounded growth is the exact OOM failure mode
// stalescope exists to surface.
export class MemoryStore implements EventStore {
  private events: CacheEvent[] = []
  private readonly maxSize: number

  constructor(maxSize = 500) {
    this.maxSize = maxSize
  }

  push(event: CacheEvent): void {
    if (this.events.length >= this.maxSize) {
      this.events.shift()
    }
    this.events.push(event)
  }

  getAll(): CacheEvent[] {
    return [...this.events]
  }

  getRecent(n: number): CacheEvent[] {
    return this.events.slice(-n)
  }

  getSince(timestamp: number): CacheEvent[] {
    return this.events.filter((e) => e.timestamp >= timestamp)
  }

  clear(): void {
    this.events = []
  }

  size(): number {
    return this.events.length
  }
}
