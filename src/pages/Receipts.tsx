import { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import { econCanister, agent } from '../services/canisterService'

const Receipts = () => {
  const { isPlugAvailable } = useAgent()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Remove automatic connection and fetching - manual auth system

  const statusToString = (status: any) => {
    if (!status) return 'pending'
    if ('Completed' in status) return 'settled'
    if ('Pending' in status) return 'pending'
    if ('Failed' in status) return 'disputed'
    if ('Disputed' in status) return 'disputed'
    return 'pending'
  }

  const fetchReceipts = async () => {
    setLoading(true)
    setError(null)
    try {
      const principalId = (await agent.getPrincipal()).toString()
      const res: any = await econCanister.list_receipts([principalId], [50])
      if (res && 'Ok' in res) {
        const mapped = (res.Ok as any[]).map((r: any) => ({
          ...r,
          amount: Number(r.fees_breakdown?.total_amount ?? r.actual_cost ?? 0),
          status: statusToString(r.settlement_status),
          created_at_ms: Number(r.created_at ? r.created_at / BigInt(1_000_000) : 0),
          settled_at_ms: Array.isArray(r.settled_at) && r.settled_at.length > 0 ? Number(r.settled_at[0] / BigInt(1_000_000)) : undefined,
        }))
        setReceipts(mapped)
      } else if (res && 'Err' in res) {
        setError(res.Err || 'Failed to fetch receipts')
        setReceipts([])
      } else {
        setError('Failed to fetch receipts')
        setReceipts([])
      }
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
          disabled={!isPlugAvailable || loading}
          className="px-4 py-2 bg-accentGold text-primary rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Receipts'}
        </button>
      </div>

      {!isPlugAvailable && (
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
                  <p><span className="text-textOnDark">Job ID:</span> {receipt.job_id}</p>
                  <p><span className="text-textOnDark">Escrow ID:</span> {receipt.escrow_id}</p>
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
                    <span>Total:</span>
                    <span className="text-textOnDark">{Number(receipt.fees_breakdown?.total_amount ?? 0).toLocaleString()} ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base:</span>
                    <span className="text-textOnDark">{Number(receipt.fees_breakdown?.base_amount ?? 0).toLocaleString()} ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol Fee:</span>
                    <span className="text-textOnDark">{Number(receipt.fees_breakdown?.protocol_fee ?? 0).toLocaleString()} ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agent Fee:</span>
                    <span className="text-textOnDark">{Number(receipt.fees_breakdown?.agent_fee ?? 0).toLocaleString()} ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={receipt.status === 'settled' ? 'text-green-400' : receipt.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}>
                      {receipt.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-accentGold font-semibold mb-3">Timestamps</h3>
                <div className="space-y-1 text-sm text-textOnDark/80">
                  <p>
                    <span className="text-textOnDark">Created:</span><br />
                    {receipt.created_at_ms ? new Date(receipt.created_at_ms).toLocaleString() : '—'}
                  </p>
                  {receipt.settled_at_ms && (
                    <p>
                      <span className="text-textOnDark">Settled:</span><br />
                      {new Date(receipt.settled_at_ms).toLocaleString()}
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

        {receipts.length === 0 && !loading && isPlugAvailable && (
          <div className="text-center py-12">
            <p className="text-textOnDark/60">No receipts available. Click "Refresh Receipts" to load.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Receipts