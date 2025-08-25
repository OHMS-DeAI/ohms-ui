import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { 
  mockInternetIdentityService, 
  mockStripePaymentService,
  mockMarketDataService,
  MockRouterProvider,
  setupFetchMock 
} from './mocks'

// Mock the services before importing components
vi.mock('../services/internetIdentityService', () => ({
  internetIdentityService: mockInternetIdentityService,
  InternetIdentityService: vi.fn().mockImplementation(() => mockInternetIdentityService)
}))

vi.mock('../services/stripePaymentService', () => ({
  stripePaymentService: mockStripePaymentService,
  StripePaymentService: vi.fn().mockImplementation(() => mockStripePaymentService),
  SubscriptionTier: {
    BASIC: 'basic',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
  }
}))

vi.mock('../services/marketDataService', () => ({
  marketDataService: mockMarketDataService,
  MarketDataService: vi.fn().mockImplementation(() => mockMarketDataService)
}))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  PaymentElement: () => <div data-testid="payment-element" />,
  AddressElement: () => <div data-testid="address-element" />,
  useStripe: () => mockStripePaymentService.getStripe(),
  useElements: () => ({
    getElement: vi.fn(),
    submit: vi.fn()
  })
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  BrowserRouter: MockRouterProvider,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  Navigate: () => <div data-testid="navigate" />,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )
}))

// Mock AgentContext
const mockAgentContext = {
  isConnected: true,
  userProfile: {
    principal: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
    googleAccount: {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      googleId: 'google-123456789',
      verified: true
    },
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://example.com/avatar.jpg',
    isAnonymous: false
  },
  principal: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  isAdmin: false,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuthStatus: vi.fn()
}

const AgentContextProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="agent-context">
      {children}
    </div>
  )
}

vi.mock('../context/AgentContext', () => ({
  useAgent: () => mockAgentContext,
  AgentProvider: AgentContextProvider
}))

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean
  withAgentContext?: boolean
  initialAgentState?: Partial<typeof mockAgentContext>
}

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withRouter = true,
    withAgentContext = true,
    initialAgentState = {},
    ...renderOptions
  } = options

  // Setup fetch mock
  setupFetchMock()

  // Override agent context if needed
  if (Object.keys(initialAgentState).length > 0) {
    Object.assign(mockAgentContext, initialAgentState)
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = children

    if (withAgentContext) {
      wrapped = <AgentContextProvider>{wrapped}</AgentContextProvider>
    }

    if (withRouter) {
      wrapped = <MockRouterProvider>{wrapped}</MockRouterProvider>
    }

    return <>{wrapped}</>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Utility to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Utility to trigger market data updates
export const triggerMarketDataUpdate = (newData = {}) => {
  const updatedData = { ...mockMarketDataService.getCurrentPrice(), ...newData }
  
  // Update the mock data
  mockMarketDataService.getCurrentPrice.mockReturnValue(updatedData)
  
  // Trigger subscribers if they exist
  const subscribers = (mockMarketDataService.subscribe as any)._subscribers || []
  subscribers.forEach((callback: any) => callback(updatedData))
  
  return updatedData
}

// Utility to simulate authentication flow
export const simulateAuthentication = async (success = true, userData = {}) => {
  const authResult = success ? {
    success: true,
    user: {
      ...mockAgentContext.userProfile,
      ...userData
    },
    identity: {},
    agent: {}
  } : {
    success: false,
    error: 'Authentication failed'
  }

  mockInternetIdentityService.authenticate.mockResolvedValue(authResult)
  
  if (success) {
    Object.assign(mockAgentContext, {
      isConnected: true,
      isAuthenticated: true,
      userProfile: authResult.user
    })
  }

  return authResult
}

// Utility to simulate payment flow
export const simulatePaymentFlow = async (success = true, tier = 'basic') => {
  if (success) {
    mockStripePaymentService.createSubscription.mockResolvedValue({
      success: true,
      paymentIntent: {
        id: 'pi_test123',
        clientSecret: 'pi_test123_secret',
        amountUSD: 29,
        amountICP: 2.32,
        conversionRate: 12.50,
        currency: 'usd',
        status: 'requires_payment_method',
        tier,
        customer: 'cus_test123'
      },
      subscription: {
        id: 'sub_test123',
        status: 'incomplete',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tier
      }
    })

    mockStripePaymentService.confirmPayment.mockResolvedValue({
      success: true,
      paymentIntent: {
        id: 'pi_test123',
        status: 'succeeded'
      }
    })
  } else {
    mockStripePaymentService.createSubscription.mockResolvedValue({
      success: false,
      error: 'Payment failed'
    })
  }
}

// Clean up function to reset mocks
export const cleanupMocks = () => {
  vi.clearAllMocks()
  
  // Reset agent context to defaults
  Object.assign(mockAgentContext, {
    isConnected: true,
    isAuthenticated: true,
    isLoading: false,
    error: null
  })
  
  // Setup fresh fetch mock
  setupFetchMock()
}

// Export commonly used testing utilities
export * from '@testing-library/react'
export * from '@testing-library/user-event'
export { vi } from 'vitest'