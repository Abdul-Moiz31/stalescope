import { getStore } from '../index'
import { renderDashboard } from './ui'
import { createSSEStream } from './sse'

// Used in Next.js as a catch-all route handler:
//
//   app/__stalescope/[[...path]]/route.ts:
//     export { GET, DELETE } from 'stalescope/dashboard'
//
// Serves:
//   GET    /__stalescope              -> dashboard HTML
//   GET    /__stalescope/events       -> SSE stream (live feed)
//   GET    /__stalescope/api/events   -> last 100 events as JSON
//   DELETE /__stalescope/api/clear    -> clear the store
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname.endsWith('/events') && !pathname.includes('/api/')) {
    return createSSEStream(getStore())
  }

  if (pathname.includes('/api/events')) {
    const events = getStore().getRecent(100)
    return Response.json({ events, total: getStore().size() })
  }

  const html = renderDashboard()
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function DELETE(_request: Request): Promise<Response> {
  getStore().clear()
  return Response.json({ ok: true })
}
