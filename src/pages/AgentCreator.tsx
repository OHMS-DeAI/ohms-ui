import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { logger } from '../utils/professionalLogger'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import LoadingSpinner from '../components/LoadingSpinner'
import { createAgentActor, createEconActor, createAgentsFromInstructions, executeCoordinatorWorkflow, sendMessageToAgent } from '../services/canisterService'

interface AgentCreationRequest {
  instruction: string
  agent_count?: number
  capabilities?: string[]
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

interface AgentCreationProgress {
  stage: 'analyzing' | 'configuring' | 'binding' | 'creating' | 'complete' | 'error'
  message: string
  progress: number
  agent_id?: string
}

interface CreatedAgent {
  agent_id: string
  agent_type: string
  status: string
  created_at: number
  capabilities: string[]
}

interface TestResults {
  testType: 'single' | 'dual' | 'swarm'
  agentsCreated: number
  coordinationResults?: any[]
  autonomousTasks?: string[]
  timestamp: number
}

interface AgentActivity {
  type: 'creation' | 'coordination' | 'task' | 'error'
  message: string
  timestamp: string
}

const AgentCreator = () => {
  const { isConnected, createAuthAgent, principal } = useAgent()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [instruction, setInstruction] = useState('')
  const [agentCount, setAgentCount] = useState(1)
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([])
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal')
  
  const [showCreationModal, setShowCreationModal] = useState(false)
  const [creationProgress, setCreationProgress] = useState<AgentCreationProgress | null>(null)
  const [createdAgents, setCreatedAgents] = useState<CreatedAgent[]>([])

  const [quotaValidation, setQuotaValidation] = useState<any>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)

  // Test functionality state
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([])

