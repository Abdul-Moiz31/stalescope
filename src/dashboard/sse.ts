import type { EventStore } from '../instrument/types'

const POLL_INTERVAL_MS = 500

// Pushes new cache events to the browser dashboard in real-time by
// polling the store on an interval rather than wiring up a pub/sub
// system — keeps the store decoupled from any notion of subscribers,
// which matters since the ring buffer must stay cheap on the hot
// fetch path.
export function createSSEStream(store: EventStore): Response {
  let lastTimestamp = Date.now()
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const interval = setInterval(() => {
        if (closed) {
          clearInterval(interval)
          return
        }
        const newEvents = store.getSince(lastTimestamp)
        if (newEvents.length > 0) {
          lastTimestamp = Date.now()
          const data = JSON.stringify(newEvents)
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
        }
      }, POLL_INTERVAL_MS)
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
