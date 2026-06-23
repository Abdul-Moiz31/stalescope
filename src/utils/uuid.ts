// Uses the Web Crypto API instead of node:crypto so this works whether
// the consuming code is bundled for the Node.js or edge runtime.
export function randomUUID(): string {
  return globalThis.crypto.randomUUID()
}
