import type { CacheEvent, EventStore } from '../instrument/types'

const POLL_INTERVAL_MS = 1000

// SSE endpoint for the live feed. Polls the store on an interval rather
// than pushing on every store.push() call — keeps the store decoupled
// from any notion of subscribers, which matters since the ring buffer
// must stay cheap on the hot fetch path.
export function createSseResponse(store: EventStore): Response {
  let lastSeen = Date.now()
  let interval: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: CacheEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      interval = setInterval(() => {
        const events = store.getSince(lastSeen)
        lastSeen = Date.now()
        for (const event of events) send(event)
      }, POLL_INTERVAL_MS)

      controller.enqueue(encoder.encode(': connected\n\n'))
    },
    cancel() {
      clearInterval(interval)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
