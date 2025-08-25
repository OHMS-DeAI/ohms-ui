import React, { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import ProfilePhoto from './ProfilePhoto'

interface SimpleUserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SimpleUserAvatar: React.FC<SimpleUserAvatarProps> = ({ 
  size = 'sm', 
  className = '' 
}) => {
  const { userProfile, principal, isAdmin, disconnect } = useAgent()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!userProfile || !principal) {
    return null
  }

  // Format principal for display (first 5 and last 5 characters)
  const formatPrincipal = (principalId: string): string => {
    if (principalId.length <= 12) return principalId
    return `${principalId.slice(0, 5)}...${principalId.slice(-5)}`
  }

  const handleSignOut = async () => {
    setIsDropdownOpen(false)
    await disconnect()
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-light hover:border-border transition-all duration-300 group w-full"
        aria-label="User menu"
      >
        <ProfilePhoto
          src={userProfile.picture}
          alt={userProfile.name || 'User'}
          fallbackName={userProfile.name}
          size={size}
          className="ring-2 ring-purple-400/20 group-hover:ring-purple-400/40"
        />
        
        <div className="flex flex-col items-start min-w-0 flex-1">
          <div className="flex items-center gap-1 md:gap-1.5">
            <span className="text-sm font-medium text-textOnDark truncate max-w-20 md:max-w-24">
              {userProfile.name || 'Anonymous'}
            </span>
            {userProfile.googleAccount && (
              <svg className="w-3 h-3 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-0.5 15l-3.5-3.5 1.4-1.4 2.1 2.1 4.1-4.1 1.4 1.4-5.5 5.5z"/>
              </svg>
            )}
            {isAdmin && (
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-textOnDark/60 font-mono hidden md:block">
            {formatPrincipal(principal)}
          </span>
        </div>
        
        <svg 
          className={`w-4 h-4 text-textOnDark/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-surface-light backdrop-blur-md border border-border rounded-lg shadow-xl z-20 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <ProfilePhoto
                  src={userProfile.picture}
                  alt={userProfile.name || 'User'}
                  fallbackName={userProfile.name}
                  size="md"
                  className="ring-2 ring-purple-400/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textOnDark truncate">
                    {userProfile.name || 'Anonymous User'}
                  </p>
                  {userProfile.email && (
                    <p className="text-xs text-textOnDark/60 truncate">
                      {userProfile.email}
                    </p>
                  )}
                  <p className="text-xs font-mono text-textOnDark/50 mt-1">
                    {formatPrincipal(principal)}
                  </p>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-2 mt-2">
                {userProfile.googleAccount && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-0.5 15l-3.5-3.5 1.4-1.4 2.1 2.1 4.1-4.1 1.4 1.4-5.5 5.5z"/>
                    </svg>
                    Google
                  </div>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600/20 to-purple-400/20 text-purple-300 rounded-full text-xs">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full" />
                    Admin
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-textOnDark hover:bg-purple-600/20 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SimpleUserAvatar