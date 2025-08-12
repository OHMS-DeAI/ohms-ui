// Re-export everything from the real ESM entry via alias to ensure all named exports
export * from '@dfinity-agent-real'

// Provide a `compare` helper expected by @slide-computer/signer-agent
// Compare two Uint8Array buffers lexicographically
export function compare(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return a.length - b.length
}

// Re-export LookupStatus enum from certificate module for signer-agent
// Provide a compatible LookupStatus enum-like object used by signer-agent
export const LookupStatus = {
  Unknown: 'Unknown',
  Absent: 'Absent',
  Found: 'Found',
  Error: 'Error',
} as const

// Re-export helpers used by transports
export { SignIdentity, requestIdOf } from '@dfinity-agent-real'
// Implement minimal hex helpers compatible with signer-transport-stoic usage
export function toHex(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
export function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return out
}


