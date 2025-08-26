import { HttpAgent, Actor } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { getCanisterIdsFromEnv } from '../config/network'

/**
 * Profile Management Service
 * Integrates with the OHMS Profile Management Canister for custom user profiles
 */

// Profile data structures (matching canister types)
export interface UserProfile {
  principal_id: string
  username: string
  profile_photo_url?: string
  creation_timestamp: bigint
  last_update_timestamp: bigint
  profile_version: number
  session_data: SessionData
  verification_status: VerificationStatus
}

export interface SessionData {
  last_login: bigint
  login_count: number
  preferences: UserPreferences
  device_info: DeviceInfo[]
}

export interface UserPreferences {
  theme: string
  language: string
  notifications_enabled: boolean
  privacy_level: PrivacyLevel
}

export interface DeviceInfo {
  device_id: string
  last_access: bigint
  user_agent?: string
}

export type PrivacyLevel = 'Public' | 'Limited' | 'Private'
export type VerificationStatus = 'Unverified' | 'EmailVerified' | 'FullyVerified'

export interface ProfileUpdates {
  username?: string
  profile_photo_url?: string | null
  preferences?: UserPreferences
  privacy_level?: PrivacyLevel
}

export interface ProfileStats {
  creation_date: bigint
  total_logins: number
  last_activity: bigint
  profile_completeness: number
}

export interface UsernameAvailability {
  available: boolean
  suggestions: string[]
  reason?: string
}

export interface PublicProfile {
  username: string
  profile_photo_url?: string
  creation_timestamp: bigint
  verification_status: VerificationStatus
}

export type ProfileError = 
  | 'PrincipalNotFound'
  | 'ProfileAlreadyExists' 
  | 'InvalidUsername'
  | 'UsernameNotAvailable'
  | 'InvalidProfilePhoto'
  | { StorageError: string }
  | 'AuthenticationRequired'
  | 'PermissionDenied'
  | { ValidationError: string }
  | { SystemError: string }

