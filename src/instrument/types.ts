export type CacheLayer =
  | 'request-memo' // React.cache() / dedupeFetch within a single render
  | 'data-cache' // Next.js fetch() data cache (unstable_cache)
  | 'full-route' // Full route cache (prerendered pages)
  | 'router-cache' // Client-side router cache
  | 'bypass' // cache: 'no-store' / noStore()
  | 'unknown'

export type CacheStatus = 'HIT' | 'MISS' | 'SKIP' | 'REVALIDATE'

export interface CacheEvent {
  id: string // nanoid
  timestamp: number // Date.now()
  type: 'fetch' | 'revalidate-path' | 'revalidate-tag' | 'page-render'
  url: string // fetch URL or route path
  layer: CacheLayer
  status: CacheStatus
  tags?: string[] // cache tags if present
  ttl?: number // revalidate value in seconds
  duration?: number // how long the fetch took in ms
  size?: number // response body size in bytes
  // Memory tracking fields — directly relevant to the OOM issue
  heapUsed?: number // process.memoryUsage().heapUsed at time of event
  cached?: boolean // was this response stored in the fetch cache?
  requestId?: string // correlates events within the same request
}

export interface EventStore {
  push(event: CacheEvent): void
  getAll(): CacheEvent[]
  getRecent(n: number): CacheEvent[]
  getSince(timestamp: number): CacheEvent[]
  clear(): void
  size(): number
}

export interface StalescopeOptions {
  enabled?: boolean // default: process.env.NODE_ENV !== 'production'
  maxEvents?: number // ring buffer size, default 500
  store?: 'memory' | 'sqlite'
  dbPath?: string // SQLite db path if store === 'sqlite'
  mountPath?: string // dashboard URL, default '/__stalescope'
  trackMemory?: boolean // log heapUsed per event, default true
}
