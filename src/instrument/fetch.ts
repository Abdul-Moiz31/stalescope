import { randomUUID } from 'node:crypto'
import type { EventStore } from './types'
import { classifyCacheLayer } from '../utils/classify'

let patched = false

// Patches globalThis.fetch to intercept every call Next.js makes and
// classify which cache layer is serving the response by inspecting
// response headers. Idempotent — calling this more than once (e.g. from
// hot reload in dev) is a no-op after the first call.
export function patchFetch(store: EventStore, trackMemory: boolean): void {
  if (patched || typeof globalThis.fetch === 'undefined') return
  patched = true

  const originalFetch = globalThis.fetch

  globalThis.fetch = async function stalescoped_fetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const start = performance.now()
    const heapBefore = trackMemory ? process.memoryUsage().heapUsed : undefined

    let response: Response
    try {
      response = await originalFetch(input, init)
    } catch (err) {
      // Don't break the app — rethrow after logging
      store.push({
        id: randomUUID(),
        timestamp: Date.now(),
        type: 'fetch',
        url,
        layer: 'unknown',
        status: 'MISS',
        duration: Math.round(performance.now() - start),
        heapUsed: heapBefore,
        cached: false,
      })
      throw err
    }

    // Clone to allow body consumption — never consume the original
    const cloned = response.clone()
    const layer = classifyCacheLayer(response.headers, init)
    const duration = Math.round(performance.now() - start)

    // Next.js sets x-nextjs-cache: HIT | MISS | STALE | REVALIDATED
    const nextCacheHeader = response.headers.get('x-nextjs-cache')
    const status =
      nextCacheHeader === 'HIT'
        ? 'HIT'
        : nextCacheHeader === 'STALE'
          ? 'REVALIDATE'
          : nextCacheHeader === 'REVALIDATED'
            ? 'REVALIDATE'
            : init?.cache === 'no-store'
              ? 'SKIP'
              : 'MISS'

    // Estimate body size without consuming it
    const contentLength = response.headers.get('content-length')
    const size = contentLength ? parseInt(contentLength, 10) : undefined

    store.push({
      id: randomUUID(),
      timestamp: Date.now(),
      type: 'fetch',
      url,
      layer,
      status,
      duration,
      size,
      heapUsed: trackMemory ? process.memoryUsage().heapUsed : undefined,
      cached: status === 'HIT',
    })

    return cloned
  }
}

// Test-only escape hatch — resets the module-level patch guard so each
// test file can re-patch a fresh globalThis.fetch mock.
export function __resetPatchGuardForTests(): void {
  patched = false
}
