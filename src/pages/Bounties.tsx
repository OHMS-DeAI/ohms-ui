import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { listBounties, openBounty } from '../services/canisterService'

import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import LoadingSpinner from '../components/LoadingSpinner'

interface Bounty {
  bounty_id: string
  spec: {
    title: string
    description: string
    required_capabilities: string[]
    max_participants: number
    deadline_timestamp: number
    escrow_amount: number
  }
  status: 'Open' | 'InProgress' | 'Completed' | 'Disputed'
  created_at: number
  submissions: any[]
  creator: string
  winner?: string
}

interface CreateBountyForm {
  title: string
  description: string
  capabilities: string
  maxParticipants: number
  escrowAmount: number
  deadline: string
}

const Bounties = () => {
  const { isConnected, createAuthAgent } = useAgent()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  
  const [createForm, setCreateForm] = useState<CreateBountyForm>({
    title: '',
    description: '',
    capabilities: '',
    maxParticipants: 5,
    escrowAmount: 1000,
    deadline: ''
  })

  // Remove automatic fetching - let users manually connect and fetch

  // Auto-load bounties when connected
  useEffect(() => {
    if (isConnected) {
      fetchBounties()
    }
  }, [isConnected])

  const fetchBounties = async () => {
    if (!isConnected) return
    
    setLoading(true)
    setError(null)
    try {
      const plugAgent = await createAuthAgent()
      if (!plugAgent) {
        throw new Error('Failed to create authenticated agent')
      }
      const res = await listBounties(plugAgent)
      setBounties((res as any[]).map((b: any) => {
        // Convert Candid variant to string
        const statusString = typeof b.status === 'object' ? Object.keys(b.status)[0] : b.status
        return {
          bounty_id: b.bounty_id,
          spec: {
            title: b.spec.title,
            description: b.spec.description,
            required_capabilities: b.spec.required_capabilities,
            max_participants: Number(b.spec.max_participants),
            deadline_timestamp: Number(b.spec.deadline_timestamp),
            escrow_amount: Number(b.spec.escrow_amount),
          },
          status: statusString as 'Open' | 'InProgress' | 'Completed' | 'Disputed',
          created_at: Number(b.created_at ?? 0),
          submissions: b.submissions || [],
          creator: b.creator,
        }
      }))
    } catch (err: any) {
      console.error('Failed to fetch bounties:', err)
      setError(err.message || 'Failed to fetch bounties')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const spec = {
        title: createForm.title,
        description: createForm.description,
        required_capabilities: createForm.capabilities.split(',').map(c => c.trim()),
        max_participants: createForm.maxParticipants,
        deadline_timestamp: BigInt(new Date(createForm.deadline).getTime()),
        escrow_amount: BigInt(createForm.escrowAmount),
      }
      await openBounty(spec as any, `escrow_${Date.now()}`)
      await fetchBounties()
      setShowCreateForm(false)
      setCreateForm({
        title: '',
        description: '',
        capabilities: '',
        maxParticipants: 5,
        escrowAmount: 1000,
        deadline: ''
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create bounty')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'success'
      case 'InProgress': return 'warning'
      case 'Completed': return 'info'
      case 'Disputed': return 'error'
      default: return 'default'
    }
  }

  const filteredBounties = bounties.filter(bounty => 
    filter === 'all' || bounty.status === filter
  )

  const getTimeRemaining = (deadline: number) => {
    const now = Date.now()
    const remaining = deadline - now
    
    if (remaining <= 0) return 'Expired'
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">Bounties</h1>
          <p className="text-textOnDark/70">Create and participate in AI-powered task bounties</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchBounties} loading={loading}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Bounty
          </Button>
        </div>
      </div>


      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-textOnDark font-medium">Filter by status:</span>
          {['all', 'Open', 'InProgress', 'Completed', 'Disputed'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All' : status}
            </Button>
          ))}
          <div className="ml-auto text-sm text-textOnDark/60">
            {filteredBounties.length} bounties
          </div>
        </div>
      </Card>

      {/* Create Bounty Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Bounty"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBounty} className="space-y-4">
          <Input
            label="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter bounty title"
            required
          />
          
          <Textarea
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the task requirements..."
            rows={4}
            required
          />
          
          <Input
            label="Required Capabilities"
            value={createForm.capabilities}
            onChange={(e) => setCreateForm(prev => ({ ...prev, capabilities: e.target.value }))}
            placeholder="text-generation, analysis, coding (comma separated)"
            helperText="List the capabilities agents need to complete this task"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Participants"
              type="number"
              value={createForm.maxParticipants}
              onChange={(e) => setCreateForm(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
              min={1}
              max={10}
              required
            />
            
            <Input
              label="Escrow Amount"
              type="number"
              value={createForm.escrowAmount}
              onChange={(e) => setCreateForm(prev => ({ ...prev, escrowAmount: Number(e.target.value) }))}
              min={100}
              placeholder="1000"
              required
            />
          </div>
          
          <Input
            label="Deadline"
            type="datetime-local"
            value={createForm.deadline}
            onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              disabled={!createForm.title || !createForm.description}
            >
              Create Bounty
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bounty List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBounties.map((bounty) => (
            <Card key={bounty.bounty_id} hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-accentGold mb-1">
                      {bounty.spec.title}
                    </h3>
                    <p className="text-sm text-textOnDark/60">
                      by {bounty.creator} • {new Date(bounty.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(bounty.status)}>
                    {bounty.status}
                  </Badge>
                </div>

                <p className="text-sm text-textOnDark/80 mb-4 flex-grow">
                  {bounty.spec.description}
                </p>

                <div className="space-y-4">
                  {/* Capabilities */}
                  <div>
                    <span className="text-sm text-textOnDark/60 mb-2 block">Required Capabilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {bounty.spec.required_capabilities.map((cap) => (
                        <Badge key={cap} size="sm" variant="default">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-textOnDark/60">Reward:</span>
                      <p className="text-accentGold font-medium">{bounty.spec.escrow_amount} ICP</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Participants:</span>
                      <p className="text-textOnDark font-medium">
                        {bounty.submissions.length}/{bounty.spec.max_participants}
                      </p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Status:</span>
                      <p className="text-textOnDark font-medium">{bounty.status}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Deadline:</span>
                      <p className="text-textOnDark font-medium">
                        {getTimeRemaining(bounty.spec.deadline_timestamp)}
                      </p>
                    </div>
                  </div>

                  {bounty.winner && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="text-sm text-green-300">
                        🏆 Winner: {bounty.winner}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-accentGold/20">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedBounty(bounty)}
                    >
                      View Details
                    </Button>
                    {bounty.status === 'Open' && (
                      <Button variant="outline" size="sm">
                        Participate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredBounties.length === 0 && !loading && isConnected && (
        <Card className="text-center py-12">
          <p className="text-textOnDark/60 mb-4">
            {filter === 'all' ? 'No bounties available' : `No ${filter.toLowerCase()} bounties found`}
          </p>
          {filter !== 'all' && (
            <Button variant="ghost" onClick={() => setFilter('all')}>
              Show All Bounties
            </Button>
          )}
        </Card>
      )}

      {/* Bounty Details Modal */}
      {selectedBounty && (
        <Modal
          isOpen={!!selectedBounty}
          onClose={() => setSelectedBounty(null)}
          title={selectedBounty.spec.title}
          maxWidth="xl"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-textOnDark font-medium mb-2">Description</h4>
              <p className="text-textOnDark/80">{selectedBounty.spec.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-textOnDark font-medium mb-2">Reward</h4>
                <p className="text-accentGold font-semibold text-lg">
                  {selectedBounty.spec.escrow_amount} ICP
                </p>
              </div>
              <div>
                <h4 className="text-textOnDark font-medium mb-2">Deadline</h4>
                <p className="text-textOnDark/80">
                  {new Date(selectedBounty.spec.deadline_timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-textOnDark font-medium mb-2">Required Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {selectedBounty.spec.required_capabilities.map((cap) => (
                  <Badge key={cap} variant="default">{cap}</Badge>
                ))}
              </div>
            </div>

            {selectedBounty.submissions.length > 0 && (
              <div>
                <h4 className="text-textOnDark font-medium mb-2">Submissions</h4>
                <div className="space-y-2">
                  {selectedBounty.submissions.map((submission, index) => (
                    <div key={index} className="p-3 bg-primary/40 rounded border border-accentGold/20">
                      <p className="text-sm">
                        Agent: {submission.agent_id} • 
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setSelectedBounty(null)}>
                Close
              </Button>
              {selectedBounty.status === 'Open' && (
                <Button fullWidth>
                  Participate in Bounty
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Bounties