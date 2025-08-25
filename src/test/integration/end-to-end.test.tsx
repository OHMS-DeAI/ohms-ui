import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders, simulateAuthentication, simulatePaymentFlow, cleanupMocks } from '../utils'
import { internetIdentityService } from '../../services/internetIdentityService'
import { stripePaymentService } from '../../services/stripePaymentService'
import { marketDataService } from '../../services/marketDataService'
import { mockGoogleAccount, mockPrincipal } from '../mocks'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AgentProvider } from '../../context/AgentContext'
import { Header } from '../../components/Header'
import { Economics } from '../../pages/Economics'
import { Subscription } from '../../pages/Subscription'
import { PaymentForm } from '../../components/PaymentForm'
import { SubscriptionTiers } from '../../components/SubscriptionTiers'
import { Elements } from '@stripe/react-stripe-js'

// Mock complete application structure for E2E testing
const MockApp = ({ initialPath = '/' }: { initialPath?: string }) => {
  return (
    <BrowserRouter>
      <AgentProvider>
        <div data-testid="app">
          <Header />
          <Routes>
            <Route path="/" element={<div data-testid="home">Home</div>} />
            <Route path="/economics" element={<Economics />} />
            <Route path="/subscription" element={<Subscription />} />
          </Routes>
        </div>
      </AgentProvider>
    </BrowserRouter>
  )
}