// Candid Interface Definition
const profileServiceIDL = ({ IDL }) => IDL.Service({
  // Profile Operations
  create_profile: IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [IDL.Variant({
    Ok: IDL.Record({
      principal_id: IDL.Text,
      username: IDL.Text,
      profile_photo_url: IDL.Opt(IDL.Text),
      creation_timestamp: IDL.Nat64,
      last_update_timestamp: IDL.Nat64,
      profile_version: IDL.Nat32,
      session_data: IDL.Record({
        last_login: IDL.Nat64,
        login_count: IDL.Nat32,
        preferences: IDL.Record({
          theme: IDL.Text,
          language: IDL.Text,
          notifications_enabled: IDL.Bool,
          privacy_level: IDL.Variant({
            Public: IDL.Null,
            Limited: IDL.Null,
            Private: IDL.Null
          })
        }),
        device_info: IDL.Vec(IDL.Record({
          device_id: IDL.Text,
          last_access: IDL.Nat64,
          user_agent: IDL.Opt(IDL.Text)
        }))
      }),
      verification_status: IDL.Variant({
        Unverified: IDL.Null,
        EmailVerified: IDL.Null,
        FullyVerified: IDL.Null
      })
    }),
    Err: IDL.Variant({
      PrincipalNotFound: IDL.Null,
      ProfileAlreadyExists: IDL.Null,
      InvalidUsername: IDL.Null,
      UsernameNotAvailable: IDL.Null,
      InvalidProfilePhoto: IDL.Null,
      StorageError: IDL.Text,
      AuthenticationRequired: IDL.Null,
      PermissionDenied: IDL.Null,
      ValidationError: IDL.Text,
      SystemError: IDL.Text
    })
  })], []),

  get_profile: IDL.Func([], [IDL.Opt(IDL.Record({
    principal_id: IDL.Text,
    username: IDL.Text,
    profile_photo_url: IDL.Opt(IDL.Text),
    creation_timestamp: IDL.Nat64,
    last_update_timestamp: IDL.Nat64,
    profile_version: IDL.Nat32,
    session_data: IDL.Record({
      last_login: IDL.Nat64,
      login_count: IDL.Nat32,
      preferences: IDL.Record({
        theme: IDL.Text,
        language: IDL.Text,
        notifications_enabled: IDL.Bool,
        privacy_level: IDL.Variant({
          Public: IDL.Null,
          Limited: IDL.Null,
          Private: IDL.Null
        })
      }),
      device_info: IDL.Vec(IDL.Record({
        device_id: IDL.Text,
        last_access: IDL.Nat64,
        user_agent: IDL.Opt(IDL.Text)
      }))
    }),
    verification_status: IDL.Variant({
      Unverified: IDL.Null,
      EmailVerified: IDL.Null,
      FullyVerified: IDL.Null
    })
  }))], ['query']),

  update_profile: IDL.Func([IDL.Record({
    username: IDL.Opt(IDL.Text),
    profile_photo_url: IDL.Opt(IDL.Opt(IDL.Text)),
    preferences: IDL.Opt(IDL.Record({
      theme: IDL.Text,
      language: IDL.Text,
      notifications_enabled: IDL.Bool,
      privacy_level: IDL.Variant({
        Public: IDL.Null,
        Limited: IDL.Null,
        Private: IDL.Null
      })
    }))
  })], [IDL.Variant({
    Ok: IDL.Record({
      principal_id: IDL.Text,
      username: IDL.Text,
      profile_photo_url: IDL.Opt(IDL.Text),
      creation_timestamp: IDL.Nat64,
      last_update_timestamp: IDL.Nat64,
      profile_version: IDL.Nat32,
      session_data: IDL.Record({
        last_login: IDL.Nat64,
        login_count: IDL.Nat32,
        preferences: IDL.Record({
          theme: IDL.Text,
          language: IDL.Text,
          notifications_enabled: IDL.Bool,
          privacy_level: IDL.Variant({
            Public: IDL.Null,
            Limited: IDL.Null,
            Private: IDL.Null
          })
        }),
        device_info: IDL.Vec(IDL.Record({
          device_id: IDL.Text,
          last_access: IDL.Nat64,
          user_agent: IDL.Opt(IDL.Text)
        }))
      }),
      verification_status: IDL.Variant({
        Unverified: IDL.Null,
        EmailVerified: IDL.Null,
        FullyVerified: IDL.Null
      })
    }),
    Err: IDL.Variant({
      PrincipalNotFound: IDL.Null,
      ProfileAlreadyExists: IDL.Null,
      InvalidUsername: IDL.Null,
      UsernameNotAvailable: IDL.Null,
      InvalidProfilePhoto: IDL.Null,
      StorageError: IDL.Text,
      AuthenticationRequired: IDL.Null,
      PermissionDenied: IDL.Null,
      ValidationError: IDL.Text,
      SystemError: IDL.Text
    })
  })], []),

  delete_profile: IDL.Func([], [IDL.Variant({
    Ok: IDL.Null,
    Err: IDL.Variant({
      PrincipalNotFound: IDL.Null,
      AuthenticationRequired: IDL.Null,
      PermissionDenied: IDL.Null,
      SystemError: IDL.Text
    })
  })], []),

  // Query Operations
  profile_exists: IDL.Func([], [IDL.Bool], ['query']),
  
  check_username_availability: IDL.Func([IDL.Text], [IDL.Record({
    available: IDL.Bool,
    suggestions: IDL.Vec(IDL.Text),
    reason: IDL.Opt(IDL.Text)
  })], ['query']),

  get_profile_stats: IDL.Func([], [IDL.Opt(IDL.Record({
    creation_date: IDL.Nat64,
    total_logins: IDL.Nat32,
    last_activity: IDL.Nat64,
    profile_completeness: IDL.Float32
  }))], ['query']),

  get_public_profile_by_username: IDL.Func([IDL.Text], [IDL.Opt(IDL.Record({
    username: IDL.Text,
    profile_photo_url: IDL.Opt(IDL.Text),
    creation_timestamp: IDL.Nat64,
    verification_status: IDL.Variant({
      Unverified: IDL.Null,
      EmailVerified: IDL.Null,
      FullyVerified: IDL.Null
    })
  }))], ['query']),

  // Session Management
  update_session: IDL.Func([], [IDL.Variant({
    Ok: IDL.Null,
    Err: IDL.Variant({
      PrincipalNotFound: IDL.Null,
      AuthenticationRequired: IDL.Null
    })
  })], [])
})

/**
 * Profile Management Service Class
 */
export class ProfileService {
  private canisterId: string
  private actor: any = null

