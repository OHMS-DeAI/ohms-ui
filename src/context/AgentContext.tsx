import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { HttpAgent, type Identity } from '@dfinity/agent'
import { debugAdminConfig, getAdminStatus, CURRENT_NETWORK, ADMIN_PRINCIPALS } from '../config/adminConfig'
import { getCanisterIdsFromEnv, NETWORK, HOST } from '../config/network'
import { 
  getUserFriendlyErrorMessage,
  getBrowserGuidance,
  isBraveBrowser,
  classifyWalletError,
  type WalletError
} from '../utils/walletErrorHandler'
import { useAuth, useAgent as useIdentityKitAgent, useIdentity } from '@nfid/identitykit/react'
import { Principal } from '@dfinity/principal'

// Define types for our canisters
export interface CanisterIds {
  ohms_model: string
  ohms_agent: string
  ohms_coordinator: string
  ohms_econ: string
}

interface UserProfile {
  name?: string
  accountId?: string
  principal: string
}

interface AgentContextType {
  canisterIds: CanisterIds
  isWalletAvailable: boolean
  principal: string | null
  userProfile: UserProfile | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: WalletError | null
  createAuthAgent: () => Promise<HttpAgent | null>
  getPrincipal: () => Promise<string | null>
  connect: () => Promise<boolean>
  disconnect: () => void
  isAdmin: boolean
  checkAdminStatus: () => Promise<boolean>
  adminData: AdminData | null
  refreshAdminData: () => Promise<void>
  clearConnectionError: () => void
}

interface AdminData {
  health: {
    model: any
    agent: any
    coordinator: any
    econ: any
  } | null
  modelStats: {
    total: number
    active: number
    pending: number
    deprecated: number
  }
  agentHealth: any
  routingHealth: any
  econHealth: any
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

// Default canister IDs (from centralized network env loader)
const defaultCanisterIds: CanisterIds = getCanisterIdsFromEnv()

interface AgentProviderProps {
  children: ReactNode
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [canisterIds] = useState<CanisterIds>(defaultCanisterIds)
  const [principal, setPrincipal] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isWalletAvailable, setIsWalletAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<WalletError | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  // IdentityKit hooks
  const { connect: idkitConnect, disconnect: idkitDisconnect } = useAuth()
  const identity: Identity | undefined = useIdentity()
  const idkitAgent = useIdentityKitAgent({ host: HOST })

  // No wallet polling needed with IdentityKit; maintain minimal cache
  const [connectionCache, setConnectionCache] = useState<{
    status: boolean | null
    timestamp: number
  }>({ status: null, timestamp: 0 })

  const CACHE_DURATION = 1000

  // Local storage keys
  const STORAGE_KEYS = {
    WAS_CONNECTED: 'ohms_plug_was_connected',
    PRINCIPAL: 'ohms_principal',
    USER_PROFILE: 'ohms_user_profile',
    LAST_CONNECTION: 'ohms_last_connection'
  }
  
  // Extract user profile from signer/identity
  const extractUserProfile = async (_unused: unknown, principalStr: string): Promise<UserProfile> => {
    try {
      if (NETWORK === 'ic') {
        return {
          principal: principalStr,
          name: `User ${principalStr.slice(0, 8)}...`,
        }
      }
      const profile: UserProfile = { principal: principalStr, name: `User ${principalStr.slice(0, 8)}...` }
      return profile
    } catch (error) {
      console.warn('Could not extract full user profile:', error)
      return {
        principal: principalStr,
        name: `User ${principalStr.slice(0, 8)}...`
      }
    }
  }

