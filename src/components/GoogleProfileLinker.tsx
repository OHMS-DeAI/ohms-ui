import React, { useState } from 'react'
import { internetIdentityService, type GoogleAccountInfo } from '../services/internetIdentityService'
import { Button } from './Button'
import { Card } from './Card'

interface GoogleProfileLinkerProps {
  onProfileLinked?: (profile: GoogleAccountInfo) => void
  onProfileUnlinked?: () => void
}

export const GoogleProfileLinker: React.FC<GoogleProfileLinkerProps> = ({
  onProfileLinked,
  onProfileUnlinked
}) => {
  const [loading, setLoading] = useState(false)
  const [linkedProfile, setLinkedProfile] = useState<GoogleAccountInfo | null>(null)
  
  // Check if already linked on component mount
  React.useEffect(() => {
    const checkLinkedProfile = () => {
      const currentUser = internetIdentityService.getCurrentUser()
      if (currentUser?.googleAccount) {
        setLinkedProfile(currentUser.googleAccount)
      }
    }
    checkLinkedProfile()
  }, [])

  const handleLinkGoogle = async () => {
    setLoading(true)
    try {
      // Removed console log
      
      const profile = await internetIdentityService.linkGoogleAccountProfile()
      
      if (profile) {
        setLinkedProfile(profile)
        onProfileLinked?.(profile)
        // Removed console log
      } else {
        // Removed console log
      }
    } catch (error) {
      // Removed console log
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    setLoading(true)
    try {
      await internetIdentityService.unlinkGoogleAccountProfile()
      setLinkedProfile(null)
      onProfileUnlinked?.()
      // Removed console log
    } catch (error) {
      // Removed console log
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-textOnDark">
          Google Profile
        </h3>
        
        {linkedProfile ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {linkedProfile.picture && (
                <img 
                  src={linkedProfile.picture}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-textOnDark">
                  {linkedProfile.name}
                </p>
                <p className="text-sm text-gray-400">
                  {linkedProfile.email}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleUnlinkGoogle}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Unlinking...' : 'Unlink Google Account'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Link your Google account to display your name and profile picture.
            </p>
            
            <Button
              onClick={handleLinkGoogle}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Linking...' : '🔗 Link Google Account'}
            </Button>
            
            <p className="text-xs text-gray-500">
              Note: Requires VITE_GOOGLE_CLIENT_ID in environment variables.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default GoogleProfileLinker