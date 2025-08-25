/**
 * OHMS 2.0 Security Audit Framework
 * 
 * Comprehensive security validation for:
 * - Internet Identity v2 authentication flows
 * - Stripe payment processing security
 * - Google account privacy compliance
 * - Data protection and validation
 * - API security and rate limiting
 */

import type { GoogleAccountInfo } from '../services/internetIdentityService'
import type { MarketDataPoint } from '../services/marketDataService'

// Security audit levels
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security check categories
export enum SecurityCategory {
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  DATA_PRIVACY = 'data_privacy',
  INPUT_VALIDATION = 'input_validation',
  API_SECURITY = 'api_security',
  SESSION_MANAGEMENT = 'session_management',
  ERROR_HANDLING = 'error_handling'
}

export interface SecurityIssue {
  id: string
  category: SecurityCategory
  level: SecurityLevel
  title: string
  description: string
  impact: string
  recommendation: string
  cweId?: string // Common Weakness Enumeration ID
  owaspCategory?: string // OWASP Top 10 category
  testCase?: string
  remediation?: {
    steps: string[]
    priority: 'immediate' | 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
  }
}

export interface SecurityAuditResult {
  timestamp: Date
  version: string
  overallRisk: SecurityLevel
  summary: {
    totalIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
  categories: Record<SecurityCategory, SecurityIssue[]>
  recommendations: string[]
  complianceStatus: {
    gdpr: boolean
    ccpa: boolean
    pci: boolean
    owasp: boolean
  }
}

class SecurityAuditor {
  private issues: SecurityIssue[] = []
  private currentTest: string = ''

  public async performFullAudit(): Promise<SecurityAuditResult> {
    console.log('🔒 Starting OHMS 2.0 Security Audit...')
    
    this.issues = []
    
    // Run all security checks
    await this.auditAuthentication()
    await this.auditPaymentSecurity()
    await this.auditDataPrivacy()
    await this.auditInputValidation()
    await this.auditApiSecurity()
    await this.auditSessionManagement()
    await this.auditErrorHandling()
    
    return this.generateReport()
  }

  private async auditAuthentication(): Promise<void> {
    console.log('🔐 Auditing Authentication Security...')
    
    // Check Internet Identity v2 configuration
    this.checkIIv2Configuration()
    
    // Check Google OAuth security
    this.checkGoogleOAuthSecurity()
    
    // Check principal validation
    this.checkPrincipalValidation()
    
    // Check session security
    this.checkSessionSecurity()
  }

  private checkIIv2Configuration(): void {
    this.currentTest = 'II v2 Configuration Security'
    
    // Check if II v2 is properly configured
    const iiHost = import.meta.env.VITE_II_HOST
    if (!iiHost || iiHost !== 'https://id.ai') {
      this.addIssue({
        id: 'auth-001',
        category: SecurityCategory.AUTHENTICATION,
        level: SecurityLevel.HIGH,
        title: 'Internet Identity v2 Host Configuration',
        description: 'II v2 host is not properly configured or uses insecure endpoint',
        impact: 'Could allow man-in-the-middle attacks or authentication bypassing',
        recommendation: 'Ensure VITE_II_HOST is set to https://id.ai in production',
        owaspCategory: 'A07:2021 – Identification and Authentication Failures',
        remediation: {
          steps: [
            'Set VITE_II_HOST=https://id.ai in production environment',
            'Validate SSL certificate of II v2 endpoint',
            'Implement certificate pinning for additional security'
          ],
          priority: 'high',
          effort: 'low'
        }
      })
    }

    // Check canister ID validation
    const canisterId = import.meta.env.VITE_II_CANISTER_ID
    if (!canisterId || !this.isValidCanisterId(canisterId)) {
      this.addIssue({
        id: 'auth-002',
        category: SecurityCategory.AUTHENTICATION,
        level: SecurityLevel.MEDIUM,
        title: 'II v2 Canister ID Validation',
        description: 'Internet Identity canister ID is missing or invalid',
        impact: 'Could connect to wrong canister or fail authentication',
        recommendation: 'Validate and configure proper II v2 canister ID',
        remediation: {
          steps: [
            'Obtain official II v2 canister ID from Internet Computer',
            'Validate canister ID format and existence',
            'Set VITE_II_CANISTER_ID in environment configuration'
          ],
          priority: 'medium',
          effort: 'low'
        }
      })
    }
  }