  // Cached connection status checker
  const checkConnectionCached = async (): Promise<boolean> => {
    const now = Date.now()
    
    // Return cached result if still valid
    if (connectionCache.status !== null && (now - connectionCache.timestamp) < CACHE_DURATION) {
      return connectionCache.status
    }

    try {
      const connected = Boolean(identity && (await identity.getPrincipal?.()))
      
      // Update cache
      setConnectionCache({
        status: connected,
        timestamp: now
      })
      
      // Clear connection error on successful check
      if (connected) {
        setConnectionError(null)
      }
      
      return connected
    } catch (error) {
      const walletError = classifyWalletError(error)
      
      // Don't log or set connection errors for extension errors that don't affect the app
      if (walletError.type === 'EXTENSION_ERROR' && !walletError.affectsApp) {
        // Silently ignore extension internal errors
        return false
      }
      
      console.warn('⚠️ Cached connection check failed:', getUserFriendlyErrorMessage(walletError))
      
      // Only set connection error for errors that affect the app
      if (walletError.affectsApp !== false && walletError.type !== 'UNKNOWN') {
        setConnectionError(walletError)
      }
      
      return false
    }
  }
  
  // Initialize wallet availability (IdentityKit)
  useEffect(() => {
    setIsWalletAvailable(true)
    // Attempt to derive state from IdentityKit
    ;(async () => {
      try {
        if (identity) {
          const p = await identity.getPrincipal()
          const principalStr = p.toText()
          setPrincipal(principalStr)
          setIsConnected(true)
          const profile = await extractUserProfile(null, principalStr)
          setUserProfile(profile)
        }
      } catch (_) {}
    })()
  }, [])
  
  const clearStoredConnection = () => {
    localStorage.removeItem(STORAGE_KEYS.WAS_CONNECTED)
    localStorage.removeItem(STORAGE_KEYS.PRINCIPAL)
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
    localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTION)
  }
  
