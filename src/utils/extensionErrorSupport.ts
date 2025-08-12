/**
 * Extension Error Support - Identifies browser extension errors
 * No mocks or simulations - just error classification
 */

interface ExtensionErrorPattern {
  pattern: RegExp
  description: string
  affectsApp: boolean
}

const EXTENSION_ERROR_PATTERNS: ExtensionErrorPattern[] = [
  {
    pattern: /localhost:5000\/api\/v2\/status.*ERR_CONNECTION_REFUSED/i,
    description: 'Plug wallet extension trying to connect to local daemon',
    affectsApp: false
  },
  {
    pattern: /Failed to fetch.*localhost:5000/i,
    description: 'Extension fetch failures to localhost',
    affectsApp: false
  },
  {
    pattern: /inpage\.js.*ERR_CONNECTION_REFUSED/i,
    description: 'Plug wallet inpage script connection errors', 
    affectsApp: false
  },
  {
    pattern: /ERR_BLOCKED_BY_CLIENT.*wallet|plug/i,
    description: 'Wallet extension blocked by browser security',
    affectsApp: true
  }
]

/**
 * Check if an error is from a browser extension
 */
export const isExtensionError = (error: any): ExtensionErrorPattern | null => {
  const errorMessage = String(error?.message || error || '').toLowerCase()
  const errorStack = String(error?.stack || '').toLowerCase()
  const searchText = `${errorMessage} ${errorStack}`
  
  for (const pattern of EXTENSION_ERROR_PATTERNS) {
    if (pattern.pattern.test(searchText)) {
      return pattern
    }
  }
  
  return null
}

/**
 * Check if an error affects application functionality
 */
export const doesErrorAffectApp = (error: any): boolean => {
  const extensionError = isExtensionError(error)
  return extensionError ? extensionError.affectsApp : true
}

/**
 * Get user-friendly message for extension errors
 */
export const getExtensionErrorMessage = (error: any): string | null => {
  const extensionError = isExtensionError(error)
  if (!extensionError) return null
  
  switch (true) {
    case extensionError.pattern.test('localhost:5000'):
      return 'Wallet extension internal service unavailable (this doesn\'t affect functionality)'
    case extensionError.pattern.test('blocked'):
      return 'Wallet connection blocked by browser security settings'
    default:
      return extensionError.description
  }
}


/**
 * Error boundary for extension errors
 */
export const handleExtensionError = (error: any): boolean => {
  const extensionError = isExtensionError(error)
  
  if (extensionError && !extensionError.affectsApp) {
    // Log minimal info for extension errors that don't affect the app
    if (import.meta.env.DEV) {
      console.debug('🔌 Extension error (non-critical):', extensionError.description)
    }
    return true // Error handled
  }
  
  return false // Let other error handlers deal with it
}

/**
 * Initialize extension error support - error classification only
 */
export const initializeExtensionErrorSupport = (): void => {
  try {
    // Add global error handler for unhandled extension errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (handleExtensionError(event.error)) {
          event.preventDefault()
          event.stopPropagation()
        }
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        if (handleExtensionError(event.reason)) {
          event.preventDefault()
        }
      })
    }
    
    console.debug('✅ Extension error support initialized')
  } catch (error) {
    console.warn('Failed to initialize extension error support:', error)
  }
}