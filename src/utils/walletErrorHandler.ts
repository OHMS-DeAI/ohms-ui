/**
 * Enhanced wallet error handling for browser compatibility issues
 * Addresses wallet connectivity problems in Brave and other browsers
 */

import { 
  isExtensionError, 
  getExtensionErrorMessage 
} from './extensionErrorSupport'

export interface WalletError {
  type: 'BLOCKED_REQUEST' | 'NETWORK_ERROR' | 'TIMEOUT' | 'EXTENSION_ERROR' | 'UNKNOWN'
  message: string
  originalError?: any
  retryable: boolean
  affectsApp?: boolean
}

export interface RetryOptions {
  maxRetries: number
  delayMs: number
  backoff: boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: true
}

/**
 * Classifies errors from wallet operations
 */
export const classifyWalletError = (error: any): WalletError => {
  const errorMessage = error?.message?.toLowerCase() || String(error).toLowerCase()
  
  // Check for extension-specific errors first
  const extensionError = isExtensionError(error)
  if (extensionError) {
    const friendlyMessage = getExtensionErrorMessage(error)
    return {
      type: 'EXTENSION_ERROR',
      message: friendlyMessage || extensionError.description,
      originalError: error,
      retryable: extensionError.affectsApp, // Only retry if it affects the app
      affectsApp: extensionError.affectsApp
    }
  }
  
  if (errorMessage.includes('blocked') || errorMessage.includes('err_blocked_by_client')) {
    return {
      type: 'BLOCKED_REQUEST',
      message: 'Request blocked by browser security features',
      originalError: error,
      retryable: true,
      affectsApp: true
    }
  }
  
  if (errorMessage.includes('failed to fetch') || errorMessage.includes('network error')) {
    return {
      type: 'NETWORK_ERROR', 
      message: 'Network connection failed',
      originalError: error,
      retryable: true,
      affectsApp: true
    }
  }
  
  if (errorMessage.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      message: 'Operation timed out',
      originalError: error,
      retryable: true,
      affectsApp: true
    }
  }
  
  return {
    type: 'UNKNOWN',
    message: errorMessage || 'Unknown wallet error',
    originalError: error,
    retryable: false,
    affectsApp: true
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Execute wallet operation with retry logic
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: WalletError | null = null
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const walletError = classifyWalletError(error)
      lastError = walletError
      
      // Don't retry non-retryable errors
      if (!walletError.retryable) {
        throw walletError
      }
      
      // Don't retry on final attempt
      if (attempt === config.maxRetries) {
        break
      }
      
      // Calculate delay with optional exponential backoff
      const delay = config.backoff 
        ? config.delayMs * Math.pow(2, attempt)
        : config.delayMs
        
      console.log(`🔄 Wallet operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`)
      console.log(`   Error: ${walletError.message}`)
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Enhanced Plug wallet connection with error handling
 */
// Removed Plug-specific connect helper; handled by IdentityKit

/**
 * Enhanced principal retrieval with error handling
 */
// Removed Plug-specific principal helper; IdentityKit provides identity

/**
 * Enhanced connection status check with error handling
 */
// Removed Plug-specific connection check; IdentityKit provides state

/**
 * Get user-friendly error message for display
 */
export const getUserFriendlyErrorMessage = (error: WalletError): string => {
  switch (error.type) {
    case 'BLOCKED_REQUEST':
      return 'Browser security settings are blocking wallet connection. Try disabling ad blockers or using a different browser.'
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection and try again.'
    case 'TIMEOUT':
      return 'Connection timed out. Please try again.'
    case 'EXTENSION_ERROR':
      // For extension errors that don't affect the app, provide a gentler message
      if (!error.affectsApp) {
        return 'Wallet extension background service unavailable (wallet functionality is not affected).'
      }
      return error.message
    default:
      return error.message
  }
}

/**
 * Detect if running in Brave browser
 */
export const isBraveBrowser = (): boolean => {
  return !!(navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function'
}

/**
 * Get browser-specific guidance for wallet issues
 */
export const getBrowserGuidance = (): string => {
  if (isBraveBrowser()) {
    return 'Brave Browser detected. Consider disabling Shields for this site (click the shield icon in address bar) or enabling third-party cookies in Privacy settings.'
  }
  
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('chrome')) {
    return 'Chrome detected. Ensure third-party cookies are enabled and no extensions are blocking wallet connections.'
  }
  
  if (userAgent.includes('firefox')) {
    return 'Firefox detected. Check that Enhanced Tracking Protection is not blocking wallet connections.'
  }
  
  return 'Consider disabling ad blockers, enabling third-party cookies, or trying a different browser if wallet connection issues persist.'
}