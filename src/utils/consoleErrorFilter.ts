/**
 * Console Error Filter - Direct suppression of extension console errors
 * No mocks, no fakes - just filters console output
 */

interface ErrorPattern {
  pattern: RegExp
  description: string
  severity: 'suppress' | 'log' | 'warn'
}

const EXTENSION_ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /localhost:5000\/api\/v2\/status.*ERR_CONNECTION_REFUSED/i,
    description: 'Plug wallet extension localhost connection failure',
    severity: 'suppress'
  },
  {
    pattern: /Failed to fetch.*localhost:5000/i,
    description: 'Extension fetch to localhost',
    severity: 'suppress'
  },
  {
    pattern: /inpage\.js.*ERR_CONNECTION_REFUSED/i,
    description: 'Plug wallet inpage script errors',
    severity: 'suppress'
  },
  {
    pattern: /GET.*localhost:5000.*net::ERR_CONNECTION_REFUSED/i,
    description: 'Network requests to localhost by extension',
    severity: 'suppress'
  }
]

class ConsoleErrorFilter {
  private static instance: ConsoleErrorFilter
  private originalError: typeof // Removed console log
  private originalWarn: typeof // Removed console log
  private suppressedCount = 0
  
  private constructor() {
    this.originalError = // Removed console log
    this.originalWarn = // Removed console log
  }
  
  static getInstance(): ConsoleErrorFilter {
    if (!ConsoleErrorFilter.instance) {
      ConsoleErrorFilter.instance = new ConsoleErrorFilter()
    }
    return ConsoleErrorFilter.instance
  }
  
  install(): void {
    // Removed console log
      if (this.shouldSuppressMessage(args)) {
        this.suppressedCount++
        return
      }
      this.originalError(...args)
    }
    
    // Removed console log
      if (this.shouldSuppressMessage(args)) {
        this.suppressedCount++
        return
      }
      this.originalWarn(...args)
    }
  }
  
  uninstall(): void {
    // Removed console log
    // Removed console log
  }
  
  private shouldSuppressMessage(args: any[]): boolean {
    const messageText = args.join(' ').toLowerCase()
    
    return EXTENSION_ERROR_PATTERNS.some(pattern => 
      pattern.severity === 'suppress' && pattern.pattern.test(messageText)
    )
  }
  
  getStats(): { suppressedCount: number } {
    return { suppressedCount: this.suppressedCount }
  }
}

/**
 * Install console error filtering for extension errors
 */
export const installConsoleErrorFilter = (): void => {
  if (typeof window !== 'undefined') {
    ConsoleErrorFilter.getInstance().install()
  }
}

/**
 * Uninstall console error filtering
 */
export const uninstallConsoleErrorFilter = (): void => {
  if (typeof window !== 'undefined') {
    ConsoleErrorFilter.getInstance().uninstall()
  }
}

/**
 * Check if an error message should be filtered
 */
export const isExtensionErrorMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase()
  return EXTENSION_ERROR_PATTERNS.some(pattern => 
    pattern.severity === 'suppress' && pattern.pattern.test(lowerMessage)
  )
}