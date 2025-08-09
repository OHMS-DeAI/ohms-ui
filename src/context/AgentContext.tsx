import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { HttpAgent } from '@dfinity/agent'
import { debugAdminConfig, getAdminStatus, CURRENT_NETWORK, ADMIN_PRINCIPALS } from '../config/adminConfig'

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
  isPlugAvailable: boolean
  principal: string | null
  userProfile: UserProfile | null
  isConnected: boolean
  isConnecting: boolean
  createPlugAgent: () => Promise<HttpAgent | null>
  getPrincipal: () => Promise<string | null>
  connect: () => Promise<boolean>
  disconnect: () => void
  isAdmin: boolean
  checkAdminStatus: () => Promise<boolean>
  adminData: AdminData | null
  refreshAdminData: () => Promise<void>
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

// Default canister IDs (from our local deployment)
const defaultCanisterIds: CanisterIds = {
  ohms_model: import.meta.env.VITE_OHMS_MODEL_CANISTER_ID || '',
  ohms_agent: import.meta.env.VITE_OHMS_AGENT_CANISTER_ID || '',
  ohms_coordinator: import.meta.env.VITE_OHMS_COORDINATOR_CANISTER_ID || '',
  ohms_econ: import.meta.env.VITE_OHMS_ECON_CANISTER_ID || '',
}

interface AgentProviderProps {
  children: ReactNode
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [canisterIds] = useState<CanisterIds>(defaultCanisterIds)
  const [principal, setPrincipal] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isPlugAvailable, setIsPlugAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  // Local storage keys
  const STORAGE_KEYS = {
    WAS_CONNECTED: 'ohms_plug_was_connected',
    PRINCIPAL: 'ohms_principal',
    USER_PROFILE: 'ohms_user_profile',
    LAST_CONNECTION: 'ohms_last_connection'
  }
  
  // Extract user profile from Plug wallet
  const extractUserProfile = async (plug: any, principalStr: string): Promise<UserProfile> => {
    try {
      // Try to get account info if available
      let accountInfo = null
      if (plug.getManagementCanister) {
        try {
          accountInfo = await plug.getManagementCanister().getAccountInfo()
        } catch (error) {
          // Account info might not be available, that's OK
        }
      }
      
      const profile: UserProfile = {
        principal: principalStr,
        name: accountInfo?.name || `User ${principalStr.slice(0, 8)}...`,
        accountId: accountInfo?.accountId
      }
      
      return profile
    } catch (error) {
      console.warn('Could not extract full user profile:', error)
      return {
        principal: principalStr,
        name: `User ${principalStr.slice(0, 8)}...`
      }
    }
  }
  
  // Remove unused network detection variables

