/**
 * Centralized network detection for OHMS UI
 * - Determines current network (local vs mainnet)
 * - Exposes the correct boundary node host for canister calls
 * - Honors environment overrides when provided
 */

const getRuntimeHostname = (): string | undefined => {
  if (typeof window === 'undefined') return undefined
  return window.location?.hostname
}

const isMainnetHostname = (hostname?: string): boolean => {
  if (!hostname) return false
  const h = hostname.toLowerCase()
  // Covers ic0.app, icp0.io and their raw subdomains
  return (
    h.endsWith('.ic0.app') ||
    h.endsWith('.icp0.io') ||
    h.endsWith('.raw.ic0.app') ||
    h.endsWith('.raw.icp0.io')
  )
}

/**
 * Resolve the active network.
 * Priority:
 * 1) Runtime host (served from canister domain -> ic)
 * 2) VITE_DFX_NETWORK or VITE_NETWORK envs
 * 3) Default to 'local'
 */
export const NETWORK: 'ic' | 'local' = (() => {
  const runtimeHost = getRuntimeHostname()
  if (isMainnetHostname(runtimeHost)) return 'ic'
  const envNetwork = (import.meta as any).env?.VITE_DFX_NETWORK || (import.meta as any).env?.VITE_NETWORK
  if (envNetwork === 'ic') return 'ic'
  return 'local'
})()

/**
 * Boundary host for the current network.
 * Allows override via VITE_HOST_OVERRIDE if needed.
 */
export const HOST: string = (() => {
  const override = (import.meta as any).env?.VITE_HOST_OVERRIDE as string | undefined
  if (override) return override
  return NETWORK === 'ic' ? 'https://ic0.app' : 'http://127.0.0.1:4943'
})()

export const IS_MAINNET = NETWORK === 'ic'
export const IS_LOCAL = NETWORK === 'local'

export type CanisterIds = {
  ohms_model: string
  ohms_agent: string
  ohms_coordinator: string
  ohms_econ: string
}

/**
 * Load canister IDs from environment.
 * For local dev: set in .env.local
 * For mainnet: set in .env.ic and build with it
 */
export const getCanisterIdsFromEnv = (): CanisterIds => {
  const env = (import.meta as any).env || {}
  return {
    ohms_model: env.VITE_OHMS_MODEL_CANISTER_ID || '',
    ohms_agent: env.VITE_OHMS_AGENT_CANISTER_ID || '',
    ohms_coordinator: env.VITE_OHMS_COORDINATOR_CANISTER_ID || '',
    ohms_econ: env.VITE_OHMS_ECON_CANISTER_ID || '',
  }
}


