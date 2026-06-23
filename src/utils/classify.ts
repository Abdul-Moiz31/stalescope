import type { CacheLayer } from '../instrument/types'

// Next.js uses headers and the fetch init object to determine which cache
// layer served a response. We inspect both to classify — this is a best
// effort heuristic, since Next.js does not expose this directly.
export function classifyCacheLayer(headers: Headers, init?: RequestInit): CacheLayer {
  // Explicit bypass — developer used cache: 'no-store' or noStore()
  if (init?.cache === 'no-store') return 'bypass'
  if (init?.cache === 'no-cache') return 'bypass'

  // Next.js sets this header on responses served from its data cache
  const nextCache = headers.get('x-nextjs-cache')
  if (nextCache) return 'data-cache'

  // Content-type text/x-component indicates RSC payload (full route cache)
  const contentType = headers.get('content-type') ?? ''
  if (contentType.includes('text/x-component')) return 'full-route'

  // next.revalidate in the fetch init signals data cache with TTL
  if ((init as Record<string, unknown> | undefined)?.next) return 'data-cache'

  return 'unknown'
}
