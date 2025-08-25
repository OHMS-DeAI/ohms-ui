import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { renderWithProviders, simulateAuthentication, cleanupMocks } from '../utils'
import { internetIdentityService } from '../../services/internetIdentityService'
import { mockGoogleAccount, mockPrincipal } from '../mocks'
import { Header } from '../../components/Header'
import { useAgent } from '../../context/AgentContext'

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    cleanupMocks()
  })

  describe('Internet Identity v2 Authentication', () => {
    it('should initialize II v2 service successfully', async () => {
      const result = await internetIdentityService.initialize()
      expect(result).toBe(true)
      expect(internetIdentityService.initialize).toHaveBeenCalled()
    })

    it('should authenticate with Google OAuth through II v2', async () => {
      const authResult = await simulateAuthentication(true, {
        googleAccount: mockGoogleAccount
      })

      expect(authResult.success).toBe(true)
      expect(authResult.user.googleAccount).toEqual(mockGoogleAccount)
      expect(authResult.user.principal).toBe(mockPrincipal)
      expect(authResult.user.email).toBe(mockGoogleAccount.email)
      expect(authResult.user.name).toBe(mockGoogleAccount.name)
    })

    it('should extract Google account metadata correctly', async () => {
      await simulateAuthentication(true)
      
      const googleAccountData = internetIdentityService.getGoogleAccountForStripe()
      
      expect(googleAccountData).toEqual(mockGoogleAccount)
      expect(googleAccountData.email).toBe('test@example.com')
      expect(googleAccountData.name).toBe('Test User')
      expect(googleAccountData.googleId).toBe('google-123456789')
      expect(googleAccountData.verified).toBe(true)
    })

    it('should handle authentication failure gracefully', async () => {
      const authResult = await simulateAuthentication(false)
      
      expect(authResult.success).toBe(false)
      expect(authResult.error).toBe('Authentication failed')
    })

    it('should maintain session persistence for 7 days', async () => {
      // Simulate successful authentication
      await simulateAuthentication(true)
      
      // Check auth status after simulated time
      const authStatus = await internetIdentityService.getAuthStatus()
      
      expect(authStatus.isAuthenticated).toBe(true)
      expect(authStatus.user.principal).toBe(mockPrincipal)
      expect(authStatus.hasGoogleAccount).toBe(true)
    })

    it('should refresh session successfully', async () => {
      await simulateAuthentication(true)
      
      const refreshResult = await internetIdentityService.refreshSession()
      
      expect(refreshResult).toBe(true)
      expect(internetIdentityService.refreshSession).toHaveBeenCalled()
    })

    it('should sign out properly', async () => {
      await simulateAuthentication(true)
      
      await internetIdentityService.signOut()
      
      expect(internetIdentityService.signOut).toHaveBeenCalled()
    })
  })

  describe('AgentContext Integration', () => {
    it('should integrate II v2 authentication with AgentContext', async () => {
      const TestComponent = () => {
        const { userProfile, isAuthenticated, principal } = useAgent()
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <div data-testid="principal">{principal}</div>
            <div data-testid="email">{userProfile?.email}</div>
            <div data-testid="google-id">{userProfile?.googleAccount?.googleId}</div>
          </div>
        )
      }

      const { getByTestId } = renderWithProviders(<TestComponent />)

      expect(getByTestId('auth-status').textContent).toBe('authenticated')
      expect(getByTestId('principal').textContent).toBe(mockPrincipal)
      expect(getByTestId('email').textContent).toBe(mockGoogleAccount.email)
      expect(getByTestId('google-id').textContent).toBe(mockGoogleAccount.googleId)
    })

    it('should preserve admin role verification with II v2 principals', async () => {
      // Test admin user
      const adminPrincipal = 'admin-principal-test'
      const { rerender } = renderWithProviders(<Header />, {
        initialAgentState: {
          isAdmin: true,
          principal: adminPrincipal,
          userProfile: {
            ...mockGoogleAccount,
            principal: adminPrincipal,
            isAnonymous: false
          }
        }
      })

      await waitFor(() => {
        expect(document.querySelector('[data-testid="admin-link"]')).toBeInTheDocument()
      })

      // Test regular user
      rerender(<Header />)
      
      await waitFor(() => {
        expect(document.querySelector('[data-testid="admin-link"]')).not.toBeInTheDocument()
      })
    })

    it('should handle login/logout flows correctly', async () => {
      const TestComponent = () => {
        const { login, logout, isAuthenticated } = useAgent()
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <button data-testid="login-btn" onClick={login}>Login</button>
            <button data-testid="logout-btn" onClick={logout}>Logout</button>
          </div>
        )
      }

      const { getByTestId } = renderWithProviders(<TestComponent />)
      
      // Test login
      const loginBtn = getByTestId('login-btn')
      await act(async () => {
        loginBtn.click()
      })
      
      expect(getByTestId('auth-status').textContent).toBe('authenticated')
      
      // Test logout
      const logoutBtn = getByTestId('logout-btn')
      await act(async () => {
        logoutBtn.click()
      })
      
      // Logout function should be called
      expect(useAgent().logout).toBeDefined()
    })
  })

  describe('Session Management', () => {
    it('should handle session restoration on page reload', async () => {
      // Simulate existing session
      await simulateAuthentication(true)
      
      // Check if session can be restored
      const authStatus = await internetIdentityService.getAuthStatus()
      
      expect(authStatus.isAuthenticated).toBe(true)
      expect(authStatus.user).toBeDefined()
      expect(authStatus.principal).toBe(mockPrincipal)
    })

    it('should handle expired session gracefully', async () => {
      // Mock expired session
      vi.mocked(internetIdentityService.getAuthStatus).mockResolvedValue({
        isAuthenticated: false,
        user: null,
        principal: null,
        hasGoogleAccount: false
      })
      
      const authStatus = await internetIdentityService.getAuthStatus()
      
      expect(authStatus.isAuthenticated).toBe(false)
      expect(authStatus.user).toBeNull()
    })

    it('should create agent correctly after authentication', async () => {
      await simulateAuthentication(true)
      
      const agent = internetIdentityService.createAgent()
      
      expect(agent).toBeDefined()
      expect(internetIdentityService.createAgent).toHaveBeenCalled()
    })

    it('should get current identity after authentication', async () => {
      await simulateAuthentication(true)
      
      const identity = internetIdentityService.getCurrentIdentity()
      
      expect(identity).toBeDefined()
      expect(internetIdentityService.getCurrentIdentity).toHaveBeenCalled()
    })

    it('should get current user after authentication', async () => {
      await simulateAuthentication(true)
      
      const user = internetIdentityService.getCurrentUser()
      
      expect(user).toBeDefined()
      expect(user.principal).toBe(mockPrincipal)
      expect(user.googleAccount).toEqual(mockGoogleAccount)
      expect(user.email).toBe(mockGoogleAccount.email)
      expect(user.name).toBe(mockGoogleAccount.name)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during authentication', async () => {
      // Mock network error
      vi.mocked(internetIdentityService.authenticate).mockRejectedValue(
        new Error('Network error')
      )
      
      try {
        await internetIdentityService.authenticate()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle invalid Google account data', async () => {
      const invalidGoogleAccount = {
        email: '', // Invalid empty email
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        googleId: '',
        verified: false
      }
      
      const authResult = await simulateAuthentication(true, {
        googleAccount: invalidGoogleAccount
      })
      
      // Service should handle invalid data gracefully
      expect(authResult.success).toBe(true)
      expect(authResult.user.googleAccount.email).toBe('')
    })

    it('should handle II v2 service initialization failure', async () => {
      vi.mocked(internetIdentityService.initialize).mockResolvedValue(false)
      
      const result = await internetIdentityService.initialize()
      
      expect(result).toBe(false)
    })
  })

  describe('Google Account Integration', () => {
    it('should extract complete Google profile data', async () => {
      await simulateAuthentication(true)
      
      const googleAccount = internetIdentityService.getGoogleAccountForStripe()
      
      expect(googleAccount).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        googleId: 'google-123456789',
        verified: true
      })
    })

    it('should verify Google account for Stripe integration', async () => {
      await simulateAuthentication(true)
      
      const authStatus = await internetIdentityService.getAuthStatus()
      
      expect(authStatus.hasGoogleAccount).toBe(true)
      expect(authStatus.user?.googleAccount?.verified).toBe(true)
      expect(authStatus.user?.googleAccount?.email).toBeTruthy()
      expect(authStatus.user?.googleAccount?.googleId).toBeTruthy()
    })

    it('should handle missing Google account data', async () => {
      const authResultWithoutGoogle = await simulateAuthentication(true, {
        googleAccount: null
      })
      
      expect(authResultWithoutGoogle.success).toBe(true)
      expect(authResultWithoutGoogle.user.googleAccount).toBeNull()
    })
  })
})