  const storeConnection = (principalId: string, profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.WAS_CONNECTED, 'true')
    localStorage.setItem(STORAGE_KEYS.PRINCIPAL, principalId)
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
    localStorage.setItem(STORAGE_KEYS.LAST_CONNECTION, Date.now().toString())
  }
  
  // Removed Plug-specific reconnection
  
  // Check admin status when principal changes
  useEffect(() => {
    if (principal) {
      checkAdminStatus().then(isAdminUser => {
        if (isAdminUser) {
          console.log(`🔑 Admin access GRANTED for: ${principal} on ${CURRENT_NETWORK} network`)
          console.log(`📊 Total configured admins: ${ADMIN_PRINCIPALS.length}`)
          refreshAdminData()
        } else {
          console.log(`👤 Regular user access for: ${principal} on ${CURRENT_NETWORK} network`)
        }
      })
    } else {
      // Clear admin status when no principal
      console.log('🚪 User disconnected - clearing admin status')
      setIsAdmin(false)
      setAdminData(null)
    }
  }, [principal])

  // Helper function to wait for identity to be available
  const waitForIdentity = async (maxAttempts: number = 10, delayMs: number = 500): Promise<Identity | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (identity) {
        try {
          const principal = await identity.getPrincipal()
          if (principal) {
            return identity
          }
        } catch (error) {
          console.warn(`Identity check attempt ${attempt + 1} failed:`, error)
        }
      }
      
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    return null
  }

  // Check if OISY wallet is available before attempting connection
  const checkOisyAvailability = async (): Promise<boolean> => {
    try {
      const { detectOisyWallet, checkOisyWithDiagnostics } = await import('../utils/oisyDetection')
      
      const diagnostics = await checkOisyWithDiagnostics()
      const { detection, browserInfo, recommendations } = diagnostics
      
      console.log('🔍 OISY Detection Results:', {
        installed: detection.isInstalled,
        open: detection.isOpen,
        available: detection.isAvailable,
        version: detection.version,
        cookiesEnabled: browserInfo.cookiesEnabled,
        storageAvailable: browserInfo.storageAvailable
      })
      
      if (recommendations.length > 0) {
        console.log('💡 OISY Setup Recommendations:', recommendations)
      }
      
      // Return true only if OISY is fully available
      return detection.isAvailable
    } catch (error) {
      console.warn('OISY availability check failed:', error)
      return false
    }
  }

  // Connect wallet (Oisy via IdentityKit)
  const connect = async (): Promise<boolean> => {
    setIsConnecting(true)
    setConnectionError(null) // Clear any previous errors
    
    try {
      // First check if OISY is available with detailed diagnostics
      console.log('🔍 Checking OISY wallet availability...')
      const oisyAvailable = await checkOisyAvailability()
      
      if (!oisyAvailable) {
        // Get detailed diagnostics for better error message
        const { checkOisyWithDiagnostics } = await import('../utils/oisyDetection')
        const diagnostics = await checkOisyWithDiagnostics()
        
        const errorMsg = diagnostics.detection.error || 'OISY wallet not available'
        const instructions = diagnostics.recommendations.join('\n')
        
        throw new Error(`${errorMsg}\n\nSetup Instructions:\n${instructions}`)
      }

      console.log('🔗 OISY wallet detected, attempting connection...')
      
      // Reduce timeout since we've validated OISY is available
      const connectionPromise = idkitConnect('OISY')
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - please approve the connection in OISY wallet')), 15000)
      })
      
      await Promise.race([connectionPromise, timeoutPromise])
      console.log('📡 IdentityKit connection established, waiting for identity...')
      
      // Wait for identity to be properly initialized with more attempts
      const readyIdentity = await waitForIdentity(20, 500)
      if (!readyIdentity) {
        throw new Error('Failed to initialize Oisy identity - please ensure OISY wallet is open and try again')
      }
      
      console.log('🔐 Identity ready, obtaining principal...')
      const principalRaw = await readyIdentity.getPrincipal()
      if (!principalRaw) {
        throw new Error('Failed to obtain principal from Oisy wallet - connection may have been rejected')
      }
      
      const principalStr = principalRaw.toText()
      const profile = await extractUserProfile(null, principalStr)
      setPrincipal(principalStr)
      setUserProfile(profile)
      setIsConnected(true)
      setConnectionError(null)
      storeConnection(principalStr, profile)
      console.log('✅ Connected to Oisy wallet:', principalStr)
      
      // Log browser-specific guidance if we detected issues earlier
      if (isBraveBrowser()) {
        console.log('💡 Brave Browser guidance:', getBrowserGuidance())
      }
      
      return true
    } catch (error) {
      const walletError = classifyWalletError(error)
      const friendlyMessage = getUserFriendlyErrorMessage(walletError)
      
      console.error('❌ Failed to connect to wallet:', friendlyMessage)
      console.error('💡 Browser guidance:', getBrowserGuidance())
      
      // Provide more specific error guidance
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.error('🕐 Connection timed out. Please ensure OISY wallet is open and try again.')
        } else if (error.message.includes('not detected')) {
          console.error('🔌 OISY wallet not found. Install from https://oisy.com')
        } else if (error.message.includes('rejected')) {
          console.error('🚫 Connection was rejected. Please approve the connection in OISY wallet.')
        }
      }
      
      setIsConnected(false)
      setConnectionError(walletError)
      throw walletError
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Create authenticated agent from IdentityKit when needed
  const createAuthAgent = async (): Promise<HttpAgent | null> => {
    try {
      if (!isConnected) {
        // Try to connect first
        await connect()
      }

      if (!idkitAgent) throw new Error('Wallet agent unavailable')
      if (!identity) throw new Error('Identity not available')

      // Create compatible agent adapter instead of unsafe casting
      const { createAgentAdapter } = await import('../services/agentAdapter')
      const adapter = createAgentAdapter(idkitAgent, identity, HOST, undefined)
      
      // Ensure correct host for local dev
      if (NETWORK !== 'ic') {
        await adapter.fetchRootKey()
      }

      // Validate adapter is ready before returning
      if (!adapter.isReady()) {
        throw new Error('Agent adapter is not ready - check wallet connection')
      }

      return adapter
    } catch (error) {
      console.error('Failed to create authenticated agent:', error)
      throw error
    }
  }

  // Get principal without creating full agent
  const getPrincipal = async (): Promise<string | null> => {
    try {
      const connected = await checkConnectionCached()
      if (!connected) return null
      
      const p = await identity?.getPrincipal()
      const principalStr = p ? Principal.from(p).toText() : null
      setPrincipal(principalStr)
      return principalStr
    } catch (error) {
      const walletError = classifyWalletError(error)
      
      // Don't log or set errors for extension issues that don't affect the app
      if (walletError.type === 'EXTENSION_ERROR' && !walletError.affectsApp) {
        // Silently fail for extension internal errors
        return null
      }
      
      console.error('Failed to get principal:', getUserFriendlyErrorMessage(walletError))
      
      // Only set connection error for errors that affect the app
      if (walletError.affectsApp !== false) {
        setConnectionError(walletError)
      }
      return null
    }
  }

  const disconnect = () => {
    setPrincipal(null)
    setUserProfile(null)
    setIsConnected(false)
    setIsAdmin(false)
    setAdminData(null)
    setConnectionError(null) // Clear connection errors
    clearStoredConnection()
    
    // Also disconnect from wallet if connected
    try {
      idkitDisconnect()
    } catch (error) {
      console.warn('Error disconnecting from wallet:', error)
    }
    
    console.log('🚪 Disconnected from wallet')
  }

  const clearConnectionError = () => {
    setConnectionError(null)
  }

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!isWalletAvailable || !principal) {
      setIsAdmin(false)
      return false
    }
    
    try {
      // Get detailed admin status
      const adminStatusInfo = getAdminStatus(principal)
      setIsAdmin(adminStatusInfo.isAdmin)
      
      // Comprehensive logging
      const logLevel = adminStatusInfo.isAdmin ? 'log' : 'info'
      console.group(`🔐 OHMS Admin Check - ${adminStatusInfo.isAdmin ? '✅ ADMIN' : '👤 USER'}`)
      console[logLevel]('Principal ID:', adminStatusInfo.principalId)
      console[logLevel]('Normalized ID:', adminStatusInfo.normalizedId)
      console[logLevel]('Network:', adminStatusInfo.network)
      console[logLevel]('Admin Count:', adminStatusInfo.adminCount)
      if (adminStatusInfo.matchedAdmin) {
        console[logLevel]('Matched Admin:', adminStatusInfo.matchedAdmin)
      }
      console.groupEnd()
      
      // Debug admin configuration in development or when debug is enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ADMIN_DEBUG === 'true') {
        debugAdminConfig()
      }
      
      return adminStatusInfo.isAdmin
    } catch (error) {
      console.error('❌ Failed to check admin status:', error)
      setIsAdmin(false)
      return false
    }
  }

  const refreshAdminData = async () => {
    if (!isAdmin) return
    
    try {
      const { createModelActor, createAgentActor, createCoordinatorActor, createEconActor } = await import('../services/canisterService')
      const authAgent = await createAuthAgent()
      if (!authAgent) return
      
      const modelActor = createModelActor(authAgent)
      const agentActor = createAgentActor(authAgent as any)
      const coordinatorActor = createCoordinatorActor(authAgent as any)
      const econActor = createEconActor(authAgent as any)
      
      const [models, agentHealth, coordinatorHealth, econHealth] = await Promise.all([
        modelActor.list_models([]),
        agentActor.health(),
        coordinatorActor.health(), 
        econActor.health()
      ])
      
      const modelList = models as any[]
      const modelStats = modelList.reduce((acc: any, m: any) => {
        acc.total += 1
        const st = Object.keys(m.state || {})[0] || 'Pending'
        acc[st.toLowerCase()] = (acc[st.toLowerCase()] || 0) + 1
        return acc
      }, { total: 0, active: 0, pending: 0, deprecated: 0 })
      
      setAdminData({
        health: {
          model: 'OK',
          agent: agentHealth,
          coordinator: coordinatorHealth,
          econ: econHealth
        },
        modelStats,
        agentHealth,
        routingHealth: coordinatorHealth,
        econHealth
      })
    } catch (error) {
      console.error('Failed to refresh admin data:', error)
    }
  }

  return (
    <AgentContext.Provider
      value={{
        canisterIds,
        isWalletAvailable,
        principal,
        userProfile,
        isConnected,
        isConnecting,
        connectionError,
        createAuthAgent,
        getPrincipal,
        connect,
        disconnect,
        isAdmin,
        checkAdminStatus,
        adminData,
        refreshAdminData,
        clearConnectionError,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export const useAgent = () => {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}