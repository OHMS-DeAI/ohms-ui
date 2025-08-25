import React from 'react'
import { DemoSubscriptionPlan, type DemoSubscriptionInfo, type UserSubscription } from '../services/demoSubscriptionService'

import Card from './Card'
import Button from './Button'
import Badge from './Badge'

interface SubscriptionTiersProps {
  currentSubscription?: UserSubscription | null
  onSelectPlan: (plan: DemoSubscriptionPlan) => void
  showCurrentPlan?: boolean
  isLoading?: boolean
  className?: string
}

const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({
  currentSubscription,
  onSelectPlan,
  showCurrentPlan = true,
  isLoading = false,
  className = ''
}) => {
  // Subscription plan information
  const plans: Record<DemoSubscriptionPlan, DemoSubscriptionInfo & { 
    color: string
    icon: string
    description: string
    ctaText: string
    isPopular?: boolean
  }> = {
    [DemoSubscriptionPlan.FREE]: {
      plan: DemoSubscriptionPlan.FREE,
      name: 'Free Plan',
      description: 'Perfect for exploring OHMS capabilities',
      color: 'border-blue-500/50 bg-blue-900/10',
      icon: '🆓',
      ctaText: 'Select Free Plan',
      features: [
        '5 AI models per month',
        '10 compute hours',
        '50 API calls per minute',
        'Community support',
        'Basic model catalog access',
        'Managed infrastructure'
      ],
      rateLimits: {
        modelsPerMonth: 5,
        computeHours: 10,
        apiCallsPerMinute: 50,
        maxConcurrentRequests: 2
      },
      isActive: true,
      createdAt: new Date()
    },
    [DemoSubscriptionPlan.BASIC]: {
      plan: DemoSubscriptionPlan.BASIC,
      name: 'Basic Plan',
      description: 'Enhanced capabilities for growing projects',
      color: 'border-accentGold/50 bg-yellow-900/20',
      icon: '⭐',
      ctaText: 'Upgrade to Basic',
      isPopular: true,
      features: [
        '50 AI models per month',
        '100 compute hours',
        '500 API calls per minute',
        'Priority support',
        'Full model catalog access',
        'Advanced analytics',
        'Export capabilities',
        'Managed infrastructure'
      ],
      rateLimits: {
        modelsPerMonth: 50,
        computeHours: 100,
        apiCallsPerMinute: 500,
        maxConcurrentRequests: 10
      },
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date()
    }
  }

  const currentPlan = currentSubscription?.subscription.plan

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 70) return 'text-orange-400'
    return 'text-green-400'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Plan Status */}
      {showCurrentPlan && currentSubscription && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-accentGold">Current Plan Status</h3>
            <Badge
              variant={currentPlan === DemoSubscriptionPlan.BASIC ? 'success' : 'info'}
              size="md"
            >
              {plans[currentPlan!].name}
            </Badge>
          </div>

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
              <p className="text-textOnDark/60 text-sm mb-1">Models Used This Month</p>
              <div className="flex items-center gap-2">
                <span className="text-textOnDark font-medium">
                  {currentSubscription.usage.modelsUsedThisMonth}/{currentSubscription.subscription.rateLimits.modelsPerMonth}
                </span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.modelsUsedThisMonth, currentSubscription.subscription.rateLimits.modelsPerMonth))}`}>
                  ({getUsagePercentage(currentSubscription.usage.modelsUsedThisMonth, currentSubscription.subscription.rateLimits.modelsPerMonth).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${getUsagePercentage(currentSubscription.usage.modelsUsedThisMonth, currentSubscription.subscription.rateLimits.modelsPerMonth) >= 90 ? 'bg-red-500' : getUsagePercentage(currentSubscription.usage.modelsUsedThisMonth, currentSubscription.subscription.rateLimits.modelsPerMonth) >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${getUsagePercentage(currentSubscription.usage.modelsUsedThisMonth, currentSubscription.subscription.rateLimits.modelsPerMonth)}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
              <p className="text-textOnDark/60 text-sm mb-1">Compute Hours Used</p>
              <div className="flex items-center gap-2">
                <span className="text-textOnDark font-medium">
                  {currentSubscription.usage.computeHoursUsed}/{currentSubscription.subscription.rateLimits.computeHours}h
                </span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.computeHoursUsed, currentSubscription.subscription.rateLimits.computeHours))}`}>
                  ({getUsagePercentage(currentSubscription.usage.computeHoursUsed, currentSubscription.subscription.rateLimits.computeHours).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${getUsagePercentage(currentSubscription.usage.computeHoursUsed, currentSubscription.subscription.rateLimits.computeHours) >= 90 ? 'bg-red-500' : getUsagePercentage(currentSubscription.usage.computeHoursUsed, currentSubscription.subscription.rateLimits.computeHours) >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${getUsagePercentage(currentSubscription.usage.computeHoursUsed, currentSubscription.subscription.rateLimits.computeHours)}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-primary/20 rounded border border-accentGold/20">
              <p className="text-textOnDark/60 text-sm mb-1">API Calls Today</p>
              <div className="flex items-center gap-2">
                <span className="text-textOnDark font-medium">
                  {currentSubscription.usage.apiCallsToday}
                </span>
                <span className="text-green-400 text-sm">
                  (No daily limit)
                </span>
              </div>
              <p className="text-textOnDark/60 text-xs mt-1">
                Rate limited to {currentSubscription.subscription.rateLimits.apiCallsPerMinute}/min
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(plans).map((plan) => {
          const isCurrentPlan = currentPlan === plan.plan
          const canSelect = !isCurrentPlan && !isLoading

          return (
            <Card 
              key={plan.plan}
              className={`relative ${plan.color} ${plan.isPopular ? 'ring-2 ring-accentGold/50' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="warning" size="sm">
                    🔥 Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold text-accentGold mb-2">{plan.name}</h3>
                <p className="text-textOnDark/70 text-sm">{plan.description}</p>
                
                {/* Current Plan Indicator */}
                {isCurrentPlan && (
                  <div className="mt-3">
                    <Badge variant="success" size="sm">
                      ✅ Current Plan
                    </Badge>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-400 text-sm mt-0.5">✓</span>
                    <span className="text-textOnDark text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Rate Limits */}
              <div className="mb-6 p-3 bg-primary/20 rounded border border-accentGold/20">
                <h4 className="text-accentGold font-medium text-sm mb-2">Usage Limits</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-textOnDark/60">Models/Month:</span>
                    <span className="text-textOnDark ml-1">{plan.rateLimits.modelsPerMonth}</span>
                  </div>
                  <div>
                    <span className="text-textOnDark/60">Compute Hours:</span>
                    <span className="text-textOnDark ml-1">{plan.rateLimits.computeHours}h</span>
                  </div>
                  <div>
                    <span className="text-textOnDark/60">API Rate:</span>
                    <span className="text-textOnDark ml-1">{plan.rateLimits.apiCallsPerMinute}/min</span>
                  </div>
                  <div>
                    <span className="text-textOnDark/60">Concurrent:</span>
                    <span className="text-textOnDark ml-1">{plan.rateLimits.maxConcurrentRequests}</span>
                  </div>
                </div>
              </div>

              {/* Special Offers */}
              {plan.plan === DemoSubscriptionPlan.BASIC && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                  <div className="text-center">
                    <p className="text-green-300 font-medium text-sm">🎉 Special Offer!</p>
                    <p className="text-green-200 text-xs mt-1">Try Basic Plan with enhanced features</p>
                    <p className="text-green-200/80 text-xs">Flexible • Scalable • Enterprise-ready</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                fullWidth
                variant={isCurrentPlan ? 'outline' : 'primary'}
                disabled={!canSelect}
                loading={isLoading}
                onClick={() => canSelect && onSelectPlan(plan.plan)}
              >
                {isCurrentPlan ? '✅ Current Plan' : plan.ctaText}
              </Button>

              {plan.plan === DemoSubscriptionPlan.FREE && !isCurrentPlan && (
                <p className="text-textOnDark/60 text-xs text-center mt-2">
                  Switch back to free plan anytime
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Platform Information */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <div className="text-center">
          <h4 className="text-blue-300 font-medium mb-2">🚀 OHMS 2.0 Platform</h4>
          <p className="text-blue-200/80 text-sm mb-3">
            Advanced AI model orchestration with real-time usage tracking, 
            flexible subscription tiers, and enterprise-grade infrastructure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-2 bg-blue-800/20 rounded">
              <p className="text-blue-300 font-medium">🔄 Real-time Monitoring</p>
              <p className="text-blue-200/70">Live usage tracking and rate limiting</p>
            </div>
            <div className="p-2 bg-blue-800/20 rounded">
              <p className="text-blue-300 font-medium">📊 Analytics Dashboard</p>
              <p className="text-blue-200/70">Comprehensive usage analytics and reporting</p>
            </div>
            <div className="p-2 bg-blue-800/20 rounded">
              <p className="text-blue-300 font-medium">⚡ Scalable Infrastructure</p>
              <p className="text-blue-200/70">Enterprise-grade computational resources</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SubscriptionTiers