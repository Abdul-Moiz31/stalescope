// Prefers the Web Crypto API (available as a global on the edge runtime
// and on Node 19+) so this works without a node:crypto import, which
// would break edge-runtime bundling of instrumentation.ts. Node 18 doesn't
// expose globalThis.crypto by default, so we fall back to a Math.random()
// based generator — these IDs only need to be unique within a single
// ring buffer, not cryptographically random.
export function randomUUID(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
