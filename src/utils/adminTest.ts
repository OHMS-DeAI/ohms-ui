/**
 * Admin Functionality Test Utility
 * Tests the admin system with configured Principal IDs
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
 */
export const testAdminFunctionality = () => {
  console.group('🧪 OHMS Admin System Test')
  
  // Test environment configuration
  console.log('📋 Environment Configuration:')
  console.log('Network:', CURRENT_NETWORK)
  console.log('Admin Principals:', ADMIN_PRINCIPALS)
  console.log('Admin Count:', ADMIN_PRINCIPALS.length)
  
  // Test each configured admin Principal ID
  console.log('\\n🔍 Testing Configured Admin Principal IDs:')
  ADMIN_PRINCIPALS.forEach((principalId, index) => {
    console.group(`Admin ${index + 1}: ${principalId}`)
    
    const isValid = isValidPrincipalId(principalId)
    const isAdmin = isAdminPrincipal(principalId)
    const status = getAdminStatus(principalId)
    
    console.log('✅ Valid format:', isValid)
    console.log('🔑 Has admin access:', isAdmin)
    console.log('📊 Status details:', status)
    
    if (!isValid) {
      console.warn('⚠️  Invalid Principal ID format detected!')
    }
    if (!isAdmin) {
      console.warn('⚠️  Principal ID not recognized as admin!')
    }
    
    console.groupEnd()
  })
  
  // Test with fake/invalid Principal IDs
  console.log('\\n🚫 Testing Non-Admin Principal IDs:')
  const testCases = [
    'fake-principal-id-123',
    'rdmx6-invalid-test-id',
    'short-id',
    '',
    null,
    undefined
  ]
  
  testCases.forEach((testId: any) => {
    if (testId === null || testId === undefined) {
      const result = isAdminPrincipal(testId)
      console.log(`${testId}: ${result} ✅ (correctly denied)`)
    } else {
      const isValid = isValidPrincipalId(testId)
      const isAdmin = isAdminPrincipal(testId)
      console.log(`"${testId}": valid=${isValid}, admin=${isAdmin} ${!isAdmin ? '✅' : '❌'}`)
    }
  })
  
  // Test with the real configured Principal IDs (from environment)
  console.log('\\n🎯 Testing Environment-Specific Configuration:')
  const envAdmins = import.meta.env.VITE_ADMIN_PRINCIPALS
  const envSysAdmins = import.meta.env.VITE_SYSADMINS
  
  console.log('VITE_ADMIN_PRINCIPALS:', envAdmins)
  console.log('VITE_SYSADMINS (legacy):', envSysAdmins)
  
  if (envAdmins) {
    const parsedAdmins = envAdmins.split(',').map((p: string) => p.trim())
    console.log('Parsed admin principals:', parsedAdmins)
    
    parsedAdmins.forEach((principalId: string) => {
      const hasAccess = isAdminPrincipal(principalId)
      console.log(`${principalId}: ${hasAccess ? '✅ ADMIN' : '❌ DENIED'}`)
    })
  }
  
  console.log('\\n🐛 Debug Admin Configuration:')
  debugAdminConfig()
  
  console.groupEnd()
  
  return {
    network: CURRENT_NETWORK,
    adminCount: ADMIN_PRINCIPALS.length,
    configuredAdmins: ADMIN_PRINCIPALS,
    allTestsPassed: ADMIN_PRINCIPALS.every(pid => isAdminPrincipal(pid) && isValidPrincipalId(pid))
  }
}

/**
 * Quick test for a specific Principal ID
 */
export const testPrincipalId = (principalId: string) => {
  console.group(`🔍 Testing Principal ID: ${principalId}`)
  
  const isValid = isValidPrincipalId(principalId)
  const isAdmin = isAdminPrincipal(principalId)
  const status = getAdminStatus(principalId)
  
  console.log('Valid format:', isValid)
  console.log('Has admin access:', isAdmin)
  console.log('Detailed status:', status)
  
  console.groupEnd()
  
  return { isValid, isAdmin, status }
}

/**
 * Simulate wallet authentication test
 */
export const simulatePlugAuth = (principalId: string) => {
  console.group(`🔌 Simulating Wallet Auth: ${principalId}`)
  
  const adminResult = testPrincipalId(principalId)
  
  if (adminResult.isAdmin) {
    console.log('🟢 Result: ADMIN MODE ACTIVATED')
    console.log('🎛️  Admin features will be visible')
    console.log('📊 Admin metrics will be available')
  } else {
    console.log('🔵 Result: NORMAL USER MODE')
    console.log('👤 Standard user interface')
    console.log('🚫 Admin features hidden')
  }
  
  console.groupEnd()
  
  return adminResult.isAdmin
}

// Auto-run tests in development mode
if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEBUG === 'true') {
  // Wait a bit for environment to be ready
  setTimeout(() => {
    testAdminFunctionality()
  }, 1000)
}