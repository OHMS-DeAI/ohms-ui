import React, { useState, useCallback } from 'react'

interface ProfilePhotoProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackName?: string
  className?: string
  onClick?: () => void
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  src,
  alt,
  size = 'md',
  fallbackName,
  className = '',
  onClick
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }

  const sizeClass = sizeClasses[size]

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
    setImageError(false)
  }, [])

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageLoading(false)
    setImageError(true)
  }, [])

  // Generate initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?'
    
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  // Generate fallback avatar URL using UI Avatars
  const getFallbackAvatarUrl = (name?: string): string => {
    const initials = encodeURIComponent(getInitials(name))
    const bgColor = 'f59e0b' // OHMS gold color
    const textColor = 'ffffff'
    const size = 128 // High resolution for crisp display
    
    return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=${textColor}&size=${size}&bold=true&format=png`
  }

  // Determine what to display
  const shouldShowImage = src && !imageError
  const shouldShowFallback = !src || imageError

  return (
    <div 
      className={`${sizeClass} rounded-full overflow-hidden bg-accentGold/20 border-2 border-accentGold/40 flex items-center justify-center flex-shrink-0 ${onClick ? 'cursor-pointer hover:border-accentGold/60 transition-colors' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {shouldShowImage && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {shouldShowFallback && (
        <>
          {fallbackName ? (
            <img
              src={getFallbackAvatarUrl(fallbackName)}
              alt={`${fallbackName} avatar`}
              className="w-full h-full object-cover"
              onError={() => {
                // If even the fallback image fails, show initials
                setImageError(true)
              }}
            />
          ) : (
            <span className="text-accentGold font-medium">
              {getInitials(alt)}
            </span>
          )}
        </>
      )}
      
      {imageLoading && shouldShowImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-accentGold/20">
          <div className="w-4 h-4 border-2 border-accentGold/30 border-t-accentGold rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default ProfilePhoto