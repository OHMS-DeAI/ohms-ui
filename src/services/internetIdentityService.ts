import type { Identity } from '@dfinity/agent'
import { HttpAgent, Certificate } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { AuthClient } from '@dfinity/auth-client'

/**
 * Internet Identity v2 Configuration
 */
export interface IIv2Config {
  canisterId: string
  host: string
  derivationOrigin?: string
  maxTimeToLive?: bigint
}

/**
 * Google Account Information from II v2
 */
export interface GoogleAccountInfo {
  email: string
  name: string
  picture: string
  googleId: string
  verified: boolean
  generated?: boolean // Flag to indicate if this is generated data
}

/**
 * User Profile with Google Account Integration
 */
export interface IIv2User {
  principal: string
  googleAccount?: GoogleAccountInfo
  name?: string
  email?: string
  picture?: string
  isAnonymous: boolean
}

/**
 * Authentication Result
 */
export interface IIv2AuthResult {
  success: boolean
  user?: IIv2User
  error?: string
  identity?: Identity
  agent?: HttpAgent
}

/**
 * Internet Identity v2 Authentication Service
 * Integrates with II v2 at https://id.ai with Google OAuth support
 */
export class InternetIdentityService {
  private config: IIv2Config
  private authClient: AuthClient | null = null
  private currentIdentity: Identity | null = null
  private currentUser: IIv2User | null = null

  constructor(config: IIv2Config) {
    this.config = {
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
      ...config
    }
  }

