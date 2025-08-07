import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'

import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'

interface Receipt {
  receipt_id: string
  request_id: string
  amount: number
  status: 'pending' | 'settled' | 'disputed' | 'refunded'
  created_at: number
  settled_at?: number
  agent_id: string
  model_id: string
  tokens_processed: number
  actual_cost: number
  estimated_cost: number
}

interface Estimate {
  base_cost: number
  priority_multiplier: number
  protocol_fee: number
  total_cost: number
  estimated_time: string
  confidence: number
}

interface Statement {
  period: string
  total_spent: number
  total_jobs: number
  total_tokens: number
  cost_breakdown: {
    agent_fees: number
    protocol_fees: number
    storage_fees: number
    compute_fees: number
  }
  receipts: Receipt[]
}

const Economics = () => {
  const { isConnected, connect } = useAgent()
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'estimates' | 'billing'>('overview')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  
  // Estimate form
  const [estimateForm, setEstimateForm] = useState({
    task_description: '',
    estimated_tokens: 1000,
    priority: 'medium' as 'low' | 'medium' | 'high',
    agent_type: 'general'
  })
  const [currentEstimate, setCurrentEstimate] = useState<Estimate | null>(null)

  // Balance and stats
  const [balance, setBalance] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [monthlySpent, setMonthlySpent] = useState(0)

  useEffect(() => {
    if (!isConnected) {
      connect()
    } else {
      fetchData()
    }
  }, [isConnected, connect])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchReceipts(),
        fetchStatements(),
        fetchBalance()
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchReceipts = async () => {
    try {
      // Fetch receipts from economics canister - will be empty until backend is connected
      setReceipts([])
      setPendingAmount(0)
      setMonthlySpent(0)
    } catch (err) {
      console.error('Failed to fetch receipts:', err)
    }
  }

  const fetchStatements = async () => {
    try {
      // Mock statements
      const mockStatements: Statement[] = [
        {
          period: 'January 2025',
          total_spent: 15750,
          total_jobs: 47,
          total_tokens: 125000,
          cost_breakdown: {
            agent_fees: 14175,
            protocol_fees: 472,
            storage_fees: 315,
            compute_fees: 788
          },
          receipts: receipts.filter(r => r.status === 'settled')
        }
      ]
      setStatements(mockStatements)
    } catch (err) {
      console.error('Failed to fetch statements:', err)
    }
  }

  const fetchBalance = async () => {
    try {
      // Mock balance
      setBalance(25000)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }

  const handleGetEstimate = async () => {
    setLoading(true)
    try {
      // Simulate estimate calculation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const priorityMultipliers = { low: 1.0, medium: 1.2, high: 1.5 }
      const baseCost = Math.round(estimateForm.estimated_tokens * 0.5)
      const priorityCost = Math.round(baseCost * priorityMultipliers[estimateForm.priority])
      const protocolFee = Math.round(priorityCost * 0.03)
      
      const estimate: Estimate = {
        base_cost: baseCost,
        priority_multiplier: priorityMultipliers[estimateForm.priority],
        protocol_fee: protocolFee,
        total_cost: priorityCost + protocolFee,
        estimated_time: estimateForm.priority === 'high' ? '5-15 min' : estimateForm.priority === 'medium' ? '15-30 min' : '30-60 min',
        confidence: 0.85 + Math.random() * 0.1
      }
      
      setCurrentEstimate(estimate)
    } catch (err: any) {
      setError(err.message || 'Failed to get estimate')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled': return 'success'
      case 'pending': return 'warning'
      case 'disputed': return 'error'
      case 'refunded': return 'info'
      default: return 'default'
    }
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ICP`

  const currentStatement = statements[0]

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Economics</h1>
          <p className="text-textOnDark/70 mb-6">Manage payments, billing, and financial analytics</p>
          <Button onClick={connect}>Connect to OHMS</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accentGold mb-2">Economics</h1>
        <p className="text-textOnDark/70">Manage payments, estimates, and financial analytics</p>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'receipts', label: 'Receipts', icon: '🧾' },
            { id: 'estimates', label: 'Cost Estimates', icon: '💰' },
            { id: 'billing', label: 'Billing & Statements', icon: '📋' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Available Balance</p>
                <p className="text-2xl font-bold text-accentGold">{formatCurrency(balance)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(pendingAmount)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Monthly Spent</p>
                <p className="text-2xl font-bold text-textOnDark">{formatCurrency(monthlySpent)}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-textOnDark/60 text-sm mb-2">Total Jobs</p>
                <p className="text-2xl font-bold text-textOnDark">{receipts.length}</p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-accentGold">Recent Activity</h3>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('receipts')}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {receipts.slice(0, 5).map((receipt) => (
                <div key={receipt.receipt_id} className="flex items-center justify-between p-3 bg-primary/40 rounded border border-accentGold/20">
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(receipt.status)} size="sm">
                      {receipt.status}
                    </Badge>
                    <div>
                      <p className="font-medium text-textOnDark">{receipt.receipt_id}</p>
                      <p className="text-sm text-textOnDark/60">
                        {receipt.model_id} • {receipt.tokens_processed} tokens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-textOnDark">{formatCurrency(receipt.amount)}</p>
                    <p className="text-sm text-textOnDark/60">
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card hover className="text-center cursor-pointer" onClick={() => setShowEstimateModal(true)}>
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-accentGold font-semibold mb-2">Get Cost Estimate</h3>
              <p className="text-textOnDark/70 text-sm">Estimate costs before running tasks</p>
            </Card>
            <Card hover className="text-center cursor-pointer" onClick={() => setActiveTab('receipts')}>
              <div className="text-3xl mb-3">🧾</div>
              <h3 className="text-accentGold font-semibold mb-2">View Receipts</h3>
              <p className="text-textOnDark/70 text-sm">Track all payment transactions</p>
            </Card>
            <Card hover className="text-center cursor-pointer" onClick={() => setShowBillingModal(true)}>
              <div className="text-3xl mb-3">📋</div>
              <h3 className="text-accentGold font-semibold mb-2">Download Statement</h3>
              <p className="text-textOnDark/70 text-sm">Export billing statements</p>
            </Card>
          </div>
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Payment Receipts</h2>
            <Button variant="outline" onClick={fetchReceipts} loading={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <Card key={receipt.receipt_id}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Receipt Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">ID:</span> {receipt.receipt_id}</p>
                        <p><span className="text-textOnDark/60">Request:</span> {receipt.request_id}</p>
                        <p><span className="text-textOnDark/60">Agent:</span> {receipt.agent_id}</p>
                        <p><span className="text-textOnDark/60">Model:</span> {receipt.model_id}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Payment Info</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Amount:</span>
                          <span className="text-textOnDark font-medium">{formatCurrency(receipt.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Estimated:</span>
                          <span className="text-textOnDark">{formatCurrency(receipt.estimated_cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textOnDark/60">Variance:</span>
                          <span className={receipt.actual_cost <= receipt.estimated_cost ? 'text-green-400' : 'text-orange-400'}>
                            {receipt.actual_cost <= receipt.estimated_cost ? '-' : '+'}
                            {Math.abs(receipt.actual_cost - receipt.estimated_cost)} ICP
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Usage Stats</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">Tokens:</span> {receipt.tokens_processed.toLocaleString()}</p>
                        <p><span className="text-textOnDark/60">Cost/Token:</span> {(receipt.amount / receipt.tokens_processed).toFixed(3)} ICP</p>
                        <Badge variant={getStatusColor(receipt.status)} size="sm">
                          {receipt.status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-accentGold font-medium mb-2">Timestamps</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-textOnDark/60">Created:</span></p>
                        <p className="text-textOnDark">{new Date(receipt.created_at).toLocaleString()}</p>
                        {receipt.settled_at && (
                          <>
                            <p><span className="text-textOnDark/60">Settled:</span></p>
                            <p className="text-textOnDark">{new Date(receipt.settled_at).toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estimates Tab */}
      {activeTab === 'estimates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Cost Estimates</h2>
            <Button onClick={() => setShowEstimateModal(true)}>
              New Estimate
            </Button>
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Cost Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Task Description"
                  value={estimateForm.task_description}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, task_description: e.target.value }))}
                  placeholder="Describe your task..."
                />
                
                <Input
                  label="Estimated Tokens"
                  type="number"
                  value={estimateForm.estimated_tokens}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimated_tokens: Number(e.target.value) }))}
                  min={100}
                  max={10000}
                />
                
                <div>
                  <label className="block text-sm font-medium text-textOnDark mb-2">Priority</label>
                  <select
                    value={estimateForm.priority}
                    onChange={(e) => setEstimateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
                  >
                    <option value="low">Low Priority (1.0x)</option>
                    <option value="medium">Medium Priority (1.2x)</option>
                    <option value="high">High Priority (1.5x)</option>
                  </select>
                </div>
                
                <Button 
                  fullWidth 
                  onClick={handleGetEstimate}
                  loading={loading}
                  disabled={!estimateForm.task_description}
                >
                  Calculate Estimate
                </Button>
              </div>

              {currentEstimate && (
                <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
                  <h4 className="text-accentGold font-medium mb-3">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Base Cost:</span>
                      <span className="text-textOnDark">{formatCurrency(currentEstimate.base_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Priority Multiplier:</span>
                      <span className="text-textOnDark">{currentEstimate.priority_multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Protocol Fee (3%):</span>
                      <span className="text-textOnDark">{formatCurrency(currentEstimate.protocol_fee)}</span>
                    </div>
                    <div className="border-t border-accentGold/20 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-accentGold">Total Cost:</span>
                        <span className="text-accentGold text-lg">{formatCurrency(currentEstimate.total_cost)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-accentGold/20">
                      <p className="text-textOnDark/60 text-xs">Estimated Time: {currentEstimate.estimated_time}</p>
                      <p className="text-textOnDark/60 text-xs">Confidence: {(currentEstimate.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-accentGold">Billing & Statements</h2>
            <Button onClick={() => setShowBillingModal(true)}>
              Export Statement
            </Button>
          </div>

          {currentStatement && (
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-accentGold mb-3">{currentStatement.period} Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Spent:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.total_spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Jobs:</span>
                      <span className="text-textOnDark font-medium">{currentStatement.total_jobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Total Tokens:</span>
                      <span className="text-textOnDark font-medium">{currentStatement.total_tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Avg Cost/Job:</span>
                      <span className="text-textOnDark font-medium">
                        {formatCurrency(Math.round(currentStatement.total_spent / currentStatement.total_jobs))}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-accentGold mb-3">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Agent Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.agent_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Protocol Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.protocol_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Storage Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.storage_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textOnDark/60">Compute Fees:</span>
                      <span className="text-textOnDark font-medium">{formatCurrency(currentStatement.cost_breakdown.compute_fees)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Estimate Modal */}
      <Modal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        title="Get Cost Estimate"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            label="Task Description"
            value={estimateForm.task_description}
            onChange={(e) => setEstimateForm(prev => ({ ...prev, task_description: e.target.value }))}
            placeholder="Describe what you want to accomplish..."
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Tokens"
              type="number"
              value={estimateForm.estimated_tokens}
              onChange={(e) => setEstimateForm(prev => ({ ...prev, estimated_tokens: Number(e.target.value) }))}
              min={100}
              max={10000}
              helperText="Approximate token count needed"
            />
            
            <div>
              <label className="block text-sm font-medium text-textOnDark mb-2">Priority Level</label>
              <select
                value={estimateForm.priority}
                onChange={(e) => setEstimateForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
              >
                <option value="low">Low Priority (1.0x)</option>
                <option value="medium">Medium Priority (1.2x)</option>
                <option value="high">High Priority (1.5x)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" fullWidth onClick={() => setShowEstimateModal(false)}>
              Cancel
            </Button>
            <Button 
              fullWidth 
              onClick={handleGetEstimate}
              loading={loading}
              disabled={!estimateForm.task_description}
            >
              Get Estimate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Billing Export Modal */}
      <Modal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        title="Export Billing Statement"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-textOnDark/80">
            Export your billing statement for accounting and expense tracking purposes.
          </p>
          
          <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
            <h4 className="text-accentGold font-medium mb-2">Export Options</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="json" defaultChecked className="text-accentGold" />
                <span className="text-textOnDark">JSON Format (machine readable)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="csv" className="text-accentGold" />
                <span className="text-textOnDark">CSV Format (spreadsheet compatible)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="format" value="pdf" className="text-accentGold" />
                <span className="text-textOnDark">PDF Format (human readable)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowBillingModal(false)}>
              Cancel
            </Button>
            <Button fullWidth>
              Download Statement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Economics