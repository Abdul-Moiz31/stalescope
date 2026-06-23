import type { EventStore } from '../instrument/types'
import { renderDashboardHtml } from './ui'
import { createSseResponse } from './sse'

export interface DashboardHandlerOptions {
  store: EventStore
  mountPath?: string
}

// Builds a single (req: Request) => Response handler that serves the
// dashboard HTML, the events JSON API, and the SSE live feed under one
// mount path. Wire it into a Next.js catch-all route handler:
//
//   app/__stalescope/[...path]/route.ts:
//     export const GET = createDashboardHandler({ store: getStore() })
export function createDashboardHandler(options: DashboardHandlerOptions) {
  const mountPath = options.mountPath ?? '/__stalescope'
  const { store } = options

  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const path = url.pathname

    if (path === `${mountPath}/api/live`) {
      return createSseResponse(store)
    }

    if (path === `${mountPath}/api/events`) {
      const since = url.searchParams.get('since')
      const events = since ? store.getSince(Number(since)) : store.getAll()
      return Response.json(events)
    }

    if (path === `${mountPath}/api/clear`) {
      store.clear()
      return Response.json({ ok: true })
    }

    return new Response(renderDashboardHtml(mountPath), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
