import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'

const Receipts = () => {
  const { isConnected, connect } = useAgent()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  const fetchReceipts = async () => {
    setLoading(true)
    // Mock receipts for demo
    setTimeout(() => {
      setReceipts([
        {
          receipt_id: 'receipt_demo_001',
          job_id: 'job_demo_001',
          escrow_id: 'escrow_demo_001',
          agent_id: 'agent_demo_001',
          actual_cost: 850,
          fees_breakdown: {
            base_amount: 800,
            protocol_fee: 25,
            agent_fee: 25,
            total_amount: 850,
          },
          settlement_status: 'Completed',
          created_at: Date.now() - 3600000,
          settled_at: Date.now() - 3000000,
        },
        {
          receipt_id: 'receipt_demo_002',
          job_id: 'job_demo_002',
          escrow_id: 'escrow_demo_002',
          agent_id: 'agent_demo_002',
          actual_cost: 1200,
          fees_breakdown: {
            base_amount: 1100,
            protocol_fee: 50,
            agent_fee: 50,
            total_amount: 1200,
          },
          settlement_status: 'Pending',
          created_at: Date.now() - 1800000,
          settled_at: null,
        }
      ])
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-accentGold">Receipts</h1>
        <button
          onClick={fetchReceipts}
          disabled={!isConnected || loading}
          className="px-4 py-2 bg-accentGold text-primary rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Receipts'}
        </button>
      </div>

      {!isConnected && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">Please connect to view receipts</p>
        </div>
      )}

      <div className="space-y-4">
        {receipts.map((receipt) => (
          <div
            key={receipt.receipt_id}
            className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-accentGold font-semibold mb-3">Receipt Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-textOnDark">Receipt ID:</span> {receipt.receipt_id}</p>
                  <p><span className="text-textOnDark">Job ID:</span> {receipt.job_id}</p>
                  <p><span className="text-textOnDark">Agent ID:</span> {receipt.agent_id}</p>
                  <p><span className="text-textOnDark">Escrow ID:</span> {receipt.escrow_id}</p>
                  <p>
                    <span className="text-textOnDark">Status:</span>{' '}
                    <span
                      className={
                        receipt.settlement_status === 'Completed'
                          ? 'text-green-400'
                          : receipt.settlement_status === 'Pending'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {receipt.settlement_status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-accentGold font-semibold mb-3">Fee Breakdown</h3>
                <div className="space-y-1 text-sm text-textOnDark/80">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="text-textOnDark">{receipt.fees_breakdown.base_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol Fee:</span>
                    <span className="text-textOnDark">{receipt.fees_breakdown.protocol_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agent Fee:</span>
                    <span className="text-textOnDark">{receipt.fees_breakdown.agent_fee}</span>
                  </div>
                  <div className="flex justify-between border-t border-accentGold/20 pt-1 mt-2">
                    <span className="text-accentGold font-medium">Total:</span>
                    <span className="text-accentGold font-medium">{receipt.fees_breakdown.total_amount}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-accentGold font-semibold mb-3">Timestamps</h3>
                <div className="space-y-1 text-sm text-textOnDark/80">
                  <p>
                    <span className="text-textOnDark">Created:</span><br />
                    {new Date(receipt.created_at).toLocaleString()}
                  </p>
                  {receipt.settled_at && (
                    <p>
                      <span className="text-textOnDark">Settled:</span><br />
                      {new Date(receipt.settled_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-x-2">
                  <button className="px-3 py-1 bg-accentGold text-primary rounded text-sm">
                    View Details
                  </button>
                  <button className="px-3 py-1 border border-accentGold text-accentGold rounded text-sm">
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {receipts.length === 0 && !loading && isConnected && (
          <div className="text-center py-12">
            <p className="text-textOnDark/60">No receipts available. Click "Refresh Receipts" to load.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Receipts