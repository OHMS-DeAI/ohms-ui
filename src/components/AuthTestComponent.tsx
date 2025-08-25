import React, { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import SimpleUserAvatar from './SimpleUserAvatar'
import SimplifiedProfileManager from './SimplifiedProfileManager'
import Button from './Button'

/**
 * Test component to verify simplified authentication system
 * This component demonstrates the new streamlined authentication UI
 */
const AuthTestComponent: React.FC = () => {
  const { isConnected, isConnecting, connect, userProfile, principal, isAdmin } = useAgent()
  const [showProfileModal, setShowProfileModal] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-textOnDark">Authentication System Test</h2>
      
      {/* Connection Status */}
      <div className="bg-primary/30 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-textOnDark mb-3">Connection Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-textOnDark">
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          
          {userProfile && (
            <>
              <div className="text-sm text-textOnDark/70">
                <strong>User:</strong> {userProfile.name || 'Anonymous'}
              </div>
              <div className="text-xs text-textOnDark/60 font-mono">
                <strong>Principal:</strong> {principal?.slice(0, 16)}...
              </div>
              {isAdmin && (
                <div className="text-sm text-purple-300">
                  <strong>Admin Status:</strong> Administrator
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Authentication Controls */}
      <div className="bg-primary/30 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-textOnDark mb-3">Authentication Controls</h3>
        
        {!isConnected ? (
          <Button
            variant="purple"
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Connect Internet Identity
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* User Avatar Component */}
            <div>
              <h4 className="text-sm font-medium text-textOnDark mb-2">User Avatar Component:</h4>
              <div className="max-w-xs">
                <SimpleUserAvatar size="md" />
              </div>
            </div>
            
            {/* Profile Modal Test */}
            <div>
              <h4 className="text-sm font-medium text-textOnDark mb-2">Profile Modal:</h4>
              <Button
                variant="outline"
                onClick={() => setShowProfileModal(true)}
                size="sm"
              >
                Open Profile Modal
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Features Demonstrated */}
      <div className="bg-primary/30 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-textOnDark mb-3">Features Implemented</h3>
        <ul className="space-y-1 text-sm text-textOnDark/80">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Simplified user avatar with purple gradient design
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Click-to-sign-out functionality via dropdown
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Shortened principal identifier display
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Subtle admin indicators with purple accents
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Mobile-responsive design
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No verbose welcome messages
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Internet Identity v2 integration maintained
          </li>
        </ul>
      </div>

      {/* Profile Modal */}
      <SimplifiedProfileManager
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}

export default AuthTestComponent