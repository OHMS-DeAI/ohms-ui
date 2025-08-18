import { useEffect, useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import {
  createAgentActor,
  createCoordinatorActor,
  createEconActor,
} from '../services/canisterService'

type AgentCreationRequest = {
  instruction: string
  agent_count: number
  capabilities: string[]
  priority: 'low' | 'normal' | 'high' | 'critical'
}

type AgentCreationResult = {
  agent_id: string
  status: string
  capabilities: string[]
  estimated_completion: number
  created_at: number
}

type UserSubscription = {
  tier: 'free' | 'basic' | 'pro' | 'enterprise'
  max_agents: number
  monthly_creations: number
  token_limit: number
  current_usage: {
    active_agents: number
    creations_this_month: number
    tokens_used: number
  }
}

const UserAgentCreator = () => {
  const { isWalletAvailable, createAuthAgent, principal } = useAgent()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Agent creation state
  const [creationRequest, setCreationRequest] = useState<AgentCreationRequest>({
    instruction: '',
    agent_count: 1,
    capabilities: [],
    priority: 'normal',
  })
  const [creating, setCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)

  // User data
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [createdAgents, setCreatedAgents] = useState<AgentCreationResult[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const loadUserData = async () => {
    setLoading(true)
    setError(null)
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Authentication required. Please connect your wallet.')
      }
      
      const agentActor = createAgentActor(import.meta.env.VITE_OHMS_AGENT_CANISTER_ID, agent as any)
      const coordinatorActor = createCoordinatorActor(agent as any)
      const econActor = createEconActor(agent as any)
      
      // Load user subscription and usage
      const [sub, agents, models] = await Promise.all([
        econActor.get_user_subscription(principal || ''),
        coordinatorActor.get_user_agents(principal || ''),
        coordinatorActor.get_available_models(),
      ])

      setSubscription(sub as UserSubscription)
      setCreatedAgents(agents as AgentCreationResult[])
      setAvailableModels(models as string[])

    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async () => {
    if (!creationRequest.instruction.trim()) {
      setError('Please provide instructions for your agent')
      return
    }

    setCreating(true)
    setCreationProgress(0)
    setError(null)

    try {
      const agent = await createAuthAgent()
      if (!agent) throw new Error('Authentication required')
      
      const agentActor = createAgentActor(import.meta.env.VITE_OHMS_AGENT_CANISTER_ID, agent as any)
      
      // Simulate agent creation steps
      const steps = [
        'Analyzing instructions...',
        'Selecting optimal models...',
        'Creating agent configuration...',
        'Initializing autonomous capabilities...',
        'Setting up coordination protocols...',
        'Agent ready for deployment...'
      ]
      
      for (let i = 0; i < steps.length; i++) {
        setCreationProgress((i / steps.length) * 100)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Create the agent
      const result = await agentActor.create_agent_from_instruction({
        instruction: creationRequest.instruction,
        agent_count: creationRequest.agent_count,
        capabilities: creationRequest.capabilities,
        priority: creationRequest.priority,
      })

      setCreationProgress(100)
      
      // Add to created agents list
      setCreatedAgents(prev => [result as AgentCreationResult, ...prev])
      
      // Reset form
      setCreationRequest({
        instruction: '',
        agent_count: 1,
        capabilities: [],
        priority: 'normal',
      })

      // Reload user data to update usage
      await loadUserData()

    } catch (e: any) {
      setError(e?.message || 'Failed to create agent')
    } finally {
      setCreating(false)
      setCreationProgress(0)
    }
  }

  const checkQuota = () => {
    if (!subscription) return false
    
    const { current_usage, max_agents, monthly_creations } = subscription
    
    if (current_usage.active_agents >= max_agents) {
      setError(`You have reached your maximum of ${max_agents} active agents`)
      return false
    }
    
    if (current_usage.creations_this_month >= monthly_creations) {
      setError(`You have reached your monthly limit of ${monthly_creations} agent creations`)
      return false
    }
    
    return true
  }

  const handleCreateAgent = () => {
    if (!checkQuota()) return
    createAgent()
  }

  useEffect(() => {
    if (isWalletAvailable && principal) {
      loadUserData()
    }
  }, [isWalletAvailable, principal])

  if (!isWalletAvailable) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Create Autonomous Agents</h1>
          <p className="text-textOnDark/70 mb-4">Connect your OISY wallet to create agents from natural language instructions.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">Create Autonomous Agents</h1>
          <p className="text-textOnDark/70">Transform natural language instructions into intelligent, autonomous agents</p>
        </div>
        <Button variant="outline" onClick={loadUserData} loading={loading}>Refresh</Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Creation Form */}
          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-lg font-semibold text-accentGold mb-4">Create New Agent</h3>
              
              <div className="space-y-4">
                {/* Instructions Input */}
                <div>
                  <label className="block text-sm font-medium text-textOnDark/80 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={creationRequest.instruction}
                    onChange={(e) => setCreationRequest(prev => ({ ...prev, instruction: e.target.value }))}
                    placeholder="Describe what you want your agent to do... (e.g., 'Create a Python coding assistant for web development')"
                    className="w-full h-32 p-3 border border-accentGold/30 rounded bg-primary/40 text-textOnDark resize-none"
                    disabled={creating}
                  />
                </div>

                {/* Agent Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textOnDark/80 mb-2">
                      Number of Agents
                    </label>
                    <select
                      value={creationRequest.agent_count}
                      onChange={(e) => setCreationRequest(prev => ({ ...prev, agent_count: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-accentGold/30 rounded bg-primary/40 text-textOnDark"
                      disabled={creating}
                    >
                      <option value={1}>1 Agent</option>
                      <option value={2}>2 Agents</option>
                      <option value={3}>3 Agents</option>
                      <option value={5}>5 Agents</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textOnDark/80 mb-2">
                      Priority
                    </label>
                    <select
                      value={creationRequest.priority}
                      onChange={(e) => setCreationRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-2 border border-accentGold/30 rounded bg-primary/40 text-textOnDark"
                      disabled={creating}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textOnDark/80 mb-2">
                      Capabilities
                    </label>
                    <select
                      multiple
                      value={creationRequest.capabilities}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setCreationRequest(prev => ({ ...prev, capabilities: selected }))
                      }}
                      className="w-full p-2 border border-accentGold/30 rounded bg-primary/40 text-textOnDark"
                      disabled={creating}
                    >
                      <option value="coding">Coding</option>
                      <option value="data-analysis">Data Analysis</option>
                      <option value="content-creation">Content Creation</option>
                      <option value="research">Research</option>
                      <option value="planning">Planning</option>
                      <option value="automation">Automation</option>
                    </select>
                  </div>
                </div>

                {/* Creation Progress */}
                {creating && (
                  <div className="space-y-2">
                    <div className="w-full bg-primary/40 rounded-full h-2">
                      <div 
                        className="bg-accentGold h-2 rounded-full transition-all duration-300"
                        style={{ width: `${creationProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-textOnDark/70 text-center">
                      Creating your autonomous agent...
                    </p>
                  </div>
                )}

                {/* Create Button */}
                <Button
                  onClick={handleCreateAgent}
                  loading={creating}
                  disabled={!creationRequest.instruction.trim() || creating}
                  className="w-full"
                >
                  Create Autonomous Agent
                </Button>
              </div>
            </Card>

            {/* Available Models */}
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-accentGold mb-4">Available Models</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableModels.map((model) => (
                  <div key={model} className="p-3 bg-primary/40 rounded border border-accentGold/20">
                    <h4 className="font-medium text-textOnDark">{model}</h4>
                    <p className="text-sm text-textOnDark/60">NOVAQ-compressed, ready for agent creation</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* User Dashboard */}
          <div className="space-y-6">
            {/* Subscription Status */}
            {subscription && (
              <Card>
                <h3 className="text-lg font-semibold text-accentGold mb-4">Subscription</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Tier:</span>
                    <Badge variant="success" size="sm">{subscription.tier.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Active Agents:</span>
                    <span className="text-textOnDark">
                      {subscription.current_usage.active_agents} / {subscription.max_agents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Monthly Creations:</span>
                    <span className="text-textOnDark">
                      {subscription.current_usage.creations_this_month} / {subscription.monthly_creations}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textOnDark/60">Tokens Used:</span>
                    <span className="text-textOnDark">
                      {subscription.current_usage.tokens_used.toLocaleString()} / {subscription.token_limit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Agents */}
            <Card>
              <h3 className="text-lg font-semibold text-accentGold mb-4">Recent Agents</h3>
              {createdAgents.length === 0 ? (
                <p className="text-textOnDark/60 text-center py-4">No agents created yet</p>
              ) : (
                <div className="space-y-3">
                  {createdAgents.slice(0, 5).map((agent) => (
                    <div key={agent.agent_id} className="p-3 bg-primary/40 rounded border border-accentGold/20">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-textOnDark truncate">{agent.agent_id}</h4>
                        <Badge variant="success" size="sm">{agent.status}</Badge>
                      </div>
                      <p className="text-sm text-textOnDark/60">
                        Created {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.capabilities.slice(0, 2).map((cap) => (
                          <Badge key={cap} variant="outline" size="xs">{cap}</Badge>
                        ))}
                        {agent.capabilities.length > 2 && (
                          <Badge variant="outline" size="xs">+{agent.capabilities.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-accentGold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View All Agents
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Subscription
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Usage Analytics
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAgentCreator
