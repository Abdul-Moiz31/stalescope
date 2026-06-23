# stalescope

Next.js App Router cache inspector. Drop it in, visit /__stalescope,
see exactly which cache layer served every request — live.

## Why

Next.js has four separate cache layers. The only built-in debug tool
is NEXT_PRIVATE_DEBUG_CACHE — a raw env var dumping unstructured
console logs. When your page shows stale data, you have no structured
way to see which layer is responsible.

stalescope instruments your fetch calls and revalidations, stores
the events in a ring buffer, and renders a live dashboard inside
your own app.

## Install

```bash
npm install stalescope
```

## Setup (two files)

**instrumentation.ts** (project root):
```typescript
import { withStalescope } from 'stalescope'
withStalescope()
```

**app/%5F%5Fstalescope/[[...path]]/route.ts**:
```typescript
export { GET, DELETE } from 'stalescope/dashboard'
```

> Next.js treats folders starting with `_` as private, non-routable
> segments — `%5F` is the URL-encoded underscore, and this folder name
> maps to the `/__stalescope` URL at request time.

Visit http://localhost:3000/__stalescope — done.

## What you see

- Every fetch() call with status (HIT / MISS / REVALIDATE / SKIP),
  cache layer, duration, and URL
- Every revalidatePath and revalidateTag call
- Heap usage trend chart — helps correlate memory growth with
  specific fetch patterns (relevant to the known standalone mode
  memory leak in Next.js 14-16)
- Live SSE feed — updates without page refresh
- Filter by status, layer, or revalidation type

## Options

```typescript
withStalescope({
  enabled:      true,           // default: NODE_ENV !== 'production'
  maxEvents:    500,            // ring buffer size
  trackMemory:  true,           // log heapUsed per event
  mountPath:    '/__stalescope' // dashboard URL
})
```

## Security

Disable in production (the default). The dashboard exposes internal
cache state and heap metrics — not suitable for public exposure.

## Related issues

This package was built in response to these open Next.js issues:
- #90433 — Memory leak causing OOM in standalone + fetch
- #85914 — Memory leak Node 22 + fetch + output: standalone
- #75314 — Excessive caching causes memory leak
- #75686 — Memory leak in standalone mode via dedupeFetch
- #68636 — Possible memory leak in Fetch API
- #26801 — Memory leak in Kubernetes (5 years of reports)

## License

MIT
