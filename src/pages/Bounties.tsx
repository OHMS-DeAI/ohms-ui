import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'

const Bounties = () => {
  const { isConnected, connect } = useAgent()
  const [bounties, setBounties] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  const fetchBounties = async () => {
    setLoading(true)
    // Mock bounties for demo
    setTimeout(() => {
      setBounties([
        {
          bounty_id: 'bounty_demo_001',
          spec: {
            title: 'Text Summarization Task',
            description: 'Summarize technical documentation into concise points',
            required_capabilities: ['text-generation', 'summarization'],
            max_participants: 5,
            deadline_timestamp: Date.now() + 7 * 24 * 60 * 60 * 1000,
            escrow_amount: 1000,
          },
          status: 'Open',
          created_at: Date.now() - 3600000,
          submissions: [],
        },
        {
          bounty_id: 'bounty_demo_002',
          spec: {
            title: 'Code Review Assistant',
            description: 'Review code for potential bugs and improvements',
            required_capabilities: ['code-generation', 'analysis'],
            max_participants: 3,
            deadline_timestamp: Date.now() + 3 * 24 * 60 * 60 * 1000,
            escrow_amount: 2500,
          },
          status: 'InProgress',
          created_at: Date.now() - 86400000,
          submissions: [{ agent_id: 'agent_001' }],
        }
      ])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-accentGold">Bounties</h1>
        <div className="space-x-4">
          <button
            onClick={fetchBounties}
            disabled={!isConnected || loading}
            className="px-4 py-2 border border-accentGold text-accentGold rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!isConnected}
            className="px-4 py-2 bg-accentGold text-primary rounded disabled:opacity-50"
          >
            Create Bounty
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">Please connect to view bounties</p>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-primary border border-accentGold/20 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl text-accentGold mb-4">Create Bounty</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                className="w-full p-2 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              />
              <textarea
                placeholder="Description"
                rows={3}
                className="w-full p-2 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              />
              <input
                type="text"
                placeholder="Required capabilities (comma separated)"
                className="w-full p-2 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              />
              <input
                type="number"
                placeholder="Max participants"
                className="w-full p-2 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              />
              <input
                type="number"
                placeholder="Escrow amount"
                className="w-full p-2 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              />
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-textOnDark/40 text-textOnDark rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accentGold text-primary rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bounties.map((bounty) => (
          <div
            key={bounty.bounty_id}
            className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-accentGold font-semibold text-lg">
                {bounty.spec.title}
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  bounty.status === 'Open'
                    ? 'bg-green-500/20 text-green-300'
                    : bounty.status === 'InProgress'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}
              >
                {bounty.status}
              </span>
            </div>

            <p className="text-textOnDark/80 text-sm mb-4">
              {bounty.spec.description}
            </p>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-textOnDark">Capabilities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bounty.spec.required_capabilities.map((cap: string) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 bg-accentGold/20 text-accentGold rounded text-xs"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-textOnDark/80">
                <p><span className="text-textOnDark">Reward:</span> {bounty.spec.escrow_amount}</p>
                <p><span className="text-textOnDark">Max Participants:</span> {bounty.spec.max_participants}</p>
                <p><span className="text-textOnDark">Submissions:</span> {bounty.submissions.length}</p>
                <p><span className="text-textOnDark">Deadline:</span> {new Date(bounty.spec.deadline_timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-4 space-x-2">
              <button className="px-3 py-1 bg-accentGold text-primary rounded text-sm">
                View Details
              </button>
              {bounty.status === 'Open' && (
                <button className="px-3 py-1 border border-accentGold text-accentGold rounded text-sm">
                  Participate
                </button>
              )}
            </div>
          </div>
        ))}

        {bounties.length === 0 && !loading && isConnected && (
          <div className="col-span-full text-center py-12">
            <p className="text-textOnDark/60">No bounties available. Click "Refresh" to load.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Bounties