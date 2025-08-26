/**
 * Comprehensive Error Handling Utilities for OHMS 2.0
 * 
 * Provides centralized error handling, logging, and user feedback
 * with security-conscious error message sanitization.
 */

// Error types and categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  NETWORK = 'network',
  VALIDATION = 'validation',
  MARKET_DATA = 'market_data',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  action?: string
  component?: string
  additionalData?: Record<string, any>
}

export interface ProcessedError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  userMessage: string
  technicalMessage: string
  timestamp: Date
  context: ErrorContext
  recoverable: boolean
  retryable: boolean
  suggestions: string[]
}

// Custom error classes for different categories
export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class PaymentError extends Error {
  constructor(message: string, public code?: string, public retryable: boolean = false) {
    super(message)
    this.name = 'PaymentError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public retryable: boolean = true) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class MarketDataError extends Error {
  constructor(message: string, public source?: string, public retryable: boolean = true) {
    super(message)
    this.name = 'MarketDataError'
  }
}

class ErrorHandler {
  private errorHistory: ProcessedError[] = []
  private readonly maxHistorySize = 50

  /**
   * Process and handle any error with appropriate categorization and user messaging
   */
  public handleError(
    error: Error | unknown,
    context: ErrorContext = {},
    customUserMessage?: string
  ): ProcessedError {
    const processedError = this.processError(error, context, customUserMessage)
    
    // Log the error
    this.logError(processedError)
    
    // Store in history
    this.addToHistory(processedError)
    
    // Report if critical
    if (processedError.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(processedError)
    }
    
    return processedError
  }

  /**
   * Process raw error into structured format
   */
  private processError(
    error: Error | unknown,
    context: ErrorContext,
    customUserMessage?: string
  ): ProcessedError {
    const id = this.generateErrorId()
    const timestamp = new Date()
    
    // Handle different error types
    if (error instanceof AuthenticationError) {
      return this.processAuthenticationError(error, context, id, timestamp, customUserMessage)
    } else if (error instanceof PaymentError) {
      return this.processPaymentError(error, context, id, timestamp, customUserMessage)
    } else if (error instanceof NetworkError) {
      return this.processNetworkError(error, context, id, timestamp, customUserMessage)
    } else if (error instanceof ValidationError) {
      return this.processValidationError(error, context, id, timestamp, customUserMessage)
    } else if (error instanceof MarketDataError) {
      return this.processMarketDataError(error, context, id, timestamp, customUserMessage)
    } else {
      return this.processGenericError(error, context, id, timestamp, customUserMessage)
    }
  }

  private processAuthenticationError(
    error: AuthenticationError,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const userMessages = {
      'session_expired': 'Your session has expired. Please log in again.',
      'invalid_credentials': 'Authentication failed. Please check your credentials.',
      'google_oauth_failed': 'Google authentication failed. Please try again.',
      'principal_invalid': 'Authentication error. Please contact support.',
      'ii_service_unavailable': 'Authentication service is temporarily unavailable.'
    }

    const defaultMessage = 'Authentication failed. Please try logging in again.'
    const userMessage = customUserMessage || userMessages[error.code || ''] || defaultMessage

    return {
      id,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(error.message),
      timestamp,
      context,
      recoverable: true,
      retryable: true,
      suggestions: [
        'Try logging in again',
        'Clear your browser cache and cookies',
        'Check your internet connection',
        'Contact support if the problem persists'
      ]
    }
  }

  private processPaymentError(
    error: PaymentError,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const userMessages = {
      'card_declined': 'Your payment was declined. Please check your card details or try a different card.',
      'insufficient_funds': 'Payment failed due to insufficient funds.',
      'expired_card': 'Your card has expired. Please use a different payment method.',
      'invalid_cvc': 'Invalid security code. Please check your card details.',
      'stripe_error': 'Payment processing error. Please try again.',
      'conversion_failed': 'Currency conversion failed. Please try again later.',
      'subscription_exists': 'You already have an active subscription.'
    }

    const defaultMessage = 'Payment failed. Please check your payment details and try again.'
    const userMessage = customUserMessage || userMessages[error.code || ''] || defaultMessage

    return {
      id,
      category: ErrorCategory.PAYMENT,
      severity: ErrorSeverity.HIGH,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(error.message),
      timestamp,
      context,
      recoverable: true,
      retryable: error.retryable,
      suggestions: error.retryable ? [
        'Try again in a few moments',
        'Check your payment method details',
        'Contact your bank if the problem persists',
        'Try a different payment method'
      ] : [
        'Check your payment method details',
        'Contact your bank',
        'Try a different payment method',
        'Contact support for assistance'
      ]
    }
  }

  private processNetworkError(
    error: NetworkError,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const severity = error.status === 429 ? ErrorSeverity.MEDIUM : 
                    error.status && error.status >= 500 ? ErrorSeverity.HIGH : 
                    ErrorSeverity.MEDIUM

    const userMessages = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You do not have permission for this action.',
      404: 'Service not found. Please contact support.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. We are working to fix this issue.',
      503: 'Service temporarily unavailable. Please try again later.'
    }

    const defaultMessage = 'Network error. Please check your connection and try again.'
    const userMessage = customUserMessage || 
                       (error.status ? userMessages[error.status] : undefined) || 
                       defaultMessage

    return {
      id,
      category: ErrorCategory.NETWORK,
      severity,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(error.message),
      timestamp,
      context,
      recoverable: true,
      retryable: error.retryable,
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a few moments and try again',
        'Contact support if the problem persists'
      ]
    }
  }

  private processValidationError(
    error: ValidationError,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const userMessage = customUserMessage || 
                       `Please check your ${error.field || 'input'} and try again.`

    return {
      id,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(error.message),
      timestamp,
      context,
      recoverable: true,
      retryable: true,
      suggestions: [
        `Correct the ${error.field || 'input'} field`,
        'Check for any missing required information',
        'Ensure all fields are properly formatted'
      ]
    }
  }

  private processMarketDataError(
    error: MarketDataError,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const userMessage = customUserMessage || 
                       'Market data is temporarily unavailable. Showing cached prices.'

    return {
      id,
      category: ErrorCategory.MARKET_DATA,
      severity: ErrorSeverity.MEDIUM,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(error.message),
      timestamp,
      context,
      recoverable: true,
      retryable: error.retryable,
      suggestions: [
        'Try refreshing the market data',
        'Check again in a few moments',
        'Cached prices may be shown temporarily'
      ]
    }
  }

  private processGenericError(
    error: Error | unknown,
    context: ErrorContext,
    id: string,
    timestamp: Date,
    customUserMessage?: string
  ): ProcessedError {
    const message = error instanceof Error ? error.message : String(error)
    const userMessage = customUserMessage || 'An unexpected error occurred. Please try again.'

    return {
      id,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      userMessage,
      technicalMessage: this.sanitizeErrorMessage(message),
      timestamp,
      context,
      recoverable: true,
      retryable: true,
      suggestions: [
        'Try refreshing the page',
        'Wait a moment and try again',
        'Contact support if the problem persists'
      ]
    }
  }

  /**
   * Sanitize error messages to remove sensitive information
   */
  private sanitizeErrorMessage(message: string): string {
    return message
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Remove potential tokens or keys
      .replace(/\b(?:token|key|secret|password|auth)\s*[:=]\s*\S+/gi, '[REDACTED]')
      // Remove long alphanumeric strings that might be tokens
      .replace(/\b[a-z0-9]{20,}\b/gi, '[TOKEN]')
      // Remove Stripe IDs
      .replace(/\b(?:pk_|sk_|pi_|cus_|sub_)[a-zA-Z0-9]+/g, '[STRIPE_ID]')
      // Remove IC principals
      .replace(/\b[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}\b/g, '[PRINCIPAL]')
      // Remove URLs with query parameters
      .replace(/https?:\/\/[^\s]+\?[^\s]+/g, '[URL_WITH_PARAMS]')
      // Remove file paths
      .replace(/\/[^\s]*\/[^\s]*/g, '[FILE_PATH]')
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: ProcessedError): void {
    const logData = {
      id: error.id,
      category: error.category,
      severity: error.severity,
      message: error.technicalMessage,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        // Removed console log
        break
      case ErrorSeverity.HIGH:
        // Removed console log
        break
      case ErrorSeverity.MEDIUM:
        // Removed console log
        break
      case ErrorSeverity.LOW:
        // Removed console log
        break
    }
  }

  /**
   * Add error to history for analysis
   */
  private addToHistory(error: ProcessedError): void {
    this.errorHistory.unshift(error)
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }

    // Store in localStorage for persistence (sanitized)
    try {
      const sanitizedHistory = this.errorHistory.map(e => ({
        id: e.id,
        category: e.category,
        severity: e.severity,
        timestamp: e.timestamp.toISOString(),
        userMessage: e.userMessage
      }))
      
      localStorage.setItem('ohms_error_history', JSON.stringify(sanitizedHistory.slice(0, 10)))
    } catch (storageError) {
      // Removed console log
    }
  }

  /**
   * Report critical errors to monitoring service
   */
  private async reportCriticalError(error: ProcessedError): Promise<void> {
    if (import.meta.env.PROD) {
      try {
        // In production, this would send to monitoring service
        const report = {
          errorId: error.id,
          category: error.category,
          severity: error.severity,
          message: error.technicalMessage,
          timestamp: error.timestamp.toISOString(),
          context: error.context,
          userAgent: navigator.userAgent,
          url: window.location.href,
          buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
        }

        // Removed console log
        // TODO: Implement actual reporting to monitoring service
      } catch (reportingError) {
        // Removed console log
      }
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get error history for analysis
   */
  public getErrorHistory(): ProcessedError[] {
    return [...this.errorHistory]
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number
    byCategory: Record<ErrorCategory, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: number
  } {
    const stats = {
      total: this.errorHistory.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: 0
    }

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })

    // Count errors
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    this.errorHistory.forEach(error => {
      stats.byCategory[error.category]++
      stats.bySeverity[error.severity]++
      
      if (error.timestamp > oneHourAgo) {
        stats.recent++
      }
    })

    return stats
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = []
    try {
      localStorage.removeItem('ohms_error_history')
    } catch (storageError) {
      // Removed console log
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler()

// Convenience functions for common error scenarios
export function handleAuthenticationError(error: unknown, context?: ErrorContext): ProcessedError {
  return errorHandler.handleError(
    error instanceof Error ? new AuthenticationError(error.message) : new AuthenticationError(String(error)),
    context
  )
}

export function handlePaymentError(error: unknown, retryable: boolean = false, context?: ErrorContext): ProcessedError {
  return errorHandler.handleError(
    error instanceof Error ? new PaymentError(error.message, undefined, retryable) : new PaymentError(String(error), undefined, retryable),
    context
  )
}

export function handleNetworkError(error: unknown, status?: number, context?: ErrorContext): ProcessedError {
  return errorHandler.handleError(
    error instanceof Error ? new NetworkError(error.message, status) : new NetworkError(String(error), status),
    context
  )
}

export function handleValidationError(error: unknown, field?: string, context?: ErrorContext): ProcessedError {
  return errorHandler.handleError(
    error instanceof Error ? new ValidationError(error.message, field) : new ValidationError(String(error), field),
    context
  )
}

export function handleMarketDataError(error: unknown, source?: string, context?: ErrorContext): ProcessedError {
  return errorHandler.handleError(
    error instanceof Error ? new MarketDataError(error.message, source) : new MarketDataError(String(error), source),
    context
  )
}

// React hook for error handling in components
export function useErrorHandler() {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    handleAuthenticationError,
    handlePaymentError,
    handleNetworkError,
    handleValidationError,
    handleMarketDataError,
    getErrorHistory: errorHandler.getErrorHistory.bind(errorHandler),
    getErrorStats: errorHandler.getErrorStats.bind(errorHandler),
    clearHistory: errorHandler.clearHistory.bind(errorHandler)
  }
}