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
          console.error('❌ Google OAuth error:', error)
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error
          }, window.location.origin)
          window.close()
          return
        }

        if (!code) {
          console.error('❌ No authorization code received from Google')
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'No authorization code'
          }, window.location.origin)
          window.close()
          return
        }

        console.log('✅ Google OAuth callback received with code')

        // Exchange code for tokens and profile
        const profile = await exchangeCodeForProfile(code)
        
        if (profile) {
          console.log('✅ Google profile retrieved successfully')
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            profile
          }, window.location.origin)
        } else {
          console.error('❌ Failed to retrieve Google profile')
          window.opener?.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: 'Failed to retrieve profile'
          }, window.location.origin)
        }

        window.close()
      } catch (error) {
        console.error('❌ Google callback error:', error)
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

    console.log('🔄 Exchanging authorization code for tokens...')

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
    console.log('✅ Tokens received from Google')

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
    console.log('✅ Google profile retrieved:', {
      name: profile.name,
      email: profile.email,
      verified: profile.verified_email
    })

    return profile

  } catch (error) {
    console.error('❌ Failed to exchange code for profile:', error)
    throw error
  }
}

export default GoogleCallback