  constructor(canisterId?: string) {
    // Get canister ID from environment or use provided one
    this.canisterId = canisterId || this.getProfilesCanisterId()
    // Removed console log
  }

  private getProfilesCanisterId(): string {
    // For now, we'll construct the canister ID based on the pattern
    // In production, this should be in the canister_ids.json file
    const canisterIds = getCanisterIdsFromEnv()
    
    // Check if ohms_profiles is in the environment
    const profilesCanisterId = process.env.VITE_PROFILES_CANISTER_ID ||
                               (window as any).__VITE_PROFILES_CANISTER_ID__ ||
                               canisterIds.ohms_model // Use existing model canister as fallback
    
    // Removed console log
    return profilesCanisterId
  }

  /**
   * Create canister actor with authentication
   */
  private async createActor(agent: HttpAgent): Promise<any> {
    if (this.actor) {
      return this.actor
    }

    try {
      // Removed console log
      
      this.actor = Actor.createActor(profileServiceIDL, {
        agent,
        canisterId: this.canisterId
      })
      
      // Removed console log
      return this.actor
    } catch (error) {
      // Removed console log
      throw new Error(`Failed to create profile service actor: ${error}`)
    }
  }

  /**
   * Clear cached actor (for reconnection scenarios)
   */
  clearActor(): void {
    this.actor = null
  }