  // Check if Plug is available and attempt auto-reconnection
  useEffect(() => {
    const initializePlugConnection = async () => {
      const plug = (window as any).ic?.plug
      setIsPlugAvailable(!!plug)
      
      if (plug) {
        // Check if user was previously connected
        const wasConnected = localStorage.getItem(STORAGE_KEYS.WAS_CONNECTED) === 'true'
        const lastConnection = localStorage.getItem(STORAGE_KEYS.LAST_CONNECTION)
        const savedPrincipal = localStorage.getItem(STORAGE_KEYS.PRINCIPAL)
        const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
        
        // Auto-reconnect if user was connected within last 24 hours
        if (wasConnected && lastConnection && savedPrincipal) {
          const lastConnectTime = parseInt(lastConnection)
          const now = Date.now()
          const dayInMs = 24 * 60 * 60 * 1000
          
          if (now - lastConnectTime < dayInMs) {
            console.log('🔄 Attempting auto-reconnection to Plug wallet...')
            const profile = savedProfile ? JSON.parse(savedProfile) : null
            await attemptReconnection(savedPrincipal, profile)
          } else {
            // Clear old connection data
            clearStoredConnection()
          }
        }
      }
    }
    
    // Initial check
    initializePlugConnection()
    
    // Check again after a short delay in case Plug loads later
    const timer = setTimeout(initializePlugConnection, 1000)
    return () => clearTimeout(timer)
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
  
  const attemptReconnection = async (expectedPrincipal: string, savedProfile: UserProfile | null) => {
    try {
      const plug = (window as any).ic?.plug
      if (!plug) return false
      
      // Check if already connected
      if (plug.isConnected()) {
        const currentPrincipal = await plug.getPrincipal()
        const currentPrincipalStr = currentPrincipal?.toString() || String(currentPrincipal)
        
        if (currentPrincipalStr === expectedPrincipal) {
          setPrincipal(currentPrincipalStr)
          setIsConnected(true)
          
          // Use saved profile or extract fresh one
          let profile = savedProfile
          if (!profile) {
            profile = await extractUserProfile(plug, currentPrincipalStr)
            // Update storage with fresh profile
            storeConnection(currentPrincipalStr, profile)
          }
          setUserProfile(profile)
          
          console.log('✅ Auto-reconnected to Plug wallet:', profile.name || currentPrincipalStr)
          return true
        } else {
          // Different principal, disconnect and clear storage
          await plug.disconnect()
          clearStoredConnection()
        }
      }
      
      return false
    } catch (error) {
      console.log('❌ Auto-reconnection failed:', error)
      clearStoredConnection()
      return false
    }
  }
  
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

  // Connect to Plug wallet (manual connection)
  const connect = async (): Promise<boolean> => {
    if (!isPlugAvailable) {
      throw new Error('Plug wallet not found. Please install Plug wallet extension.')
    }
    
    setIsConnecting(true)
    try {
      const plug = (window as any).ic?.plug
      const whitelist = [
        'ryjl3-tyaaa-aaaaa-aaaba-cai', // ICP ledger
        canisterIds.ohms_model,
        canisterIds.ohms_agent,
        canisterIds.ohms_coordinator,
        canisterIds.ohms_econ,
      ]
      
      const connected = await plug.requestConnect({ 
        whitelist,
        timeout: 50000
      })
      
      if (!connected) {
        throw new Error('Connection denied by user')
      }
      
      // Get principal and extract user profile
      const p = await plug.getPrincipal()
      const principalStr = p?.toString?.() || String(p)
      const profile = await extractUserProfile(plug, principalStr)
      
      setPrincipal(principalStr)
      setUserProfile(profile)
      setIsConnected(true)
      storeConnection(principalStr, profile)
      
      console.log('✅ Connected to Plug wallet:', profile.name || principalStr)
      return true
    } catch (error) {
      console.error('❌ Failed to connect to Plug wallet:', error)
      setIsConnected(false)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Create authenticated agent when needed
  const createPlugAgent = async (): Promise<HttpAgent | null> => {
    try {
      if (!isConnected) {
        // Try to connect first
        await connect()
      }
      
      const plug = (window as any).ic?.plug
      if (!plug || !plug.isConnected()) {
        throw new Error('Plug wallet not connected')
      }
      
      return plug.agent
    } catch (error) {
      console.error('Failed to create Plug agent:', error)
      throw error
    }
  }

  // Get principal without creating full agent
  const getPrincipal = async (): Promise<string | null> => {
    try {
      const plug = (window as any).ic?.plug
      if (!plug) return null
      
      if (!plug.isConnected()) return null
      
      const p = await plug.getPrincipal()
      const principalStr = p?.toString?.() || String(p)
      setPrincipal(principalStr)
      return principalStr
    } catch (error) {
      console.error('Failed to get principal:', error)
      return null
    }
  }

  const disconnect = () => {
    setPrincipal(null)
    setUserProfile(null)
    setIsConnected(false)
    setIsAdmin(false)
    setAdminData(null)
    clearStoredConnection()
    
    // Also disconnect from Plug if connected
    try {
      const plug = (window as any).ic?.plug
      if (plug && plug.disconnect) {
        plug.disconnect()
      }
    } catch (error) {
      console.warn('Error disconnecting from Plug:', error)
    }
    
    console.log('🚪 Disconnected from Plug wallet')
  }

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!isPlugAvailable || !principal) {
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
      const plugAgent = await createPlugAgent()
      if (!plugAgent) return
      
      const modelActor = createModelActor(plugAgent)
      const agentActor = createAgentActor(plugAgent as any)
      const coordinatorActor = createCoordinatorActor(plugAgent as any)
      const econActor = createEconActor(plugAgent as any)
      
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
        isPlugAvailable,
        principal,
        userProfile,
        isConnected,
        isConnecting,
        createPlugAgent,
        getPrincipal,
        connect,
        disconnect,
        isAdmin,
        checkAdminStatus,
        adminData,
        refreshAdminData,
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