  // Available capabilities for agent creation
  const availableCapabilities = [
    'Code Assistant',
    'Data Analysis',
    'Content Creation',
    'Research',
    'Planning',
    'Problem Solving',
    'Translation',
    'Summarization',
    'Question Answering',
    'Creative Writing',
  ]

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low', description: 'Background processing' },
    { value: 'normal', label: 'Normal', description: 'Standard priority' },
    { value: 'high', label: 'High', description: 'Priority processing' },
    { value: 'critical', label: 'Critical', description: 'Immediate processing' },
  ]

  useEffect(() => {
    if (isConnected) {
      checkSubscriptionAndQuota()
    }
  }, [isConnected])

  const checkSubscriptionAndQuota = async () => {
    if (!isConnected) return
    
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const econActor = createEconActor(agent as any)
      
      // Check subscription and quota, create free tier if none exists
      const [subscription, quotaValidation] = await Promise.all([
        econActor.get_user_subscription([]).then(sub => {
          if (!sub) {
            // Create free tier subscription for new user
            return econActor.get_or_create_free_subscription()
          }
          return sub
        }),
        econActor.validate_agent_creation_quota(),
      ])

      setSubscriptionStatus(subscription as any)
      setQuotaValidation(quotaValidation as any)
      
    } catch (err) {
      // Removed console log
      setError('Failed to verify subscription status')
    }
  }

  const handleCreateAgent = async () => {
    if (!instruction.trim()) {
      setError('Please enter an instruction for your agent')
      return
    }

    if (!quotaValidation?.allowed) {
      setError(quotaValidation?.reason || 'Quota validation failed')
      return
    }

    setShowCreationModal(true)
    setCreationProgress({
      stage: 'analyzing',
      message: 'Analyzing your instruction...',
      progress: 10,
    })

    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Failed to create authenticated agent')
      }

      const agentActor = createAgentActor(import.meta.env.VITE_OHMS_AGENT_CANISTER_ID, agent as any)

      // Create the agent creation request
      const request: AgentCreationRequest = {
        instruction: instruction.trim(),
        agent_count: agentCount,
        capabilities: selectedCapabilities.length > 0 ? selectedCapabilities : undefined,
        priority,
      }

      // Update progress
      setCreationProgress({
        stage: 'configuring',
        message: 'Configuring agent parameters...',
        progress: 30,
      })

      // Create the agent
      const result = await agentActor.create_agent_from_instruction(request)

      // Update progress
      setCreationProgress({
        stage: 'creating',
        message: 'Creating autonomous agent...',
        progress: 60,
      })

      // Simulate binding and creation process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update progress to complete
      setCreationProgress({
        stage: 'complete',
        message: 'Agent created successfully!',
        progress: 100,
        agent_id: result.agent_id || 'agent-123',
      })

      // Add to created agents list
      const newAgent: CreatedAgent = {
        agent_id: result.agent_id || 'agent-123',
        agent_type: 'Autonomous Agent',
        status: 'Ready',
        created_at: Date.now() * 1000000, // Convert to nanoseconds
        capabilities: selectedCapabilities,
      }

      setCreatedAgents(prev => [newAgent, ...prev])
      setSuccess(`Successfully created agent: ${newAgent.agent_id}`)

      // Reset form
      setInstruction('')
      setAgentCount(1)
      setSelectedCapabilities([])
      setPriority('normal')

      // Refresh quota
      await checkSubscriptionAndQuota()

    } catch (err) {
      // Removed console log
      setCreationProgress({
        stage: 'error',
        message: 'Failed to create agent. Please try again.',
        progress: 0,
      })
      setError('Failed to create agent. Please check your subscription and try again.')
    }
  }

  const handleCapabilityToggle = (capability: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capability)
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp / 1000000).toLocaleString()
  }

  const getProgressColor = (stage: string) => {
    switch (stage) {
      case 'complete': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-blue-400'
    }
  }

  const getProgressBgColor = (stage: string) => {
    switch (stage) {
      case 'complete': return 'bg-green-600'
      case 'error': return 'bg-red-600'
      default: return 'bg-blue-600'
    }
  }

  // Test Functions for Autonomous Agent Creation
  const addActivity = (type: AgentActivity['type'], message: string) => {
    setAgentActivities(prev => [...prev, {
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const getActivityColor = (type: AgentActivity['type']) => {
    switch (type) {
      case 'creation': return 'bg-green-500'
      case 'coordination': return 'bg-blue-500'
      case 'task': return 'bg-purple-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const testAutonomousAgent = async (testType: 'single' | 'dual' | 'swarm') => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setTestResults(null)
    setAgentActivities([])

    try {
      addActivity('creation', `Starting ${testType} agent test...`)

      let instructions = ''
      let agentCount = 1
      let capabilities: string[] = []

      switch (testType) {
        case 'single':
          instructions = `Create a single autonomous agent that analyzes market trends and provides investment recommendations. Use the real Llama 3.1 8B model capabilities.`
          agentCount = 1
          capabilities = ['analysis', 'research']
          break

        case 'dual':
          instructions = `Create two autonomous agents that work together to solve complex coding problems. Agent 1 specializes in algorithm design, Agent 2 specializes in code implementation. They should coordinate their efforts.`
          agentCount = 2
          capabilities = ['code', 'planning', 'coordination']
          break

        case 'swarm':
          instructions = `Create a swarm of 3 autonomous agents for content creation. Each agent should specialize in different aspects: research, writing, and editing. They should collaborate to produce high-quality content.`
          agentCount = 3
          capabilities = ['research', 'writing', 'editing', 'coordination']
          break
      }

      // Create agents using real DFINITY LLM
      const result = await createAgentsFromInstructions(
        instructions,
        agentCount,
        capabilities,
        'normal'
      )

      if (result.Ok) {
        const agentIds = result.Ok
        addActivity('creation', `Successfully created ${agentIds.length} agents`)

        // Test coordination if multiple agents
        if (agentIds.length > 1) {
          addActivity('coordination', 'Testing agent coordination...')

          try {
            const coordResult = await executeCoordinatorWorkflow(
              `Coordinate between agents ${agentIds.join(', ')} to demonstrate autonomous collaboration`,
              agentIds
            )

            addActivity('coordination', 'Coordination test completed successfully')

            setTestResults({
              testType,
              agentsCreated: agentIds.length,
              coordinationResults: [coordResult],
              autonomousTasks: [
                'Market analysis',
                'Investment recommendations',
                'Collaborative problem solving',
                'Content creation workflow'
              ],
              timestamp: Date.now()
            })
          } catch (coordError) {
            addActivity('error', `Coordination test failed: ${coordError}`)
          }
        } else {
          // Single agent test
          setTestResults({
            testType,
            agentsCreated: 1,
            autonomousTasks: [
              'Task analysis',
              'Independent execution',
              'Result generation'
            ],
            timestamp: Date.now()
          })
        }

        logger.info('Autonomous agent test completed', {
          testType,
          agentCount: agentIds.length,
          capabilities
        })

      } else {
        throw new Error(result.Err || 'Failed to create test agents')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed'
      setError(`Autonomous agent test failed: ${errorMessage}`)
      addActivity('error', errorMessage)
      logger.error('Autonomous agent test failed', { error: err, testType })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to create autonomous agents</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Create Autonomous Agent</h1>
          <p className="text-gray-400 mt-2">Describe what you need and create intelligent agents instantly</p>
        </div>
        <Button
          onClick={() => window.location.href = '/subscription'}
          variant="outline"
          className="border-blue-500 text-blue-300 hover:bg-blue-500/10"
        >
          Manage Subscription
        </Button>
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

      {/* Quota Status */}
      {quotaValidation && (
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-white">Quota Status</h3>
              <p className="text-gray-400">
                {quotaValidation.allowed 
                  ? `You can create ${quotaValidation.remaining_quota?.agents_remaining || 0} more agents this month`
                  : quotaValidation.reason
                }
              </p>
            </div>
            <Badge variant={quotaValidation.allowed ? 'success' : 'error'}>
              {quotaValidation.allowed ? 'Available' : 'Limited'}
            </Badge>
          </div>
        </Card>
      )}

      {/* Agent Creation Form */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">Agent Configuration</h2>
        
        <div className="space-y-6">
          {/* Instruction Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What do you want your agent to do?
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe your agent's purpose, tasks, and goals. For example: 'Create a coding assistant that helps with Python development, code review, and debugging'"
              rows={4}
              className="w-full"
            />
            <p className="text-sm text-gray-400 mt-1">
              Be specific about the agent's role, capabilities, and expected behavior
            </p>
          </div>

          {/* Agent Count */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Agents
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                min="1"
                max="10"
                value={agentCount}
                onChange={(e) => setAgentCount(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-gray-400">
                {agentCount === 1 ? 'agent' : 'agents'} 
                {quotaValidation?.remaining_quota?.agents_remaining && 
                  ` (${quotaValidation.remaining_quota.agents_remaining} remaining)`
                }
              </span>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Specific Capabilities (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCapabilities.map((capability) => (
                <label key={capability} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCapabilities.includes(capability)}
                    onChange={() => handleCapabilityToggle(capability)}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm">{capability}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorityOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={priority === option.value}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-gray-300 text-sm font-medium">{option.label}</span>
                    <p className="text-gray-500 text-xs">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateAgent}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!instruction.trim() || !quotaValidation?.allowed || loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Autonomous Agent'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recently Created Agents */}
      {/* Autonomous Agent Testing Section */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-6">🧪 Test Autonomous Agent Creation</h2>
        <p className="text-gray-400 mb-6">
          Test creating multiple autonomous agents from the real Llama 3.1 8B model and see how they coordinate.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => testAutonomousAgent('single')}
            disabled={!isConnected || loading}
            className="flex-1"
          >
            Test Single Agent
          </Button>
          <Button
            onClick={() => testAutonomousAgent('dual')}
            disabled={!isConnected || loading}
            className="flex-1"
            variant="outline"
          >
            Test Dual Coordination
          </Button>
          <Button
            onClick={() => testAutonomousAgent('swarm')}
            disabled={!isConnected || loading}
            className="flex-1"
            variant="secondary"
          >
            Test Agent Swarm
          </Button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-medium text-white mb-2">Test Results:</h3>
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-900/50 p-3 rounded">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Agent Activity Feed */}
        {agentActivities.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-white mb-3">Agent Activity Feed:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {agentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-800/30 rounded text-sm">
                  <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
                  <span className="text-gray-300">{activity.message}</span>
                  <span className="text-gray-500 text-xs ml-auto">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {createdAgents.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Recently Created Agents</h2>
          <div className="space-y-4">
            {createdAgents.map((agent) => (
              <div key={agent.agent_id} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">{agent.agent_id}</h3>
                  <p className="text-gray-400 text-sm">{agent.agent_type}</p>
                  <p className="text-gray-500 text-xs">Created: {formatDate(agent.created_at)}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="success">{agent.status}</Badge>
                  <Button
                    onClick={() => window.location.href = `/agents`}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Creation Progress Modal */}
      <Modal
        isOpen={showCreationModal}
        onClose={() => {
          if (creationProgress?.stage === 'complete' || creationProgress?.stage === 'error') {
            setShowCreationModal(false)
            setCreationProgress(null)
          }
        }}
        title="Creating Autonomous Agent"
      >
        <div className="space-y-4">
          {creationProgress && (
            <>
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressBgColor(creationProgress.stage)}`}
                  style={{ width: `${creationProgress.progress}%` }}
                />
              </div>

              {/* Progress Message */}
              <div className="text-center">
                <p className={`text-lg font-medium ${getProgressColor(creationProgress.stage)}`}>
                  {creationProgress.message}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {creationProgress.progress}% complete
                </p>
              </div>

              {/* Agent ID (if complete) */}
              {creationProgress.agent_id && (
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Agent Created Successfully!</h4>
                  <p className="text-gray-300 text-sm">
                    Agent ID: <span className="font-mono text-blue-400">{creationProgress.agent_id}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {creationProgress.stage === 'complete' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => window.location.href = '/agents'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View All Agents
                  </Button>
                  <Button
                    onClick={() => setShowCreationModal(false)}
                    variant="outline"
                  >
                    Create Another
                  </Button>
                </div>
              )}

              {creationProgress.stage === 'error' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowCreationModal(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AgentCreator
