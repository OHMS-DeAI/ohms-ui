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
import { Principal } from '@dfinity/principal'
import { internetIdentityService, type IIv2User, type GoogleAccountInfo } from '../services/internetIdentityService'
import { getLlmService, type LlmState, type QuantizedModel, type ConversationSession, LlmError } from '../services/llmService'

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
  email?: string // For Google account integration
  picture?: string // For Google profile picture
  googleId?: string // For Google account ID
  googleAccount?: GoogleAccountInfo // Full Google account info for Stripe
  isAnonymous?: boolean // From II v2
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
  initializeServices: () => Promise<void>
  clearConnectionError: () => void
  // LLM functionality
  llmState: LlmState
  createLlmConversation: (model: QuantizedModel) => Promise<ConversationSession>
  sendLlmMessage: (message: string) => Promise<void>
  switchLlmModel: (model: QuantizedModel) => Promise<void>
  deleteLlmConversation: (sessionId: string) => Promise<void>
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

  // LLM state
  const [llmState, setLlmState] = useState<LlmState>({
    conversations: new Map(),
    currentConversation: null,
    availableModels: [],
    userQuota: null,
    isLoading: false,
    error: null,
  })

  // Local storage keys
  const STORAGE_KEYS = {
    WAS_CONNECTED: 'ohms_was_connected',
    PRINCIPAL: 'ohms_principal',
    USER_PROFILE: 'ohms_user_profile',
    LAST_CONNECTION: 'ohms_last_connection'
  }
  
  // Initialize Internet Identity v2
  useEffect(() => {
    const initializeII = async () => {
      try {
        console.log('🔄 Initializing Internet Identity v2 integration...')
        const initialized = await internetIdentityService.initialize()
        setIsWalletAvailable(true)
        
        if (initialized) {
          // Restore existing session
          const authStatus = await internetIdentityService.getAuthStatus()
          if (authStatus.isAuthenticated && authStatus.user) {
            const userProfile = convertIIUserToProfile(authStatus.user)
            setPrincipal(authStatus.principal!)
            setUserProfile(userProfile)
            setIsConnected(true)
            storeConnection(authStatus.principal!, userProfile)
            console.log('✅ Restored II v2 session for:', authStatus.principal)
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize II v2:', error)
        setIsWalletAvailable(false)
      }
    }
    
    initializeII()
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

  // Convert II v2 user to UserProfile
  const convertIIUserToProfile = (iiUser: IIv2User): UserProfile => {
    return {
      principal: iiUser.principal,
      name: iiUser.name,
      email: iiUser.email,
      picture: iiUser.picture,
      googleId: iiUser.googleAccount?.googleId,
      googleAccount: iiUser.googleAccount,
      isAnonymous: iiUser.isAnonymous
    }
  }
  
  // Check admin status when principal changes
  useEffect(() => {
    if (principal) {
      // Initialize services for all users
      initializeServices()

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

  // Internet Identity v2 authentication
  const connect = async (): Promise<boolean> => {
    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      console.log('🔗 Starting Internet Identity v2 authentication...')
      
      // Authenticate with II v2
      const authResult = await internetIdentityService.authenticate(true) // Prefer Google
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed')
      }

      if (!authResult.user) {
        throw new Error('No user profile returned from authentication')
      }

      // Convert II user to UserProfile and update state
      const userProfile = convertIIUserToProfile(authResult.user)
      const principalString = authResult.user.principal

      setPrincipal(principalString)
      setUserProfile(userProfile)
      setIsConnected(true)
      setConnectionError(null)
      storeConnection(principalString, userProfile)

      console.log('✅ II v2 authentication successful:', {
        principal: principalString,
        name: userProfile.name,
        hasGoogleAccount: !!userProfile.googleAccount,
        email: userProfile.email
      })
      
      return true
    } catch (error) {
      const walletError = classifyWalletError(error)
      const friendlyMessage = getUserFriendlyErrorMessage(walletError)
      
      console.error('❌ II v2 authentication failed:', friendlyMessage)
      setIsConnected(false)
      setConnectionError(walletError)
      throw walletError
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Create authenticated agent with II v2
  const createAuthAgent = async (): Promise<HttpAgent | null> => {
    try {
      if (!isConnected) {
        // Try to connect first
        const connected = await connect()
        if (!connected) {
          throw new Error('Failed to establish II v2 connection')
        }
      }

      // Get agent from II v2 service
      const agent = internetIdentityService.createAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent - no identity available')
      }

      // For local development, fetch root key
      if (NETWORK !== 'ic') {
        await agent.fetchRootKey()
      }

      console.log('✅ Created authenticated agent for:', principal)
      return agent
    } catch (error) {
      console.error('❌ Failed to create authenticated agent:', error)
      throw error
    }
  }

  // Get principal from II v2
  const getPrincipal = async (): Promise<string | null> => {
    try {
      const authStatus = await internetIdentityService.getAuthStatus()
      if (authStatus.isAuthenticated && authStatus.principal) {
        setPrincipal(authStatus.principal)
        return authStatus.principal
      }
      return null
    } catch (error) {
      const walletError = classifyWalletError(error)
      console.error('Failed to get principal:', getUserFriendlyErrorMessage(walletError))
      setConnectionError(walletError)
      return null
    }
  }

  const disconnect = async () => {
    try {
      // Sign out from II v2 service
      await internetIdentityService.signOut()
    } catch (error) {
      console.warn('⚠️ Error signing out from II v2:', error)
    }
    
    setPrincipal(null)
    setUserProfile(null)
    setIsConnected(false)
    setIsAdmin(false)
    setAdminData(null)
    setConnectionError(null)
    clearStoredConnection()
    
    console.log('🚪 Disconnected from Internet Identity v2')
  }

  const clearConnectionError = () => {
    setConnectionError(null)
  }

  // LLM methods
  const createLlmConversation = async (model: QuantizedModel): Promise<ConversationSession> => {
    try {
      const llmServiceInstance = getLlmService()
      const conversation = await llmServiceInstance.createConversation(model)
      setLlmState(prev => ({
        ...prev,
        conversations: new Map(prev.conversations).set(conversation.session_id, conversation),
        currentConversation: conversation,
      }))
      return conversation
    } catch (error) {
      console.error('Failed to create LLM conversation:', error)
      throw error
    }
  }

  const sendLlmMessage = async (message: string): Promise<void> => {
    try {
      setLlmState(prev => ({ ...prev, isLoading: true, error: null }))

      const llmServiceInstance = getLlmService()
      await llmServiceInstance.sendMessage(message)

      // Update local state with new messages
      const currentState = llmServiceInstance.getState()
      setLlmState(prev => ({
        ...prev,
        conversations: currentState.conversations,
        currentConversation: currentState.currentConversation,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to send LLM message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLlmState(prev => ({
        ...prev,
        isLoading: false,
        error: { error: LlmError.InternalError, message: errorMessage }
      }))
      throw error
    }
  }

  const switchLlmModel = async (model: QuantizedModel): Promise<void> => {
    try {
      if (llmState.currentConversation) {
        const llmServiceInstance = getLlmService()
        await llmServiceInstance.switchModel(model)
        setLlmState(prev => ({
          ...prev,
          currentConversation: prev.currentConversation ? {
            ...prev.currentConversation,
            model
          } : null,
        }))
      }
    } catch (error) {
      console.error('Failed to switch LLM model:', error)
      throw error
    }
  }

  const deleteLlmConversation = async (sessionId: string): Promise<void> => {
    try {
      const llmServiceInstance = getLlmService()
      await llmServiceInstance.deleteConversation(sessionId)
      setLlmState(prev => {
        const newConversations = new Map(prev.conversations)
        newConversations.delete(sessionId)
        return {
          ...prev,
          conversations: newConversations,
          currentConversation: prev.currentConversation?.session_id === sessionId
            ? null
            : prev.currentConversation,
        }
      })
    } catch (error) {
      console.error('Failed to delete LLM conversation:', error)
      throw error
    }
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

  const initializeServices = async () => {
    try {
      console.log('🔄 Initializing services with agent canister...')
      
      const authAgent = await createAuthAgent()
      if (!authAgent) {
        console.warn('⚠️ No authenticated agent available for service initialization')
        return
      }

      // Import services dynamically to prevent circular dependencies
      const [{ createAgentActor }, { getApiClient }] = await Promise.all([
        import('../services/canisterService'),
        import('../services/apiClient')
      ])

      const agentActor = createAgentActor(authAgent as any)

      // Get current identity from II v2 service
      const currentIdentity = internetIdentityService.getCurrentIdentity()

      // Get the API client instance and initialize it
      const apiClientInstance = getApiClient()
      await apiClientInstance.initialize(authAgent, currentIdentity || undefined)

      // Initialize LLM service with agent canister
      const llmServiceInstance = getLlmService()
      await llmServiceInstance.initialize(agentActor)
      console.log('✅ Services initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize services:', error)
    }
  }

  const refreshAdminData = async () => {
    if (!isAdmin) return
    
    try {
      console.log('🔄 Refreshing admin data with II v2 agent...')
      const { createModelActor, createAgentActor, createCoordinatorActor, createEconActor } = await import('../services/canisterService')
      const authAgent = await createAuthAgent()
      if (!authAgent) {
        console.warn('⚠️ No authenticated agent available for admin data refresh')
        return
      }
      
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

      console.log('✅ Admin data refreshed successfully')
    } catch (error) {
      console.error('❌ Failed to refresh admin data:', error)
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
        initializeServices,
        clearConnectionError,
        // LLM functionality
        llmState,
        createLlmConversation,
        sendLlmMessage,
        switchLlmModel,
        deleteLlmConversation,
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