import React, { useEffect } from 'react'

/**
 * Google OAuth Callback Handler
 * This page handles the Google OAuth redirect and sends profile data back to the parent window
 */
const GoogleCallback: React.FC = () => {
  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')
        const error = urlParams.get('error')

        if (error) {
          // Removed console log
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error
          }, window.location.origin)
          window.close()
          return
        }

        if (!code) {
          // Removed console log
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'No authorization code'
          }, window.location.origin)
          window.close()
          return
        }

        // Removed console log

        // Exchange code for tokens and profile
        const profile = await exchangeCodeForProfile(code)
        
        if (profile) {
          // Removed console log
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            profile
          }, window.location.origin)
        } else {
          // Removed console log
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'Failed to retrieve profile'
          }, window.location.origin)
        }

        window.close()
      } catch (error) {
        // Removed console log
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, window.location.origin)
        window.close()
      }
    }

    handleGoogleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center text-textOnDark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accentGold mx-auto mb-4"></div>
        <p>Completing Google authentication...</p>
        <p className="text-sm text-gray-400 mt-2">
          This window will close automatically.
        </p>
      </div>
    </div>
  )
}

/**
 * Exchange authorization code for Google profile information
 */
async function exchangeCodeForProfile(code: string): Promise<any> {
  try {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    const redirectUri = `${window.location.origin}/auth/google/callback`

    if (!clientId) {
      throw new Error('Google Client ID not configured')
    }

    // Removed console log

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret || '', // Optional for public clients
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    // Removed console log

    // Get user profile using access token
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      throw new Error(`Profile fetch failed: ${errorText}`)
    }

    const profile = await profileResponse.json()
    // Google profile retrieved successfully - logging removed for security

    return profile

  } catch (error) {
    // Removed console log
    throw error
  }
}

export default GoogleCallback