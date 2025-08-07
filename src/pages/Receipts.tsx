import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { econCanister, agent } from '../services/canisterService'

const Receipts = () => {
  const { isConnected, connect } = useAgent()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      connect()
    } else {
      fetchReceipts()
    }
  }, [isConnected, connect])

  const fetchReceipts = async () => {
    setLoading(true)
    setError(null)
    try {
      const principalId = (await agent.getPrincipal()).toString()
      const result = await econCanister.list_receipts(principalId, 50)
      setReceipts(Array.isArray(result) ? result : [])
    } catch (err: any) {
      console.error('Failed to fetch receipts:', err)
      setError(err.message || 'Failed to fetch receipts')
      setReceipts([])
    } finally {
      setLoading(false)
    }
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

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">Error: {error}</p>
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
                  <p><span className="text-textOnDark">Request ID:</span> {receipt.request_id}</p>
                  <p><span className="text-textOnDark">Amount:</span> {receipt.amount}</p>
                  <p>
                    <span className="text-textOnDark">Status:</span>{' '}
                    <span
                      className={
                        receipt.status === 'settled'
                          ? 'text-green-400'
                          : receipt.status === 'pending'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {receipt.status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-accentGold font-semibold mb-3">Payment Info</h3>
                <div className="space-y-1 text-sm text-textOnDark/80">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="text-textOnDark">{receipt.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-textOnDark">{receipt.status}</span>
                  </div>
                  <div className="flex justify-between border-t border-accentGold/20 pt-1 mt-2">
                    <span className="text-accentGold font-medium">Total:</span>
                    <span className="text-accentGold font-medium">{receipt.amount}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-accentGold font-semibold mb-3">Timestamps</h3>
                <div className="space-y-1 text-sm text-textOnDark/80">
                  <p>
                    <span className="text-textOnDark">Created:</span><br />
                    {new Date(Number(receipt.created_at) / 1000000).toLocaleString()}
                  </p>
                  {receipt.settled_at && receipt.settled_at.length > 0 && (
                    <p>
                      <span className="text-textOnDark">Settled:</span><br />
                      {new Date(Number(receipt.settled_at[0]) / 1000000).toLocaleString()}
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