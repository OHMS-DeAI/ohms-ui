import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * Comprehensive Error Boundary for OHMS 2.0
 * 
 * Provides graceful error handling with:
 * - User-friendly error messages
 * - Error reporting and logging
 * - Recovery mechanisms
 * - Security-conscious error display
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount: number = 0
  private maxRetries: number = 3

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: this.generateErrorId()
    })

    // Log error for monitoring and debugging
    this.logError(error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to external monitoring service (in production)
    this.reportError(error, errorInfo)
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    // Security-conscious logging - don't log sensitive data
    const sanitizedError = {
      message: this.sanitizeErrorMessage(error.message),
      stack: this.sanitizeStackTrace(error.stack),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Error Boundary Caught Error
    // Removed console log
    // Removed console log
    // Removed console log
    // End error logging

    // Store error for potential user support
    try {
      localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(sanitizedError))
      
      // Clean up old error logs (keep only last 5)
      const errorKeys = Object.keys(localStorage).filter(key => key.startsWith('error_'))
      if (errorKeys.length > 5) {
        errorKeys.slice(0, -5).forEach(key => localStorage.removeItem(key))
      }
    } catch (storageError) {
      // Removed console log
    }
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information from error messages
    return message
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b(?:token|key|secret|password|auth)\s*[:=]\s*\S+/gi, '[REDACTED]')
      .replace(/\b[a-z0-9]{20,}\b/gi, '[TOKEN]')
      .replace(/\b(?:pk_|sk_|pi_|cus_)[a-zA-Z0-9]+/g, '[STRIPE_ID]')
  }

  private sanitizeStackTrace(stack?: string): string {
    if (!stack) return ''
    
    // Remove file paths that might contain sensitive information
    return stack
      .replace(/\/home\/[^\/]+/g, '/home/[USER]')
      .replace(/file:\/\/\/[^\s]+/g, '[FILE_PATH]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
  }

  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    // In production, report to monitoring service
    if (import.meta.env.PROD) {
      try {
        // This would integrate with services like Sentry, LogRocket, etc.
        // For now, we'll just prepare the data structure
        const errorReport = {
          errorId: this.state.errorId,
          message: this.sanitizeErrorMessage(error.message),
          stack: this.sanitizeStackTrace(error.stack),
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.getCurrentUserId(),
          buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
        }

        // TODO: Implement actual error reporting
        // Removed console log
      } catch (reportingError) {
        // Removed console log
      }
    }
  }

  private getCurrentUserId(): string | null {
    try {
      // Get user ID from authentication context (without exposing sensitive data)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.principal ? `principal_${user.principal.slice(0, 8)}...` : null
    } catch {
      return null
    }
  }

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId()
      })
    }
  }

  private handleReset = (): void => {
    this.retryCount = 0
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    })
  }

  private handleReportIssue = (): void => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }

    // Open GitHub issue or support system
    const issueBody = encodeURIComponent(`
Error Report:
- Error ID: ${errorDetails.errorId}
- Timestamp: ${errorDetails.timestamp}
- Message: ${errorDetails.message}

Please provide additional context about what you were doing when this error occurred.
    `)

    window.open(
      `https://github.com/your-org/ohms/issues/new?title=Error%20Report%20${errorDetails.errorId}&body=${issueBody}`,
      '_blank'
    )
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="text-center space-y-4">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h1>

              {/* User-friendly error message */}
              <p className="text-gray-600">
                We encountered an unexpected error. Our team has been notified and is working to fix this.
              </p>

              {/* Error ID for support */}
              <div className="bg-gray-100 rounded p-3">
                <p className="text-sm text-gray-500">Error ID</p>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {this.state.errorId}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full"
                  >
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="secondary"
                  className="w-full"
                >
                  Start Over
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleReportIssue}
                  variant="outline"
                  className="w-full"
                >
                  Report Issue
                </Button>
              </div>

              {/* Development mode error details */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Developer Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 rounded border text-sm">
                    <p className="font-semibold text-red-800">Error:</p>
                    <p className="text-red-700 mb-2">{this.state.error.message}</p>
                    
                    {this.state.error.stack && (
                      <>
                        <p className="font-semibold text-red-800">Stack Trace:</p>
                        <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <p className="font-semibold text-red-800 mt-2">Component Stack:</p>
                        <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              {/* Help text */}
              <p className="text-xs text-gray-400">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specialized error boundaries for different contexts

export function AuthenticationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Authentication Error</h1>
            <p className="text-gray-600">There was a problem with authentication. Please try logging in again.</p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Return to Login
            </Button>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        // Removed console log
        // Could trigger logout or redirect to login
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function PaymentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Payment Error</h1>
            <p className="text-gray-600">There was a problem processing your payment. No charges have been made.</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/support'} variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        // Removed console log
        // Could trigger payment failure analytics or support notifications
      }}
    >
      {children}
    </ErrorBoundary>
  )
}