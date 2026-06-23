import { randomUUID } from 'node:crypto'
import type { EventStore } from './types'

// We cannot directly patch next/cache exports because they are resolved
// at build time. Instead, expose wrapper functions that users call in
// place of the originals — documented in the README.
export function createTrackedRevalidatePath(
  originalFn: (path: string, type?: 'layout' | 'page') => void,
  store: EventStore
) {
  return function trackedRevalidatePath(path: string, type?: 'layout' | 'page'): void {
    store.push({
      id: randomUUID(),
      timestamp: Date.now(),
      type: 'revalidate-path',
      url: path,
      layer: 'data-cache',
      status: 'REVALIDATE',
    })
    originalFn(path, type)
  }
}

export function createTrackedRevalidateTag(
  originalFn: (tag: string) => void,
  store: EventStore
) {
  return function trackedRevalidateTag(tag: string): void {
    store.push({
      id: randomUUID(),
      timestamp: Date.now(),
      type: 'revalidate-tag',
      url: tag,
      layer: 'data-cache',
      status: 'REVALIDATE',
      tags: [tag],
    })
    originalFn(tag)
  }
}
