import { MemoryStore } from './store/memory'
import { SqliteStore } from './store/sqlite'
import { patchFetch } from './instrument/fetch'
import { createTrackedRevalidatePath, createTrackedRevalidateTag } from './instrument/revalidate'
import type { StalescopeOptions, EventStore } from './instrument/types'

export type {
  CacheEvent,
  CacheLayer,
  CacheStatus,
  EventStore,
  StalescopeOptions,
} from './instrument/types'

export { createTrackedRevalidatePath, createTrackedRevalidateTag }
export { createDashboardHandler } from './dashboard/handler'

let _store: EventStore | null = null

export function getStore(): EventStore {
  if (!_store) throw new Error('stalescope: call withStalescope() first')
  return _store
}

// The main setup function — call once in instrumentation.ts
export function withStalescope(options: StalescopeOptions = {}): void {
  const {
    enabled = process.env.NODE_ENV !== 'production',
    maxEvents = 500,
    store = 'memory',
    dbPath,
    trackMemory = true,
  } = options

  if (!enabled) return

  _store =
    store === 'sqlite'
      ? new SqliteStore(dbPath ?? '.stalescope/events.sqlite', maxEvents)
      : new MemoryStore(maxEvents)
  patchFetch(_store, trackMemory)
}