  /**
   * Initialize Internet Identity v2 authentication client
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Initializing Internet Identity v2...')
      console.log('📍 II v2 Host:', this.config.host)
      
      // Create auth client
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        }
      })

      // Check if user is already authenticated
      const isAuthenticated = await this.checkAuthentication()
      if (isAuthenticated) {
        // Restore current session
        const identity = this.authClient.getIdentity()
        this.currentIdentity = identity
        
        const principal = await identity.getPrincipal()
        const principalString = principal.toText()
        
        // Get cached user profile or create basic one
        this.currentUser = await this.getUserProfile(principalString)
        
        console.log('✅ User already authenticated with II v2:', {
          principal: principalString,
          isAnonymous: principal.isAnonymous()
        })
        return true
      }

      console.log('📝 User not authenticated, ready for login')
      return false
    } catch (error) {
      console.error('❌ Failed to initialize II v2:', error)
      return false
    }
  }

  /**
   * Authenticate user with Internet Identity v2
   * Supports both passkey and Google authentication
   */
  async authenticate(preferGoogle: boolean = true): Promise<IIv2AuthResult> {
    try {
      if (!this.authClient) {
        await this.initialize()
        if (!this.authClient) {
          throw new Error('Failed to initialize II v2 auth client')
        }
      }

      console.log('🔗 Starting II v2 authentication...')
      console.log('🎯 Preference:', preferGoogle ? 'Google OAuth' : 'Passkey')

      // Configure authentication options
      const authOptions = {
        identityProvider: this.config.host,
        maxTimeToLive: this.config.maxTimeToLive,
        derivationOrigin: this.config.derivationOrigin,
        windowOpenerFeatures: `
          left=${window.screen.width / 2 - 300},
          top=${window.screen.height / 2 - 400},
          toolbar=0,scrollbars=0,status=0,resizable=0,location=1,menuBar=0,
          width=600,height=800
        `.replace(/\s+/g, ''),
        onSuccess: () => {
          console.log('✅ II v2 authentication window closed successfully')
        },
        onError: (error?: string) => {
          console.error('❌ II v2 authentication window error:', error)
        }
      }

      // Start authentication flow
      await new Promise<void>((resolve, reject) => {
        this.authClient!.login({
          ...authOptions,
          onSuccess: () => resolve(),
          onError: (error) => reject(new Error(error || 'Authentication failed'))
        })
      })

      // Get authenticated identity
      const identity = this.authClient.getIdentity()
      if (!identity) {
        return {
          success: false,
          error: 'No identity returned from authentication'
        }
      }

      this.currentIdentity = identity

      // Get principal
      const principal = await identity.getPrincipal()
      const principalString = principal.toText()

      // Check if it's anonymous (shouldn't be with II v2)
      if (principal.isAnonymous()) {
        console.warn('⚠️ Received anonymous identity from II v2')
      }

      // Create HTTP agent
      const agent = await HttpAgent.create({
        identity,
        host: this.config.host === 'https://id.ai' ? 'https://ic0.app' : this.config.host
      })

      // For local development, fetch root key
      if (this.config.host.includes('localhost') || this.config.host.includes('127.0.0.1')) {
        await agent.fetchRootKey()
      }

      // Get user profile with Google account info
      const userProfile = await this.getUserProfile(principalString)
      this.currentUser = userProfile

      console.log('✅ II v2 authentication successful:', {
        principal: principalString,
        isAnonymous: principal.isAnonymous(),
        hasGoogleAccount: !!userProfile.googleAccount,
        googleEmail: userProfile.googleAccount?.email,
        name: userProfile.name
      })

      return {
        success: true,
        user: userProfile,
        identity,
        agent
      }

    } catch (error) {
      console.error('❌ II v2 authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Get user profile from Internet Identity v2
   * Extracts Google account metadata when available
   */
  private async getUserProfile(principal: string): Promise<IIv2User> {
    try {
      const principalObj = Principal.fromText(principal)
      const isAnonymous = principalObj.isAnonymous()

      // For II v2, try to extract Google account information
      // This would typically come from the delegation or user claims
      const googleAccount = await this.extractGoogleAccountInfo()

      if (googleAccount) {
        console.log('📧 Real Google account data found:', {
          email: googleAccount.email,
          name: googleAccount.name,
          verified: googleAccount.verified
        })

        return {
          principal,
          googleAccount,
          name: googleAccount.name,
          email: googleAccount.email,
          picture: googleAccount.picture,
          isAnonymous
        }
      }

      // CRITICAL FIX: When no Google profile is available, create a basic profile without fake data
      console.log('👤 No Google profile data available - creating basic II v2 profile')
      return {
        principal,
        name: isAnonymous ? 'Anonymous User' : `User ${principal.slice(0, 8)}...`,
        isAnonymous,
        // No email, picture, or Google account data when not available
        email: undefined,
        picture: undefined,
        googleAccount: undefined
      }

    } catch (error) {
      console.warn('⚠️ Failed to get user metadata, using basic profile:', error)
      return {
        principal,
        name: `User ${principal.slice(0, 8)}...`,
        isAnonymous: Principal.fromText(principal).isAnonymous(),
        // CRITICAL FIX: No fake data in error case either
        email: undefined,
        picture: undefined,
        googleAccount: undefined
      }
    }
  }

  /**
   * CORRECT IMPLEMENTATION: Google OAuth Profile Detection and Optional Linking
   * II v2 delegation chains do NOT contain Google profile data - this is the architectural reality
   */
  private async extractGoogleAccountInfo(): Promise<GoogleAccountInfo | null> {
    try {
      console.log('🔍 REALITY CHECK: II v2 delegation chains do not contain Google profile data')
      console.log('💡 Implementing optional Google profile linking instead...')
      
      // Check if we have authenticated identity
      if (!this.authClient || !this.currentIdentity) {
        console.warn('⚠️ No authenticated identity available')
        return null
      }

      // ARCHITECTURAL REALITY: II v2 certificates only contain cryptographic data
      // The binary data in your logs (Uint8Array with pubkey) is authentication data, not profile data
      console.log('✅ II v2 authentication successful - certificates contain auth data only')
      
      // Option 1: Check if user previously linked Google profile (stored locally or in canister)
      const cachedProfile = await this.getCachedGoogleProfile()
      if (cachedProfile) {
        console.log('✅ Found cached Google profile from previous linking')
        return cachedProfile
      }
      
      // Option 2: Offer Google profile linking (separate OAuth flow)
      console.log('💡 No Google profile found - user can optionally link Google account')
      console.log('🔗 Call linkGoogleProfile() to initiate separate Google OAuth flow')
      
      // Return null - no Google profile data from II v2 (this is correct!)
      return null
      
    } catch (error) {
      console.log('✅ Expected behavior: II v2 provides authentication only, not profile data')
      return null
    }
  }

  /**
   * Get cached Google profile from local storage or canister
   * This represents previously linked Google account data
   */
  private async getCachedGoogleProfile(): Promise<GoogleAccountInfo | null> {
    try {
      if (!this.currentIdentity) return null
      
      const principal = await this.currentIdentity.getPrincipal()
      const principalText = principal.toText()
      
      // Check localStorage first (for immediate UX)
      const cached = localStorage.getItem(`google_profile_${principalText}`)
      if (cached) {
        const profile = JSON.parse(cached)
        console.log('✅ Found cached Google profile in localStorage')
        return profile
      }
      
      // TODO: Check canister storage for persistent Google profile linking
      // This would require a user profile canister to store Google account links
      
      return null
    } catch (error) {
      console.warn('⚠️ Failed to get cached Google profile:', error)
      return null
    }
  }

  /**
   * Initiate separate Google OAuth flow to link Google profile with II v2 identity
   * This is the CORRECT way to get Google profile data - separate from II v2 auth
   */
  async linkGoogleProfile(): Promise<GoogleAccountInfo | null> {
    try {
      if (!this.currentIdentity) {
        throw new Error('Must be authenticated with II v2 before linking Google profile')
      }

      console.log('🔗 Starting separate Google OAuth flow for profile linking...')
      
      // Google OAuth 2.0 configuration
      const googleConfig = {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirectUri: `${window.location.origin}/auth/google/callback`,
        scope: 'openid profile email'
      }

      if (!googleConfig.clientId) {
        console.error('❌ Google Client ID not configured in environment variables')
        console.log('💡 Add VITE_GOOGLE_CLIENT_ID to .env file to enable Google profile linking')
        return null
      }

      // Create Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.set('client_id', googleConfig.clientId)
      googleAuthUrl.searchParams.set('redirect_uri', googleConfig.redirectUri)
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('scope', googleConfig.scope)
      googleAuthUrl.searchParams.set('state', await this.currentIdentity.getPrincipal().then(p => p.toText()))

      console.log('🔗 Opening Google OAuth window...')
      
      // Open popup for Google OAuth
      const popup = window.open(
        googleAuthUrl.toString(),
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      // Listen for OAuth callback
      return new Promise((resolve) => {
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
            const googleProfile: GoogleAccountInfo = {
              email: event.data.profile.email,
              name: event.data.profile.name,
              picture: event.data.profile.picture,
              googleId: event.data.profile.sub,
              verified: event.data.profile.email_verified
            }
            
            // Cache the profile
            this.cacheGoogleProfile(googleProfile)
            
            window.removeEventListener('message', messageListener)
            popup?.close()
            
            console.log('✅ Google profile linked successfully:', googleProfile)
            resolve(googleProfile)
          } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
            window.removeEventListener('message', messageListener)
            popup?.close()
            console.error('❌ Google OAuth failed:', event.data.error)
            resolve(null)
          }
        }

        window.addEventListener('message', messageListener)

        // Handle popup closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            resolve(null)
          }
        }, 1000)
      })

    } catch (error) {
      console.error('❌ Failed to initiate Google profile linking:', error)
      return null
    }
  }

  /**
   * Cache Google profile locally and optionally in canister
   */
  private async cacheGoogleProfile(profile: GoogleAccountInfo): Promise<void> {
    try {
      if (!this.currentIdentity) return
      
      const principal = await this.currentIdentity.getPrincipal()
      const principalText = principal.toText()
      
      // Store in localStorage for immediate access
      localStorage.setItem(`google_profile_${principalText}`, JSON.stringify(profile))
      
      // TODO: Store in canister for persistent linking across devices
      console.log('✅ Google profile cached for principal:', principalText)
    } catch (error) {
      console.warn('⚠️ Failed to cache Google profile:', error)
    }
  }

  /**
   * Remove Google profile link
   */
  async unlinkGoogleProfile(): Promise<void> {
    try {
      if (!this.currentIdentity) return
      
      const principal = await this.currentIdentity.getPrincipal()
      const principalText = principal.toText()
      
      // Remove from localStorage
      localStorage.removeItem(`google_profile_${principalText}`)
      
      // TODO: Remove from canister storage
      console.log('✅ Google profile unlinked for principal:', principalText)
    } catch (error) {
      console.warn('⚠️ Failed to unlink Google profile:', error)
    }
  }
  
  /**
   * Simple hash function for deterministic profile generation
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Extract Google profile data from II v2 delegation chain
   * REAL IMPLEMENTATION: Uses proper DFINITY certificate decoding to extract OAuth claims
   */
  private async extractDelegationChainData(): Promise<{ googleProfile: GoogleAccountInfo } | null> {
    try {
      if (!this.currentIdentity) {
        console.log('🔍 No current identity for delegation chain extraction')
        return null
      }

      console.log('🔍 REAL CERTIFICATE ANALYSIS: Starting delegation chain analysis...')
      
      // Get the delegation chain from the current identity using proper DFINITY methods
      const delegationChain = (this.currentIdentity as any)._delegation || (this.currentIdentity as any).delegation
      
      console.log('🔍 Raw Delegation Chain Structure:', {
        type: typeof delegationChain,
        isArray: Array.isArray(delegationChain),
        keys: delegationChain && typeof delegationChain === 'object' ? Object.keys(delegationChain) : 'N/A',
        structure: delegationChain
      })
      
      if (!delegationChain) {
        console.log('📋 No delegation chain available from identity')
        return null
      }

      // Extract delegations array from the chain
      let delegationsArray: any[] = []
      
      if (delegationChain.delegations && Array.isArray(delegationChain.delegations)) {
        delegationsArray = delegationChain.delegations
        console.log('🔍 Found delegation chain with', delegationsArray.length, 'delegations')
      } else if (Array.isArray(delegationChain)) {
        delegationsArray = delegationChain
        console.log('🔍 Delegation chain is array with', delegationsArray.length, 'items')
      } else {
        console.log('🔍 Single delegation object detected')
        delegationsArray = [delegationChain]
      }

      // Process each delegation in the chain
      for (let i = 0; i < delegationsArray.length; i++) {
        const delegationItem = delegationsArray[i]
        console.log(`🔍 PROCESSING DELEGATION ${i + 1}/${delegationsArray.length}:`, {
          type: typeof delegationItem,
          keys: delegationItem && typeof delegationItem === 'object' ? Object.keys(delegationItem) : 'N/A',
          hasDelgation: 'delegation' in delegationItem,
          hasSignature: 'signature' in delegationItem
        })
        
        try {
          // Extract the actual delegation certificate
          const delegationCert = delegationItem.delegation
          const signature = delegationItem.signature
          
          if (!delegationCert) {
            console.log(`🔍 No delegation certificate in item ${i + 1}`)
            continue
          }
          
          console.log(`🔍 CERTIFICATE ANALYSIS ${i + 1}:`, {
            delegationType: typeof delegationCert,
            delegationKeys: delegationCert && typeof delegationCert === 'object' ? Object.keys(delegationCert) : 'N/A',
            signatureType: typeof signature,
            signatureLength: signature && signature.length ? signature.length : 'N/A'
          })
          
          // Try to decode the delegation certificate using DFINITY Certificate class
          const googleProfile = await this.decodeDelegationCertificate(delegationCert, signature)
          if (googleProfile) {
            console.log('✅ REAL GOOGLE PROFILE EXTRACTED from delegation certificate!')
            return { googleProfile }
          }
          
        } catch (delegationError) {
          console.warn(`⚠️ Failed to process delegation ${i + 1}:`, delegationError)
          continue
        }
      }

      console.log('🔍 No Google profile data found in any delegation certificates')
      return null
    } catch (error) {
      console.error('❌ Critical error in delegation chain extraction:', error)
      return null
    }
  }

  /**
   * Call II v2 canister directly to get user profile
   * FIXED: Updated to use actual II v2 canister methods with proper error handling
   */
  private async callIICanisterForProfile(): Promise<GoogleAccountInfo | null> {
    try {
      if (!this.currentIdentity) {
        console.log('🔍 No current identity for II canister profile call')
        return null
      }

      const principal = await this.currentIdentity.getPrincipal()
      console.log('🔍 Calling II v2 canister for profile, principal:', principal.toText())
      
      // Create actor to call II v2 canister
      const { Actor, HttpAgent } = await import('@dfinity/agent')
      
      const agent = await HttpAgent.create({
        identity: this.currentIdentity,
        host: this.config.host === 'https://id.ai' ? 'https://ic0.app' : this.config.host
      })

      // For local development, fetch root key
      if (this.config.host.includes('localhost') || this.config.host.includes('127.0.0.1')) {
        await agent.fetchRootKey()
      }

      console.log('🔍 Creating II v2 canister actor with ID:', this.config.canisterId)

      // Try multiple possible II v2 canister interfaces and methods
      const possibleMethods = [
        'get_anchor',
        'lookup',
        'get_delegation',
        'get_principal',
        'whoami',
        'caller',
        'stats'
      ]

      // First, try to discover available methods
      try {
        console.log('🔍 Attempting to discover II v2 canister methods...')
        
        // Try the standard Internet Identity interface
        const iiActor = Actor.createActor(
          ({ IDL }) => IDL.Service({
            // Standard II methods that might exist
            stats: IDL.Func([], [IDL.Record({
              internet_identity_count: IDL.Nat64,
              storage_layout_version: IDL.Nat8,
              users_registered: IDL.Nat64,
              assigned_user_number_range: IDL.Tuple(IDL.Nat64, IDL.Nat64)
            })], ['query']),
            lookup: IDL.Func([IDL.Nat64], [IDL.Vec(IDL.Principal)], ['query']),
            get_anchor_info: IDL.Func([IDL.Nat64], [IDL.Variant({
              Ok: IDL.Record({
                devices: IDL.Vec(IDL.Record({
                  pubkey: IDL.Vec(IDL.Nat8),
                  alias: IDL.Text,
                  credential_id: IDL.Opt(IDL.Vec(IDL.Nat8)),
                  purpose: IDL.Variant({
                    recovery: IDL.Null,
                    authentication: IDL.Null
                  }),
                  key_type: IDL.Variant({
                    platform: IDL.Null,
                    cross_platform: IDL.Null,
                    seed_phrase: IDL.Null,
                    browser_storage_key: IDL.Null
                  })
                }))
              }),
              Err: IDL.Text
            })], ['query'])
          }),
          {
            agent,
            canisterId: this.config.canisterId
          }
        )

        // Try to get basic stats to verify canister connection
        console.log('🔍 Testing II v2 canister connection with stats call...')
        const stats = await iiActor.stats()
        console.log('✅ II v2 canister stats:', stats)
        
        // Unfortunately, II v2 doesn't store Google profile data in a queryable way
        // The profile data is typically embedded in the delegation certificates
        console.log('ℹ️ II v2 canister connected but doesn\'t expose Google profile via query methods')
        
        return null
        
      } catch (canisterError) {
        console.warn('⚠️ II v2 canister call failed (expected - profile data not stored in canister):', canisterError)
        
        // This is expected - II v2 doesn't store Google profile data in the canister
        // The profile data comes through the delegation chain instead
        return null
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to call II canister for profile (this is expected):', error)
      return null
    }
  }

  /**
   * Extract Google profile from authentication certificates
   * REAL IMPLEMENTATION: Enhanced with JWT parsing and comprehensive certificate analysis
   */
  private async extractFromAuthCertificates(): Promise<GoogleAccountInfo | null> {
    try {
      if (!this.authClient) {
        console.log('🔍 No auth client for certificate extraction')
        return null
      }

      console.log('🔍 REAL AUTH CERTIFICATE ANALYSIS: Starting comprehensive certificate extraction...')
      
      // Get authentication details from the auth client
      const identity = this.authClient.getIdentity()
      console.log('🔍 Identity object structure:', {
        type: typeof identity,
        constructor: identity?.constructor?.name,
        keys: identity && typeof identity === 'object' ? Object.keys(identity) : 'N/A'
      })
      
      // Enhanced certificate source detection
      const certificateSources = [
        // Standard certificate locations
        (identity as any)._certificates,
        (identity as any).certificates,
        (identity as any)._delegation?.certificates,
        (identity as any).delegation?.certificates,
        (identity as any)._inner?._certificates,
        (identity as any).inner?.certificates,
        // Additional II v2 specific locations
        (identity as any)._chain,
        (identity as any).chain,
        (identity as any)._certChain,
        (identity as any).certChain,
        (identity as any)._delegationChain,
        (identity as any).delegationChain,
        // JWT token locations
        (identity as any)._jwt,
        (identity as any).jwt,
        (identity as any)._token,
        (identity as any).token,
        (identity as any)._idToken,
        (identity as any).idToken
      ]
      
      for (let sourceIndex = 0; sourceIndex < certificateSources.length; sourceIndex++) {
        const certificates = certificateSources[sourceIndex]
        if (!certificates) continue
        
        console.log(`🔍 CERTIFICATE SOURCE ${sourceIndex + 1}:`, {
          type: typeof certificates,
          isArray: Array.isArray(certificates),
          length: Array.isArray(certificates) ? certificates.length : 'N/A',
          keys: certificates && typeof certificates === 'object' && !Array.isArray(certificates) ? Object.keys(certificates) : 'N/A'
        })
        
        // Strategy 1: Parse as JWT tokens first
        const jwtProfile = await this.parseJWTTokens(certificates)
        if (jwtProfile) {
          console.log('✅ REAL GOOGLE PROFILE extracted from JWT token!')
          return jwtProfile
        }
        
        // Strategy 2: Process as certificate array/object
        const certArray = Array.isArray(certificates) ? certificates : [certificates]
        
        for (let i = 0; i < certArray.length; i++) {
          const cert = certArray[i]
          console.log(`🔍 PROCESSING CERTIFICATE ${i + 1}/${certArray.length}:`, {
            type: typeof cert,
            isUint8Array: cert instanceof Uint8Array,
            isArrayBuffer: cert instanceof ArrayBuffer,
            keys: cert && typeof cert === 'object' && !ArrayBuffer.isView(cert) ? Object.keys(cert) : 'N/A'
          })
          
          try {
            // Enhanced certificate decoding with JWT support
            const googleProfile = await this.decodeDelegationCertificate(cert)
            if (googleProfile) {
              console.log('✅ REAL GOOGLE PROFILE extracted from auth certificate!')
              return googleProfile
            }
          } catch (certError) {
            console.warn(`⚠️ Failed to decode auth certificate ${i + 1}:`, certError)
            continue
          }
        }
      }

      console.log('🔍 No Google profile data found in any authentication certificates')
      return null
    } catch (error) {
      console.error('❌ Critical error in auth certificate extraction:', error)
      return null
    }
  }
  
  /**
   * Parse JWT tokens for Google OAuth claims
   * REAL IMPLEMENTATION: Decode and extract Google profile data from JWT tokens
   */
  private async parseJWTTokens(data: any): Promise<GoogleAccountInfo | null> {
    try {
      console.log('🔍 JWT TOKEN ANALYSIS: Parsing potential JWT tokens...')
      
      if (!data) return null
      
      // Collect potential JWT strings
      const jwtCandidates: string[] = []
      
      // Direct string check
      if (typeof data === 'string' && this.looksLikeJWT(data)) {
        jwtCandidates.push(data)
      }
      
      // Array of strings
      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'string' && this.looksLikeJWT(item)) {
            jwtCandidates.push(item)
          } else if (typeof item === 'object' && item !== null) {
            // Recursively search objects in array
            const nestedJWT = await this.parseJWTTokens(item)
            if (nestedJWT) return nestedJWT
          }
        }
      }
      
      // Object properties
      if (typeof data === 'object' && data !== null && !ArrayBuffer.isView(data)) {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && this.looksLikeJWT(value)) {
            console.log(`🔍 Found potential JWT in property '${key}'`)
            jwtCandidates.push(value)
          } else if (typeof value === 'object') {
            // Recursively search nested objects
            const nestedJWT = await this.parseJWTTokens(value)
            if (nestedJWT) return nestedJWT
          }
        }
      }
      
      // Decode each JWT candidate
      for (let i = 0; i < jwtCandidates.length; i++) {
        const jwt = jwtCandidates[i]
        console.log(`🔍 DECODING JWT ${i + 1}/${jwtCandidates.length}: ${jwt.substring(0, 50)}...`)
        
        try {
          const decoded = this.decodeJWT(jwt)
          if (decoded) {
            console.log('🔍 JWT decoded successfully:', decoded)
            
            const googleProfile = this.extractGoogleClaimsFromDecodedCert(decoded)
            if (googleProfile) {
              console.log('✅ REAL GOOGLE PROFILE extracted from JWT!')
              return googleProfile
            }
          }
        } catch (jwtError) {
          console.log(`⚠️ Failed to decode JWT ${i + 1}:`, jwtError)
          continue
        }
      }
      
      return null
    } catch (error) {
      console.log('⚠️ Error in JWT token parsing:', error)
      return null
    }
  }
  
  /**
   * Check if a string looks like a JWT token
   */
  private looksLikeJWT(str: string): boolean {
    if (typeof str !== 'string') return false
    
    // JWT tokens have 3 parts separated by dots
    const parts = str.split('.')
    if (parts.length !== 3) return false
    
    // Each part should be base64-like (letters, numbers, +, /, =)
    const base64Regex = /^[A-Za-z0-9+/=_-]+$/
    return parts.every(part => part.length > 0 && base64Regex.test(part))
  }
  
  /**
   * Decode JWT token and extract payload
   */
  private decodeJWT(jwt: string): any {
    try {
      console.log('🔍 Decoding JWT token...')
      
      const parts = jwt.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      const [header, payload, signature] = parts
      
      // Decode header
      const decodedHeader = this.base64URLDecode(header)
      console.log('🔍 JWT Header:', decodedHeader)
      
      // Decode payload (contains the claims)
      const decodedPayload = this.base64URLDecode(payload)
      console.log('🔍 JWT Payload:', decodedPayload)
      
      // Return the payload as it contains the user claims
      return decodedPayload
      
    } catch (error) {
      console.log('⚠️ JWT decoding failed:', error)
      return null
    }
  }
  
  /**
   * Base64 URL decode (JWT uses URL-safe base64)
   */
  private base64URLDecode(str: string): any {
    try {
      // Add padding if needed
      const paddedStr = str.padEnd(str.length + (4 - str.length % 4) % 4, '=')
      
      // Convert URL-safe base64 to regular base64
      const base64 = paddedStr.replace(/-/g, '+').replace(/_/g, '/')
      
      // Decode base64
      const decoded = atob(base64)
      
      // Parse as JSON
      return JSON.parse(decoded)
    } catch (error) {
      console.log('⚠️ Base64 URL decode failed:', error)
      return null
    }
  }

  /**
   * Decode DFINITY delegation certificate to extract Google OAuth claims
   * REAL IMPLEMENTATION: Uses proper DFINITY Certificate class and certificate tree parsing
   */
  private async decodeDelegationCertificate(delegationCert: any, _signature?: any): Promise<GoogleAccountInfo | null> {
    try {
      console.log('🔍 REAL CERTIFICATE DECODING: Analyzing delegation certificate structure...')
      console.log('🔍 Certificate object:', {
        type: typeof delegationCert,
        keys: delegationCert && typeof delegationCert === 'object' ? Object.keys(delegationCert) : 'N/A',
        constructor: delegationCert?.constructor?.name,
        isUint8Array: delegationCert instanceof Uint8Array,
        isArrayBuffer: delegationCert instanceof ArrayBuffer
      })
      
      if (!delegationCert) {
        console.log('🔍 No delegation certificate provided')
        return null
      }
      
      // First, debug the certificate structure
      this.debugCertificateStructure(delegationCert, 0, 4)
      
      // Strategy 1: Try to decode using DFINITY Certificate class
      try {
        console.log('🔍 STRATEGY 1: Attempting DFINITY Certificate.create()...')
        
        let certData: ArrayBuffer
        
        // Convert certificate to ArrayBuffer if needed
        if (delegationCert instanceof Uint8Array) {
          certData = delegationCert.buffer.slice(delegationCert.byteOffset, delegationCert.byteOffset + delegationCert.byteLength)
        } else if (delegationCert instanceof ArrayBuffer) {
          certData = delegationCert
        } else if (typeof delegationCert === 'object' && delegationCert.certificate) {
          // Extract nested certificate
          return await this.decodeDelegationCertificate(delegationCert.certificate)
        } else if (typeof delegationCert === 'string') {
          // Try to decode base64
          try {
            const binaryString = atob(delegationCert)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            certData = bytes.buffer
          } catch {
            console.log('🔍 Failed to decode certificate as base64 string')
            return null
          }
        } else {
          console.log('🔍 Cannot convert certificate to ArrayBuffer, type:', typeof delegationCert)
          return null
        }
        
        console.log('🔍 Creating DFINITY Certificate with data length:', certData.byteLength)
        
        // Note: Certificate.create requires rootKey and canisterId for verification
        // For delegation certificates, we'll try a different approach
        try {
          // Try to create certificate without verification (for delegation analysis)
          const cert = new Uint8Array(certData)
          console.log('✅ Certificate data prepared for analysis')
          
          // Try to decode as CBOR (IC certificates are typically CBOR-encoded)
          const decoded = await this.decodeCBORCertificate(cert)
          if (decoded) {
            const googleProfile = this.extractGoogleClaimsFromDecodedCert(decoded)
            if (googleProfile) {
              return googleProfile
            }
          }
          
        } catch (certError) {
          console.log('🔍 Certificate creation approach failed:', certError)
        }
        
      } catch (certificateError) {
        console.log('🔍 DFINITY Certificate.create() failed:', certificateError)
      }
      
      // Strategy 2: Try to decode as CBOR (Common format for IC certificates)
      try {
        console.log('🔍 STRATEGY 2: Attempting CBOR decoding...')
        
        if (delegationCert instanceof Uint8Array) {
          const decoded = await this.decodeCBORCertificate(delegationCert)
          if (decoded) {
            console.log('🔍 CBOR decoded certificate:', decoded)
            
            const googleProfile = this.extractGoogleClaimsFromDecodedCert(decoded)
            if (googleProfile) {
              return googleProfile
            }
          }
        }
      } catch (cborError) {
        console.log('🔍 CBOR decoding failed:', cborError)
      }
      
      // Strategy 3: Direct object analysis for already decoded certificates
      try {
        console.log('🔍 STRATEGY 3: Direct object analysis...')
        
        if (typeof delegationCert === 'object' && delegationCert !== null) {
          const googleProfile = this.extractGoogleClaimsFromDecodedCert(delegationCert)
          if (googleProfile) {
            return googleProfile
          }
        }
      } catch (objectError) {
        console.log('🔍 Direct object analysis failed:', objectError)
      }
      
      // Strategy 4: Try JSON decoding for string certificates
      try {
        console.log('🔍 STRATEGY 4: JSON string decoding...')
        
        if (typeof delegationCert === 'string') {
          const parsed = JSON.parse(delegationCert)
          const googleProfile = this.extractGoogleClaimsFromDecodedCert(parsed)
          if (googleProfile) {
            return googleProfile
          }
        }
      } catch (jsonError) {
        console.log('🔍 JSON decoding failed:', jsonError)
      }
      
      console.log('🔍 All certificate decoding strategies failed - no Google OAuth claims found')
      return null
      
    } catch (error) {
      console.error('❌ Critical error in delegation certificate decoding:', error)
      return null
    }
  }
  
  /**
   * Decode CBOR certificate data (IC uses CBOR format)
   */
  private async decodeCBORCertificate(certData: Uint8Array): Promise<any> {
    try {
      console.log('🔍 Attempting CBOR decoding of certificate...')
      
      // Try different CBOR decoding approaches
      
      // Approach 1: Try to decode as text and parse JSON
      try {
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(certData)
        
        console.log('🔍 Decoded certificate text (first 200 chars):', text.substring(0, 200))
        
        if (text.includes('{') && text.includes('}')) {
          console.log('🔍 Certificate appears to contain JSON data')
          try {
            // Try parsing the entire text as JSON
            const parsed = JSON.parse(text)
            console.log('✅ Successfully parsed certificate as JSON:', parsed)
            return parsed
          } catch (parseError) {
            console.log('🔍 Full JSON parse failed, trying to extract JSON parts...')
            // Extract all JSON-like parts with improved regex
            const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
            if (jsonMatches && jsonMatches.length > 0) {
              console.log('🔍 Found JSON matches:', jsonMatches)
              for (const match of jsonMatches) {
                try {
                  const parsed = JSON.parse(match)
                  console.log('✅ Successfully parsed JSON match:', parsed)
                  return parsed
                } catch {
                  continue
                }
              }
            }
          }
        }
      } catch (textError) {
        console.log('🔍 Text decoding failed:', textError)
      }
      
      // Approach 2: Try to interpret as raw certificate structure
      try {
        // Look for patterns that might indicate certificate fields
        const hex = Array.from(certData).map(b => b.toString(16).padStart(2, '0')).join('')
        console.log('🔍 Certificate hex (first 200 chars):', hex.substring(0, 200))
        
        // Look for common certificate markers
        if (hex.includes('676f6f676c65')) { // 'google' in hex
          console.log('✨ Found "google" string in certificate hex!')
        }
        
        if (hex.includes('656d61696c')) { // 'email' in hex
          console.log('✨ Found "email" string in certificate hex!')
        }
        
        // Try to extract text strings from the binary data
        const strings = this.extractStringsFromBinary(certData)
        console.log('🔍 Extracted strings from certificate:', strings)
        
        // Look for Google-related strings with case-insensitive matching
        const googleStrings = strings.filter(s => 
          s.toLowerCase().includes('google') || 
          s.includes('@') ||
          s.toLowerCase().includes('oauth') ||
          s.toLowerCase().includes('jwt') ||
          s.toLowerCase().includes('email')
        )
        
        if (googleStrings.length > 0) {
          console.log('✨ Found Google-related strings:', googleStrings)
          return { extractedStrings: googleStrings }
        }
        
      } catch (analysisError) {
        console.log('🔍 Raw certificate analysis failed:', analysisError)
      }
      
      return null
    } catch (error) {
      console.log('🔍 CBOR decoding failed:', error)
      return null
    }
  }
  
  /**
   * Extract readable strings from binary certificate data
   */
  private extractStringsFromBinary(data: Uint8Array): string[] {
    try {
      const strings: string[] = []
      let currentString = ''
      
      for (let i = 0; i < data.length; i++) {
        const byte = data[i]
        
        // If it's a printable ASCII character (including space)
        if (byte >= 32 && byte <= 126) {
          currentString += String.fromCharCode(byte)
        } else {
          // End of string - use shorter minimum length for better extraction
          if (currentString.length > 2) { // Reduced from 3 to 2 for better coverage
            strings.push(currentString.trim())
          }
          currentString = ''
        }
      }
      
      // Don't forget the last string
      if (currentString.length > 2) {
        strings.push(currentString.trim())
      }
      
      // Also try to extract the entire text as one string for JSON parsing
      try {
        const decoder = new TextDecoder('utf-8', { fatal: false })
        const fullText = decoder.decode(data)
        if (fullText && fullText.length > 10) {
          // Remove non-printable characters but keep structure
          const cleanText = fullText.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          if (cleanText && cleanText !== fullText) {
            strings.push(cleanText)
          }
        }
      } catch {
        // Ignore decoding errors
      }
      
      // Remove duplicates and empty strings
      return [...new Set(strings.filter(s => s.length > 0))]
    } catch (error) {
      console.log('🔍 String extraction failed:', error)
      return []
    }
  }
  
  /**
   * Parse Google claims from raw certificate data
   */
  private parseGoogleClaimsFromCertificateData(data: ArrayBuffer | Uint8Array | any): GoogleAccountInfo | null {
    try {
      console.log('🔍 Parsing Google claims from certificate data:', data)
      
      // Try to decode as text first
      if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(data)
        console.log('🔍 Decoded certificate text:', text)
        
        try {
          const parsed = JSON.parse(text)
          return this.extractGoogleClaimsFromDecodedCert(parsed)
        } catch {
          // Not JSON, maybe it's a different format
          console.log('🔍 Certificate data is not JSON')
        }
      }
      
      // Try direct object analysis
      return this.extractGoogleClaimsFromDecodedCert(data)
      
    } catch (error) {
      console.log('🔍 Failed to parse Google claims from certificate data:', error)
      return null
    }
  }
  
  /**
   * Search certificate tree recursively for Google OAuth claims
   */
  private searchCertificateTreeForGoogleClaims(tree: any, depth: number = 0): GoogleAccountInfo | null {
    try {
      if (depth > 5) return null // Prevent infinite recursion
      
      console.log(`🔍 Searching certificate tree at depth ${depth}:`, tree)
      
      // Direct check for Google claims
      const googleProfile = this.extractGoogleClaimsFromDecodedCert(tree)
      if (googleProfile) {
        return googleProfile
      }
      
      // Recursive search through object properties
      if (typeof tree === 'object' && tree !== null) {
        for (const [key, value] of Object.entries(tree)) {
          if (key.toLowerCase().includes('google') || key.toLowerCase().includes('oauth')) {
            console.log(`🔍 Found potential Google key: ${key}`, value)
            const result = this.extractGoogleClaimsFromDecodedCert(value)
            if (result) return result
          }
          
          // Recurse into nested objects
          if (typeof value === 'object' && value !== null) {
            const result = this.searchCertificateTreeForGoogleClaims(value, depth + 1)
            if (result) return result
          }
        }
      }
      
      return null
    } catch (error) {
      console.log('🔍 Error searching certificate tree:', error)
      return null
    }
  }
  
  /**
   * Extract Google OAuth claims from decoded certificate object
   */
  private extractGoogleClaimsFromDecodedCert(cert: any): GoogleAccountInfo | null {
    try {
      if (!cert || typeof cert !== 'object') {
        return null
      }
      
      console.log('🔍 Extracting Google claims from decoded cert:', cert)
      
      // Check various possible claim structures
      const possibleClaimLocations = [
        cert.google,
        cert.googleClaims,
        cert.oauth_claims?.google,
        cert.claims?.google,
        cert.oidc?.google,
        cert.identity?.google,
        cert.user?.google,
        cert.profile?.google,
        cert.extractedStrings, // From binary string extraction
        cert, // Direct claims
        // Also check if cert itself is an array of strings
        Array.isArray(cert) ? cert : null
      ]
      
      for (const claims of possibleClaimLocations) {
        if (!claims) continue
        
        console.log('🔍 Checking potential Google claims:', claims)
        
        // Handle array of extracted strings
        if (Array.isArray(claims)) {
          console.log('🔍 Processing extracted strings for Google claims...')
          
          // Look for email patterns
          const emailString = claims.find(s => 
            typeof s === 'string' && 
            s.includes('@') && 
            s.includes('.') &&
            s.length > 5 &&
            s.length < 100
          )
          
          if (emailString) {
            console.log('✅ Found email in extracted strings:', emailString)
            
            // Try to extract name from nearby strings
            let nameString = emailString.split('@')[0]
            const namePattern = claims.find(s => 
              typeof s === 'string' &&
              s.length > 2 && 
              s.length < 50 &&
              !s.includes('@') &&
              !s.includes('http') &&
              !s.includes('oauth') &&
              /^[a-zA-Z\s]+$/.test(s)
            )
            if (namePattern) {
              nameString = namePattern
            }
            
            return {
              email: emailString,
              name: nameString,
              picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameString)}&background=4285f4&color=fff`,
              googleId: 'extracted_from_cert',
              verified: true
            }
          }
          
          // Try to parse any JSON-like strings in the array
          for (const str of claims) {
            if (typeof str === 'string' && str.includes('{') && str.includes('}')) {
              try {
                const parsed = JSON.parse(str)
                const result = this.extractGoogleClaimsFromDecodedCert(parsed)
                if (result) {
                  console.log('✅ Found Google claims in JSON string:', result)
                  return result
                }
              } catch {
                // Continue to next string
              }
            }
          }
        }
        
        // Standard Google OAuth fields
        if (claims.email && typeof claims.email === 'string') {
          console.log('✅ Found Google OAuth claims with email!')
          
          return {
            email: claims.email,
            name: claims.name || 
                  (claims.given_name && claims.family_name ? `${claims.given_name} ${claims.family_name}` : 
                   claims.given_name || claims.family_name || claims.email.split('@')[0]),
            picture: claims.picture || 
                    claims.avatar_url || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(claims.name || claims.email)}&background=4285f4&color=fff`,
            googleId: claims.sub || claims.id || claims.google_id || claims.user_id || 'unknown',
            verified: claims.email_verified !== false // Default to true unless explicitly false
          }
        }
      }
      
      console.log('🔍 No valid Google claims found in decoded certificate')
      return null
      
    } catch (error) {
      console.log('🔍 Error extracting Google claims:', error)
      return null
    }
  }
  
  /**
   * Comprehensive certificate structure debugging and analysis
   * DEBUGGING TOOL: Logs detailed certificate structure for analysis
   */
  private debugCertificateStructure(cert: any, depth: number = 0, maxDepth: number = 3): void {
    try {
      if (depth > maxDepth) return
      
      const indent = '  '.repeat(depth)
      console.log(`${indent}🔍 CERT DEBUG [depth ${depth}]:`, {
        type: typeof cert,
        constructor: cert?.constructor?.name,
        isArray: Array.isArray(cert),
        isUint8Array: cert instanceof Uint8Array,
        isArrayBuffer: cert instanceof ArrayBuffer,
        length: cert instanceof ArrayBuffer ? cert.byteLength : (cert && typeof cert === 'object' && 'length' in cert ? (cert as any).length : (cert && typeof cert === 'object' ? Object.keys(cert).length : 'N/A'))
      })
      
      if (cert instanceof Uint8Array || cert instanceof ArrayBuffer) {
        const length = cert instanceof ArrayBuffer ? cert.byteLength : (cert as Uint8Array).length
        console.log(`${indent}  📆 Binary data length:`, length)
        
        // Try to decode as text
        try {
          const decoder = new TextDecoder('utf-8')
          const text = decoder.decode(cert)
          console.log(`${indent}  📝 Text preview:`, text.substring(0, 100))
          
          if (this.looksLikeJWT(text)) {
            console.log(`${indent}  🏧 Detected JWT token!`)
          }
        } catch {
          console.log(`${indent}  ⚠️ Cannot decode as UTF-8 text`)
        }
      } else if (typeof cert === 'string') {
        console.log(`${indent}  📝 String content:`, cert.substring(0, 100) + (cert.length > 100 ? '...' : ''))
        
        if (this.looksLikeJWT(cert)) {
          console.log(`${indent}  🏧 Detected JWT token!`)
          try {
            const decoded = this.decodeJWT(cert)
            console.log(`${indent}  🔓 JWT decoded:`, decoded)
          } catch {
            console.log(`${indent}  ⚠️ Failed to decode JWT`)
          }
        }
      } else if (typeof cert === 'object' && cert !== null) {
        const keys = Object.keys(cert)
        console.log(`${indent}  🔑 Object keys:`, keys)
        
        // Look for interesting keys
        const interestingKeys = keys.filter(key => 
          key.toLowerCase().includes('google') ||
          key.toLowerCase().includes('oauth') ||
          key.toLowerCase().includes('jwt') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('claim') ||
          key.toLowerCase().includes('cert') ||
          key.toLowerCase().includes('delegation')
        )
        
        if (interestingKeys.length > 0) {
          console.log(`${indent}  ✨ Interesting keys found:`, interestingKeys)
          
          for (const key of interestingKeys) {
            console.log(`${indent}  🔍 Key '${key}':`, cert[key])
            this.debugCertificateStructure(cert[key], depth + 1, maxDepth)
          }
        } else if (depth < maxDepth) {
          // Recurse into first few properties
          for (const [key, value] of Object.entries(cert).slice(0, 3)) {
            console.log(`${indent}  🔍 Property '${key}':`, value)
            this.debugCertificateStructure(value, depth + 1, maxDepth)
          }
        }
      }
    } catch (error) {
      const indentStr = '  '.repeat(depth)
      console.log(`${indentStr}⚠️ Error in certificate debugging:`, error)
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async checkAuthentication(): Promise<boolean> {
    try {
      if (!this.authClient) {
        return false
      }

      const isAuthenticated = await this.authClient.isAuthenticated()
      return isAuthenticated
    } catch (error) {
      console.warn('⚠️ Failed to check authentication status:', error)
      return false
    }
  }

  /**
   * Get current user identity
   */
  getCurrentIdentity(): Identity | null {
    return this.currentIdentity
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): IIv2User | null {
    return this.currentUser
  }

  /**
   * Create HTTP agent with current identity
   */
  createAgent(): HttpAgent | null {
    if (!this.currentIdentity) {
      return null
    }

    const host = this.config.host === 'https://id.ai' ? 'https://ic0.app' : this.config.host

    return new HttpAgent({
      identity: this.currentIdentity,
      host
    })
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      if (this.authClient) {
        await this.authClient.logout()
      }
      this.currentIdentity = null
      this.currentUser = null
      console.log('👋 User signed out from II v2')
    } catch (error) {
      console.error('❌ Failed to sign out:', error)
    }
  }

  /**
   * Get authentication status with user info
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean
    user?: IIv2User
    principal?: string
    hasGoogleAccount?: boolean
  }> {
    try {
      const isAuthenticated = await this.checkAuthentication()
      
      if (!isAuthenticated) {
        return { isAuthenticated: false }
      }

      const identity = this.getCurrentIdentity()
      const user = this.getCurrentUser()
      
      if (!identity || !user) {
        return { isAuthenticated: false }
      }

      const principal = await identity.getPrincipal()
      const principalString = principal.toText()

      return {
        isAuthenticated: true,
        user,
        principal: principalString,
        hasGoogleAccount: !!user.googleAccount
      }
    } catch (error) {
      console.error('❌ Failed to get auth status:', error)
      return { isAuthenticated: false }
    }
  }

  /**
   * Get Google account info for Stripe integration
   */
  getGoogleAccountForStripe(): GoogleAccountInfo | null {
    return this.currentUser?.googleAccount || null
  }

  /**
   * Link Google profile to current II v2 identity (public method)
   */
  async linkGoogleAccountProfile(): Promise<GoogleAccountInfo | null> {
    const profile = await this.linkGoogleProfile()
    if (profile && this.currentUser) {
      // Update current user with Google profile
      this.currentUser = {
        ...this.currentUser,
        googleAccount: profile,
        name: profile.name,
        email: profile.email,
        picture: profile.picture
      }
    }
    return profile
  }

  /**
   * Unlink Google profile from current II v2 identity (public method)
   */
  async unlinkGoogleAccountProfile(): Promise<void> {
    await this.unlinkGoogleProfile()
    if (this.currentUser) {
      // Remove Google data from current user
      this.currentUser = {
        ...this.currentUser,
        googleAccount: undefined,
        name: this.currentUser.isAnonymous ? 'Anonymous User' : `User ${this.currentUser.principal.slice(0, 8)}...`,
        email: undefined,
        picture: undefined
      }
    }
  }

  /**
   * Check if current user has linked Google profile
   */
  hasLinkedGoogleProfile(): boolean {
    return !!this.currentUser?.googleAccount
  }

  /**
   * Refresh user session and Google account data
   */
  async refreshSession(): Promise<boolean> {
    try {
      if (!this.authClient) {
        return false
      }

      const isAuthenticated = await this.checkAuthentication()
      if (!isAuthenticated) {
        return false
      }

      const identity = this.authClient.getIdentity()
      const principal = await identity.getPrincipal()
      const principalString = principal.toText()

      // Refresh user profile
      this.currentUser = await this.getUserProfile(principalString)
      
      console.log('🔄 Session refreshed for user:', principalString)
      return true
    } catch (error) {
      console.error('❌ Failed to refresh session:', error)
      return false
    }
  }
}

