import React, { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { profileService, ProfileService, type UserProfile, type ProfileUpdates, type UsernameAvailability, type ProfileStats } from '../services/profileService'
import Button from './Button'
import Input from './Input'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'
import Modal from './Modal'

interface ProfileManagerProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileFormData {
  username: string
  profilePhotoUrl: string
  theme: string
  language: string
  notificationsEnabled: boolean
  privacyLevel: 'Public' | 'Limited' | 'Private'
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ isOpen, onClose }) => {
  const { createAuthAgent, isConnected, principal } = useAgent()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    profilePhotoUrl: '',
    theme: 'system',
    language: 'en',
    notificationsEnabled: true,
    privacyLevel: 'Limited'
  })

  // Username availability checking
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean
    availability: UsernameAvailability | null
  }>({ checking: false, availability: null })

  // Load profile data when component opens
  useEffect(() => {
    if (isOpen && isConnected) {
      loadProfile()
    }
  }, [isOpen, isConnected])

  /**
   * Load user profile and stats
   */
  const loadProfile = async () => {
    if (!isConnected) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      // Check if profile exists
      const profileExists = await profileService.profileExists(agent)
      
      if (profileExists) {
        // Load existing profile
        const userProfile = await profileService.getProfile(agent)
        const stats = await profileService.getProfileStats(agent)
        
        if (userProfile) {
          setProfile(userProfile)
          setProfileStats(stats)
          updateFormFromProfile(userProfile)
          console.log('✅ Profile loaded:', userProfile.username)
        }
      } else {
        // No profile exists
        setProfile(null)
        setProfileStats(null)
        resetForm()
        console.log('📭 No profile found for user')
      }
    } catch (err) {
      console.error('❌ Failed to load profile:', err)
      setError(`Failed to load profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update form data from loaded profile
   */
  const updateFormFromProfile = (userProfile: UserProfile) => {
    setFormData({
      username: userProfile.username,
      profilePhotoUrl: userProfile.profile_photo_url || '',
      theme: userProfile.session_data.preferences.theme,
      language: userProfile.session_data.preferences.language,
      notificationsEnabled: userProfile.session_data.preferences.notifications_enabled,
      privacyLevel: userProfile.session_data.preferences.privacy_level
    })
  }

  /**
   * Reset form to defaults
   */
  const resetForm = () => {
    setFormData({
      username: '',
      profilePhotoUrl: '',
      theme: 'system',
      language: 'en',
      notificationsEnabled: true,
      privacyLevel: 'Limited'
    })
  }

  /**
   * Check username availability with debouncing
   */
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus({ checking: false, availability: null })
      return
    }

    // Skip check if username hasn't changed from current profile
    if (profile && profile.username === formData.username) {
      setUsernameStatus({ checking: false, availability: null })
      return
    }

    const timeoutId = setTimeout(async () => {
      if (!isConnected) return
      
      setUsernameStatus({ checking: true, availability: null })
      
      try {
        const agent = await createAuthAgent()
        if (!agent) return
        
        const availability = await profileService.checkUsernameAvailability(agent, formData.username)
        setUsernameStatus({ checking: false, availability })
      } catch (err) {
        console.warn('⚠️ Failed to check username availability:', err)
        setUsernameStatus({ checking: false, availability: null })
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [formData.username, isConnected, profile])

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
    setSuccess(null)
  }

  /**
   * Validate form data
   */
  const validateForm = (): string | null => {
    // Validate username
    const usernameValidation = ProfileService.validateUsername(formData.username)
    if (!usernameValidation.isValid) {
      return usernameValidation.error || 'Invalid username'
    }

    // Check username availability (if we have data)
    if (usernameStatus.availability && !usernameStatus.availability.available) {
      return usernameStatus.availability.reason || 'Username is not available'
    }

    // Validate profile photo URL if provided
    if (formData.profilePhotoUrl) {
      const urlValidation = ProfileService.validateProfilePhotoUrl(formData.profilePhotoUrl)
      if (!urlValidation.isValid) {
        return urlValidation.error || 'Invalid profile photo URL'
      }
    }

    return null
  }

  /**
   * Create new profile
   */
  const handleCreateProfile = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      await profileService.createProfile(
        agent,
        formData.username,
        formData.profilePhotoUrl || undefined
      )

      // Update profile with preferences if different from defaults
      if (formData.theme !== 'system' || 
          formData.language !== 'en' || 
          !formData.notificationsEnabled ||
          formData.privacyLevel !== 'Limited') {
        
        const updates: ProfileUpdates = {
          preferences: {
            theme: formData.theme,
            language: formData.language,
            notifications_enabled: formData.notificationsEnabled,
            privacy_level: formData.privacyLevel
          }
        }
        
        await profileService.updateProfile(agent, updates)
      }

      setSuccess('Profile created successfully!')
      await loadProfile() // Reload profile data
      setIsEditing(false)
      
      console.log('✅ Profile created and preferences updated')
    } catch (err) {
      console.error('❌ Failed to create profile:', err)
      setError(`Failed to create profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update existing profile
   */
  const handleUpdateProfile = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const updates: ProfileUpdates = {
        username: formData.username !== profile?.username ? formData.username : undefined,
        profile_photo_url: formData.profilePhotoUrl !== (profile?.profile_photo_url || '') ? 
          (formData.profilePhotoUrl || null) : undefined,
        preferences: {
          theme: formData.theme,
          language: formData.language,
          notifications_enabled: formData.notificationsEnabled,
          privacy_level: formData.privacyLevel
        }
      }

      await profileService.updateProfile(agent, updates)
      setSuccess('Profile updated successfully!')
      await loadProfile() // Reload profile data
      setIsEditing(false)
      
      console.log('✅ Profile updated successfully')
    } catch (err) {
      console.error('❌ Failed to update profile:', err)
      setError(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete profile
   */
  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      await profileService.deleteProfile(agent)
      setSuccess('Profile deleted successfully!')
      
      // Reset state
      setProfile(null)
      setProfileStats(null)
      resetForm()
      setIsEditing(false)
      
      console.log('✅ Profile deleted successfully')
    } catch (err) {
      console.error('❌ Failed to delete profile:', err)
      setError(`Failed to delete profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp / BigInt(1000000)))
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (!isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Profile Management">
        <div className="text-center py-8">
          <p className="text-gray-600">Please connect your wallet to manage your profile.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Management" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* User Info */}
        <Card className="bg-blue-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {profile?.username?.[0]?.toUpperCase() || principal?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-gray-900">
                {profile?.username || 'No Profile'}
              </h3>
              <p className="text-sm text-gray-600">
                Principal: {principal?.slice(0, 8)}...{principal?.slice(-8)}
              </p>
            </div>
            {profile && (
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Member since {formatTimestamp(profile.creation_timestamp).split(' ')[0]}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Profile Stats */}
        {profileStats && (
          <Card>
            <h4 className="font-semibold mb-4">Profile Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profileStats.total_logins}</div>
                <div className="text-sm text-gray-600">Total Logins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(profileStats.profile_completeness)}%</div>
                <div className="text-sm text-gray-600">Completeness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatTimestamp(profileStats.last_activity).split(' ')[0]}
                </div>
                <div className="text-sm text-gray-600">Last Activity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor((Date.now() - Number(profileStats.creation_date / BigInt(1000000))) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-gray-600">Days Member</div>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Form */}
        {(!profile || isEditing) && (
          <Card>
            <h4 className="font-semibold mb-4">
              {profile ? 'Edit Profile' : 'Create Profile'}
            </h4>
            
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username (3-30 characters)"
                  disabled={isLoading}
                  className="w-full"
                />
                {/* Username availability feedback */}
                {usernameStatus.checking && (
                  <p className="text-sm text-blue-600 mt-1">Checking availability...</p>
                )}
                {usernameStatus.availability && !usernameStatus.checking && (
                  <div className="mt-1">
                    {usernameStatus.availability.available ? (
                      <p className="text-sm text-green-600">✅ Username is available</p>
                    ) : (
                      <div>
                        <p className="text-sm text-red-600">❌ {usernameStatus.availability.reason}</p>
                        {usernameStatus.availability.suggestions.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Suggestions: {usernameStatus.availability.suggestions.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Photo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo URL
                </label>
                <Input
                  type="url"
                  value={formData.profilePhotoUrl}
                  onChange={(e) => handleInputChange('profilePhotoUrl', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional. Must be an HTTPS URL.
                </p>
              </div>

              {/* Preferences */}
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-3">Preferences</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      disabled={isLoading}
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      disabled={isLoading}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  {/* Privacy Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Privacy Level
                    </label>
                    <select
                      value={formData.privacyLevel}
                      onChange={(e) => handleInputChange('privacyLevel', e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      disabled={isLoading}
                    >
                      <option value="Public">Public</option>
                      <option value="Limited">Limited</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>

                  {/* Notifications */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.notificationsEnabled}
                        onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                        className="rounded border-gray-300"
                        disabled={isLoading}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Notifications
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  if (profile) {
                    updateFormFromProfile(profile)
                  } else {
                    resetForm()
                  }
                  setError(null)
                  setSuccess(null)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={profile ? handleUpdateProfile : handleCreateProfile}
                disabled={isLoading || usernameStatus.checking || 
                  (usernameStatus.availability && !usernameStatus.availability.available)}
              >
                {isLoading ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
              </Button>
            </div>
          </Card>
        )}

        {/* Profile Display */}
        {profile && !isEditing && (
          <Card>
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">Profile Details</h4>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteProfile}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="text-gray-900">{profile.username}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Profile Photo</label>
                  <div className="flex items-center space-x-3">
                    {profile.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=4285f4&color=fff`
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                    <p className="text-gray-900 text-sm">
                      {profile.profile_photo_url ? 'Custom photo' : 'Default avatar'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Verification Status</label>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      profile.verification_status === 'FullyVerified' ? 'bg-green-100 text-green-800' :
                      profile.verification_status === 'EmailVerified' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.verification_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Theme</label>
                  <p className="text-gray-900 capitalize">{profile.session_data.preferences.theme}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Language</label>
                  <p className="text-gray-900 uppercase">{profile.session_data.preferences.language}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Privacy Level</label>
                  <p className="text-gray-900">{profile.session_data.preferences.privacy_level}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Notifications</label>
                  <p className="text-gray-900">
                    {profile.session_data.preferences.notifications_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{formatTimestamp(profile.creation_timestamp)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatTimestamp(profile.last_update_timestamp)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Version</label>
                  <p className="text-gray-900">v{profile.profile_version}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* No Profile State */}
        {!profile && !isEditing && !isLoading && (
          <Card className="text-center py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Profile Found</h3>
              <p className="text-gray-600">
                Create a custom profile to personalize your OHMS experience.
              </p>
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
              >
                Create Profile
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  )
}

export default ProfileManager