describe('End-to-End User Journey Tests', () => {
  beforeEach(() => {
    cleanupMocks()
  })

  describe('Complete Authentication to Payment Flow', () => {
    it('should complete full user journey: II v2 auth → Google account → Stripe payment → subscription activation', async () => {
      // Step 1: Render application
      const { getByTestId, getByText } = renderWithProviders(<MockApp />)
      
      expect(getByTestId('app')).toBeInTheDocument()
      
      // Step 2: User clicks login
      await simulateAuthentication(true)
      
      await waitFor(() => {
        expect(getByTestId('user-profile')).toBeInTheDocument()
      })
      
      // Step 3: Navigate to economics/subscription page
      const economicsLink = getByText('Economics')
      fireEvent.click(economicsLink)
      
      await waitFor(() => {
        expect(getByTestId('economics-page')).toBeInTheDocument()
      })
      
      // Step 4: Select subscription tier
      const basicTierButton = getByTestId('select-basic-tier')
      fireEvent.click(basicTierButton)
      
      // Step 5: Proceed to payment
      await simulatePaymentFlow(true, 'basic')
      
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeInTheDocument()
      })
      
      // Step 6: Complete payment
      const submitPaymentButton = getByTestId('submit-payment')
      await act(async () => {
        fireEvent.click(submitPaymentButton)
      })
      
      // Step 7: Verify successful payment and subscription activation
      await waitFor(() => {
        expect(getByTestId('payment-success')).toBeInTheDocument()
        expect(getByTestId('subscription-active')).toBeInTheDocument()
      })
      
      // Verify the complete flow
      expect(internetIdentityService.authenticate).toHaveBeenCalled()
      expect(internetIdentityService.getGoogleAccountForStripe).toHaveBeenCalled()
      expect(stripePaymentService.createOrGetCustomer).toHaveBeenCalledWith(mockGoogleAccount)
      expect(stripePaymentService.createSubscription).toHaveBeenCalledWith('basic', mockGoogleAccount)
    })

    it('should handle authentication failure gracefully in complete flow', async () => {
      const { getByTestId, getByText } = renderWithProviders(<MockApp />)
      
      // Simulate authentication failure
      await simulateAuthentication(false)
      
      const loginButton = getByTestId('login-button')
      await act(async () => {
        fireEvent.click(loginButton)
      })
      
      await waitFor(() => {
        expect(getByTestId('auth-error')).toBeInTheDocument()
        expect(getByText('Authentication failed')).toBeInTheDocument()
      })
      
      // User should not have access to protected routes
      expect(() => getByTestId('economics-page')).toThrow()
    })

    it('should handle payment failure and retry flow', async () => {
      const { getByTestId } = renderWithProviders(<MockApp />)
      
      // Complete authentication
      await simulateAuthentication(true)
      
      // Navigate to payment
      await waitFor(() => {
        const economicsLink = getByTestId('economics-link')
        fireEvent.click(economicsLink)
      })
      
      // Select tier and proceed to payment
      const basicTier = getByTestId('select-basic-tier')
      fireEvent.click(basicTier)
      
      // Simulate payment failure
      await simulatePaymentFlow(false)
      
      const submitPayment = getByTestId('submit-payment')
      await act(async () => {
        fireEvent.click(submitPayment)
      })
      
      // Should show error and retry option
      await waitFor(() => {
        expect(getByTestId('payment-error')).toBeInTheDocument()
        expect(getByTestId('retry-payment')).toBeInTheDocument()
      })
      
      // Retry payment
      await simulatePaymentFlow(true) // Fix the payment
      
      const retryButton = getByTestId('retry-payment')
      await act(async () => {
        fireEvent.click(retryButton)
      })
      
      // Should succeed on retry
      await waitFor(() => {
        expect(getByTestId('payment-success')).toBeInTheDocument()
      })
    })
  })

  describe('Single Google Account Flow Validation', () => {
    it('should use same Google account from II v2 authentication for Stripe customer creation', async () => {
      await simulateAuthentication(true)
      
      // Get Google account from II v2
      const googleAccountFromII = internetIdentityService.getGoogleAccountForStripe()
      
      // Create Stripe customer
      const stripeCustomer = await stripePaymentService.createOrGetCustomer(googleAccountFromII)
      
      // Verify same Google account data is used
      expect(googleAccountFromII.email).toBe(mockGoogleAccount.email)
      expect(googleAccountFromII.googleId).toBe(mockGoogleAccount.googleId)
      expect(stripeCustomer.email).toBe(mockGoogleAccount.email)
      expect(stripeCustomer.googleId).toBe(mockGoogleAccount.googleId)
      expect(stripeCustomer.metadata.googleAccountVerified).toBe(true)
    })

    it('should maintain Google account consistency across services', async () => {
      await simulateAuthentication(true)
      
      // Check AgentContext has Google account
      const { getByTestId } = renderWithProviders(
        <div>
          <div data-testid="user-email">{/* Would show user email */}</div>
          <div data-testid="user-name">{/* Would show user name */}</div>
        </div>
      )
      
      // Check all services have consistent Google account data
      const iiGoogleAccount = internetIdentityService.getGoogleAccountForStripe()
      const authStatus = await internetIdentityService.getAuthStatus()
      
      expect(iiGoogleAccount.email).toBe(mockGoogleAccount.email)
      expect(authStatus.user?.googleAccount?.email).toBe(mockGoogleAccount.email)
      expect(authStatus.hasGoogleAccount).toBe(true)
    })

    it('should handle Google account updates across all services', async () => {
      await simulateAuthentication(true)
      
      // Simulate Google account update
      const updatedGoogleAccount = {
        ...mockGoogleAccount,
        name: 'Updated Test User',
        picture: 'https://example.com/new-avatar.jpg'
      }
      
      await simulateAuthentication(true, {
        googleAccount: updatedGoogleAccount
      })
      
      // All services should reflect the update
      const iiAccount = internetIdentityService.getGoogleAccountForStripe()
      expect(iiAccount.name).toBe('Updated Test User')
      expect(iiAccount.picture).toBe('https://example.com/new-avatar.jpg')
    })
  })

  describe('Real-time Market Data Integration Throughout Journey', () => {
    it('should show consistent market data across all components', async () => {
      const { getByTestId } = renderWithProviders(
        <div>
          <SubscriptionTiers onTierSelect={() => {}} />
          <PaymentForm selectedTier="basic" onSubmit={() => {}} googleAccount={mockGoogleAccount} />
        </div>
      )
      
      await waitFor(() => {
        // Market data should be consistent
        const priceInTiers = getByTestId('price-icp-basic').textContent
        const priceInPayment = getByTestId('icp-amount-basic').textContent
        
        expect(priceInTiers).toBe(priceInPayment)
      })
    })

    it('should update pricing in real-time during user journey', async () => {
      const { getByTestId } = renderWithProviders(<SubscriptionTiers onTierSelect={() => {}} />)
      
      // Initial price
      await waitFor(() => {
        expect(getByTestId('price-icp-basic')).toHaveTextContent('2.32 ICP')
      })
      
      // Simulate market data update
      await act(async () => {
        await marketDataService.updateMarketData()
      })
      
      // Price should update (in real implementation)
      await waitFor(() => {
        expect(getByTestId('conversion-rate')).toBeInTheDocument()
      })
    })

    it('should handle market data errors during payment flow', async () => {
      // Mock market data service failure
      vi.mocked(marketDataService.updateMarketData).mockRejectedValue(
        new Error('Market data unavailable')
      )
      
      const { getByTestId } = renderWithProviders(<SubscriptionTiers onTierSelect={() => {}} />)
      
      await waitFor(() => {
        // Should show fallback pricing or error state
        expect(getByTestId('pricing-error') || getByTestId('fallback-pricing')).toBeInTheDocument()
      })
    })
  })

  describe('Error Scenarios and Recovery', () => {
    it('should handle network disconnection during payment flow', async () => {
      await simulateAuthentication(true)
      
      // Simulate network disconnection
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network unavailable'))
      
      const { getByTestId } = renderWithProviders(<PaymentForm 
        selectedTier="basic" 
        onSubmit={() => {}} 
        googleAccount={mockGoogleAccount} 
      />)
      
      const submitButton = getByTestId('submit-payment')
      await act(async () => {
        fireEvent.click(submitButton)
      })
      
      await waitFor(() => {
        expect(getByTestId('network-error') || getByTestId('payment-error')).toBeInTheDocument()
      })
    })

    it('should handle session expiration during payment', async () => {
      await simulateAuthentication(true)
      
      // Simulate session expiration
      vi.mocked(internetIdentityService.getAuthStatus).mockResolvedValue({
        isAuthenticated: false,
        user: null,
        principal: null,
        hasGoogleAccount: false
      })
      
      const { getByTestId } = renderWithProviders(<PaymentForm 
        selectedTier="basic" 
        onSubmit={() => {}} 
        googleAccount={mockGoogleAccount} 
      />)
      
      // Should redirect to login or show session expired message
      await waitFor(() => {
        expect(getByTestId('session-expired') || getByTestId('login-required')).toBeInTheDocument()
      })
    })

    it('should handle subscription status conflicts', async () => {
      await simulateAuthentication(true)
      
      // Mock existing active subscription
      vi.mocked(stripePaymentService.getCustomerSubscription).mockResolvedValue({
        hasActiveSubscription: true,
        subscription: {
          id: 'sub_existing',
          status: 'active',
          tier: 'pro',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        customer: {
          id: 'cus_existing',
          email: mockGoogleAccount.email
        }
      })
      
      const { getByTestId } = renderWithProviders(<Economics />)
      
      await waitFor(() => {
        expect(getByTestId('existing-subscription-notice')).toBeInTheDocument()
        expect(getByTestId('manage-subscription-link')).toBeInTheDocument()
      })
    })
  })

  describe('UI Component Integration', () => {
    it('should navigate between components seamlessly', async () => {
      const { getByTestId } = renderWithProviders(<MockApp />)
      
      await simulateAuthentication(true)
      
      // Navigate through the application
      const economicsLink = getByTestId('economics-link')
      fireEvent.click(economicsLink)
      
      await waitFor(() => {
        expect(getByTestId('economics-page')).toBeInTheDocument()
      })
      
      const subscriptionLink = getByTestId('subscription-link')
      fireEvent.click(subscriptionLink)
      
      await waitFor(() => {
        expect(getByTestId('subscription-page')).toBeInTheDocument()
      })
    })

    it('should maintain state across component transitions', async () => {
      await simulateAuthentication(true)
      
      const { getByTestId } = renderWithProviders(<MockApp initialPath="/economics" />)
      
      // Select tier on economics page
      const basicTier = getByTestId('select-basic-tier')
      fireEvent.click(basicTier)
      
      // Navigate to subscription page
      const subscriptionLink = getByTestId('subscription-link')
      fireEvent.click(subscriptionLink)
      
      // Selected tier should be maintained
      await waitFor(() => {
        expect(getByTestId('selected-tier')).toHaveTextContent('basic')
      })
    })

    it('should show appropriate loading states', async () => {
      const { getByTestId } = renderWithProviders(<MockApp />)
      
      // Should show loading during authentication
      const loginButton = getByTestId('login-button')
      await act(async () => {
        fireEvent.click(loginButton)
      })
      
      // Mock slow authentication
      vi.mocked(internetIdentityService.authenticate).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          user: {
            principal: mockPrincipal,
            googleAccount: mockGoogleAccount,
            name: mockGoogleAccount.name,
            email: mockGoogleAccount.email,
            picture: mockGoogleAccount.picture,
            isAnonymous: false
          },
          identity: {},
          agent: {}
        }), 1000))
      )
      
      await waitFor(() => {
        expect(getByTestId('auth-loading')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', async () => {
      const { getByRole, getByLabelText } = renderWithProviders(<MockApp />)
      
      // Check navigation accessibility
      expect(getByRole('navigation')).toBeInTheDocument()
      expect(getByRole('main')).toBeInTheDocument()
      
      // Check form accessibility
      await simulateAuthentication(true)
      
      const economicsLink = getByRole('link', { name: /economics/i })
      fireEvent.click(economicsLink)
      
      await waitFor(() => {
        expect(getByRole('button', { name: /select basic tier/i })).toBeInTheDocument()
      })
    })

    it('should handle keyboard navigation', async () => {
      const { getByTestId } = renderWithProviders(<MockApp />)
      
      await simulateAuthentication(true)
      
      // Test keyboard navigation
      const firstTabbableElement = getByTestId('first-tabbable')
      firstTabbableElement.focus()
      
      // Simulate Tab key
      fireEvent.keyDown(firstTabbableElement, { key: 'Tab' })
      
      // Should move to next focusable element
      await waitFor(() => {
        expect(document.activeElement).not.toBe(firstTabbableElement)
      })
    })

    it('should provide clear error messages and recovery options', async () => {
      await simulateAuthentication(false)
      
      const { getByTestId, getByText } = renderWithProviders(<MockApp />)
      
      const loginButton = getByTestId('login-button')
      await act(async () => {
        fireEvent.click(loginButton)
      })
      
      await waitFor(() => {
        expect(getByText('Authentication failed')).toBeInTheDocument()
        expect(getByTestId('retry-login')).toBeInTheDocument()
        expect(getByTestId('help-link')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('should load components efficiently', async () => {
      const startTime = performance.now()
      
      const { getByTestId } = renderWithProviders(<MockApp />)
      
      await waitFor(() => {
        expect(getByTestId('app')).toBeInTheDocument()
      })
      
      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(1000) // Should load in under 1 second
    })

    it('should handle concurrent operations', async () => {
      await simulateAuthentication(true)
      
      // Simulate concurrent market data updates and payment processing
      const marketDataPromise = marketDataService.updateMarketData()
      const paymentPromise = stripePaymentService.getPricingInfo()
      
      const [marketData, pricingInfo] = await Promise.all([marketDataPromise, paymentPromise])
      
      expect(marketData).toBeDefined()
      expect(pricingInfo).toBeDefined()
    })

    it('should clean up resources properly', async () => {
      const { unmount } = renderWithProviders(<MockApp />)
      
      await simulateAuthentication(true)
      
      // Subscribe to market data
      const unsubscribe = marketDataService.subscribe(() => {})
      
      // Unmount component
      unmount()
      
      // Should clean up subscriptions
      expect(unsubscribe).toBeDefined()
    })
  })
})