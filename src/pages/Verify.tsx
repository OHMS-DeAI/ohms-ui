import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'

const Verify = () => {
  const { isConnected, connect } = useAgent()
  const [manifestId, setManifestId] = useState('')
  const [receiptId, setReceiptId] = useState('')
  const [verification, setVerification] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  const verifyManifest = async () => {
    if (!manifestId.trim()) return
    
    setLoading(true)
    // Mock verification for demo
    setTimeout(() => {
      setVerification({
        type: 'manifest',
        id: manifestId,
        status: 'verified',
        details: {
          model_id: 'llama-8b-instruct',
          family: 'llama',
          version: '8b-v1.0',
          chunks: 8,
          total_size: '15.2 MB',
          overall_digest: 'sha256:a1b2c3d4e5f6...',
          verification_status: 'PASS',
          chunk_hashes: [
            { chunk_id: 0, hash: 'sha256:1a2b3c4d...', verified: true },
            { chunk_id: 1, hash: 'sha256:2b3c4d5e...', verified: true },
            { chunk_id: 2, hash: 'sha256:3c4d5e6f...', verified: true },
          ]
        }
      })
      setLoading(false)
    }, 1500)
  }

  const verifyReceipt = async () => {
    if (!receiptId.trim()) return
    
    setLoading(true)
    // Mock verification for demo
    setTimeout(() => {
      setVerification({
        type: 'receipt',
        id: receiptId,
        status: 'verified',
        details: {
          receipt_id: receiptId,
          job_id: 'job_demo_001',
          agent_id: 'agent_demo_001',
          actual_cost: 850,
          settlement_status: 'Completed',
          integrity_check: 'PASS',
          fee_calculation_valid: true,
          escrow_released: true,
          audit_trail: [
            { timestamp: Date.now() - 7200000, event: 'Job Created', hash: 'abc123...' },
            { timestamp: Date.now() - 6000000, event: 'Agent Assigned', hash: 'def456...' },
            { timestamp: Date.now() - 3600000, event: 'Job Completed', hash: 'ghi789...' },
            { timestamp: Date.now() - 3000000, event: 'Settlement', hash: 'jkl012...' }
          ]
        }
      })
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-accentGold mb-8">Verify</h1>

      {!isConnected && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">Please connect to use verification features</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h2 className="text-xl text-accentGold font-semibold mb-4">Verify Model Manifest</h2>
          <p className="text-textOnDark/80 text-sm mb-4">
            Verify the integrity of a model's manifest and chunk hashes
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              value={manifestId}
              onChange={(e) => setManifestId(e.target.value)}
              placeholder="Enter manifest ID or model ID"
              className="w-full p-3 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              disabled={!isConnected}
            />
            
            <button
              onClick={verifyManifest}
              disabled={!isConnected || loading || !manifestId.trim()}
              className="w-full px-4 py-3 bg-accentGold text-primary rounded disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Manifest'}
            </button>
          </div>
        </div>

        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h2 className="text-xl text-accentGold font-semibold mb-4">Verify Receipt</h2>
          <p className="text-textOnDark/80 text-sm mb-4">
            Verify the integrity of a payment receipt and audit trail
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              placeholder="Enter receipt ID"
              className="w-full p-3 bg-primary/60 border border-accentGold/40 rounded text-textOnDark"
              disabled={!isConnected}
            />
            
            <button
              onClick={verifyReceipt}
              disabled={!isConnected || loading || !receiptId.trim()}
              className="w-full px-4 py-3 bg-accentGold text-primary rounded disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Receipt'}
            </button>
          </div>
        </div>
      </div>

      {verification && (
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-accentGold font-semibold">
              Verification Results
            </h3>
            <span
              className={`px-3 py-1 rounded ${
                verification.status === 'verified'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {verification.status === 'verified' ? 'VERIFIED' : 'FAILED'}
            </span>
          </div>

          {verification.type === 'manifest' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-textOnDark">Model ID:</span>
                  <p className="text-textOnDark/80">{verification.details.model_id}</p>
                </div>
                <div>
                  <span className="text-textOnDark">Family:</span>
                  <p className="text-textOnDark/80">{verification.details.family}</p>
                </div>
                <div>
                  <span className="text-textOnDark">Version:</span>
                  <p className="text-textOnDark/80">{verification.details.version}</p>
                </div>
                <div>
                  <span className="text-textOnDark">Total Size:</span>
                  <p className="text-textOnDark/80">{verification.details.total_size}</p>
                </div>
              </div>

              <div>
                <span className="text-textOnDark">Overall Digest:</span>
                <p className="font-mono text-sm text-textOnDark/80 break-all">
                  {verification.details.overall_digest}
                </p>
              </div>

              <div>
                <h4 className="text-accentGold font-medium mb-2">Chunk Verification</h4>
                <div className="space-y-2">
                  {verification.details.chunk_hashes.map((chunk: any) => (
                    <div key={chunk.chunk_id} className="flex items-center justify-between text-sm">
                      <span>Chunk {chunk.chunk_id}</span>
                      <span className="font-mono text-xs">{chunk.hash}</span>
                      <span className={chunk.verified ? 'text-green-400' : 'text-red-400'}>
                        {chunk.verified ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {verification.type === 'receipt' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-textOnDark">Receipt ID:</span>
                  <p className="text-textOnDark/80">{verification.details.receipt_id}</p>
                </div>
                <div>
                  <span className="text-textOnDark">Settlement Status:</span>
                  <p className="text-textOnDark/80">{verification.details.settlement_status}</p>
                </div>
                <div>
                  <span className="text-textOnDark">Integrity Check:</span>
                  <p className={verification.details.integrity_check === 'PASS' ? 'text-green-400' : 'text-red-400'}>
                    {verification.details.integrity_check}
                  </p>
                </div>
                <div>
                  <span className="text-textOnDark">Fee Calculation:</span>
                  <p className={verification.details.fee_calculation_valid ? 'text-green-400' : 'text-red-400'}>
                    {verification.details.fee_calculation_valid ? 'VALID' : 'INVALID'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-accentGold font-medium mb-2">Audit Trail</h4>
                <div className="space-y-2">
                  {verification.details.audit_trail.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm border-l-2 border-accentGold/20 pl-3">
                      <div>
                        <p className="text-textOnDark">{entry.event}</p>
                        <p className="text-textOnDark/60 text-xs">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-textOnDark/80">
                        {entry.hash}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Verify