  /**
   * Create a new user profile
   */
  async createProfile(
    agent: HttpAgent,
    username: string,
    profilePhotoUrl?: string
  ): Promise<UserProfile> {
    try {
      // Removed console log
      
      const actor = await this.createActor(agent)
      const result = await actor.create_profile(username, profilePhotoUrl ? [profilePhotoUrl] : [])
      
      if ('Ok' in result) {
        const profile = result.Ok
        // Removed console log
        return this.convertCanisterProfile(profile)
      } else {
        const error = Object.keys(result.Err)[0] as keyof typeof result.Err
        // Removed console log
        throw new Error(`Profile creation failed: ${error}`)
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  /**
   * Get current user's profile
   */
  async getProfile(agent: HttpAgent): Promise<UserProfile | null> {
    try {
      // Removed console log
      
      const actor = await this.createActor(agent)
      const result = await actor.get_profile()
      
      if (result && result.length > 0) {
        const profile = result[0]
        // Removed console log
        return this.convertCanisterProfile(profile)
      } else {
        // Removed console log
        return null
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    agent: HttpAgent,
    updates: ProfileUpdates
  ): Promise<UserProfile> {
    try {
      // Removed console log
      
      const actor = await this.createActor(agent)
      
      // Convert updates to canister format
      const canisterUpdates = {
        username: updates.username ? [updates.username] : [],
        profile_photo_url: updates.profile_photo_url !== undefined ? 
          [updates.profile_photo_url ? [updates.profile_photo_url] : []] : [],
        preferences: updates.preferences ? [updates.preferences] : []
      }
      
      const result = await actor.update_profile(canisterUpdates)
      
      if ('Ok' in result) {
        const profile = result.Ok
        // Removed console log
        return this.convertCanisterProfile(profile)
      } else {
        const error = Object.keys(result.Err)[0] as keyof typeof result.Err
        // Removed console log
        throw new Error(`Profile update failed: ${error}`)
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(agent: HttpAgent): Promise<void> {
    try {
      // Removed console log
      
      const actor = await this.createActor(agent)
      const result = await actor.delete_profile()
      
      if ('Ok' in result) {
        // Removed console log
        this.clearActor() // Clear cached actor
      } else {
        const error = Object.keys(result.Err)[0] as keyof typeof result.Err
        // Removed console log
        throw new Error(`Profile deletion failed: ${error}`)
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  /**
   * Check if profile exists for current user
   */
  async profileExists(agent: HttpAgent): Promise<boolean> {
    try {
      const actor = await this.createActor(agent)
      const exists = await actor.profile_exists()
      
      // Removed console log
      return exists
    } catch (error) {
      // Removed console log
      return false
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(
    agent: HttpAgent,
    username: string
  ): Promise<UsernameAvailability> {
    try {
      // Removed console log
      
      const actor = await this.createActor(agent)
      const result = await actor.check_username_availability(username)
      
      // Removed console log
      return {
        available: result.available,
        suggestions: result.suggestions,
        reason: result.reason.length > 0 ? result.reason[0] : undefined
      }
    } catch (error) {
      // Removed console log
      return {
        available: false,
        suggestions: [],
        reason: 'Service error'
      }
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(agent: HttpAgent): Promise<ProfileStats | null> {
    try {
      const actor = await this.createActor(agent)
      const result = await actor.get_profile_stats()
      
      if (result && result.length > 0) {
        const stats = result[0]
        // Removed console log
        return {
          creation_date: stats.creation_date,
          total_logins: stats.total_logins,
          last_activity: stats.last_activity,
          profile_completeness: stats.profile_completeness
        }
      } else {
        return null
      }
    } catch (error) {
      // Removed console log
      return null
    }
  }

  /**
   * Get public profile by username
   */
  async getPublicProfileByUsername(
    agent: HttpAgent,
    username: string
  ): Promise<PublicProfile | null> {
    try {
      const actor = await this.createActor(agent)
      const result = await actor.get_public_profile_by_username(username)
      
      if (result && result.length > 0) {
        const profile = result[0]
        return {
          username: profile.username,
          profile_photo_url: profile.profile_photo_url.length > 0 ? profile.profile_photo_url[0] : undefined,
          creation_timestamp: profile.creation_timestamp,
          verification_status: Object.keys(profile.verification_status)[0] as VerificationStatus
        }
      } else {
        return null
      }
    } catch (error) {
      // Removed console log
      return null
    }
  }

  /**
   * Update session data (track login)
   */
  async updateSession(agent: HttpAgent): Promise<void> {
    try {
      const actor = await this.createActor(agent)
      const result = await actor.update_session()
      
      if ('Ok' in result) {
        // Removed console log
      } else {
        // Removed console log
      }
    } catch (error) {
      // Removed console log
      // Don't throw - session update is not critical
    }
  }

  /**
   * Convert canister profile format to TypeScript format
   */
  private convertCanisterProfile(canisterProfile: any): UserProfile {
    return {
      principal_id: canisterProfile.principal_id,
      username: canisterProfile.username,
      profile_photo_url: canisterProfile.profile_photo_url.length > 0 ? canisterProfile.profile_photo_url[0] : undefined,
      creation_timestamp: canisterProfile.creation_timestamp,
      last_update_timestamp: canisterProfile.last_update_timestamp,
      profile_version: canisterProfile.profile_version,
      session_data: {
        last_login: canisterProfile.session_data.last_login,
        login_count: canisterProfile.session_data.login_count,
        preferences: {
          theme: canisterProfile.session_data.preferences.theme,
          language: canisterProfile.session_data.preferences.language,
          notifications_enabled: canisterProfile.session_data.preferences.notifications_enabled,
          privacy_level: Object.keys(canisterProfile.session_data.preferences.privacy_level)[0] as PrivacyLevel
        },
        device_info: canisterProfile.session_data.device_info.map((device: any) => ({
          device_id: device.device_id,
          last_access: device.last_access,
          user_agent: device.user_agent.length > 0 ? device.user_agent[0] : undefined
        }))
      },
      verification_status: Object.keys(canisterProfile.verification_status)[0] as VerificationStatus
    }
  }

  /**
   * Validate username format
   */
  static validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'Username cannot be empty' }
    }

    if (username.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long' }
    }

    if (username.length > 30) {
      return { isValid: false, error: 'Username must be less than 30 characters long' }
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    const validFormat = /^[a-zA-Z0-9_-]+$/.test(username)
    if (!validFormat) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }

    // Check for reserved usernames
    const reserved = ['admin', 'system', 'root', 'api', 'www', 'mail', 'support']
    if (reserved.includes(username.toLowerCase())) {
      return { isValid: false, error: 'This username is reserved' }
    }

    return { isValid: true }
  }

  /**
   * Validate profile photo URL
   */
  static validateProfilePhotoUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || url.trim().length === 0) {
      return { isValid: true } // Empty URL is valid (no photo)
    }

    if (url.length > 500) {
      return { isValid: false, error: 'Profile photo URL is too long' }
    }

    if (!url.startsWith('https://')) {
      return { isValid: false, error: 'Profile photo must be an HTTPS URL' }
    }

    return { isValid: true }
  }
}

/**
 * Singleton profile service instance
 */
export const profileService = new ProfileService()

export default profileService