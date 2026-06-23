# stalescope

Next.js App Router cache inspector and live debug dashboard at `/__stalescope`.

"Why is my page showing old data?" is the most common App Router production
bug. Next.js has four cache layers — request memoization, the data cache,
the full route cache, and the router cache — and the only built-in debug
tool is the `NEXT_PRIVATE_DEBUG_CACHE` env var, which dumps unstructured
console logs. There is no structured inspector, no cache map, and no way to
see which layer served a given request.

stalescope patches `fetch` to classify and record every cache decision into
a bounded ring buffer, then serves a zero-dependency HTML dashboard so you
can watch cache hits, misses, and revalidations live.

## Install

```sh
npm install stalescope
```

## Usage

**Step 1** — call `withStalescope()` once, in `instrumentation.ts` at the
project root:

```ts
// instrumentation.ts
import { withStalescope } from 'stalescope'

export function register() {
  withStalescope({
    enabled: process.env.NODE_ENV !== 'production',
    maxEvents: 500,
  })
}
```

**Step 2** — create the dashboard route. Next.js treats any folder starting
with `_` as a private, non-routable segment, so the literal folder name
`__stalescope` would 404. Escape the underscores as `%5F` in the folder
name — this maps to the `/__stalescope` URL at request time:

```ts
// app/%5F%5Fstalescope/[[...path]]/route.ts
export { GET, DELETE } from 'stalescope/dashboard'
```

**Step 3** — visit `http://localhost:3000/__stalescope` to see live cache
events.

The route handler serves:

| Route                          | Description               |
| ------------------------------- | -------------------------- |
| `GET /__stalescope`             | dashboard HTML             |
| `GET /__stalescope/events`      | SSE stream (live feed)     |
| `GET /__stalescope/api/events`  | last 100 events as JSON    |
| `DELETE /__stalescope/api/clear`| clear the store            |

### Tracking revalidations

`revalidatePath` and `revalidateTag` are resolved at build time, so they
can't be patched directly. Wrap them instead:

```ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { createTrackedRevalidatePath, createTrackedRevalidateTag, getStore } from 'stalescope'

export const trackedRevalidatePath = createTrackedRevalidatePath(revalidatePath, getStore())
export const trackedRevalidateTag = createTrackedRevalidateTag(revalidateTag, getStore())
```

Use these wrappers in place of the originals to see revalidations show up
in the dashboard.

## Why this matters

The fetch cache in standalone mode has multiple open GitHub issues
documenting unbounded memory growth leading to OOM in Kubernetes, caused by
caching every unique header combination forever without eviction.
stalescope's event store is a fixed-size ring buffer and tracks
`heapUsed` per event, so you can correlate cache activity with memory
growth instead of guessing.

## Options

| Option        | Default                                  | Description                          |
| ------------- | ----------------------------------------- | ------------------------------------- |
| `enabled`     | `NODE_ENV !== 'production'`               | Turn instrumentation on/off           |
| `maxEvents`   | `500`                                      | Ring buffer size                      |
| `store`       | `'memory'`                                 | `'memory'` or `'sqlite'`              |
| `dbPath`      | `.stalescope/events.sqlite`                 | SQLite db path (if `store: 'sqlite'`) |
| `mountPath`   | `/__stalescope`                            | Dashboard URL                         |
| `trackMemory` | `true`                                     | Record `heapUsed` per event           |

## License

MIT