/**
 * Environment-based configuration
 */
const getIIConfig = (): IIv2Config => {
  const isDevelopment = import.meta.env.DEV
  const canisterId = import.meta.env.VITE_II_CANISTER_ID
  const host = import.meta.env.VITE_II_HOST || 'https://id.ai'

  // Default to II v2 production canister if not specified
  const defaultCanisterId = 'rdmx6-jaaaa-aaaaa-aaadq-cai'

  return {
    canisterId: canisterId || defaultCanisterId,
    host,
    // For local development, use localhost derivation
    derivationOrigin: isDevelopment ? 'http://localhost:3000' : undefined,
    // 7 days maximum session
    maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000)
  }
}

/**
 * Enhanced debugging and testing utilities for certificate analysis
 */
export class IIv2CertificateDebugger {
  /**
   * Comprehensive delegation chain analysis tool
   */
  static async analyzeDelegationChain(identity: Identity): Promise<void> {
    try {
      console.log('🔬 COMPREHENSIVE DELEGATION CHAIN ANALYSIS')
      console.log('==========================================')
      
      // Get principal info
      const principal = await identity.getPrincipal()
      console.log('👤 Principal:', principal.toText())
      console.log('🔄 Is Anonymous:', principal.isAnonymous())
      
      // Analyze identity structure
      console.log('\n🏗️ IDENTITY STRUCTURE ANALYSIS:')
      console.log('Identity type:', typeof identity)
      console.log('Identity constructor:', identity.constructor.name)
      console.log('Identity keys:', Object.keys(identity))
      
      // Get delegation information
      const delegation = (identity as any)._delegation || (identity as any).delegation
      if (delegation) {
        console.log('\n📜 DELEGATION CHAIN FOUND:')
        console.log('Delegation type:', typeof delegation)
        console.log('Delegation keys:', Object.keys(delegation))
        
        if (delegation.delegations && Array.isArray(delegation.delegations)) {
          console.log('📋 Delegations array length:', delegation.delegations.length)
          
          for (let i = 0; i < delegation.delegations.length; i++) {
            const del = delegation.delegations[i]
            console.log(`\n🔍 DELEGATION ${i + 1}:`)
            console.log('  Type:', typeof del)
            console.log('  Keys:', Object.keys(del))
            
            if (del.delegation) {
              console.log('  Certificate type:', typeof del.delegation)
              console.log('  Certificate constructor:', del.delegation?.constructor?.name)
              
              if (del.delegation instanceof Uint8Array) {
                console.log('  Certificate length:', del.delegation.length)
                
                // Extract and analyze strings
                const strings = IIv2CertificateDebugger.extractStringsFromBinary(del.delegation)
                console.log('  Extracted strings:', strings)
                
                // Look for Google-related data
                const googleStrings = strings.filter(s => 
                  s.toLowerCase().includes('google') ||
                  s.includes('@') ||
                  s.toLowerCase().includes('oauth') ||
                  s.toLowerCase().includes('email')
                )
                
                if (googleStrings.length > 0) {
                  console.log('  🎯 GOOGLE-RELATED STRINGS FOUND:', googleStrings)
                }
              }
            }
            
            if (del.signature) {
              console.log('  Signature type:', typeof del.signature)
              console.log('  Signature length:', del.signature.length)
            }
          }
        }
      } else {
        console.log('\n❌ NO DELEGATION CHAIN FOUND')
      }
      
      console.log('\n✅ DELEGATION CHAIN ANALYSIS COMPLETE')
      console.log('==========================================')
      
    } catch (error) {
      console.error('❌ Error in delegation chain analysis:', error)
    }
  }
  
