import type { CacheEvent } from '../instrument/types'

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDuration(ms?: number): string {
  if (ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatHeap(bytes?: number): string {
  return formatBytes(bytes)
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString()
}

export function formatEventSummary(event: CacheEvent): string {
  const parts = [
    `[${event.status}]`,
    event.layer,
    event.url,
    formatDuration(event.duration),
  ]
  if (event.size !== undefined) parts.push(formatBytes(event.size))
  return parts.join(' ')
}
