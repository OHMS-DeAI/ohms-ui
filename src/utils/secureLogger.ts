/**
 * Secure Logger Utility
 * Provides secure logging that prevents sensitive data leaks in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  enableConsoleInDev: boolean
  enableConsoleInProd: boolean
  sensitiveDataPatterns: RegExp[]
  maxLogLength: number
}

const DEFAULT_CONFIG: LogConfig = {
  enableConsoleInDev: true,
  enableConsoleInProd: false,
  sensitiveDataPatterns: [
    /principal/i,
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /email/i,
    /phone/i,
    /address/i,
    /id:[a-zA-Z0-9-_]+/g,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email pattern
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g // UUID pattern
  ],
  maxLogLength: 500
}

class SecureLogger {
  private config: LogConfig
  private isDevelopment: boolean

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.isDevelopment = import.meta.env.MODE === 'development'
  }

  private sanitizeMessage(message: any): string {
    if (typeof message === 'object') {
      try {
        message = JSON.stringify(message, this.sensitiveDataReplacer)
      } catch {
        message = '[Object - could not serialize safely]'
      }
    }

    let sanitized = String(message)

    // Remove sensitive data patterns
    this.config.sensitiveDataPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    // Truncate if too long
    if (sanitized.length > this.config.maxLogLength) {
      sanitized = sanitized.substring(0, this.config.maxLogLength) + '[TRUNCATED]'
    }

    return sanitized
  }

  private sensitiveDataReplacer(key: string, value: any): any {
    const sensitiveKeys = [
      'principal', 'password', 'token', 'secret', 'key', 'auth',
      'email', 'phone', 'address', 'id', 'googleAccount', 'profile'
    ]
    
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      return '[REDACTED]'
    }
    
    return value
  }

  private shouldLog(): boolean {
    return this.isDevelopment ? 
      this.config.enableConsoleInDev : 
      this.config.enableConsoleInProd
  }

  private formatLogMessage(level: LogLevel, message: any, context?: any): string {
    const timestamp = new Date().toISOString()
    const sanitizedMessage = this.sanitizeMessage(message)
    const sanitizedContext = context ? this.sanitizeMessage(context) : ''
    
    return `[${timestamp}] [${level.toUpperCase()}] ${sanitizedMessage}${sanitizedContext ? ' | Context: ' + sanitizedContext : ''}`
  }

  debug(message: any, context?: any): void {
    if (this.shouldLog()) {
      // Removed console log
    }
  }

  info(message: any, context?: any): void {
    if (this.shouldLog()) {
      // Removed console log
    }
  }

  warn(message: any, context?: any): void {
    if (this.shouldLog()) {
      // Removed console log
    }
  }

  error(message: any, context?: any): void {
    if (this.shouldLog()) {
      // Removed console log
    }
  }

  // Safe logging methods that always sanitize
  safeLog(message: any, context?: any): void {
    if (this.isDevelopment) {
      this.info(`SAFE: ${message}`, context)
    }
  }

  // Production-safe error logging
  prodError(message: string, errorCode?: string): void {
    if (this.config.enableConsoleInProd || this.isDevelopment) {
      const safeMessage = errorCode ? 
        `Error ${errorCode}: ${this.sanitizeMessage(message)}` : 
        this.sanitizeMessage(message)
      // Removed console log
    }
  }
}

// Global secure logger instance
export const secureLogger = new SecureLogger()

// Utility function to disable all console logging in production
export const disableProductionLogging = (): void => {
  if (import.meta.env.PROD) {
    const noop = () => {}
    // Removed console log
    // Removed console log
    // Removed console log
    // Removed console log
    // Keep // Removed console log
    const originalError = // Removed console log
    // Removed console log
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'string' ? 
          arg.replace(/principal[a-zA-Z0-9-_]*/gi, '[PRINCIPAL-REDACTED]')
             .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]') :
          '[REDACTED]'
      )
      originalError('[PROD-ERROR]', ...sanitizedArgs)
    }
  }
}

// Initialize production logging security
if (import.meta.env.PROD) {
  disableProductionLogging()
}

export default secureLogger