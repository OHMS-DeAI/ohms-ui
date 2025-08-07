import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { modelCanister } from '../services/canisterService'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'

import LoadingSpinner from '../components/LoadingSpinner'

interface Agent {
  agent_id: string
  agent_principal: string
  capabilities: string[]
  reputation: number
  last_heartbeat: number
  health_score: number
  model_id?: string
  status: 'online' | 'offline' | 'busy' | 'maintenance'
}

interface AgentConfig {
  model_id: string
  max_tokens: number
  temperature: number
  top_p: number
  retention_days: number
  capabilities: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const Agents = () => {
  const { isConnected, connect } = useAgent()
  const [agents, setAgents] = useState<Agent[]>([])

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    model_id: '',
    max_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    retention_days: 30,
    capabilities: []
  })
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  


  useEffect(() => {
    if (!isConnected) {
      connect()
    } else {
      fetchAgents()
      fetchModels()
    }
  }, [isConnected, connect])

  const fetchAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch agents from coordinator canister - will be empty until backend is connected
      setAgents([])
    } catch (err: any) {
      console.error('Failed to fetch agents:', err)
      setError(err.message || 'Failed to fetch agents')
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      await modelCanister.list_models([])
    } catch (err) {
      console.error('Failed to fetch models:', err)
    }
  }

  const handleCreateAgent = async () => {
    try {
      // In real implementation, would call agent creation API
      const newAgent: Agent = {
        agent_id: `agent_${Date.now()}`,
        agent_principal: 'new-agent-principal',
        capabilities: agentConfig.capabilities,
        reputation: 0,
        last_heartbeat: Date.now(),
        health_score: 1.0,
        model_id: agentConfig.model_id,
        status: 'online'
      }
      
      setAgents(prev => [...prev, newAgent])
      setShowCreateForm(false)
      setAgentConfig({
        model_id: '',
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        retention_days: 30,
        capabilities: []
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create agent')
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent) return
    
    setIsSending(true)
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: Date.now()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    
    try {
      // Simulate agent response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: generateMockResponse(currentMessage, selectedAgent),
        timestamp: Date.now()
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const generateMockResponse = (prompt: string, agent: Agent) => {
    const responses = {
      'text-generation': `Based on your request: "${prompt}"\n\nI can help you with text generation tasks. As an AI agent specialized in ${agent.capabilities.join(', ')}, I'm ready to assist with creative writing, content creation, and analytical tasks.\n\nWhat specific type of content would you like me to generate?`,
      'code-analysis': `I'll analyze your code request: "${prompt}"\n\n\`\`\`python\n# Here's a sample analysis approach:\ndef analyze_code(code_snippet):\n    issues = []\n    suggestions = []\n    \n    # Check for common patterns\n    if 'TODO' in code_snippet:\n        issues.append('Unfinished implementation')\n    \n    return {\n        'issues': issues,\n        'suggestions': suggestions,\n        'score': 85\n    }\n\`\`\`\n\nThis agent specializes in code review and can help with debugging, optimization, and best practices.`,
      'data-analysis': `Data analysis for: "${prompt}"\n\n**Analysis Summary:**\n- Data points processed: 1,247\n- Key insights identified: 5\n- Recommendations: 3\n\n**Key Findings:**\n1. 23% increase in user engagement\n2. Peak activity occurs at 2-4 PM\n3. Mobile users show 67% higher conversion\n\n**Recommendations:**\n1. Focus marketing efforts during peak hours\n2. Optimize mobile experience further\n3. Implement A/B testing for engagement features\n\nWould you like me to dive deeper into any specific aspect?`
    }
    
    const primaryCapability = agent.capabilities[0] as keyof typeof responses
    return responses[primaryCapability] || `I understand your request: "${prompt}"\n\nAs an AI agent with capabilities in ${agent.capabilities.join(', ')}, I'm here to help. Could you provide more specific details about what you'd like me to assist with?`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'busy': return 'warning'
      case 'offline': return 'error'
      case 'maintenance': return 'info'
      default: return 'default'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 0.9) return 'success'
    if (score >= 0.7) return 'warning'
    return 'error'
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">Agent Console</h1>
          <p className="text-textOnDark/70">Manage, configure, and interact with AI agents</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAgents} loading={loading} disabled={!isConnected}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} disabled={!isConnected}>
            Create Agent
          </Button>
        </div>
      </div>

      {!isConnected && (
        <Card className="mb-6 border-red-500/50">
          <div className="text-center">
            <p className="text-red-300 mb-4">Please connect to view agents</p>
            <Button onClick={connect}>Connect</Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {/* Agents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.agent_id} hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-accentGold mb-1">
                      {agent.agent_id}
                    </h3>
                    <p className="text-sm text-textOnDark/60">
                      {agent.model_id || 'No model bound'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={getStatusColor(agent.status)} size="sm">
                      {agent.status}
                    </Badge>
                    <Badge variant={getHealthColor(agent.health_score)} size="sm">
                      {(agent.health_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 flex-grow">
                  <div>
                    <span className="text-sm text-textOnDark/60">Capabilities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.capabilities.map((cap) => (
                        <Badge key={cap} size="sm" variant="default">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-textOnDark/60">Reputation:</span>
                      <p className="text-textOnDark font-medium">
                        ⭐ {agent.reputation.toFixed(1)}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Last Active:</span>
                      <p className="text-textOnDark font-medium">
                        {Math.round((Date.now() - agent.last_heartbeat) / 60000)}m ago
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-textOnDark/60">
                    Principal: {agent.agent_principal.slice(0, 20)}...
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-accentGold/20 mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedAgent(agent)
                      setChatMessages([])
                      setShowChatModal(true)
                    }}
                    disabled={agent.status === 'offline'}
                  >
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent)
                      setShowConfigModal(true)
                    }}
                  >
                    Configure
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {agents.length === 0 && !loading && isConnected && (
        <Card className="text-center py-12">
          <p className="text-textOnDark/60 mb-4">No agents available</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Agent
          </Button>
        </Card>
      )}

      {/* Create Agent Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Agent"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textOnDark mb-2">
              Select Model
            </label>
            <select
              value={agentConfig.model_id}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, model_id: e.target.value }))}
              className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
            >
              <option value="">Select a model...</option>
              <option value="llama-3-8b-instruct">Llama 3 8B Instruct</option>
              <option value="phi-3-mini-128k">Phi-3 Mini 128k</option>
              <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Tokens"
              type="number"
              value={agentConfig.max_tokens}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, max_tokens: Number(e.target.value) }))}
              min={100}
              max={4000}
            />
            <Input
              label="Temperature"
              type="number"
              step="0.1"
              value={agentConfig.temperature}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, temperature: Number(e.target.value) }))}
              min={0}
              max={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Top P"
              type="number"
              step="0.1"
              value={agentConfig.top_p}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, top_p: Number(e.target.value) }))}
              min={0}
              max={1}
            />
            <Input
              label="Retention (days)"
              type="number"
              value={agentConfig.retention_days}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, retention_days: Number(e.target.value) }))}
              min={1}
              max={365}
            />
          </div>

          <Input
            label="Capabilities"
            value={agentConfig.capabilities.join(', ')}
            onChange={(e) => setAgentConfig(prev => ({ 
              ...prev, 
              capabilities: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
            }))}
            placeholder="text-generation, analysis, creative-writing"
            helperText="Comma-separated list of capabilities"
          />

          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleCreateAgent}
              disabled={!agentConfig.model_id || agentConfig.capabilities.length === 0}
            >
              Create Agent
            </Button>
          </div>
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        title={`Chat with ${selectedAgent?.agent_id}`}
        maxWidth="xl"
      >
        <div className="flex flex-col h-96">
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-textOnDark/60 py-8">
                <p>Start a conversation with this agent</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-accentGold text-primary'
                        : 'bg-primary/60 text-textOnDark border border-accentGold/20'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-primary/60 border border-accentGold/20 rounded-lg px-4 py-2">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isSending}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`Configure ${selectedAgent?.agent_id}`}
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-textOnDark font-medium mb-3">Agent Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-primary/40 rounded border border-accentGold/20">
                <p className="text-sm text-textOnDark/60">Current Status</p>
                <Badge variant={getStatusColor(selectedAgent?.status || 'offline')}>
                  {selectedAgent?.status}
                </Badge>
              </div>
              <div className="p-3 bg-primary/40 rounded border border-accentGold/20">
                <p className="text-sm text-textOnDark/60">Health Score</p>
                <p className="text-lg font-semibold text-accentGold">
                  {((selectedAgent?.health_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-textOnDark font-medium mb-3">Model Binding</h4>
            <div className="p-3 bg-primary/40 rounded border border-accentGold/20">
              <p className="text-sm text-textOnDark/60">Bound Model</p>
              <p className="font-medium text-textOnDark">
                {selectedAgent?.model_id || 'No model bound'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-textOnDark font-medium mb-3">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAgent?.capabilities.map((cap) => (
                <Badge key={cap} variant="default">{cap}</Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowConfigModal(false)}>
              Close
            </Button>
            <Button fullWidth>
              Save Configuration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Agents