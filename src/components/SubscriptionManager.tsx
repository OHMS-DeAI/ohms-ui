import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { 
  stripePaymentService, 
  SubscriptionTier,
  type SubscriptionTierInfo,
  type ICPMarketData 
} from '../services/stripePaymentService'

import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import SubscriptionTiers from './SubscriptionTiers'

interface SubscriptionManagerProps {
  className?: string
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  className = ''
}) => {
  const { userProfile, principal } = useAgent()
  
  const [currentSubscription, setCurrentSubscription] = useState<{
    hasActiveSubscription: boolean
    subscription?: {
      id: string
      status: string
      tier: SubscriptionTier
      currentPeriodEnd: Date
      cancelAtPeriodEnd: boolean
    }
    customer?: any
  } | null>(null)
  
  const [subscriptionTiers, setSubscriptionTiers] = useState<Record<SubscriptionTier, SubscriptionTierInfo> | null>(null)
  const [marketData, setMarketData] = useState<ICPMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<SubscriptionTier | null>(null)

  // Load subscription data
  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!userProfile?.googleAccount) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Load subscription status and pricing data in parallel
        const [subscriptionStatus, pricingInfo] = await Promise.all([
          stripePaymentService.getCustomerSubscription(userProfile.googleAccount),
          stripePaymentService.getPricingInfo()
        ])

        setCurrentSubscription(subscriptionStatus)
        setSubscriptionTiers(pricingInfo.tiers)
        setMarketData(pricingInfo.marketData)

        console.log('✅ Subscription data loaded:', {
          hasActive: subscriptionStatus.hasActiveSubscription,
          tier: subscriptionStatus.subscription?.tier
        })
      } catch (error) {
        console.error('❌ Failed to load subscription data:', error)
        setError('Failed to load subscription information')
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptionData()
  }, [userProfile])

  const handleUpgrade = async (newTier: SubscriptionTier) => {
    if (!currentSubscription?.subscription?.id || !userProfile?.googleAccount) {
      return
    }

    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await stripePaymentService.updateSubscription(
        currentSubscription.subscription.id,
        newTier
      )

      if (result.success) {
        setSuccessMessage(`Successfully upgraded to ${newTier} plan!`)
        setShowUpgradeModal(false)
        
        // Refresh subscription status
        const updatedStatus = await stripePaymentService.getCustomerSubscription(userProfile.googleAccount)
        setCurrentSubscription(updatedStatus)
      } else {
        throw new Error(result.error || 'Upgrade failed')
      }
    } catch (error: any) {
      console.error('❌ Upgrade failed:', error)
      setError(error.message || 'Failed to upgrade subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!currentSubscription?.subscription?.id || !userProfile?.googleAccount) {
      return
    }

    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await stripePaymentService.cancelSubscription(currentSubscription.subscription.id)

      if (result.success) {
        setSuccessMessage('Subscription cancelled successfully. Access will continue until the end of your billing period.')
        setShowCancelModal(false)
        
        // Refresh subscription status
        const updatedStatus = await stripePaymentService.getCustomerSubscription(userProfile.googleAccount)
        setCurrentSubscription(updatedStatus)
      } else {
        throw new Error(result.error || 'Cancellation failed')
      }
    } catch (error: any) {
      console.error('❌ Cancellation failed:', error)
      setError(error.message || 'Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)} USD`
  const formatICP = (amount: number) => `${amount.toFixed(3)} ICP`

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success'
      case 'trialing': return 'info'
      case 'past_due': return 'warning'
      case 'canceled': return 'error'
      case 'incomplete': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Active'
      case 'trialing': return 'Trial'
      case 'past_due': return 'Past Due'
      case 'canceled': return 'Cancelled'
      case 'incomplete': return 'Incomplete'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!userProfile?.googleAccount) {
    return (
      <Card className={`text-center py-8 ${className}`}>
        <h2 className="text-xl font-bold text-accentGold mb-2">Subscription Management</h2>
        <p className="text-textOnDark/70">Google account authentication required for subscription management</p>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="mb-6 border-green-500/50 bg-green-500/10">
          <p className="text-green-300">{successMessage}</p>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500/50 bg-red-500/10">
          <p className="text-red-300">{error}</p>
        </Card>
      )}

      {/* Current Subscription Status */}
      {currentSubscription?.hasActiveSubscription && currentSubscription.subscription ? (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-accentGold">Current Subscription</h2>
            <Badge 
              variant={getStatusColor(currentSubscription.subscription.status)} 
              size="sm"
            >
              {getStatusText(currentSubscription.subscription.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div>
              <h3 className="text-lg font-semibold text-accentGold mb-3">Plan Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-textOnDark/60">Plan:</span>
                  <span className="text-textOnDark font-medium capitalize">{currentSubscription.subscription.tier}</span>
                </div>
                
                {subscriptionTiers && subscriptionTiers[currentSubscription.subscription.tier] && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Price (USD):</span>
                      <span className="text-textOnDark font-medium">
                        {formatCurrency(subscriptionTiers[currentSubscription.subscription.tier].priceUSD)}/month
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Price (ICP):</span>
                      <span className="text-textOnDark font-medium">
                        {formatICP(subscriptionTiers[currentSubscription.subscription.tier].priceICP)}/month
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-textOnDark/60">Status:</span>
                  <span className="text-textOnDark font-medium">
                    {currentSubscription.subscription.cancelAtPeriodEnd ? 'Cancelling' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Billing Info */}
            <div>
              <h3 className="text-lg font-semibold text-accentGold mb-3">Billing Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-textOnDark/60">Next Billing:</span>
                  <span className="text-textOnDark font-medium">
                    {currentSubscription.subscription.currentPeriodEnd.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textOnDark/60">Billing Account:</span>
                  <span className="text-textOnDark font-medium">{userProfile.googleAccount.email}</span>
                </div>
                
                {marketData && (
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Current ICP Rate:</span>
                    <span className="text-textOnDark font-medium">{formatCurrency(marketData.priceUSD)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {!currentSubscription.subscription.cancelAtPeriodEnd && (
              <>
                <Button 
                  variant="primary" 
                  onClick={() => setShowUpgradeModal(true)}
                  disabled={actionLoading}
                >
                  Change Plan
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelModal(true)}
                  disabled={actionLoading}
                >
                  Cancel Subscription
                </Button>
              </>
            )}
            
            {currentSubscription.subscription.cancelAtPeriodEnd && (
              <div className="text-sm text-orange-400">
                Your subscription will end on {currentSubscription.subscription.currentPeriodEnd.toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Current Plan Features */}
          {subscriptionTiers && subscriptionTiers[currentSubscription.subscription.tier] && (
            <div className="mt-6 p-4 bg-primary/20 rounded border border-accentGold/10">
              <h4 className="text-sm font-semibold text-accentGold mb-3">Your Plan Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-semibold text-accentGold mb-2">Monthly Limits</h5>
                  <ul className="text-xs text-textOnDark/70 space-y-1">
                    <li>Models: {subscriptionTiers[currentSubscription.subscription.tier].quota.modelsPerMonth === -1 ? 'Unlimited' : subscriptionTiers[currentSubscription.subscription.tier].quota.modelsPerMonth}</li>
                    <li>Compute Hours: {subscriptionTiers[currentSubscription.subscription.tier].quota.computeHours === -1 ? 'Unlimited' : subscriptionTiers[currentSubscription.subscription.tier].quota.computeHours}</li>
                    <li>API Calls/min: {subscriptionTiers[currentSubscription.subscription.tier].quota.apiCallsPerMinute.toLocaleString()}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-accentGold mb-2">Features</h5>
                  <ul className="text-xs text-textOnDark/70 space-y-1">
                    {subscriptionTiers[currentSubscription.subscription.tier].features.slice(0, 3).map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : (
        // No Active Subscription
        <Card className="mb-6 text-center py-8">
          <h2 className="text-xl font-bold text-accentGold mb-2">No Active Subscription</h2>
          <p className="text-textOnDark/70 mb-4">Choose a plan to unlock OHMS features and start creating AI agents</p>
          <Button 
            variant="primary" 
            onClick={() => setShowUpgradeModal(true)}
          >
            View Plans
          </Button>
        </Card>
      )}

      {/* Upgrade/Plan Selection Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={currentSubscription?.hasActiveSubscription ? "Change Subscription Plan" : "Choose Your Plan"}
        maxWidth="6xl"
      >
        <div className="space-y-6">
          <p className="text-textOnDark/70 text-center">
            {currentSubscription?.hasActiveSubscription 
              ? "Upgrade or downgrade your subscription plan. Changes take effect immediately for upgrades or at the next billing cycle for downgrades."
              : "Select a subscription plan that fits your needs. All plans include real-time ICP pricing and can be changed anytime."
            }
          </p>

          <SubscriptionTiers
            currentTier={currentSubscription?.subscription?.tier || null}
            onSelectTier={(tier) => {
              if (currentSubscription?.hasActiveSubscription) {
                setSelectedUpgradeTier(tier)
              } else {
                // Handle new subscription creation
                setShowUpgradeModal(false)
                // This would trigger the subscription creation flow
              }
            }}
            onUpgrade={(tier) => {
              setSelectedUpgradeTier(tier)
            }}
            showCurrentPlan={true}
            isLoading={actionLoading}
          />

          {selectedUpgradeTier && (
            <div className="p-4 bg-primary/40 rounded border border-accentGold/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-accentGold">Confirm Plan Change</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedUpgradeTier(null)}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-textOnDark/70 mb-4">
                Change your subscription to the <strong>{selectedUpgradeTier}</strong> plan?
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUpgradeTier(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => handleUpgrade(selectedUpgradeTier)}
                  loading={actionLoading}
                >
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-textOnDark/80">
            Are you sure you want to cancel your subscription? You'll continue to have access to your current plan until the end of your billing period.
          </p>
          
          {currentSubscription?.subscription && (
            <div className="p-4 bg-primary/40 rounded border border-accentGold/20">
              <h4 className="text-accentGold font-medium mb-2">Cancellation Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-textOnDark/60">Current Plan:</span> {currentSubscription.subscription.tier}</p>
                <p><span className="text-textOnDark/60">Access Until:</span> {currentSubscription.subscription.currentPeriodEnd.toLocaleDateString()}</p>
                <p><span className="text-textOnDark/60">Next Charge:</span> Cancelled (no future charges)</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> Once cancelled, you can reactivate your subscription at any time, but you may lose any promotional pricing.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setShowCancelModal(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="error" 
              fullWidth
              onClick={handleCancel}
              loading={actionLoading}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SubscriptionManager