/**
 * OISY wallet detection and validation utilities
 * Provides comprehensive checks for OISY wallet availability and setup
 */

export interface OisyDetectionResult {
  isAvailable: boolean
  isInstalled: boolean
  isOpen: boolean
  version?: string
  error?: string
  setupInstructions?: string[]
}

/**
 * Comprehensive OISY wallet detection
 */
export async function detectOisyWallet(): Promise<OisyDetectionResult> {
  const result: OisyDetectionResult = {
    isAvailable: false,
    isInstalled: false,
    isOpen: false
  }

  try {
    // Check 1: Look for OISY extension in window object
    if (typeof window !== 'undefined') {
      // OISY might expose itself as window.oisy or window.ic.oisy
      const hasOisyGlobal = !!(window as any).oisy || !!(window as any).ic?.oisy
      
      if (hasOisyGlobal) {
        result.isInstalled = true
        result.isOpen = true // If global is available, wallet is likely open
        result.isAvailable = true
        
        // Try to get version if available
        const oisyObj = (window as any).oisy || (window as any).ic?.oisy
        if (oisyObj?.version) {
          result.version = oisyObj.version
        }
        
        console.log('✅ OISY wallet detected via window object')
        return result
      }
    }

    // Check 2: Test if OISY can be reached through postMessage
    const canCommunicate = await testOisyCommunication()
    if (canCommunicate) {
      result.isInstalled = true
      result.isOpen = true
      result.isAvailable = true
      console.log('✅ OISY wallet detected via communication test')
      return result
    }

    // Check 3: Look for OISY-specific browser storage or indicators
    const hasOisyStorage = checkOisyStorage()
    if (hasOisyStorage) {
      result.isInstalled = true
      result.isOpen = false // Storage exists but wallet may not be open
      result.error = 'OISY wallet is installed but may not be open'
      result.setupInstructions = [
        'Open OISY wallet by visiting https://oisy.com',
        'Ensure you have created an OISY wallet account',
        'Try the connection again after opening OISY'
      ]
      console.log('⚠️ OISY wallet installed but not open')
      return result
    }

    // No OISY detected
    result.error = 'OISY wallet not detected'
    result.setupInstructions = [
      'Install OISY wallet from https://oisy.com',
      'Create a new OISY wallet account',
      'Ensure OISY is open before connecting',
      'Check that third-party cookies are enabled in your browser'
    ]
    console.log('❌ OISY wallet not detected')
    return result

  } catch (error) {
    result.error = `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('OISY detection error:', error)
    return result
  }
}

/**
 * Test communication with OISY wallet
 */
async function testOisyCommunication(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Set a short timeout for communication test
      const timeout = setTimeout(() => resolve(false), 2000)
      
      // Listen for OISY response
      const handleMessage = (event: MessageEvent) => {
        if (event.source === window && event.data?.type === 'OISY_PING_RESPONSE') {
          clearTimeout(timeout)
          window.removeEventListener('message', handleMessage)
          resolve(true)
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Send ping to OISY
      window.postMessage({ type: 'OISY_PING' }, '*')
      
    } catch (error) {
      console.warn('OISY communication test failed:', error)
      resolve(false)
    }
  })
}

/**
 * Check for OISY-related browser storage
 */
function checkOisyStorage(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    
    // Look for OISY-specific keys
    const oisyKeys = Object.keys(localStorage).filter(key => 
      key.toLowerCase().includes('oisy') || 
      key.toLowerCase().includes('nfid') ||
      key.includes('identity-kit')
    )
    
    return oisyKeys.length > 0
  } catch (error) {
    console.warn('Storage check failed:', error)
    return false
  }
}

/**
 * Get user-friendly setup instructions based on detection results
 */
export function getOisySetupGuidance(detectionResult: OisyDetectionResult): string[] {
  if (detectionResult.isAvailable) {
    return ['OISY wallet is ready for connection']
  }

  if (detectionResult.isInstalled && !detectionResult.isOpen) {
    return [
      '🔗 OISY wallet is installed but not open',
      '1. Visit https://oisy.com to open your wallet',
      '2. Ensure you are logged into your OISY account',
      '3. Try connecting again'
    ]
  }

  return [
    '🔌 OISY wallet needs to be set up',
    '1. Visit https://oisy.com',
    '2. Create a new OISY wallet account',
    '3. Open OISY wallet in your browser',
    '4. Return here and try connecting',
    '5. Ensure third-party cookies are enabled'
  ]
}

/**
 * Enhanced availability check with detailed diagnostics
 */
export async function checkOisyWithDiagnostics(): Promise<{
  detection: OisyDetectionResult
  browserInfo: {
    userAgent: string
    cookiesEnabled: boolean
    storageAvailable: boolean
  }
  recommendations: string[]
}> {
  const detection = await detectOisyWallet()
  
  const browserInfo = {
    userAgent: navigator.userAgent,
    cookiesEnabled: navigator.cookieEnabled,
    storageAvailable: typeof localStorage !== 'undefined'
  }

  const recommendations: string[] = []
  
  if (!detection.isAvailable) {
    recommendations.push(...getOisySetupGuidance(detection))
  }
  
  if (!browserInfo.cookiesEnabled) {
    recommendations.push('⚠️ Enable cookies in your browser settings')
  }
  
  if (!browserInfo.storageAvailable) {
    recommendations.push('⚠️ Browser storage not available - check privacy settings')
  }

  return {
    detection,
    browserInfo,
    recommendations
  }
}