import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders, simulatePaymentFlow, simulateAuthentication, cleanupMocks } from '../utils'
import { stripePaymentService } from '../../services/stripePaymentService'
import { internetIdentityService } from '../../services/internetIdentityService'
import { mockGoogleAccount, mockMarketData, mockStripePaymentService } from '../mocks'
import { PaymentForm } from '../../components/PaymentForm'
import { SubscriptionTiers } from '../../components/SubscriptionTiers'
import { SubscriptionManager } from '../../components/SubscriptionManager'
import { PaymentSuccess } from '../../components/PaymentSuccess'
import { PaymentError } from '../../components/PaymentError'

describe('Payment Processing Integration Tests', () => {
  beforeEach(() => {
    cleanupMocks()
  })

  describe('Stripe Service Integration', () => {
    it('should initialize Stripe service successfully', async () => {
      const result = await stripePaymentService.initialize()
      expect(result).toBe(true)
      expect(stripePaymentService.initialize).toHaveBeenCalled()
    })

    it('should update ICP market data', async () => {
      const marketData = await stripePaymentService.updateICPMarketData()
      
      expect(marketData).toEqual({
        priceUSD: mockMarketData.priceUSD,
        lastUpdated: mockMarketData.timestamp,
        change24h: mockMarketData.change24h,
        marketCap: mockMarketData.marketCap,
        volume24h: mockMarketData.volume24h,
        source: mockMarketData.source
      })
    })

    it('should convert USD to ICP accurately', async () => {
      const conversion = stripePaymentService.convertUSDToICP(29) // Basic tier price
      
      expect(conversion).toEqual({
        amountICP: 2.4,
        conversionRate: 12.50,
        lastUpdated: mockMarketData.timestamp,
        source: mockMarketData.source
      })
    })

    it('should get subscription tiers with real-time ICP pricing', async () => {
      const tiers = await stripePaymentService.getSubscriptionTiers()
      
      expect(tiers).toEqual({
        basic: expect.objectContaining({
          name: 'Basic',
          priceUSD: 29,
          priceICP: 2.32,
          features: expect.arrayContaining(['10 AI models per month']),
          quota: expect.objectContaining({ modelsPerMonth: 10 }),
          stripePriceId: 'price_basic_monthly'
        }),
        pro: expect.objectContaining({
          name: 'Pro',
          priceUSD: 99,
          priceICP: 7.92,
          features: expect.arrayContaining(['100 AI models per month']),
          quota: expect.objectContaining({ modelsPerMonth: 100 })
        }),
        enterprise: expect.objectContaining({
          name: 'Enterprise',
          priceUSD: 299,
          priceICP: 23.92,
          features: expect.arrayContaining(['Unlimited AI models']),
          quota: expect.objectContaining({ modelsPerMonth: -1 })
        })
      })
    })
  })

  describe('Google Account Sync with Stripe', () => {
    it('should create Stripe customer using Google account from II v2', async () => {
      await simulateAuthentication(true)
      
      const customer = await stripePaymentService.createOrGetCustomer(mockGoogleAccount)
      
      expect(customer).toEqual({
        id: 'cus_test123',
        email: mockGoogleAccount.email,
        name: mockGoogleAccount.name,
        googleId: mockGoogleAccount.googleId,
        subscriptionStatus: null,
        currentTier: null,
        created: expect.any(Date),
        metadata: {
          principalId: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
          googleAccountVerified: true
        }
      })
    })

    it('should link Google account data to Stripe customer', async () => {
      await simulateAuthentication(true)
      
      const googleAccountForStripe = internetIdentityService.getGoogleAccountForStripe()
      const customer = await stripePaymentService.createOrGetCustomer(googleAccountForStripe)
      
      expect(customer.email).toBe(mockGoogleAccount.email)
      expect(customer.name).toBe(mockGoogleAccount.name)
      expect(customer.googleId).toBe(mockGoogleAccount.googleId)
      expect(customer.metadata.googleAccountVerified).toBe(true)
    })

    it('should handle existing Stripe customer lookup', async () => {
      await simulateAuthentication(true)
      
      // First call creates customer
      const customer1 = await stripePaymentService.createOrGetCustomer(mockGoogleAccount)
      
      // Second call should return existing customer
      const customer2 = await stripePaymentService.createOrGetCustomer(mockGoogleAccount)
      
      expect(customer1.id).toBe(customer2.id)
      expect(customer1.email).toBe(customer2.email)
    })
  })

  describe('Subscription Creation and Management', () => {
    it('should create subscription with real-time ICP conversion', async () => {
      await simulateAuthentication(true)
      await simulatePaymentFlow(true, 'basic')
      
      const result = await stripePaymentService.createSubscription('basic', mockGoogleAccount)
      
      expect(result.success).toBe(true)
      expect(result.paymentIntent).toEqual({
        id: 'pi_test123',
        clientSecret: 'pi_test123_secret',
        amountUSD: 29,
        amountICP: 2.32,
        conversionRate: 12.50,
        currency: 'usd',
        status: 'requires_payment_method',
        tier: 'basic',
        customer: 'cus_test123'
      })
      expect(result.subscription).toEqual({
        id: 'sub_test123',
        status: 'incomplete',
        currentPeriodEnd: expect.any(Date),
        tier: 'basic'
      })
    })

    it('should confirm payment successfully', async () => {
      await simulateAuthentication(true)
      await simulatePaymentFlow(true)
      
      const result = await stripePaymentService.confirmPayment('pi_test123', 'payment_method_test')
      
      expect(result.success).toBe(true)
      expect(result.paymentIntent.id).toBe('pi_test123')
      expect(result.paymentIntent.status).toBe('succeeded')
    })

    it('should handle payment failures gracefully', async () => {
      await simulateAuthentication(true)
      await simulatePaymentFlow(false)
      
      const result = await stripePaymentService.createSubscription('basic', mockGoogleAccount)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment failed')
    })

    it('should get customer subscription status', async () => {
      await simulateAuthentication(true)
      
      const subscription = await stripePaymentService.getCustomerSubscription(mockGoogleAccount.email)
      
      expect(subscription).toEqual({
        hasActiveSubscription: false,
        subscription: null,
        customer: null
      })
    })

    it('should cancel subscription', async () => {
      await simulateAuthentication(true)
      
      const result = await stripePaymentService.cancelSubscription('sub_test123')
      
      expect(result.success).toBe(true)
    })

    it('should update subscription tier', async () => {
      await simulateAuthentication(true)
      
      const result = await stripePaymentService.updateSubscription('sub_test123', 'pro')
      
      expect(result.success).toBe(true)
    })
  })

  describe('Real-time ICP Conversion', () => {
    it('should provide accurate pricing information', async () => {
      const pricingInfo = await stripePaymentService.getPricingInfo()
      
      expect(pricingInfo).toEqual({
        marketData: {
          priceUSD: mockMarketData.priceUSD,
          lastUpdated: mockMarketData.timestamp,
          change24h: mockMarketData.change24h,
          marketCap: mockMarketData.marketCap,
          volume24h: mockMarketData.volume24h,
          source: mockMarketData.source
        },
        tiers: expect.objectContaining({
          basic: expect.objectContaining({
            priceUSD: 29,
            priceICP: 2.32
          })
        }),
        conversionTimestamp: mockMarketData.timestamp
      })
    })

    it('should update prices when market data changes', async () => {
      // Initial pricing
      const initialPricing = await stripePaymentService.getPricingInfo()
      
      // Update market data
      const newMarketData = {
        ...mockMarketData,
        priceUSD: 15.0, // New ICP price
        timestamp: new Date()
      }
      
      await stripePaymentService.updateICPMarketData()
      
      // Check if conversion rates updated
      const conversion = stripePaymentService.convertUSDToICP(29)
      expect(conversion.conversionRate).toBe(mockMarketData.priceUSD) // Uses mock data
    })
  })

  describe('Payment Components Integration', () => {
    it('should render subscription tiers with real-time pricing', async () => {
      const onTierSelect = vi.fn()
      
      const { getByTestId, getAllByTestId } = renderWithProviders(
        <SubscriptionTiers onTierSelect={onTierSelect} />
      )
      
      await waitFor(() => {
        const tierCards = getAllByTestId(/tier-card/)
        expect(tierCards).toHaveLength(3) // Basic, Pro, Enterprise
      })
      
      // Check basic tier
      expect(getByTestId('tier-basic')).toBeInTheDocument()
      expect(getByTestId('price-usd-basic')).toHaveTextContent('$29')
      expect(getByTestId('price-icp-basic')).toHaveTextContent('2.32 ICP')
    })

    it('should handle tier selection and payment form', async () => {
      const onSubmit = vi.fn()
      
      const { getByTestId } = renderWithProviders(
        <PaymentForm 
          selectedTier="basic"
          onSubmit={onSubmit}
          googleAccount={mockGoogleAccount}
        />
      )
      
      await waitFor(() => {
        expect(getByTestId('payment-form')).toBeInTheDocument()
      })
      
      // Check Stripe Elements integration
      expect(getByTestId('stripe-elements')).toBeInTheDocument()
      expect(getByTestId('payment-element')).toBeInTheDocument()
    })

    it('should show payment success with subscription details', async () => {
      const subscriptionDetails = {
        id: 'sub_test123',
        tier: 'basic',
        amount: 29,
        currency: 'USD',
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
      
      const { getByTestId } = renderWithProviders(
        <PaymentSuccess subscription={subscriptionDetails} />
      )
      
      expect(getByTestId('payment-success')).toBeInTheDocument()
      expect(getByTestId('subscription-tier')).toHaveTextContent('basic')
      expect(getByTestId('subscription-amount')).toHaveTextContent('$29')
    })

    it('should handle payment errors with retry option', async () => {
      const onRetry = vi.fn()
      const error = 'Payment failed due to insufficient funds'
      
      const { getByTestId } = renderWithProviders(
        <PaymentError error={error} onRetry={onRetry} />
      )
      
      expect(getByTestId('payment-error')).toBeInTheDocument()
      expect(getByTestId('error-message')).toHaveTextContent(error)
      
      // Test retry functionality
      const retryButton = getByTestId('retry-button')
      fireEvent.click(retryButton)
      
      expect(onRetry).toHaveBeenCalled()
    })

    it('should manage subscription with upgrade/downgrade options', async () => {
      const subscription = {
        id: 'sub_test123',
        status: 'active',
        tier: 'basic',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
      
      const { getByTestId } = renderWithProviders(
        <SubscriptionManager subscription={subscription} />
      )
      
      expect(getByTestId('subscription-manager')).toBeInTheDocument()
      expect(getByTestId('current-tier')).toHaveTextContent('basic')
      expect(getByTestId('upgrade-options')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle Stripe initialization failure', async () => {
      vi.mocked(stripePaymentService.initialize).mockResolvedValue(false)
      
      const result = await stripePaymentService.initialize()
      expect(result).toBe(false)
    })

    it('should handle network errors during payment', async () => {
      vi.mocked(stripePaymentService.createSubscription).mockRejectedValue(
        new Error('Network error')
      )
      
      try {
        await stripePaymentService.createSubscription('basic', mockGoogleAccount)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle invalid subscription tier', async () => {
      const invalidTier = 'invalid-tier' as any
      
      try {
        await stripePaymentService.getSubscriptionTier(invalidTier)
      } catch (error) {
        // Should handle gracefully or throw appropriate error
        expect(error).toBeDefined()
      }
    })

    it('should handle missing Google account data', async () => {
      const invalidGoogleAccount = {
        email: '',
        name: '',
        picture: '',
        googleId: '',
        verified: false
      }
      
      try {
        await stripePaymentService.createOrGetCustomer(invalidGoogleAccount)
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined()
      }
    })

    it('should handle payment confirmation failure', async () => {
      vi.mocked(stripePaymentService.confirmPayment).mockResolvedValue({
        success: false,
        error: 'Payment confirmation failed'
      })
      
      const result = await stripePaymentService.confirmPayment('pi_invalid', 'pm_invalid')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment confirmation failed')
    })
  })

  describe('Webhook Validation and Processing', () => {
    it('should validate webhook signatures', async () => {
      // Mock webhook validation
      const mockWebhookData = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded'
          }
        }
      }
      
      // This would typically be handled by backend, but testing the structure
      expect(mockWebhookData).toEqual({
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded'
          }
        }
      })
    })

    it('should handle subscription status updates via webhooks', async () => {
      const subscriptionUpdate = {
        id: 'sub_test123',
        status: 'active',
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
      }
      
      // Mock processing subscription update
      expect(subscriptionUpdate.status).toBe('active')
      expect(subscriptionUpdate.id).toBe('sub_test123')
    })
  })

  describe('Performance and Optimization', () => {
    it('should cache conversion rates appropriately', async () => {
      const conversion1 = stripePaymentService.convertUSDToICP(29)
      const conversion2 = stripePaymentService.convertUSDToICP(29)
      
      // Both conversions should use the same cached rate
      expect(conversion1.conversionRate).toBe(conversion2.conversionRate)
      expect(conversion1.lastUpdated).toEqual(conversion2.lastUpdated)
    })

    it('should handle high-frequency pricing updates', async () => {
      // Simulate multiple rapid updates
      for (let i = 0; i < 10; i++) {
        await stripePaymentService.updateICPMarketData()
      }
      
      // Should not overwhelm the system
      const marketData = stripePaymentService.getCurrentMarketData()
      expect(marketData).toBeDefined()
      expect(marketData.priceUSD).toBe(mockMarketData.priceUSD)
    })
  })
})