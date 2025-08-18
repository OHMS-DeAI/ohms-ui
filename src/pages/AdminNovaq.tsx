import { useEffect, useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import {
  createModelActor,
  createEconActor,
} from '../services/canisterService'

type ModelSubmission = {
  model_id: string
  source_model: string
  compression_ratio: number
  capability_retention: number
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: string
  submitted_at: number
  admin_notes?: string
}

type PlatformStats = {
  total_models: number
  active_models: number
  pending_reviews: number
  total_users: number
  active_subscriptions: number
  monthly_revenue: number
}

const AdminNovaq = () => {
  const { isWalletAvailable, createAuthAgent, isAdmin: hasAdminRole, checkAdminStatus } = useAgent()
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Platform curation data
  const [pendingSubmissions, setPendingSubmissions] = useState<ModelSubmission[]>([])
  const [approvedModels, setApprovedModels] = useState<ModelSubmission[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    total_models: 0,
    active_models: 0,
    pending_reviews: 0,
    total_users: 0,
    active_subscriptions: 0,
    monthly_revenue: 0,
  })

  // NOVAQ processing status
  const [novaqProcessing, setNovaqProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  // Check admin status when component mounts
  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isWalletAvailable) {
        setAuthChecked(true)
        return
      }
      
      try {
        const agent = await createAuthAgent()
        const admin = await checkAdminStatus()
        setIsAdmin(admin || hasAdminRole)
        setAuthChecked(true)
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setAuthChecked(true)
      }
    }
    
    verifyAdminAccess()
  }, [isWalletAvailable, createAuthAgent, hasAdminRole, checkAdminStatus])

  const loadPlatformData = async () => {
    setLoading(true)
    setError(null)
    try {
      const agent = await createAuthAgent()
      if (!agent) {
        throw new Error('Authentication required. Please connect your wallet.')
      }
      
      const modelActor = createModelActor(agent)
      const econActor = createEconActor(agent as any)
      
      // Load model submissions and platform stats
      const [models, audit, stats] = await Promise.all([
        modelActor.list_models([]),
        modelActor.get_audit_log(),
        econActor.get_platform_stats(),
      ])

      // Process model submissions
      const submissions = (models as any[]).map((m: any) => ({
        model_id: m.model_id,
        source_model: m.source_model || 'Unknown',
        compression_ratio: m.compression_ratio || 0,
        capability_retention: m.capability_retention || 0,
        status: m.state?.pending ? 'pending' : m.state?.active ? 'approved' : 'rejected',
        submitted_by: m.submitted_by || 'Unknown',
        submitted_at: m.submitted_at || Date.now(),
        admin_notes: m.admin_notes,
      }))

      setPendingSubmissions(submissions.filter(s => s.status === 'pending'))
      setApprovedModels(submissions.filter(s => s.status === 'approved'))

      // Process platform stats
      setPlatformStats({
        total_models: submissions.length,
        active_models: submissions.filter(s => s.status === 'approved').length,
        pending_reviews: submissions.filter(s => s.status === 'pending').length,
        total_users: stats?.total_users || 0,
        active_subscriptions: stats?.active_subscriptions || 0,
        monthly_revenue: stats?.monthly_revenue || 0,
      })

    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load platform data')
    } finally {
      setLoading(false)
    }
  }

  const approveModel = async (modelId: string, notes?: string) => {
    try {
      const agent = await createAuthAgent()
      if (!agent) throw new Error('Authentication required')
      
      const modelActor = createModelActor(agent)
      await modelActor.activate_model({ 0: modelId })
      
      // Reload data
      await loadPlatformData()
    } catch (e: any) {
      setError(e?.message || 'Failed to approve model')
    }
  }

  const rejectModel = async (modelId: string, reason: string) => {
    try {
      const agent = await createAuthAgent()
      if (!agent) throw new Error('Authentication required')
      
      const modelActor = createModelActor(agent)
      await modelActor.deprecate_model({ 0: modelId })
      
      // Reload data
      await loadPlatformData()
    } catch (e: any) {
      setError(e?.message || 'Failed to reject model')
    }
  }

  const processNovaqModel = async (modelFile: File) => {
    setNovaqProcessing(true)
    setProcessingProgress(0)
    
    try {
      // Simulate NOVAQ processing steps
      const steps = [
        'Uploading model file...',
        'Running Distribution Normalization...',
        'Generating Multi-stage Vector Codebooks...',
        'Applying Teacher-guided Refinement...',
        'Validating compression results...',
        'Preparing for platform deployment...'
      ]
      
      for (let i = 0; i < steps.length; i++) {
        setProcessingProgress((i / steps.length) * 100)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      setProcessingProgress(100)
      await loadPlatformData()
    } catch (e: any) {
      setError(e?.message || 'NOVAQ processing failed')
    } finally {
      setNovaqProcessing(false)
      setProcessingProgress(0)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadPlatformData()
    }
  }, [isAdmin])

  if (!authChecked) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  
  if (!isWalletAvailable) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">OHMS Platform Curation</h1>
          <p className="text-textOnDark/70 mb-4">OISY wallet not available. Please open OISY wallet.</p>
        </Card>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">OHMS Platform Curation</h1>
          <p className="text-textOnDark/70 mb-4">Admin access required for platform curation.</p>
          <Button onClick={loadPlatformData}>Connect & Re-check</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">OHMS Platform Curation</h1>
          <p className="text-textOnDark/70">Admin-controlled model curation for OHMS platform</p>
        </div>
        <Button variant="outline" onClick={loadPlatformData} loading={loading}>Refresh</Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-8">
          {/* Platform Statistics */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Platform Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Total Models" value={String(platformStats.total_models)} />
              <Stat label="Active Models" value={String(platformStats.active_models)} />
              <Stat label="Pending Reviews" value={String(platformStats.pending_reviews)} />
              <Stat label="Total Users" value={String(platformStats.total_users)} />
              <Stat label="Active Subscriptions" value={String(platformStats.active_subscriptions)} />
              <Stat label="Monthly Revenue" value={`$${platformStats.monthly_revenue.toLocaleString()}`} />
            </div>
          </Card>

          {/* NOVAQ Processing */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">NOVAQ Model Processing</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".bin,.safetensors,.pt,.pth"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) processNovaqModel(file)
                  }}
                  disabled={novaqProcessing}
                  className="flex-1 p-2 border border-accentGold/30 rounded bg-primary/40 text-textOnDark"
                />
                {novaqProcessing && (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-textOnDark/70">Processing...</span>
                  </div>
                )}
              </div>
              
              {novaqProcessing && (
                <div className="w-full bg-primary/40 rounded-full h-2">
                  <div 
                    className="bg-accentGold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              )}
              
              <p className="text-sm text-textOnDark/60">
                Process NOVAQ-compressed models for OHMS platform inclusion. 
                Models will be validated and curated before user access.
              </p>
            </div>
          </Card>

          {/* Pending Model Reviews */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Pending Model Reviews</h3>
            {pendingSubmissions.length === 0 ? (
              <p className="text-textOnDark/60 text-center py-8">No pending model reviews</p>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.model_id} className="p-4 bg-primary/40 rounded border border-accentGold/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-textOnDark">{submission.model_id}</h4>
                      <Badge variant="warning" size="sm">Pending Review</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-textOnDark/60">Source:</span>
                        <span className="ml-2 text-textOnDark">{submission.source_model}</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Compression:</span>
                        <span className="ml-2 text-textOnDark">{submission.compression_ratio.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Retention:</span>
                        <span className="ml-2 text-textOnDark">{submission.capability_retention.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Submitted:</span>
                        <span className="ml-2 text-textOnDark">{new Date(submission.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveModel(submission.model_id)}
                        disabled={loading}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => rejectModel(submission.model_id, 'Quality standards not met')}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Approved Models */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Approved Models</h3>
            {approvedModels.length === 0 ? (
              <p className="text-textOnDark/60 text-center py-8">No approved models</p>
            ) : (
              <div className="space-y-4">
                {approvedModels.map((model) => (
                  <div key={model.model_id} className="p-4 bg-primary/40 rounded border border-accentGold/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-textOnDark">{model.model_id}</h4>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-textOnDark/60">Source:</span>
                        <span className="ml-2 text-textOnDark">{model.source_model}</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Compression:</span>
                        <span className="ml-2 text-textOnDark">{model.compression_ratio.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Retention:</span>
                        <span className="ml-2 text-textOnDark">{model.capability_retention.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Available to Users:</span>
                        <span className="ml-2 text-textOnDark">Yes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 bg-primary/40 rounded border border-accentGold/20">
    <p className="text-sm text-textOnDark/60">{label}</p>
    <p className="text-textOnDark font-semibold">{value}</p>
  </div>
)

export default AdminNovaq