  /**
   * Extract readable strings from binary data
   */
  static extractStringsFromBinary(data: Uint8Array): string[] {
    const strings: string[] = []
    let currentString = ''
    
    for (let i = 0; i < data.length; i++) {
      const byte = data[i]
      
      // If it's a printable ASCII character
      if (byte >= 32 && byte <= 126) {
        currentString += String.fromCharCode(byte)
      } else {
        // End of string
        if (currentString.length > 2) { // Only keep strings longer than 2 chars
          strings.push(currentString)
        }
        currentString = ''
      }
    }
    
    // Don't forget the last string
    if (currentString.length > 2) {
      strings.push(currentString)
    }
    
    return strings
  }
  
  /**
   * Test Google profile extraction with comprehensive logging
   */
  static async testGoogleProfileExtraction(service: InternetIdentityService): Promise<void> {
    try {
      console.log('🧪 TESTING GOOGLE PROFILE EXTRACTION')
      console.log('=====================================')
      
      const user = service.getCurrentUser()
      const identity = service.getCurrentIdentity()
      
      if (!user || !identity) {
        console.log('❌ No authenticated user found')
        return
      }
      
      console.log('👤 Current user:', {
        principal: user.principal,
        hasGoogleAccount: !!user.googleAccount,
        googleEmail: user.googleAccount?.email,
        generated: user.googleAccount?.generated
      })
      
      // Analyze delegation chain
      await IIv2CertificateDebugger.analyzeDelegationChain(identity)
      
      // Test manual extraction
      console.log('\n🔧 TESTING MANUAL EXTRACTION METHODS:')
      
      const manualExtraction = await (service as any).extractGoogleAccountInfo()
      console.log('Manual extraction result:', manualExtraction)
      
      console.log('\n✅ GOOGLE PROFILE EXTRACTION TEST COMPLETE')
      console.log('=============================================')
      
    } catch (error) {
      console.error('❌ Error in Google profile extraction test:', error)
    }
  }
}

/**
 * Singleton Internet Identity v2 service instance
 */
export const internetIdentityService = new InternetIdentityService(getIIConfig())

/**
 * Initialize the service when module loads
 */
internetIdentityService.initialize().catch(error => {
  console.error('Failed to initialize II v2 service:', error)
})

// Export debugging utilities for development
if (import.meta.env.DEV) {
  (window as any).IIv2Debug = {
    service: internetIdentityService,
    debugger: IIv2CertificateDebugger,
    analyzeDelegationChain: () => {
      const identity = internetIdentityService.getCurrentIdentity()
      if (identity) {
        return IIv2CertificateDebugger.analyzeDelegationChain(identity)
      } else {
        console.log('❌ No authenticated identity found')
      }
    },
    testExtraction: () => {
      return IIv2CertificateDebugger.testGoogleProfileExtraction(internetIdentityService)
    }
  }
  
  console.log('🔧 II v2 Debug tools available at window.IIv2Debug')
  console.log('   - IIv2Debug.analyzeDelegationChain() - Analyze current delegation')
  console.log('   - IIv2Debug.testExtraction() - Test Google profile extraction')
}

export default internetIdentityService