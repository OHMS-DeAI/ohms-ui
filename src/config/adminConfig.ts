/**
 * Admin Configuration for OHMS UI
 * Manages the allowlist of Principal IDs that have admin access
 * Supports environment-specific configuration (.env.local, .env.ic)
 */

import { NETWORK as RESOLVED_NETWORK } from './network'

// Network detection based on environment & runtime
const getCurrentNetwork = (): string => {
  return RESOLVED_NETWORK
}

// Normalize Principal ID for comparison
const normalizePrincipalId = (principalId: string): string => {
  return principalId
    .trim()
    .toLowerCase()
    .replace(/[\s'"]/g, '') // Remove spaces, quotes, and other whitespace
}

// Parse admin principals from environment variables
const parseAdminPrincipals = (envString: string): string[] => {
  if (!envString) return []
  
  // Handle both comma and space-separated lists
  const principals = envString
    .replace(/[\[\]'"]/g, '') // Remove brackets and quotes
    .split(/[,\s]+/) // Split by comma or whitespace
    .map(p => p.trim())
    .filter(Boolean)
    .filter(p => p.length > 10) // Filter out invalid short strings
  
  return principals
}

// Load admin principals from environment variables
const getAdminPrincipals = (): string[] => {
  const envAdmins = import.meta.env.VITE_ADMIN_PRINCIPALS
  const legacySysAdmins = import.meta.env.VITE_SYSADMINS
  
  let principals: string[] = []
  
  // First try the new VITE_ADMIN_PRINCIPALS
  if (envAdmins) {
    principals = parseAdminPrincipals(envAdmins)
  }
  
  // Fallback to legacy VITE_SYSADMINS if no admin principals found
  if (principals.length === 0 && legacySysAdmins) {
    principals = parseAdminPrincipals(legacySysAdmins)
  }
  
  return principals
}

// Admin allowlist - Principal IDs that have admin access
export const ADMIN_PRINCIPALS = getAdminPrincipals()
export const CURRENT_NETWORK = getCurrentNetwork()

/**
 * Check if a Principal ID has admin access
 * Uses robust comparison that handles various formatting
 */
export const isAdminPrincipal = (principalId: string): boolean => {
  if (!principalId) return false
  
  const normalizedInput = normalizePrincipalId(principalId)
  
  // Check against all admin principals
  const hasAccess = ADMIN_PRINCIPALS.some(adminPrincipal => {
    const normalizedAdmin = normalizePrincipalId(adminPrincipal)
    return normalizedAdmin === normalizedInput
  })
  
  if (import.meta.env.VITE_ADMIN_DEBUG === 'true') {
    console.log(`🔍 Admin Check Debug:`, {
      input: principalId,
      normalized: normalizedInput,
      adminList: ADMIN_PRINCIPALS,
      hasAccess,
      network: CURRENT_NETWORK
    })
  }
  
  return hasAccess
}

/**
 * Add a Principal ID to the admin allowlist (runtime addition)
 * Note: This only affects the current session, not persistent storage
 */
export const addAdminPrincipal = (principalId: string): boolean => {
  if (!principalId || !isValidPrincipalId(principalId)) {
    console.warn('Invalid Principal ID provided:', principalId)
    return false
  }
  
  if (isAdminPrincipal(principalId)) {
    console.log('Principal ID already has admin access:', principalId)
    return true
  }
  
  ADMIN_PRINCIPALS.push(principalId.trim())
  console.log('✅ Added admin access for:', principalId)
  return true
}

/**
 * Remove a Principal ID from the admin allowlist (runtime removal)
 * Note: This only affects the current session, not persistent storage
 */
export const removeAdminPrincipal = (principalId: string): boolean => {
  const normalizedPrincipal = normalizePrincipalId(principalId)
  const index = ADMIN_PRINCIPALS.findIndex(adminPrincipal => 
    normalizePrincipalId(adminPrincipal) === normalizedPrincipal
  )
  
  if (index > -1) {
    const removed = ADMIN_PRINCIPALS.splice(index, 1)
    console.log('❌ Removed admin access for:', removed[0])
    return true
  }
  
  console.warn('Principal ID not found in admin list:', principalId)
  return false
}

/**
 * Get the current list of admin principals
 */
export const getAdminPrincipalsList = (): readonly string[] => {
  return [...ADMIN_PRINCIPALS]
}

/**
 * Debug function to log admin configuration (only in development)
 */
export const debugAdminConfig = (): void => {
  if (import.meta.env.DEV || import.meta.env.VITE_ADMIN_DEBUG === 'true') {
    console.group('🔐 OHMS Admin Configuration')
    console.log('Current Network:', CURRENT_NETWORK)
    console.log('Admin Principals:', ADMIN_PRINCIPALS)
    console.log('VITE_ADMIN_PRINCIPALS:', import.meta.env.VITE_ADMIN_PRINCIPALS)
    console.log('VITE_SYSADMINS (legacy):', import.meta.env.VITE_SYSADMINS)
    console.log('Total Admin Count:', ADMIN_PRINCIPALS.length)
    console.log('Debug Mode:', import.meta.env.VITE_ADMIN_DEBUG)
    console.groupEnd()
  }
}

/**
 * Get detailed admin status for a specific Principal ID
 */
export const getAdminStatus = (principalId: string) => {
  const isAdmin = isAdminPrincipal(principalId)
  const normalizedInput = normalizePrincipalId(principalId)
  
  return {
    principalId,
    normalizedId: normalizedInput,
    isAdmin,
    network: CURRENT_NETWORK,
    adminCount: ADMIN_PRINCIPALS.length,
    matchedAdmin: ADMIN_PRINCIPALS.find(admin => 
      normalizePrincipalId(admin) === normalizedInput
    )
  }
}

/**
 * Validate Principal ID format (basic validation)
 */
export const isValidPrincipalId = (principalId: string): boolean => {
  if (!principalId) return false
  
  // Basic validation: should contain hyphens and be reasonably long
  const cleaned = principalId.trim()
  return cleaned.length >= 20 && cleaned.includes('-') && /^[a-z0-9\-]+$/i.test(cleaned)
}