  private checkGoogleOAuthSecurity(): void {
    this.currentTest = 'Google OAuth Security'
    
    // Check for secure Google account handling
    this.addIssue({
      id: 'auth-003',
      category: SecurityCategory.DATA_PRIVACY,
      level: SecurityLevel.HIGH,
      title: 'Google Account Data Minimization',
      description: 'Review Google account data collection and storage practices',
      impact: 'Excessive data collection could violate privacy regulations',
      recommendation: 'Implement data minimization - only collect necessary Google account fields',
      owaspCategory: 'A03:2021 – Injection',
      cweId: 'CWE-359',
      remediation: {
        steps: [
          'Audit GoogleAccountInfo interface for unnecessary fields',
          'Implement data retention policies for Google account data',
          'Add user consent mechanisms for data collection',
          'Provide data deletion capabilities for users'
          ],
          priority: 'high',
          effort: 'medium'
        }
    })

    // Check Google ID validation
    this.addIssue({
      id: 'auth-004',
      category: SecurityCategory.INPUT_VALIDATION,
      level: SecurityLevel.MEDIUM,
      title: 'Google ID Format Validation',
      description: 'Google IDs should be properly validated before use',
      impact: 'Invalid Google IDs could cause authentication issues or security bypassing',
      recommendation: 'Implement strict Google ID format validation',
      cweId: 'CWE-20',
      remediation: {
        steps: [
          'Add regex validation for Google ID format',
          'Validate Google ID uniqueness',
          'Sanitize Google ID before storage and use',
          'Implement rate limiting for Google ID validation attempts'
        ],
        priority: 'medium',
        effort: 'low'
      }
    })
  }

  private checkPrincipalValidation(): void {
    this.currentTest = 'Principal Validation Security'
    
    this.addIssue({
      id: 'auth-005',
      category: SecurityCategory.INPUT_VALIDATION,
      level: SecurityLevel.HIGH,
      title: 'Principal Format Validation',
      description: 'IC Principals should be strictly validated',
      impact: 'Invalid principals could bypass authorization checks',
      recommendation: 'Implement comprehensive principal validation using @dfinity/principal',
      cweId: 'CWE-20',
      owaspCategory: 'A01:2021 – Broken Access Control',
      remediation: {
        steps: [
          'Use Principal.fromText() with try-catch for validation',
          'Implement principal format checking',
          'Add principal length validation',
          'Create allowlist/blocklist for admin principals'
        ],
        priority: 'high',
        effort: 'low'
      }
    })
  }

