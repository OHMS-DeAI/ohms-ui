import { vi } from 'vitest'
import React from 'react'
import type { GoogleAccountInfo } from '../services/internetIdentityService'
import type { MarketDataPoint } from '../services/marketDataService'
import type { SubscriptionTier } from '../services/stripePaymentService'

// Mock Google Account
export const mockGoogleAccount: GoogleAccountInfo = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  googleId: 'google-123456789',
  verified: true
}

// Mock Principal
export const mockPrincipal = 'rdmx6-jaaaa-aaaaa-aaadq-cai'

// Mock Market Data
export const mockMarketData: MarketDataPoint = {
  priceUSD: 12.50,
  timestamp: new Date('2025-01-01T12:00:00Z'),
  change24h: 5.25,
  change7d: -2.10,
  marketCap: 5800000000,
  volume24h: 120000000,
  source: 'CoinGecko'
}

// Mock Internet Identity Service
export const mockInternetIdentityService = {
  initialize: vi.fn().mockResolvedValue(true),
  authenticate: vi.fn().mockResolvedValue({
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
  }),
  getCurrentUser: vi.fn().mockReturnValue({
    principal: mockPrincipal,
    googleAccount: mockGoogleAccount,
    name: mockGoogleAccount.name,
    email: mockGoogleAccount.email,
    picture: mockGoogleAccount.picture,
    isAnonymous: false
  }),
  getCurrentIdentity: vi.fn().mockReturnValue({}),
  createAgent: vi.fn().mockReturnValue({}),
  signOut: vi.fn().mockResolvedValue(undefined),
  getAuthStatus: vi.fn().mockResolvedValue({
    isAuthenticated: true,
    user: {
      principal: mockPrincipal,
      googleAccount: mockGoogleAccount,
      name: mockGoogleAccount.name,
      email: mockGoogleAccount.email,
      picture: mockGoogleAccount.picture,
      isAnonymous: false
    },
    principal: mockPrincipal,
    hasGoogleAccount: true
  }),
  getGoogleAccountForStripe: vi.fn().mockReturnValue(mockGoogleAccount),
  refreshSession: vi.fn().mockResolvedValue(true)
}

// Mock Market Data Service
export const mockMarketDataService = {
  updateMarketData: vi.fn().mockResolvedValue(mockMarketData),
  getCurrentPrice: vi.fn().mockReturnValue(mockMarketData),
  getPriceHistory: vi.fn().mockReturnValue([mockMarketData]),
  convertUSDToICP: vi.fn().mockReturnValue({
    amountICP: 2.4,
    conversionRate: 12.50,
    lastUpdated: mockMarketData.timestamp,
    source: mockMarketData.source
  }),
  convertICPToUSD: vi.fn().mockReturnValue({
    amountUSD: 30.0,
    conversionRate: 12.50,
    lastUpdated: mockMarketData.timestamp,
    source: mockMarketData.source
  }),
  subscribe: vi.fn().mockImplementation((callback) => {
    // Immediately call callback with mock data
    callback(mockMarketData)
    // Return unsubscribe function
    return vi.fn()
  }),
  getCacheStatus: vi.fn().mockReturnValue({
    isCached: true,
    cacheAge: 30000, // 30 seconds
    nextUpdate: 90000 // 90 seconds
  }),
  forceRefresh: vi.fn().mockResolvedValue(mockMarketData),
  destroy: vi.fn()
}

