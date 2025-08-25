import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { econCanister, agent } from '../services/canisterService'
import {
  Subscription,
  TierConfig,
  PaymentStatus,
  QuotaValidation,
  UsageMetrics
} from '../declarations/ohms_econ'

import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import ProfilePhoto from '../components/ProfilePhoto'
import { EconomicsAdminMetrics, SystemHealthBanner } from '../components/AdminMetrics'

import AdminCycleManager from '../components/AdminCycleManager'

interface Receipt {
  receipt_id: string
  request_id: string
  amount: number
  status: 'pending' | 'settled' | 'disputed' | 'refunded'
  created_at: number
  settled_at?: number
  agent_id: string
  model_id: string
  tokens_processed: number
  actual_cost: number
  estimated_cost: number
}

interface Estimate {
  base_cost: number
  priority_multiplier: number
  protocol_fee: number
  total_cost: number
  estimated_time: string
  confidence: number
}

interface Statement {
  period: string
  total_spent: number
  total_jobs: number
  total_tokens: number
  cost_breakdown: {
    agent_fees: number
    protocol_fees: number
    storage_fees: number
    compute_fees: number
  }
  receipts: Receipt[]
}

const Economics = () => {
  const { isConnected, userProfile, principal, isAdmin } = useAgent()
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'estimates' | 'subscription'>('overview')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [statements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null)
  const [subscribeErr, setSubscribeErr] = useState<string | null>(null)

  // Real subscription state
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [availableTiers, setAvailableTiers] = useState<[string, TierConfig][]>([])
  const [basicTimeRemaining, setBasicTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    expired: boolean
  } | null>(null)
  
  // Estimate form
  const [estimateForm, setEstimateForm] = useState({
    task_description: '',
    estimated_tokens: 1000,
    priority: 'medium' as 'low' | 'medium' | 'high',
    agent_type: 'general'
  })
  const [currentEstimate, setCurrentEstimate] = useState<Estimate | null>(null)

  // Balance and stats
  const [balance] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [monthlySpent, setMonthlySpent] = useState(0)

  // Initialize real subscription data
  useEffect(() => {
    const initializeRealData = async () => {
      try {
        setLoading(true)

        // Get available subscription tiers from economics canister
        const tiers = await econCanister.get_subscription_tiers()
        setAvailableTiers(tiers)

        console.log('✅ Real subscription tiers loaded:', {
          tierCount: tiers.length,
          tiers: tiers.map(([name, _]) => name)
        })
      } catch (error) {
        console.error('❌ Failed to initialize real subscription data:', error)
        setError('Failed to load subscription tiers')
      } finally {
        setLoading(false)
      }
    }

    initializeRealData()
  }, [])

  // Load user subscription when authenticated
  useEffect(() => {
    const loadUserSubscription = async () => {
      if (!isConnected || !principal) {
        return
      }

      try {
        setLoading(true)

        // Get user subscription from economics canister
        const subscription = await econCanister.get_user_subscription([principal])

        if (subscription) {
          setCurrentSubscription(subscription)

          // If user has basic plan, calculate time remaining
          if (subscription.tier.name === "Basic") {
            const now = Date.now() * 1000000 // Convert to nanoseconds
            const expiresAt = Number(subscription.expires_at)
            const timeRemainingMs = expiresAt - now

            if (timeRemainingMs > 0) {
              const days = Math.floor(timeRemainingMs / (24 * 60 * 60 * 1000000))
              const hours = Math.floor((timeRemainingMs % (24 * 60 * 60 * 1000000)) / (60 * 60 * 1000000))
              const minutes = Math.floor((timeRemainingMs % (60 * 60 * 1000000)) / (60 * 1000000))
              setBasicTimeRemaining({ days, hours, minutes, expired: false })
            } else {
              setBasicTimeRemaining({ days: 0, hours: 0, minutes: 0, expired: true })
            }
          }

          console.log('✅ User subscription loaded:', {
            tier: subscription.tier.name,
            principal: principal,
            status: Object.keys(subscription.payment_status)[0]
          })
        } else {
          // No subscription found, create free Basic subscription automatically
          console.log('📝 No subscription found, creating free Basic subscription...')
          const newSubscription = await econCanister.get_or_create_free_basic_subscription()
          setCurrentSubscription(newSubscription)

          console.log('✅ Free Basic subscription created:', {
            tier: newSubscription.tier.name,
            principal: principal
          })
        }
      } catch (error) {
        console.error('❌ Failed to load user subscription:', error)
        setError('Failed to load subscription status')
      } finally {
        setLoading(false)
      }
    }

    loadUserSubscription()
  }, [isConnected, userProfile, principal])

  const fetchReceipts = async () => {
    try {
      const principalId = (await agent.getPrincipal()).toString()
      const res: any = await econCanister.list_receipts([principalId], [50])
      if (res && 'Ok' in res) {
        const list = res.Ok as any[]
        setReceipts(list)
        const totalPending = list
          .filter((r: any) => 'Pending' in r.settlement_status)
          .reduce((sum: number, r: any) => sum + Number(r.fees_breakdown?.total_amount ?? r.actual_cost ?? 0), 0)
        setPendingAmount(totalPending)
        const totalSpent = list
          .filter((r: any) => 'Completed' in r.settlement_status)
          .reduce((sum: number, r: any) => sum + Number(r.fees_breakdown?.total_amount ?? r.actual_cost ?? 0), 0)
        setMonthlySpent(totalSpent)
      } else {
        setReceipts([])
        setPendingAmount(0)
        setMonthlySpent(0)
      }
    } catch (err) {
      console.error('Failed to fetch receipts:', err)
    }
  }

  // Remove unused fetchStatements function

  // Remove unused fetchBalance function

  const handleGetEstimate = async () => {
    setLoading(true)
    try {
      const priorityMap: any = { low: { Low: null }, medium: { Normal: null }, high: { High: null } }
      const spec = {
        job_id: `ui-job-${Date.now()}`,
        model_id: 'tinyllama',
        estimated_tokens: estimateForm.estimated_tokens,
        estimated_compute_cycles: BigInt(1_000_000),
        priority: priorityMap[estimateForm.priority]
      }
      const res: any = await econCanister.estimate(spec)
      if (res && 'Ok' in res) {
        const q = res.Ok as any
        setCurrentEstimate({
          base_cost: Number(q.base_cost),
          priority_multiplier: Number(q.priority_multiplier),
          protocol_fee: Number(q.protocol_fee),
          total_cost: Number(q.estimated_cost),
          estimated_time: estimateForm.priority === 'high' ? '5-15 min' : estimateForm.priority === 'medium' ? '15-30 min' : '30-60 min',
          confidence: 0.9,
        })
      } else {
        setError((res as any).Err || 'Failed to get estimate')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get estimate')
    } finally {
      setLoading(false)
    }
  }

  // Handle real subscription plan change
  const handleSubscribe = async (tierName: string) => {
    if (!principal) {
      setSubscribeErr('Internet Identity authentication required')
      return
    }

    setSubscribeLoading(true)
    setSubscribeErr(null)
    setSubscribeMsg(null)

    try {
      console.log('🔄 Changing to real subscription tier:', tierName)

      // Create subscription using economics canister
      const updatedSubscription = await econCanister.create_subscription(tierName, true)
      setCurrentSubscription(updatedSubscription)

      // Success message based on tier
      if (tierName === "basic") {
        setSubscribeMsg('Basic Plan activated successfully')

        // Update timer for Basic plan
        const now = Date.now() * 1000000 // Convert to nanoseconds
        const expiresAt = Number(updatedSubscription.expires_at)
        const timeRemainingMs = expiresAt - now

        if (timeRemainingMs > 0) {
          const days = Math.floor(timeRemainingMs / (24 * 60 * 60 * 1000000))
          const hours = Math.floor((timeRemainingMs % (24 * 60 * 60 * 1000000)) / (60 * 60 * 1000000))
          const minutes = Math.floor((timeRemainingMs % (60 * 60 * 1000000)) / (60 * 1000000))
          setBasicTimeRemaining({ days, hours, minutes, expired: false })
        }
      } else {
        setSubscribeMsg(`Switched to ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} Plan successfully!`)
      }

      console.log('✅ Subscription updated:', {
        tier: updatedSubscription.tier.name,
        principal: principal,
        expiresAt: new Date(Number(updatedSubscription.expires_at) / 1000000).toISOString()
      })

    } catch (error: any) {
      console.error('❌ Subscription change failed:', error)
      setSubscribeErr(error.message || 'Subscription change failed')
    } finally {
      setSubscribeLoading(false)
    }
  }

  // Update basic plan timer
  useEffect(() => {
    if (currentSubscription?.tier.name === "Basic" && principal) {
      const interval = setInterval(() => {
        const now = Date.now() * 1000000 // Convert to nanoseconds
        const expiresAt = Number(currentSubscription.expires_at)
        const timeRemainingMs = expiresAt - now

        if (timeRemainingMs > 0) {
          const days = Math.floor(timeRemainingMs / (24 * 60 * 60 * 1000000))
          const hours = Math.floor((timeRemainingMs % (24 * 60 * 60 * 1000000)) / (60 * 60 * 1000000))
          const minutes = Math.floor((timeRemainingMs % (60 * 60 * 1000000)) / (60 * 1000000))
          setBasicTimeRemaining({ days, hours, minutes, expired: false })
        } else {
          setBasicTimeRemaining({ days: 0, hours: 0, minutes: 0, expired: true })

          // If expired, refresh subscription to show downgraded status
          econCanister.get_user_subscription([principal]).then(subscription => {
            if (subscription) {
              setCurrentSubscription(subscription)
            }
          }).catch(console.error)
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [currentSubscription?.tier.name, principal])

  // Validate quota for real usage
  const validateQuota = async (operation: 'agent_creation' | 'token_usage') => {
    if (!principal) return null

    try {
      if (operation === 'agent_creation') {
        const result = await econCanister.validate_quota()
        return result
      } else {
        // For token usage, we'd need to pass the token amount
        const result = await econCanister.validate_quota()
        return result
      }
    } catch (error) {
      console.error('❌ Quota validation failed:', error)
      return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return 'success'
      case 'pending': return 'warning'
      case 'disputed': return 'error'
      case 'refunded': return 'info'
      default: return 'default'
    }
  }

  // Currency formatting helpers
  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ICP`
  const formatUSD = (amount: number) => `$${amount.toFixed(2)} USD`
  const formatICP = (amount: number) => `${amount.toFixed(3)} ICP`
  
  // Real tier formatting helpers
  const formatTierName = (tierName: string) => {
    if (tierName === 'basic') return 'Basic (FREE for 1 month!)'
    return tierName.charAt(0).toUpperCase() + tierName.slice(1)
  }

  const formatTimeRemaining = (timeRemaining: { days: number; hours: number; minutes: number; expired: boolean } | null) => {
    if (!timeRemaining || timeRemaining.expired) return 'Expired'

    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h remaining`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
    } else {
      return `${timeRemaining.minutes}m remaining`
    }
  }

  const currentStatement = statements[0]

  // Show authentication prompt if not connected
  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">OHMS 2.0 - Economics & Subscriptions</h1>
          <p className="text-textOnDark/70 mb-6">Please authenticate with Internet Identity v2 to access subscription management</p>
          <p className="text-textOnDark/50 text-sm">Flexible plans available with real-time usage tracking!</p>
        </Card>
      </div>
    )
  }

  // Show Google account requirement for subscription features
  if (!userProfile?.googleAccount) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">OHMS 2.0 - Economics & Subscriptions</h1>
          <p className="text-textOnDark/70 mb-6">Google account integration required for subscription features</p>
          <p className="text-textOnDark/50 text-sm">Please re-authenticate with Google OAuth through Internet Identity v2</p>
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-300 font-medium mb-2">🎉 Subscription Plans Available:</h3>
            <ul className="text-blue-200/80 text-sm space-y-1">
              <li>• Free Plan: 5 models/month, 10 compute hours</li>
              <li>• Basic Plan: 50 models/month, 100 compute hours</li>
              <li>• Enterprise-grade infrastructure and support</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SystemHealthBanner />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accentGold mb-2">OHMS 2.0 - Economics & Subscriptions</h1>
        <p className="text-textOnDark/70">Subscription management with flexible plans and real-time usage tracking</p>
        
        {/* Google Profile and Subscription Status */}
        {currentSubscription && userProfile?.googleAccount && (
          <Card className="mt-6">
            <div className="flex items-start gap-4">
              <ProfilePhoto
                src={userProfile.picture}
                alt={userProfile.name || 'User'}
                fallbackName={userProfile.name}
                size="xl"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-accentGold">
                    {userProfile.name || 'Anonymous User'}
                  </h3>
                  <Badge variant="success" size="sm">✓ Google Verified</Badge>
                  {isAdmin && <Badge variant="warning" size="sm">Admin</Badge>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-textOnDark/60">Email:</span>
                    <p className="text-textOnDark font-medium truncate">{userProfile.email}</p>
                  </div>
                  <div>
                    <span className="text-textOnDark/60">Current Plan:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={currentSubscription.tier.name === "Basic" ? 'success' : 'info'} size="sm">
                        {formatTierName(currentSubscription.tier.name)}
                      </Badge>
                      {currentSubscription.tier.name === "Basic" && basicTimeRemaining && (
                        <span className={`text-xs ${basicTimeRemaining.expired ? 'text-red-400' : 'text-green-400'}`}>
                          {formatTimeRemaining(basicTimeRemaining)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-textOnDark/60">Google ID:</span>
                    <p className="text-textOnDark font-medium font-mono text-xs truncate">
                      {userProfile.googleAccount.googleId.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'subscription', label: 'Subscription', icon: '💳' },
            { id: 'receipts', label: 'Receipts', icon: '🧾' },
            { id: 'estimates', label: 'Cost Estimates', icon: '💰' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {isAdmin && <EconomicsAdminMetrics />}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Usage & Quota Display */}
          {currentSubscription && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-accentGold mb-4">
                Usage & Quotas {currentSubscription.tier.name === "Basic" ? "(FREE for 1 month!)" : ""}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-textOnDark/60 text-sm">Agent Creations</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <p className="text-textOnDark font-medium">
                    {currentSubscription.tier.monthly_agent_creations - (currentSubscription.current_usage?.agents_created_this_month || 0)} remaining
                  </p>
                  <p className="text-textOnDark/60 text-xs">
                    Monthly limit: {currentSubscription.tier.monthly_agent_creations}
                  </p>
                </div>

                <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-textOnDark/60 text-sm">Tokens</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <p className="text-textOnDark font-medium">
                    {(currentSubscription.tier.token_limit - (currentSubscription.current_usage?.tokens_used_this_month || 0)).toLocaleString()} remaining
                  </p>
                  <p className="text-textOnDark/60 text-xs">
                    Monthly limit: {currentSubscription.tier.token_limit.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-textOnDark/60 text-sm">Status</span>
                    <Badge variant={Object.keys(currentSubscription.payment_status)[0] === "Active" ? 'success' : 'warning'} size="sm">
                      {Object.keys(currentSubscription.payment_status)[0]}
                    </Badge>
                  </div>
                  <p className="text-textOnDark font-medium">
                    {currentSubscription.tier.name === "Basic" ? "FREE" : `$${currentSubscription.tier.monthly_fee_usd}`}
                  </p>
                  <p className="text-textOnDark/60 text-xs">
                    {currentSubscription.tier.name === "Basic" ? "1 month free!" : "Monthly fee"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Balance & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Available Balance</p>
                <p className="text-2xl font-bold text-accentGold">{formatCurrency(balance)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(pendingAmount)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Monthly Spent</p>
                <p className="text-2xl font-bold text-textOnDark">{formatCurrency(monthlySpent)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Total Jobs</p>
                <p className="text-2xl font-bold text-textOnDark">{receipts.length}</p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-accentGold">Recent Activity</h3>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('receipts')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {receipts.slice(0, 5).map((receipt) => (
                <div key={receipt.receipt_id} className="flex items-center justify-between p-3 bg-primary/40 rounded border border-accentGold/20">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(receipt.status)} size="sm">
                      {receipt.status}
                    </Badge>
                    <div>
                      <p className="font-medium text-textOnDark">{receipt.receipt_id}</p>
                      <p className="text-sm text-textOnDark/60">
                        {receipt.model_id} • {receipt.tokens_processed} tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-textOnDark">{formatCurrency(receipt.amount)}</p>
                    <p className="text-sm text-textOnDark/60">
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hover className="text-center cursor-pointer" onClick={() => setShowEstimateModal(true)}>
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-accentGold font-semibold mb-2">Get Cost Estimate</h3>
              <p className="text-textOnDark/70 text-sm">Estimate costs before running tasks</p>
            </Card>
            <Card hover className="text-center cursor-pointer" onClick={() => setActiveTab('receipts')}>
              <div className="text-3xl mb-3">🧾</div>
              <h3 className="text-accentGold font-semibold mb-2">View Receipts</h3>
              <p className="text-textOnDark/70 text-sm">Track all payment transactions</p>
            </Card>
            <Card hover className="text-center cursor-pointer" onClick={() => setActiveTab('subscription')}>
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="text-accentGold font-semibold mb-2">Subscription Plans</h3>
              <p className="text-textOnDark/70 text-sm mb-3">Flexible plans with real-time usage tracking</p>
                                {currentSubscription ? (
                    <div className="space-y-2">
                      <Badge variant={currentSubscription.tier.name === "Basic" ? 'success' : 'info'} size="sm">
                        {formatTierName(currentSubscription.tier.name)} Plan
                      </Badge>
                      {currentSubscription.tier.name === "Basic" && basicTimeRemaining && (
                        <p className="text-green-400 text-xs">
                          {formatTimeRemaining(basicTimeRemaining)}
                        </p>
                      )}
                      <Button size="sm" variant="outline" fullWidth>
                        Manage Plan
                      </Button>
                    </div>
                  ) : (
                <div className="space-y-2">
                  <p className="text-textOnDark/60 text-xs">Choose your subscription plan</p>
                  <Button size="sm" variant="primary" fullWidth>
                    Select Plan
                  </Button>
                </div>
              )}
              {subscribeMsg && <p className="text-green-400 text-xs mt-2">{subscribeMsg}</p>}
              {subscribeErr && <p className="text-red-400 text-xs mt-2">{subscribeErr}</p>}
            </Card>
          </div>

          {/* Subscription Plans Overview */}
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-accentGold">
                Available Subscription Plans
                {currentSubscription?.tier.name === "Basic" ? " - You're on the FREE Basic Plan! 🎉" : ""}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('subscription')}
              >
                Manage Plans
              </Button>
            </div>

            {availableTiers.length > 0 ? (
              <div className="space-y-4">
                {availableTiers.map(([tierName, tierConfig]) => (
                  <Card key={tierName} className={`p-4 ${tierName === "basic" ? "border-accentGold/50 bg-accentGold/5" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-accentGold">
                          {formatTierName(tierName)}
                        </h4>
                        <p className="text-textOnDark/70 text-sm">{tierConfig.features.join(", ")}</p>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-accentGold">
                            {tierConfig.monthly_fee_usd === 0 ? "FREE" : `$${tierConfig.monthly_fee_usd}`}
                          </span>
                          <span className="text-textOnDark/60 text-sm"> /month</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-textOnDark/60 text-sm">
                          {tierConfig.max_agents} agents
                        </p>
                        <p className="text-textOnDark/60 text-sm">
                          {tierConfig.monthly_agent_creations} creations/month
                        </p>
                        <p className="text-textOnDark/60 text-sm">
                          {tierConfig.token_limit.toLocaleString()} tokens/month
                        </p>
                        {tierName === "basic" && (
                          <Badge variant="success" size="sm" className="mt-2">
                            RECOMMENDED - FREE!
                          </Badge>
                        )}
                      </div>
                    </div>
                    {tierName !== currentSubscription?.tier.name && (
                      <Button
                        size="sm"
                        variant={tierName === "basic" ? "primary" : "outline"}
                        className="mt-3"
                        onClick={() => handleSubscribe(tierName)}
                        loading={subscribeLoading}
                      >
                        {tierName === "basic" ? "Get FREE Basic Plan" : `Select ${formatTierName(tierName)}`}
                      </Button>
                    )}
                    {tierName === currentSubscription?.tier.name && (
                      <Badge variant="success" size="sm" className="mt-3">
                        CURRENT PLAN
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <LoadingSpinner size="md" />
                <p className="text-textOnDark/60 mt-2">Loading subscription plans...</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Payment Receipts</h2>
            <Button variant="outline" onClick={fetchReceipts} loading={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <Card key={receipt.receipt_id}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Receipt Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">ID:</span> {receipt.receipt_id}</p>
                        <p><span className="text-textOnDark/60">Request:</span> {receipt.request_id}</p>
                        <p><span className="text-textOnDark/60">Agent:</span> {receipt.agent_id}</p>
                        <p><span className="text-textOnDark/60">Model:</span> {receipt.model_id}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Payment Info</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Amount:</span>
                          <span className="text-textOnDark font-medium">{formatCurrency(receipt.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Estimated:</span>
                          <span className="text-textOnDark">{formatCurrency(receipt.estimated_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Variance:</span>
                          <span className={receipt.actual_cost <= receipt.estimated_cost ? 'text-green-400' : 'text-orange-400'}>
                            {receipt.actual_cost <= receipt.estimated_cost ? '-' : '+'}
                            {Math.abs(receipt.actual_cost - receipt.estimated_cost)} ICP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Usage Stats</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">Tokens:</span> {receipt.tokens_processed.toLocaleString()}</p>
                        <p><span className="text-textOnDark/60">Cost/Token:</span> {(receipt.amount / receipt.tokens_processed).toFixed(3)} ICP</p>
                        <Badge variant={getStatusColor(receipt.status)} size="sm">
                          {receipt.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Timestamps</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">Created:</span></p>
                        <p className="text-textOnDark">{new Date(receipt.created_at).toLocaleString()}</p>
                        {receipt.settled_at && (
                          <>
                            <p><span className="text-textOnDark/60">Settled:</span></p>
                            <p className="text-textOnDark">{new Date(receipt.settled_at).toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estimates Tab */}
      {activeTab === 'estimates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Cost Estimates</h2>
            <Button onClick={() => setShowEstimateModal(true)}>
              New Estimate
            </Button>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Cost Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Task Description"
                  value={estimateForm.task_description}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, task_description: e.target.value }))}
                  placeholder="Describe your task..."
                />
                
                <Input
                  label="Estimated Tokens"
                  type="number"
                  value={estimateForm.estimated_tokens}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimated_tokens: Number(e.target.value) }))}
                  min={100}
                  max={10000}
                />
                
                <div>
                  <label className="block text-sm font-medium text-textOnDark mb-2">Priority</label>
                  <select
                    value={estimateForm.priority}
                    onChange={(e) => setEstimateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
                  >
                    <option value="low">Low Priority (1.0x)</option>
                    <option value="medium">Medium Priority (1.2x)</option>
                    <option value="high">High Priority (1.5x)</option>
                  </select>
                </div>
                
                <Button 
                  fullWidth 
                  onClick={handleGetEstimate}
                  loading={loading}
                  disabled={!estimateForm.task_description}
                >
                  Calculate Estimate
                </Button>
              </div>

              {currentEstimate && (
                <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
                  <h4 className="text-accentGold font-medium mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Base Cost:</span>
                      <span className="text-textOnDark">{formatCurrency(currentEstimate.base_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Priority Multiplier:</span>
                      <span className="text-textOnDark">{currentEstimate.priority_multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Protocol Fee (3%):</span>
                      <span className="text-textOnDark">{formatCurrency(currentEstimate.protocol_fee)}</span>
                    </div>
                    <div className="border-t border-accentGold/20 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-accentGold">Total Cost:</span>
                        <span className="text-accentGold text-lg">{formatCurrency(currentEstimate.total_cost)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-accentGold/20">
                      <p className="text-textOnDark/60 text-xs">Estimated Time: {currentEstimate.estimated_time}</p>
                      <p className="text-textOnDark/60 text-xs">Confidence: {(currentEstimate.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-accentGold">Subscription Management</h2>
            <div className="text-sm text-textOnDark/60">
              Flexible plans with real-time usage tracking
            </div>
          </div>

          {/* Admin Cycle Management (only for admins) */}
          {isAdmin && <AdminCycleManager />}

          {/* Subscription Success/Error Messages */}
          {subscribeMsg && (
            <Card className="border-green-500/50 bg-green-900/20">
              <p className="text-green-300">{subscribeMsg}</p>
            </Card>
          )}

          {subscribeErr && (
            <Card className="border-red-500/50 bg-red-900/20">
              <p className="text-red-300">{subscribeErr}</p>
            </Card>
          )}

          {/* Subscription Tiers */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-accentGold mb-2">Choose Your Plan</h3>
              <p className="text-textOnDark/70">
                {currentSubscription?.tier.name === "Basic"
                  ? "🎉 You're currently on the FREE Basic Plan for 1 month!"
                  : "Select the plan that best fits your needs"
                }
              </p>
            </div>

            {availableTiers.map(([tierName, tierConfig]) => (
              <Card key={tierName} className={`p-6 ${tierName === "basic" ? "border-accentGold/50 bg-accentGold/5" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-accentGold">
                      {formatTierName(tierName)}
                    </h4>
                    {tierName === "basic" && (
                      <p className="text-green-400 text-sm font-medium">✨ FREE for 1 month - No credit card required!</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accentGold">
                      {tierConfig.monthly_fee_usd === 0 ? "FREE" : `$${tierConfig.monthly_fee_usd}`}
                    </div>
                    <div className="text-textOnDark/60 text-sm">per month</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-accentGold font-medium mb-2">Features:</h5>
                    <ul className="text-textOnDark/80 text-sm space-y-1">
                      {tierConfig.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-accentGold font-medium mb-2">Limits:</h5>
                    <ul className="text-textOnDark/80 text-sm space-y-1">
                      <li>• {tierConfig.max_agents} concurrent agents</li>
                      <li>• {tierConfig.monthly_agent_creations} agent creations/month</li>
                      <li>• {tierConfig.token_limit.toLocaleString()} tokens/month</li>
                      <li>• {tierConfig.inference_rate} priority</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {tierName === currentSubscription?.tier.name ? (
                    <Badge variant="success" size="lg">
                      ✓ CURRENT PLAN
                    </Badge>
                  ) : (
                    <Button
                      size="lg"
                      variant={tierName === "basic" ? "primary" : "outline"}
                      onClick={() => handleSubscribe(tierName)}
                      loading={subscribeLoading}
                      className={tierName === "basic" ? "bg-gradient-to-r from-accentGold to-accentGold/80 text-primary" : ""}
                    >
                      {tierName === "basic" ? "🚀 Get FREE Basic Plan" : `Select ${formatTierName(tierName)}`}
                    </Button>
                  )}

                  {tierName === "basic" && currentSubscription?.tier.name === "Basic" && basicTimeRemaining && (
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-medium">
                        {formatTimeRemaining(basicTimeRemaining)}
                      </p>
                      <p className="text-textOnDark/60 text-xs">
                        until free period ends
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {/* Success/Error Messages */}
            {subscribeMsg && (
              <Card className="border-green-500/50 bg-green-900/20">
                <p className="text-green-300 text-center py-2">{subscribeMsg}</p>
              </Card>
            )}

            {subscribeErr && (
              <Card className="border-red-500/50 bg-red-900/20">
                <p className="text-red-300 text-center py-2">{subscribeErr}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Billing & Statements</h2>
            <Button onClick={() => setShowBillingModal(true)}>
              Export Statement
            </Button>
          </div>

          {currentStatement && (
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-accentGold mb-3">{currentStatement.period} Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Spent:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.total_spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Jobs:</span>
                      <span className="text-textOnDark font-medium">{currentStatement.total_jobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Tokens:</span>
                      <span className="text-textOnDark font-medium">{currentStatement.total_tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Avg Cost/Job:</span>
                      <span className="text-textOnDark font-medium">
                        {formatCurrency(Math.round(currentStatement.total_spent / currentStatement.total_jobs))}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-accentGold mb-3">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Agent Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.agent_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Protocol Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.protocol_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Storage Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.storage_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Compute Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.compute_fees)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Estimate Modal */}
      <Modal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        title="Get Cost Estimate"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            label="Task Description"
            value={estimateForm.task_description}
            onChange={(e) => setEstimateForm(prev => ({ ...prev, task_description: e.target.value }))}
            placeholder="Describe what you want to accomplish..."
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Tokens"
              type="number"
              value={estimateForm.estimated_tokens}
              onChange={(e) => setEstimateForm(prev => ({ ...prev, estimated_tokens: Number(e.target.value) }))}
              min={100}
              max={10000}
              helperText="Approximate token count needed"
            />
            
            <div>
              <label className="block text-sm font-medium text-textOnDark mb-2">Priority Level</label>
              <select
                value={estimateForm.priority}
                onChange={(e) => setEstimateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
              >
                <option value="low">Low Priority (1.0x)</option>
                <option value="medium">Medium Priority (1.2x)</option>
                <option value="high">High Priority (1.5x)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={() => setShowEstimateModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleGetEstimate}
              loading={loading}
              disabled={!estimateForm.task_description}
            >
              Get Estimate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Billing Export Modal */}
      <Modal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        title="Export Billing Statement"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-textOnDark/80">
            Export your billing statement for accounting and expense tracking purposes.
          </p>
          
          <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
            <h4 className="text-accentGold font-medium mb-2">Export Options</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="json" defaultChecked className="text-accentGold" />
                <span className="text-textOnDark">JSON Format (machine readable)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="csv" className="text-accentGold" />
                <span className="text-textOnDark">CSV Format (spreadsheet compatible)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="pdf" className="text-accentGold" />
                <span className="text-textOnDark">PDF Format (human readable)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowBillingModal(false)}>
              Cancel
            </Button>
            <Button fullWidth>
              Download Statement
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default Economics