  private checkSessionSecurity(): void {
    this.currentTest = 'Session Management Security'
    
    this.addIssue({
      id: 'auth-006',
      category: SecurityCategory.SESSION_MANAGEMENT,
      level: SecurityLevel.MEDIUM,
      title: 'Session Storage Security',
      description: 'Authentication sessions should use secure storage mechanisms',
      impact: 'Insecure session storage could lead to session hijacking',
      recommendation: 'Use secure session storage with proper encryption',
      cweId: 'CWE-613',
      owaspCategory: 'A07:2021 – Identification and Authentication Failures',
      remediation: {
        steps: [
          'Implement secure session token generation',
          'Use httpOnly and secure flags for session cookies',
          'Add session timeout and renewal mechanisms',
          'Implement session invalidation on logout'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private async auditPaymentSecurity(): Promise<void> {
    console.log('💳 Auditing Payment Security...')
    
    this.checkStripeConfiguration()
    this.checkPaymentDataHandling()
    this.checkICPConversionSecurity()
    this.checkWebhookSecurity()
  }

  private checkStripeConfiguration(): void {
    this.currentTest = 'Stripe Configuration Security'
    
    // Check for production keys
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!stripeKey) {
      this.addIssue({
        id: 'pay-001',
        category: SecurityCategory.PAYMENT,
        level: SecurityLevel.CRITICAL,
        title: 'Missing Stripe Configuration',
        description: 'Stripe publishable key is not configured',
        impact: 'Payment processing will not work',
        recommendation: 'Configure Stripe publishable key for production environment',
        remediation: {
          steps: [
            'Obtain Stripe publishable key from Stripe dashboard',
            'Set VITE_STRIPE_PUBLISHABLE_KEY in production environment',
            'Ensure key starts with pk_live_ for production'
          ],
          priority: 'immediate',
          effort: 'low'
        }
      })
    } else if (stripeKey.startsWith('pk_test_')) {
      this.addIssue({
        id: 'pay-002',
        category: SecurityCategory.PAYMENT,
        level: SecurityLevel.HIGH,
        title: 'Test Stripe Key in Production',
        description: 'Using Stripe test key in production environment',
        impact: 'Real payments cannot be processed',
        recommendation: 'Replace with production Stripe key',
        remediation: {
          steps: [
            'Obtain production Stripe keys from dashboard',
            'Update environment configuration with pk_live_ key',
            'Test payment processing in production environment'
          ],
          priority: 'immediate',
          effort: 'low'
        }
      })
    }
  }

  private checkPaymentDataHandling(): void {
    this.currentTest = 'Payment Data Handling Security'
    
    this.addIssue({
      id: 'pay-003',
      category: SecurityCategory.PAYMENT,
      level: SecurityLevel.CRITICAL,
      title: 'PCI DSS Compliance',
      description: 'Payment card data handling must comply with PCI DSS standards',
      impact: 'Non-compliance could result in fines and security vulnerabilities',
      recommendation: 'Ensure PCI DSS compliance by never storing card data',
      owaspCategory: 'A02:2021 – Cryptographic Failures',
      remediation: {
        steps: [
          'Use Stripe Elements for card data collection (already implemented)',
          'Never log or store payment card data',
          'Implement proper payment token handling',
          'Regular PCI DSS compliance audits'
        ],
        priority: 'immediate',
        effort: 'low'
      }
    })

    this.addIssue({
      id: 'pay-004',
      category: SecurityCategory.PAYMENT,
      level: SecurityLevel.HIGH,
      title: 'Payment Amount Validation',
      description: 'Payment amounts should be validated server-side',
      impact: 'Client-side manipulation could lead to incorrect charges',
      recommendation: 'Implement server-side payment amount validation',
      cweId: 'CWE-20',
      remediation: {
        steps: [
          'Add server-side amount validation for all payment requests',
          'Validate subscription tier pricing against database',
          'Implement minimum and maximum payment limits',
          'Log all payment amount modifications for audit'
        ],
        priority: 'high',
        effort: 'medium'
      }
    })
  }

  private checkICPConversionSecurity(): void {
    this.currentTest = 'ICP Conversion Security'
    
    this.addIssue({
      id: 'pay-005',
      category: SecurityCategory.API_SECURITY,
      level: SecurityLevel.MEDIUM,
      title: 'Market Data API Security',
      description: 'Market data APIs should be protected against manipulation',
      impact: 'Manipulated price data could lead to incorrect conversions',
      recommendation: 'Implement multiple data source validation and anomaly detection',
      remediation: {
        steps: [
          'Use multiple market data sources for price validation',
          'Implement price change anomaly detection',
          'Add circuit breakers for extreme price changes',
          'Cache and validate price data integrity'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private checkWebhookSecurity(): void {
    this.currentTest = 'Webhook Security'
    
    this.addIssue({
      id: 'pay-006',
      category: SecurityCategory.API_SECURITY,
      level: SecurityLevel.HIGH,
      title: 'Stripe Webhook Validation',
      description: 'Stripe webhooks must be properly validated',
      impact: 'Unvalidated webhooks could lead to payment fraud',
      recommendation: 'Implement Stripe webhook signature validation',
      cweId: 'CWE-345',
      remediation: {
        steps: [
          'Implement Stripe webhook signature verification',
          'Use webhook endpoint secret for validation',
          'Add idempotency checks for webhook processing',
          'Log all webhook events for audit trail'
        ],
        priority: 'high',
        effort: 'medium'
      }
    })
  }

  private async auditDataPrivacy(): Promise<void> {
    console.log('🔐 Auditing Data Privacy...')
    
    this.checkGDPRCompliance()
    this.checkDataRetention()
    this.checkDataEncryption()
  }

  private checkGDPRCompliance(): void {
    this.currentTest = 'GDPR Compliance'
    
    this.addIssue({
      id: 'priv-001',
      category: SecurityCategory.DATA_PRIVACY,
      level: SecurityLevel.HIGH,
      title: 'GDPR Consent Management',
      description: 'User consent for data processing should be properly managed',
      impact: 'Non-compliance with GDPR could result in significant fines',
      recommendation: 'Implement proper consent management system',
      remediation: {
        steps: [
          'Add explicit consent for Google account data collection',
          'Implement data processing purpose disclosure',
          'Provide data portability features',
          'Add right to be forgotten functionality'
        ],
        priority: 'high',
        effort: 'high'
      }
    })
  }

  private checkDataRetention(): void {
    this.currentTest = 'Data Retention Policy'
    
    this.addIssue({
      id: 'priv-002',
      category: SecurityCategory.DATA_PRIVACY,
      level: SecurityLevel.MEDIUM,
      title: 'Data Retention Policy',
      description: 'Clear data retention policies should be implemented',
      impact: 'Indefinite data retention could violate privacy regulations',
      recommendation: 'Implement data retention and deletion policies',
      remediation: {
        steps: [
          'Define retention periods for different data types',
          'Implement automated data deletion processes',
          'Provide user-initiated data deletion',
          'Regular audit of stored data and cleanup'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private checkDataEncryption(): void {
    this.currentTest = 'Data Encryption'
    
    this.addIssue({
      id: 'priv-003',
      category: SecurityCategory.DATA_PRIVACY,
      level: SecurityLevel.MEDIUM,
      title: 'Data Encryption at Rest',
      description: 'Sensitive data should be encrypted when stored',
      impact: 'Unencrypted data could be compromised in case of breach',
      recommendation: 'Implement encryption for sensitive data storage',
      owaspCategory: 'A02:2021 – Cryptographic Failures',
      remediation: {
        steps: [
          'Encrypt Google account data in database',
          'Use strong encryption algorithms (AES-256)',
          'Implement proper key management',
          'Regular encryption key rotation'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private async auditInputValidation(): Promise<void> {
    console.log('🛡️ Auditing Input Validation...')
    
    this.checkFormValidation()
    this.checkAPIInputValidation()
    this.checkSanitization()
  }

  private checkFormValidation(): void {
    this.currentTest = 'Form Input Validation'
    
    this.addIssue({
      id: 'input-001',
      category: SecurityCategory.INPUT_VALIDATION,
      level: SecurityLevel.MEDIUM,
      title: 'Client-Side Validation Only',
      description: 'Form validation should not rely solely on client-side checks',
      impact: 'Bypassed client validation could lead to invalid data processing',
      recommendation: 'Implement server-side validation for all inputs',
      cweId: 'CWE-20',
      remediation: {
        steps: [
          'Add server-side validation for all form inputs',
          'Validate email formats, names, and other user inputs',
          'Implement input length and character restrictions',
          'Use validation libraries for consistent checks'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private checkAPIInputValidation(): void {
    this.currentTest = 'API Input Validation'
    
    this.addIssue({
      id: 'input-002',
      category: SecurityCategory.INPUT_VALIDATION,
      level: SecurityLevel.HIGH,
      title: 'API Parameter Validation',
      description: 'API endpoints should validate all input parameters',
      impact: 'Invalid parameters could cause API errors or security issues',
      recommendation: 'Implement comprehensive API input validation',
      cweId: 'CWE-20',
      remediation: {
        steps: [
          'Validate all API request parameters',
          'Implement type checking for numeric values',
          'Add range validation for amounts and quantities',
          'Use schema validation for complex objects'
        ],
        priority: 'high',
        effort: 'low'
      }
    })
  }

  private checkSanitization(): void {
    this.currentTest = 'Input Sanitization'
    
    this.addIssue({
      id: 'input-003',
      category: SecurityCategory.INPUT_VALIDATION,
      level: SecurityLevel.MEDIUM,
      title: 'Input Sanitization',
      description: 'User inputs should be properly sanitized',
      impact: 'Unsanitized inputs could lead to XSS or injection attacks',
      recommendation: 'Implement input sanitization for all user data',
      cweId: 'CWE-79',
      owaspCategory: 'A03:2021 – Injection',
      remediation: {
        steps: [
          'Sanitize all user inputs before processing',
          'Use libraries like DOMPurify for HTML sanitization',
          'Escape special characters in user data',
          'Validate and sanitize file uploads if any'
        ],
        priority: 'medium',
        effort: 'low'
      }
    })
  }

  private async auditApiSecurity(): Promise<void> {
    console.log('🌐 Auditing API Security...')
    
    this.checkRateLimiting()
    this.checkAPIAuthentication()
    this.checkCORSConfiguration()
  }

  private checkRateLimiting(): void {
    this.currentTest = 'API Rate Limiting'
    
    this.addIssue({
      id: 'api-001',
      category: SecurityCategory.API_SECURITY,
      level: SecurityLevel.MEDIUM,
      title: 'Rate Limiting Implementation',
      description: 'API endpoints should implement rate limiting',
      impact: 'Lack of rate limiting could lead to DoS attacks or API abuse',
      recommendation: 'Implement rate limiting for all API endpoints',
      cweId: 'CWE-770',
      remediation: {
        steps: [
          'Implement rate limiting for market data APIs',
          'Add rate limiting for payment endpoints',
          'Use sliding window or token bucket algorithms',
          'Provide rate limit feedback to clients'
        ],
        priority: 'medium',
        effort: 'medium'
      }
    })
  }

  private checkAPIAuthentication(): void {
    this.currentTest = 'API Authentication'
    
    this.addIssue({
      id: 'api-002',
      category: SecurityCategory.API_SECURITY,
      level: SecurityLevel.HIGH,
      title: 'API Authentication',
      description: 'Protected API endpoints should require proper authentication',
      impact: 'Unauthenticated access could lead to unauthorized operations',
      recommendation: 'Ensure all protected endpoints validate authentication',
      owaspCategory: 'A01:2021 – Broken Access Control',
      remediation: {
        steps: [
          'Validate authentication tokens on all protected endpoints',
          'Implement proper authorization checks',
          'Use bearer tokens or similar secure mechanisms',
          'Add authentication middleware for consistent checks'
        ],
        priority: 'high',
        effort: 'medium'
      }
    })
  }

  private checkCORSConfiguration(): void {
    this.currentTest = 'CORS Configuration'
    
    this.addIssue({
      id: 'api-003',
      category: SecurityCategory.API_SECURITY,
      level: SecurityLevel.LOW,
      title: 'CORS Configuration',
      description: 'CORS should be properly configured for production',
      impact: 'Overly permissive CORS could allow unauthorized cross-origin requests',
      recommendation: 'Configure restrictive CORS policy for production',
      cweId: 'CWE-346',
      remediation: {
        steps: [
          'Restrict CORS origins to authorized domains only',
          'Avoid using wildcard (*) origins in production',
          'Configure appropriate CORS headers',
          'Regular review of CORS configuration'
        ],
        priority: 'low',
        effort: 'low'
      }
    })
  }

  private async auditSessionManagement(): Promise<void> {
    console.log('🔑 Auditing Session Management...')
    
    this.checkSessionTimeout()
    this.checkSessionInvalidation()
  }

  private checkSessionTimeout(): void {
    this.currentTest = 'Session Timeout'
    
    this.addIssue({
      id: 'sess-001',
      category: SecurityCategory.SESSION_MANAGEMENT,
      level: SecurityLevel.MEDIUM,
      title: 'Session Timeout Policy',
      description: 'Sessions should have appropriate timeout policies',
      impact: 'Long-lived sessions increase risk of session hijacking',
      recommendation: 'Implement proper session timeout and renewal',
      cweId: 'CWE-613',
      remediation: {
        steps: [
          'Set appropriate session timeout (7 days is reasonable for wallet apps)',
          'Implement session renewal before expiration',
          'Add idle timeout for inactive sessions',
          'Provide clear session expiration warnings to users'
        ],
        priority: 'medium',
        effort: 'low'
      }
    })
  }

  private checkSessionInvalidation(): void {
    this.currentTest = 'Session Invalidation'
    
    this.addIssue({
      id: 'sess-002',
      category: SecurityCategory.SESSION_MANAGEMENT,
      level: SecurityLevel.MEDIUM,
      title: 'Session Invalidation',
      description: 'Sessions should be properly invalidated on logout',
      impact: 'Lingering sessions could be hijacked after logout',
      recommendation: 'Ensure complete session cleanup on logout',
      remediation: {
        steps: [
          'Clear all authentication tokens on logout',
          'Invalidate server-side sessions',
          'Clear browser storage and cookies',
          'Redirect to login page after logout'
        ],
        priority: 'medium',
        effort: 'low'
      }
    })
  }

  private async auditErrorHandling(): Promise<void> {
    console.log('⚠️ Auditing Error Handling...')
    
    this.checkErrorInformationDisclosure()
    this.checkErrorLogging()
  }

  private checkErrorInformationDisclosure(): void {
    this.currentTest = 'Error Information Disclosure'
    
    this.addIssue({
      id: 'err-001',
      category: SecurityCategory.ERROR_HANDLING,
      level: SecurityLevel.MEDIUM,
      title: 'Error Information Disclosure',
      description: 'Error messages should not disclose sensitive information',
      impact: 'Detailed error messages could reveal system information to attackers',
      recommendation: 'Implement generic error messages for users',
      cweId: 'CWE-209',
      owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures',
      remediation: {
        steps: [
          'Create generic error messages for end users',
          'Log detailed errors server-side only',
          'Avoid exposing stack traces to users',
          'Implement error code mapping for support'
        ],
        priority: 'medium',
        effort: 'low'
      }
    })
  }

  private checkErrorLogging(): void {
    this.currentTest = 'Error Logging'
    
    this.addIssue({
      id: 'err-002',
      category: SecurityCategory.ERROR_HANDLING,
      level: SecurityLevel.LOW,
      title: 'Security Event Logging',
      description: 'Security-relevant events should be properly logged',
      impact: 'Poor logging could hinder incident response and forensics',
      recommendation: 'Implement comprehensive security event logging',
      owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures',
      remediation: {
        steps: [
          'Log authentication attempts and failures',
          'Log payment transactions and status changes',
          'Implement audit trail for admin actions',
          'Use structured logging for better analysis'
        ],
        priority: 'low',
        effort: 'medium'
      }
    })
  }

  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue)
    console.log(`  ⚠️ ${issue.level.toUpperCase()}: ${issue.title}`)
  }

  private isValidCanisterId(canisterId: string): boolean {
    // Basic canister ID format validation
    return /^[a-z0-9-]+$/.test(canisterId) && canisterId.includes('-')
  }

  private generateReport(): SecurityAuditResult {
    const categorizedIssues = this.categorizeIssues()
    const summary = this.generateSummary()
    const overallRisk = this.calculateOverallRisk()
    const recommendations = this.generateRecommendations()
    const complianceStatus = this.assessCompliance()

    return {
      timestamp: new Date(),
      version: '2.0',
      overallRisk,
      summary,
      categories: categorizedIssues,
      recommendations,
      complianceStatus
    }
  }

  private categorizeIssues(): Record<SecurityCategory, SecurityIssue[]> {
    const categorized: Record<SecurityCategory, SecurityIssue[]> = {
      [SecurityCategory.AUTHENTICATION]: [],
      [SecurityCategory.PAYMENT]: [],
      [SecurityCategory.DATA_PRIVACY]: [],
      [SecurityCategory.INPUT_VALIDATION]: [],
      [SecurityCategory.API_SECURITY]: [],
      [SecurityCategory.SESSION_MANAGEMENT]: [],
      [SecurityCategory.ERROR_HANDLING]: []
    }

    for (const issue of this.issues) {
      categorized[issue.category].push(issue)
    }

    return categorized
  }

  private generateSummary() {
    return {
      totalIssues: this.issues.length,
      criticalIssues: this.issues.filter(i => i.level === SecurityLevel.CRITICAL).length,
      highIssues: this.issues.filter(i => i.level === SecurityLevel.HIGH).length,
      mediumIssues: this.issues.filter(i => i.level === SecurityLevel.MEDIUM).length,
      lowIssues: this.issues.filter(i => i.level === SecurityLevel.LOW).length
    }
  }

  private calculateOverallRisk(): SecurityLevel {
    const criticalCount = this.issues.filter(i => i.level === SecurityLevel.CRITICAL).length
    const highCount = this.issues.filter(i => i.level === SecurityLevel.HIGH).length
    
    if (criticalCount > 0) return SecurityLevel.CRITICAL
    if (highCount > 2) return SecurityLevel.HIGH
    if (highCount > 0) return SecurityLevel.MEDIUM
    return SecurityLevel.LOW
  }

  private generateRecommendations(): string[] {
    return [
      '🔒 Configure production Stripe keys and remove test keys',
      '🔐 Implement comprehensive input validation on all endpoints',
      '🛡️ Add rate limiting to prevent API abuse',
      '📊 Enhance error logging and monitoring for security events',
      '🔑 Implement proper session management with timeouts',
      '🌐 Configure restrictive CORS policies for production',
      '📋 Establish GDPR compliance procedures for data handling',
      '🚨 Set up security monitoring and alerting systems'
    ]
  }

  private assessCompliance() {
    const issues = this.issues
    
    return {
      gdpr: !issues.some(i => i.category === SecurityCategory.DATA_PRIVACY && i.level === SecurityLevel.HIGH),
      ccpa: !issues.some(i => i.category === SecurityCategory.DATA_PRIVACY),
      pci: !issues.some(i => i.category === SecurityCategory.PAYMENT && i.level === SecurityLevel.CRITICAL),
      owasp: issues.filter(i => i.owaspCategory).length < 3
    }
  }
}

// Export the auditor and types
export const securityAuditor = new SecurityAuditor()

// Convenience function for running security audit
export async function runSecurityAudit(): Promise<SecurityAuditResult> {
  return await securityAuditor.performFullAudit()
}