// Mock Stripe Payment Service
export const mockStripePaymentService = {
  initialize: vi.fn().mockResolvedValue(true),
  updateICPMarketData: vi.fn().mockResolvedValue({
    priceUSD: mockMarketData.priceUSD,
    lastUpdated: mockMarketData.timestamp,
    change24h: mockMarketData.change24h,
    marketCap: mockMarketData.marketCap,
    volume24h: mockMarketData.volume24h,
    source: mockMarketData.source
  }),
  getCurrentMarketData: vi.fn().mockReturnValue({
    priceUSD: mockMarketData.priceUSD,
    lastUpdated: mockMarketData.timestamp,
    change24h: mockMarketData.change24h,
    marketCap: mockMarketData.marketCap,
    volume24h: mockMarketData.volume24h,
    source: mockMarketData.source
  }),
  convertUSDToICP: vi.fn().mockReturnValue({
    amountICP: 2.4,
    conversionRate: 12.50,
    lastUpdated: mockMarketData.timestamp,
    source: mockMarketData.source
  }),
  getSubscriptionTiers: vi.fn().mockResolvedValue({
    basic: {
      name: 'Basic',
      priceUSD: 29,
      priceICP: 2.32,
      features: ['10 AI models per month', '50 compute hours', '100 API calls per minute'],
      quota: { modelsPerMonth: 10, computeHours: 50, apiCallsPerMinute: 100 },
      stripePriceId: 'price_basic_monthly'
    },
    pro: {
      name: 'Pro',
      priceUSD: 99,
      priceICP: 7.92,
      features: ['100 AI models per month', '500 compute hours', '1000 API calls per minute'],
      quota: { modelsPerMonth: 100, computeHours: 500, apiCallsPerMinute: 1000 },
      stripePriceId: 'price_pro_monthly'
    },
    enterprise: {
      name: 'Enterprise',
      priceUSD: 299,
      priceICP: 23.92,
      features: ['Unlimited AI models', 'Unlimited compute hours', '10000 API calls per minute'],
      quota: { modelsPerMonth: -1, computeHours: -1, apiCallsPerMinute: 10000 },
      stripePriceId: 'price_enterprise_monthly'
    }
  }),
  getSubscriptionTier: vi.fn().mockImplementation((tier: SubscriptionTier) => {
    const tiers = {
      basic: {
        name: 'Basic',
        priceUSD: 29,
        priceICP: 2.32,
        features: ['10 AI models per month', '50 compute hours', '100 API calls per minute'],
        quota: { modelsPerMonth: 10, computeHours: 50, apiCallsPerMinute: 100 },
        stripePriceId: 'price_basic_monthly'
      },
      pro: {
        name: 'Pro',
        priceUSD: 99,
        priceICP: 7.92,
        features: ['100 AI models per month', '500 compute hours', '1000 API calls per minute'],
        quota: { modelsPerMonth: 100, computeHours: 500, apiCallsPerMinute: 1000 },
        stripePriceId: 'price_pro_monthly'
      },
      enterprise: {
        name: 'Enterprise',
        priceUSD: 299,
        priceICP: 23.92,
        features: ['Unlimited AI models', 'Unlimited compute hours', '10000 API calls per minute'],
        quota: { modelsPerMonth: -1, computeHours: -1, apiCallsPerMinute: 10000 },
        stripePriceId: 'price_enterprise_monthly'
      }
    }
    return Promise.resolve(tiers[tier])
  }),
  createOrGetCustomer: vi.fn().mockResolvedValue({
    id: 'cus_test123',
    email: mockGoogleAccount.email,
    name: mockGoogleAccount.name,
    googleId: mockGoogleAccount.googleId,
    subscriptionStatus: null,
    currentTier: null,
    created: new Date(),
    metadata: {
      principalId: mockPrincipal,
      googleAccountVerified: true
    }
  }),
  createSubscription: vi.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_test123',
      clientSecret: 'pi_test123_secret',
      amountUSD: 29,
      amountICP: 2.32,
      conversionRate: 12.50,
      currency: 'usd',
      status: 'requires_payment_method',
      tier: 'basic',
      customer: 'cus_test123'
    },
    subscription: {
      id: 'sub_test123',
      status: 'incomplete',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tier: 'basic'
    }
  }),
  confirmPayment: vi.fn().mockResolvedValue({
    success: true,
    paymentIntent: {
      id: 'pi_test123',
      status: 'succeeded'
    }
  }),
  getCustomerSubscription: vi.fn().mockResolvedValue({
    hasActiveSubscription: false,
    subscription: null,
    customer: null
  }),
  cancelSubscription: vi.fn().mockResolvedValue({
    success: true
  }),
  updateSubscription: vi.fn().mockResolvedValue({
    success: true,
    subscription: {}
  }),
  getPricingInfo: vi.fn().mockResolvedValue({
    marketData: {
      priceUSD: mockMarketData.priceUSD,
      lastUpdated: mockMarketData.timestamp,
      change24h: mockMarketData.change24h,
      marketCap: mockMarketData.marketCap,
      volume24h: mockMarketData.volume24h,
      source: mockMarketData.source
    },
    tiers: {
      basic: {
        name: 'Basic',
        priceUSD: 29,
        priceICP: 2.32,
        features: ['10 AI models per month', '50 compute hours', '100 API calls per minute'],
        quota: { modelsPerMonth: 10, computeHours: 50, apiCallsPerMinute: 100 },
        stripePriceId: 'price_basic_monthly'
      }
    },
    conversionTimestamp: mockMarketData.timestamp
  }),
  getStripe: vi.fn().mockReturnValue({
    confirmPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        id: 'pi_test123',
        status: 'succeeded'
      }
    }),
    redirectToCheckout: vi.fn().mockResolvedValue({ error: null })
  })
}

// Mock Stripe Elements
export const mockStripeElements = {
  create: vi.fn().mockReturnValue({
    mount: vi.fn(),
    unmount: vi.fn(),
    on: vi.fn(),
    update: vi.fn()
  }),
  getElement: vi.fn(),
  fetchUpdates: vi.fn(),
  submit: vi.fn()
}

// Mock fetch responses
export const mockFetchResponses = {
  coinGecko: {
    'internet-computer': {
      usd: 12.50,
      usd_24h_change: 5.25,
      usd_market_cap: 5800000000,
      usd_24h_vol: 120000000
    }
  },
  stripeCustomer: {
    id: 'cus_test123',
    email: mockGoogleAccount.email,
    name: mockGoogleAccount.name,
    created: Math.floor(Date.now() / 1000),
    metadata: {
      googleId: mockGoogleAccount.googleId,
      principalId: mockPrincipal
    }
  },
  stripeSubscription: {
    subscription: {
      id: 'sub_test123',
      status: 'active',
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
    },
    paymentIntent: {
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      status: 'requires_payment_method'
    }
  }
}

// Setup common fetch mock
export const setupFetchMock = () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('coingecko.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFetchResponses.coinGecko)
      })
    }
    
    if (url.includes('/api/stripe/customer') && url.includes('POST')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFetchResponses.stripeCustomer)
      })
    }
    
    if (url.includes('/api/stripe/subscription')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFetchResponses.stripeSubscription)
      })
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })
  })
}

// Mock React Router
export const mockNavigate = vi.fn()
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
}

// Mock Router Provider
export const MockRouterProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-router">{children}</div>
}