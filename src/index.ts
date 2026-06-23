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
export { GET, DELETE } from './dashboard/handler'

// instrumentation.ts and the app/__stalescope route handler are compiled
// by Next.js into separate bundles, each getting its own inlined copy of
// this module's code — a plain module-level variable would not be shared
// between them. globalThis is the one thing both copies actually share at
// runtime, so the store lives there instead (same trick Next.js itself
// uses for the Prisma client singleton across dev hot-reloads).
const GLOBAL_KEY = '__stalescope_store__'

function getGlobalStore(): EventStore | null {
  return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as EventStore | null ?? null
}

function setGlobalStore(store: EventStore): void {
  ;(globalThis as Record<string, unknown>)[GLOBAL_KEY] = store
}

export function getStore(): EventStore {
  const store = getGlobalStore()
  if (!store) throw new Error('stalescope: call withStalescope() first')
  return store
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

  const eventStore =
    store === 'sqlite'
      ? new SqliteStore(dbPath ?? '.stalescope/events.sqlite', maxEvents)
      : new MemoryStore(maxEvents)
  setGlobalStore(eventStore)
  patchFetch(eventStore, trackMemory)
}
