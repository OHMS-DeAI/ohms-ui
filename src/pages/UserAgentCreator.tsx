import { useEffect, useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import {
  createAgentActor,
  createCoordinatorActor,
  createEconActor,
  listUserAgents,
  getUserQuotaStatus,
  createAgentsFromInstructions,
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
      const [sub, agents, quota] = await Promise.all([
        econActor.get_user_subscription([]),
        listUserAgents(agent as any),
        getUserQuotaStatus(),
      ])

      setSubscription(sub as UserSubscription)
      setCreatedAgents(agents as AgentCreationResult[])

      // Load real available models from canister
      try {
        const { apiClient } = await import('../services/apiClient')
        const modelsResponse = await apiClient.getLlmModels()
        if (modelsResponse.success && modelsResponse.data) {
          const modelNames = modelsResponse.data.map((model: any) => model.name || model.model)
          setAvailableModels(modelNames.length > 0 ? modelNames : ['llama-3.1-8b'])
        } else {
          setAvailableModels(['llama-3.1-8b']) // Fallback to real model
        }
      } catch (error) {
        console.warn('Failed to load models, using default:', error)
        setAvailableModels(['llama-3.1-8b']) // Fallback to real model
      }

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

      // Create the agent using the new OHMS 2.0 service
      const result = await createAgentsFromInstructions(
        creationRequest.instruction,
        creationRequest.agent_count,
        creationRequest.capabilities,
        creationRequest.priority
      )

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
          <p className="text-textOnDark/70 mb-4">Connect with Internet Identity v2 to create agents from natural language instructions.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-accent/5 to-primary"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-accent-light/20 rounded-full blur-md animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full mb-6">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span className="text-sm text-secondary font-medium">AI Agent Creation Studio</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-secondary via-secondary-light to-accent bg-clip-text text-transparent">
                Create Autonomous
              </span>
              <br />
              <span className="text-text-primary">AI Agents</span>
            </h1>

            <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform natural language instructions into intelligent, autonomous agents powered by
              <span className="text-secondary font-semibold"> advanced AI models</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={loadUserData}
                loading={loading}
                size="lg"
                className="min-w-[200px]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-accent-error/10 border border-accent-error/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-accent-error font-medium">Error</span>
            </div>
            <p className="text-accent-error mt-2 ml-8">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="text-text-secondary mt-4">Loading your agent creation studio...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Agent Creation Form */}
            <div className="xl:col-span-2">
              <div className="glass-morph rounded-2xl p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary">Agent Creation Studio</h3>
                    <p className="text-text-secondary">Transform natural language into autonomous AI agents</p>
                  </div>
                </div>

                {/* Progress Indicator */}
                {creating && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Creating Agent...</span>
                      <span className="text-sm text-text-secondary">{Math.round(creationProgress)}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-secondary to-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${creationProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Instructions Input */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-lg font-semibold text-text-primary">
                      <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      Agent Instructions
                    </label>
                    <Textarea
                      value={creationRequest.instruction}
                      onChange={(e) => setCreationRequest(prev => ({ ...prev, instruction: e.target.value }))}
                      placeholder="Describe what you want your agent to do... (e.g., 'Create a Python coding assistant for web development', 'Build a data analysis agent for financial reports', 'Design a content creation agent for social media')"
                      className="min-h-[120px] resize-none"
                      disabled={creating}
                    />
                    <p className="text-sm text-text-muted">
                      Be specific about the agent's purpose, capabilities, and use cases for optimal results.
                    </p>
                  </div>

                  {/* Agent Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <div className="w-6 h-6 bg-accent/20 rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        Agent Count
                      </label>
                      <select
                        value={creationRequest.agent_count}
                        onChange={(e) => setCreationRequest(prev => ({ ...prev, agent_count: parseInt(e.target.value) }))}
                        className="w-full min-h-[48px] px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:border-accent transition-colors"
                        disabled={creating}
                      >
                        <option value={1}>1 Agent</option>
                        <option value={2}>2 Agents</option>
                        <option value={3}>3 Agents</option>
                        <option value={5}>5 Agents</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <div className="w-6 h-6 bg-accent-success/20 rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        Priority Level
                      </label>
                      <select
                        value={creationRequest.priority}
                        onChange={(e) => setCreationRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full min-h-[48px] px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:border-accent transition-colors"
                        disabled={creating}
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="normal">🟡 Normal Priority</option>
                        <option value="high">🟠 High Priority</option>
                        <option value="critical">🔴 Critical Priority</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <div className="w-6 h-6 bg-accent-light/20 rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        Capabilities
                      </label>
                      <select
                        multiple
                        value={creationRequest.capabilities}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value)
                          setCreationRequest(prev => ({ ...prev, capabilities: selected }))
                        }}
                        className="w-full min-h-[48px] px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:border-accent transition-colors"
                        disabled={creating}
                      >
                        <option value="coding">💻 Coding & Development</option>
                        <option value="data-analysis">📊 Data Analysis</option>
                        <option value="content-creation">✍️ Content Creation</option>
                        <option value="research">🔍 Research & Analysis</option>
                        <option value="planning">📋 Planning & Strategy</option>
                        <option value="automation">🤖 Automation & Tools</option>
                      </select>
                      <p className="text-xs text-text-muted">Hold Ctrl/Cmd to select multiple</p>
                    </div>
                  </div>

                  {/* Create Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleCreateAgent}
                      loading={creating}
                      disabled={!creationRequest.instruction.trim() || creating}
                      size="lg"
                      className="w-full min-h-[56px] text-lg font-semibold bg-gradient-to-r from-secondary to-accent hover:from-secondary-light hover:to-accent-light transform hover:scale-[1.02] transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {creating ? 'Creating Autonomous Agent...' : '🚀 Create Autonomous Agent'}
                    </Button>

                    {!creationRequest.instruction.trim() && !creating && (
                      <p className="text-sm text-text-muted text-center mt-2">
                        💡 Enter instructions above to create your AI agent
                      </p>
                    )}
                  </div>
              </div>
            </div>

            {/* AI Model Info */}
              <div className="glass-morph rounded-2xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Llama 3.1 8B Model</h3>
                    <p className="text-sm text-text-secondary">Currently the only supported model</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-sm font-semibold text-secondary">Model Status</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      This model is optimized for content generation, code assistance, and general-purpose AI tasks.
                      Powered by advanced AI infrastructure with real-time processing.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">0ms</div>
                      <div className="text-xs text-text-muted">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-success">Free</div>
                      <div className="text-xs text-text-muted">Current Pricing</div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

            {/* User Dashboard */}
            <div className="space-y-6">
              {/* Account Status */}
              {subscription && (
                <div className="glass-morph rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-success to-secondary rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">Account Status</h3>
                      <p className="text-sm text-text-secondary">{subscription.tier.toUpperCase()} Plan</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          <span className="text-xs text-text-secondary font-medium">Active Agents</span>
                        </div>
                        <div className="text-lg font-bold text-text-primary">
                          {subscription.current_usage.active_agents} <span className="text-sm text-text-muted">/ {subscription.max_agents}</span>
                        </div>
                      </div>

                      <div className="bg-surface rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                          <span className="text-xs text-text-secondary font-medium">This Month</span>
                        </div>
                        <div className="text-lg font-bold text-text-primary">
                          {subscription.current_usage.creations_this_month} <span className="text-sm text-text-muted">/ {subscription.monthly_creations}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary font-medium">Token Usage</span>
                        <span className="text-xs text-text-muted">
                          {Math.round((subscription.current_usage.tokens_used / subscription.token_limit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-primary/40 rounded-full h-2 mb-1">
                        <div
                          className="bg-gradient-to-r from-secondary to-accent h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((subscription.current_usage.tokens_used / subscription.token_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-text-muted">
                        {subscription.current_usage.tokens_used.toLocaleString()} / {subscription.token_limit.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Agents */}
              <div className="glass-morph rounded-2xl p-6 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-light to-secondary rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Recent Agents</h3>
                    <p className="text-sm text-text-secondary">Your latest AI creations</p>
                  </div>
                </div>

                {createdAgents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-text-secondary">No agents created yet</p>
                    <p className="text-sm text-text-muted mt-1">Create your first autonomous AI agent above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {createdAgents.slice(0, 5).map((agent) => (
                      <div key={agent.agent_id} className="bg-surface rounded-lg p-4 border border-border hover:border-secondary/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-text-primary text-sm">Agent {agent.agent_id.slice(-4)}</h4>
                              <p className="text-xs text-text-muted">
                                {new Date(Number(agent.created_at) / 1000000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="success" size="sm" className="capitalize">{agent.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span>Capabilities: {agent.capabilities.join(', ')}</span>
                        </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.capabilities.slice(0, 2).map((cap) => (
                          <Badge key={cap} variant="default" size="sm">{cap}</Badge>
                        ))}
                        {agent.capabilities.length > 2 && (
                          <Badge variant="default" size="sm">+{agent.capabilities.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-morph rounded-2xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
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
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

export default UserAgentCreator
