import React from 'react'
import { useAgent } from '../context/AgentContext'
import Button from './Button'
import Modal from './Modal'
import ProfilePhoto from './ProfilePhoto'

interface SimplifiedProfileManagerProps {
  isOpen: boolean
  onClose: () => void
}

export const SimplifiedProfileManager: React.FC<SimplifiedProfileManagerProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { userProfile, principal, isAdmin, disconnect, isConnected } = useAgent()

  const handleSignOut = async () => {
    try {
      await disconnect()
      onClose()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  // Format principal for display
  const formatPrincipal = (principalId: string): string => {
    if (principalId.length <= 16) return principalId
    return `${principalId.slice(0, 8)}...${principalId.slice(-8)}`
  }

  if (!isConnected || !userProfile || !principal) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className="text-center py-8">
          <p className="text-textOnDark/60">Please connect your Internet Identity to view your profile.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" maxWidth="max-w-md">
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-gradient-to-br from-purple-600/10 to-purple-400/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <ProfilePhoto
              src={userProfile.picture}
              alt={userProfile.name || 'User'}
              fallbackName={userProfile.name}
              size="lg"
              className="ring-2 ring-purple-400/30"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-textOnDark mb-1">
                {userProfile.name || 'Anonymous User'}
              </h3>
              {userProfile.email && (
                <p className="text-sm text-textOnDark/70 mb-2">
                  {userProfile.email}
                </p>
              )}
              <p className="text-xs font-mono text-textOnDark/60 bg-primary/50 px-2 py-1 rounded">
                {formatPrincipal(principal)}
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-purple-500/20">
            {userProfile.googleAccount && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-0.5 15l-3.5-3.5 1.4-1.4 2.1 2.1 4.1-4.1 1.4 1.4-5.5 5.5z"/>
                </svg>
                Google Account Linked
              </div>
            )}
            
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full" />
                Administrator
              </div>
            )}

            {!userProfile.googleAccount && !isAdmin && (
              <div className="text-sm text-textOnDark/60">
                Internet Identity User
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="text-sm text-textOnDark/70">
          <p>
            Your Internet Identity provides secure, passwordless authentication 
            for the Internet Computer ecosystem.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          
          <Button
            variant="purple"
            onClick={handleSignOut}
            className="flex-1"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SimplifiedProfileManager