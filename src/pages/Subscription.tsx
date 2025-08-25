import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'

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
  const navigate = useNavigate()

  // Redirect to Economics page where real subscription management is implemented
  useEffect(() => {
    navigate('/economics')
  }, [navigate])

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="text-center py-12">
        <LoadingSpinner size="md" className="mb-4" />
        <h2 className="text-xl font-semibold text-accentGold mb-2">Redirecting...</h2>
        <p className="text-textOnDark/70">Taking you to the Economics page for subscription management</p>
      </Card>
    </div>
  )
}

export default Subscription
