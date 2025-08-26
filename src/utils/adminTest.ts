/**
 * Admin Functionality Test Utility
 * Tests the admin system with configured Principal IDs
 * SECURITY: All console outputs sanitized to prevent data leaks
 */

import { 
  isAdminPrincipal, 
  getAdminStatus, 
  ADMIN_PRINCIPALS, 
  CURRENT_NETWORK,
  debugAdminConfig,
  isValidPrincipalId
} from '../config/adminConfig'

/**
 * Test admin functionality with the configured Principal IDs
 * SECURITY: No sensitive data logged to console
 */
export const testAdminFunctionality = () => {
  // Environment configuration check (no sensitive data logged)
  const configValid = ADMIN_PRINCIPALS.length > 0
  const networkConfigured = CURRENT_NETWORK !== null
  
  if (!configValid || !networkConfigured) {
    // Configuration issue detected but no details logged
    return { success: false, error: 'Configuration invalid' }
  }

  // Test each configured admin Principal ID (no sensitive data logged)
  let validPrincipalCount = 0
  let adminPrincipalCount = 0

  ADMIN_PRINCIPALS.forEach((principalId) => {
    const isValid = isValidPrincipalId(principalId)
    const isAdmin = isAdminPrincipal(principalId)
    
    if (isValid) validPrincipalCount++
    if (isAdmin) adminPrincipalCount++
  })
  
  // Test with fake/invalid Principal IDs (no sensitive data logged)
  const testInvalidPrincipals = [
    'invalid-principal',
    'not-a-real-id', 
    '123456',
    '',
    'fake-admin-id'
  ]

  let invalidTestsPassedCount = 0
  testInvalidPrincipals.forEach((testId) => {
    const isValid = isValidPrincipalId(testId)
    const isAdmin = isAdminPrincipal(testId)
    
    if (!isValid && !isAdmin) {
      invalidTestsPassedCount++
    }
  })

  // Environment-Specific Configuration test (no sensitive data logged)
  const envAdmins = import.meta.env.VITE_ADMIN_PRINCIPALS
  const envSysAdmins = import.meta.env.VITE_SYSADMINS
  const hasEnvConfig = !!(envAdmins || envSysAdmins)
  
  // Test a sample principal (no sensitive data logged)  
  const sampleTestResult = getAdminStatus('test-principal-id')
  const testValid = sampleTestResult !== null

  // Results summary (no sensitive data)
  const testResults = {
    success: true,
    configurationValid: configValid,
    networkConfigured,
    totalConfiguredPrincipals: ADMIN_PRINCIPALS.length,
    validPrincipalFormats: validPrincipalCount,
    recognizedAdmins: adminPrincipalCount,
    invalidTestsPassed: invalidTestsPassedCount,
    environmentConfigured: hasEnvConfig,
    functionalityWorking: testValid
  }

  // Debug configuration check (no sensitive data logged)
  debugAdminConfig()

  return testResults
}

/**
 * Quick test to check if a principal has admin access
 * SECURITY: No sensitive data logged to console
 */
export const quickAdminTest = (principalId: string) => {
  const isValid = isValidPrincipalId(principalId)
  const isAdmin = isAdminPrincipal(principalId)
  const status = getAdminStatus(principalId)

  // Results returned but not logged
  return {
    valid: isValid,
    admin: isAdmin,
    status,
    result: isAdmin ? 'ADMIN_ACCESS' : 'NORMAL_USER'
  }
}

/**
 * Test expected admin functionality results
 * SECURITY: No sensitive data logged to console
 */
export const testAdminResults = (principalId: string) => {
  const result = quickAdminTest(principalId)
  
  if (result.admin) {
    // Admin mode activated - no logging for security
    return 'ADMIN_MODE_ACTIVATED'
  } else {
    // Normal user mode - no logging for security  
    return 'NORMAL_USER_MODE'
  }
}