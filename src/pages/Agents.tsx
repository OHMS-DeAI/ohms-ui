import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'

const Agents = () => {
  const { isConnected, connect } = useAgent()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  const fetchAgents = async () => {
    setLoading(true)
    // Mock agents for demo
    setTimeout(() => {
      setAgents([
        {
          agent_id: 'agent_demo_001',
          agent_principal: 'demo-principal-123',
          capabilities: ['text-generation', 'summarization'],
          model_id: 'llama-8b-instruct',
          health_score: 0.95,
          registered_at: Date.now() - 86400000,
          last_seen: Date.now() - 3600000,
        },
        {
          agent_id: 'agent_demo_002',
          agent_principal: 'demo-principal-456',
          capabilities: ['code-generation', 'analysis'],
          model_id: 'mistral-7b-code',
          health_score: 0.87,
          registered_at: Date.now() - 172800000,
          last_seen: Date.now() - 1800000,
        }
      ])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-accentGold">Agents</h1>
        <button
          onClick={fetchAgents}
          disabled={!isConnected || loading}
          className="px-4 py-2 bg-accentGold text-primary rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Agents'}
        </button>
      </div>

      {!isConnected && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">Please connect to view agents</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.agent_id}
            className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-accentGold font-semibold">
                {agent.agent_id}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  agent.health_score > 0.9
                    ? 'bg-green-500/20 text-green-300'
                    : agent.health_score > 0.7
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                Health: {(agent.health_score * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-textOnDark/80">
              <p><span className="text-textOnDark">Model:</span> {agent.model_id}</p>
              <p><span className="text-textOnDark">Principal:</span> {agent.agent_principal}</p>
              
              <div>
                <span className="text-textOnDark">Capabilities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.capabilities.map((cap: string) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 bg-accentGold/20 text-accentGold rounded text-xs"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              
              <p>
                <span className="text-textOnDark">Last Seen:</span>{' '}
                {new Date(agent.last_seen).toLocaleString()}
              </p>
            </div>

            <div className="mt-4 space-x-2">
              <button className="px-3 py-1 bg-accentGold text-primary rounded text-sm">
                View Details
              </button>
              <button className="px-3 py-1 border border-accentGold text-accentGold rounded text-sm">
                Send Task
              </button>
            </div>
          </div>
        ))}
        
        {agents.length === 0 && !loading && isConnected && (
          <div className="col-span-full text-center py-12">
            <p className="text-textOnDark/60">No agents available. Click "Refresh Agents" to load.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Agents