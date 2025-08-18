import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { createEconActor } from '../services/canisterService'
import { PaymentService } from '../services/paymentService'

interface SubscriptionTier {
  name: string
  monthly_fee_usd: number
  max_agents: number
  monthly_agent_creations: number
  token_limit: number
  inference_rate: 'Standard' | 'Priority' | 'Premium'
  features: string[]
}

interface UserSubscription {
  principal_id: string
  tier: SubscriptionTier
  started_at: number
  expires_at: number
  auto_renew: boolean
  current_usage: {
    agents_created_this_month: number
    tokens_used_this_month: number
    inferences_this_month: number
    last_reset_date: number
  }
  payment_status: 'Active' | 'Pending' | 'Failed' | 'Cancelled'
  created_at: number
  updated_at: number
}

interface UsageMetrics {
  agents_created_this_month: number
  tokens_used_this_month: number
  inferences_this_month: number
  last_reset_date: number
}

const Subscription = () => {
  const { isConnected, createAuthAgent, principal } = useAgent()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null)
  const [availableTiers, setAvailableTiers] = useState<Map<string, SubscriptionTier>>(new Map())
  
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [autoRenew, setAutoRenew] = useState(true)
  const [subscribeLoading, setSubscribeLoading] = useState(false)

  // Predefined subscription tiers
  const subscriptionTiers: SubscriptionTier[] = [
    {
      name: 'Free',
      monthly_fee_usd: 0,
      max_agents: 1,
      monthly_agent_creations: 3,
      token_limit: 10000,
      inference_rate: 'Standard',
      features: [
        '1 concurrent agent',
        '3 agent creations per month',
        '10K tokens per month',
        'Standard inference priority',
        'Community support',
      ],
    },
    {
      name: 'Basic',
      monthly_fee_usd: 29,
      max_agents: 5,
      monthly_agent_creations: 10,
      token_limit: 100000,
      inference_rate: 'Standard',
      features: [
        '5 concurrent agents',
        '10 agent creations per month',
        '100K tokens per month',
        'Standard inference priority',
      ],
    },
    {
      name: 'Pro',
      monthly_fee_usd: 99,
      max_agents: 25,
      monthly_agent_creations: 50,
      token_limit: 500000,
      inference_rate: 'Priority',
      features: [
        '25 concurrent agents',
        '50 agent creations per month',
        '500K tokens per month',
        'Priority inference',
        'Advanced analytics',
      ],
    },
    {
      name: 'Enterprise',
      monthly_fee_usd: 299,
      max_agents: 100,
      monthly_agent_creations: 200,
      token_limit: 2000000,
      inference_rate: 'Premium',
      features: [
        '100 concurrent agents',
        '200 agent creations per month',
        '2M tokens per month',
        'Premium inference priority',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
      ],
    },
  ]

  useEffect(() => {
    // Initialize available tiers
    const tiersMap = new Map()
    subscriptionTiers.forEach(tier => {
      tiersMap.set(tier.name.toLowerCase(), tier)
    })
    setAvailableTiers(tiersMap)
    
    if (isConnected) {
      fetchSubscriptionData()
    }
  }, [isConnected])

  const fetchSubscriptionData = async () => {
    if (!isConnected) return
    
    setLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const econActor = createEconActor(agent as any)
      
      // Fetch current subscription and usage, create free tier if none exists
      const [subscription, usage] = await Promise.all([
        econActor.get_user_subscription([]).then(sub => {
          if (!sub) {
            // Create free tier subscription for new user
            return econActor.get_or_create_free_subscription()
          }
          return sub
        }),
        econActor.get_user_usage([]),
      ])

      setCurrentSubscription(subscription as any)
      setUsageMetrics(usage as any)
      
    } catch (err) {
      console.error('Failed to fetch subscription data:', err)
      setError('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!selectedTier) {
      setError('Please select a subscription tier')
      return
    }

    setSubscribeLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      // Check if it's a free tier (no payment required)
      const selectedTierConfig = availableTiers.get(selectedTier)
      if (!selectedTierConfig) {
        throw new Error('Invalid subscription tier')
      }

      if (selectedTierConfig.monthly_fee_usd === 0) {
        // Free tier - create subscription directly
        const econActor = createEconActor(agent as any)
        await econActor.create_subscription(selectedTier, autoRenew)
        
        setSuccess(`Successfully subscribed to ${selectedTier} tier!`)
      } else {
        // Paid tier - process payment through OISY wallet
        const paymentService = new PaymentService(agent)
        const paymentResult = await paymentService.subscribeWithPayment(selectedTier)
        
        if (paymentResult.success) {
          // Payment successful, create subscription
          const econActor = createEconActor(agent as any)
          await econActor.create_subscription(selectedTier, autoRenew)
          
          setSuccess(`Successfully subscribed to ${selectedTier} tier! Payment processed.`)
        } else {
          throw new Error(paymentResult.error || 'Payment failed')
        }
      }
      
      setShowSubscribeModal(false)
      setSelectedTier('')
      
      // Refresh subscription data
      await fetchSubscriptionData()
      
    } catch (err) {
      console.error('Failed to subscribe:', err)
      setError(err instanceof Error ? err.message : 'Failed to create subscription. Please try again.')
    } finally {
      setSubscribeLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return
    
    setLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const econActor = createEconActor(agent as any)
      
      await econActor.cancel_subscription()
      
      setSuccess('Subscription cancelled successfully')
      await fetchSubscriptionData()
      
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
      setError('Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleRenewSubscription = async () => {
    if (!currentSubscription) return
    
    setLoading(true)
    setError(null)
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const econActor = createEconActor(agent as any)
      
      await econActor.renew_subscription()
      
      setSuccess('Subscription renewed successfully')
      await fetchSubscriptionData()
      
    } catch (err) {
      console.error('Failed to renew subscription:', err)
      setError('Failed to renew subscription')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp / 1000000).toLocaleDateString()
  }

  const formatUsage = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100
    return `${usage.toLocaleString()} / ${limit.toLocaleString()} (${percentage.toFixed(1)}%)`
  }

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 75) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
          <p className="text-gray-400 mt-2">Manage your subscription and monitor usage</p>
        </div>
        {!currentSubscription && (
          <Button
            onClick={() => setShowSubscribeModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Current Subscription */}
      {currentSubscription && (
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Current Subscription</h2>
              <p className="text-gray-400">Active subscription details</p>
            </div>
            <Badge 
              variant={currentSubscription.payment_status === 'Active' ? 'success' : 'warning'}
            >
              {currentSubscription.payment_status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">{currentSubscription.tier.name} Plan</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="font-medium">Monthly Fee:</span> ${currentSubscription.tier.monthly_fee_usd}</p>
                <p><span className="font-medium">Started:</span> {formatDate(currentSubscription.started_at)}</p>
                <p><span className="font-medium">Expires:</span> {formatDate(currentSubscription.expires_at)}</p>
                <p><span className="font-medium">Auto-renew:</span> {currentSubscription.auto_renew ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">Usage This Month</h3>
              <div className="space-y-2 text-gray-300">
                <p>
                  <span className="font-medium">Agents Created:</span>
                  <span className={getUsageColor(currentSubscription.current_usage.agents_created_this_month, currentSubscription.tier.monthly_agent_creations)}>
                    {' '}{formatUsage(currentSubscription.current_usage.agents_created_this_month, currentSubscription.tier.monthly_agent_creations)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Tokens Used:</span>
                  <span className={getUsageColor(currentSubscription.current_usage.tokens_used_this_month, currentSubscription.tier.token_limit)}>
                    {' '}{formatUsage(currentSubscription.current_usage.tokens_used_this_month, currentSubscription.tier.token_limit)}
                  </span>
                </p>
                <p><span className="font-medium">Inferences:</span> {currentSubscription.current_usage.inferences_this_month.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleRenewSubscription}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              Renew Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              variant="outline"
              className="border-red-500 text-red-300 hover:bg-red-500/10"
              disabled={loading}
            >
              Cancel Subscription
            </Button>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionTiers.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-lg p-6 ${
                currentSubscription?.tier.name === tier.name
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {tier.monthly_fee_usd === 0 ? 'Free' : `$${tier.monthly_fee_usd}`}
                </p>
                <p className="text-gray-400">
                  {tier.monthly_fee_usd === 0 ? 'forever' : 'per month'}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>

              {currentSubscription?.tier.name === tier.name ? (
                <Button disabled className="w-full bg-gray-600">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setSelectedTier(tier.name.toLowerCase())
                    setShowSubscribeModal(true)
                  }}
                  className={`w-full ${
                    tier.monthly_fee_usd === 0 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {currentSubscription 
                    ? (tier.monthly_fee_usd === 0 ? 'Downgrade' : 'Upgrade')
                    : (tier.monthly_fee_usd === 0 ? 'Start Free' : 'Subscribe')
                  }
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Subscribe Modal */}
      <Modal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        title="Subscribe to Plan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Plan
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Choose a plan...</option>
              {subscriptionTiers.map((tier) => (
                <option key={tier.name} value={tier.name.toLowerCase()}>
                  {tier.name} - ${tier.monthly_fee_usd}/month
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRenew"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoRenew" className="text-gray-300">
              Auto-renew subscription
            </label>
          </div>

          {selectedTier && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">
                {availableTiers.get(selectedTier)?.name} Plan Details
              </h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• {availableTiers.get(selectedTier)?.max_agents} concurrent agents</p>
                <p>• {availableTiers.get(selectedTier)?.monthly_agent_creations} agent creations per month</p>
                <p>• {(availableTiers.get(selectedTier)?.token_limit || 0).toLocaleString()} tokens per month</p>
                <p>• {availableTiers.get(selectedTier)?.inference_rate} inference priority</p>
                {selectedTier === 'free' && (
                  <p className="text-green-400 font-medium">• No credit card required</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubscribe}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedTier || subscribeLoading}
            >
              {subscribeLoading ? <LoadingSpinner size="sm" /> : 
                selectedTier === 'free' ? 'Start Free' : 'Subscribe'
              }
            </Button>
            <Button
              onClick={() => setShowSubscribeModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Subscription
