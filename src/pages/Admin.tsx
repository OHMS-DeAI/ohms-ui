import { useEffect, useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'
import {
  createModelActor,
  createAgentActor,
  createCoordinatorActor,
  createEconActor,
} from '../services/canisterService'

type HealthStatuses = {
  model: any
  agent: any
  coordinator: any
  econ: any
}

const Admin = () => {
  const { isPlugAvailable, createPlugAgent } = useAgent()
  // For now, assume anyone with Plug is admin - real role check would require authentication
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [health, setHealth] = useState<HealthStatuses | null>(null)
  const [modelStats, setModelStats] = useState<{ total: number; active: number; pending: number; deprecated: number }>({ total: 0, active: 0, pending: 0, deprecated: 0 })
  const [audit, setAudit] = useState<any[]>([])

  const [agentHealth, setAgentHealth] = useState<any>(null)
  const [loaderStats, setLoaderStats] = useState<any>(null)

  const [routingHealth, setRoutingHealth] = useState<any>(null)
  const [routingStats, setRoutingStats] = useState<any[]>([])

  const [econHealth, setEconHealth] = useState<any>(null)
  const [policy, setPolicy] = useState<any>(null)
  const [admins, setAdmins] = useState<string[]>([])

  // Check admin status when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isPlugAvailable) {
        setAuthChecked(true)
        return
      }
      
      try {
        const principal = await createPlugAgent()
        if (principal) {
          // For demo, assume authenticated users are admin
          // In production, you'd check against a list of admin principals
          setIsAdmin(true)
          setAuthChecked(true)
        }
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setAuthChecked(true)
      }
    }
    
    checkAdminStatus()
  }, [isPlugAvailable, createPlugAgent])

  const refreshAll = async () => {
    setLoading(true)
    setError(null)
    try {
      // Create authenticated agent when needed
      const plugAgent = await createPlugAgent()
      if (!plugAgent) {
        throw new Error('Authentication required. Please connect with Plug wallet.')
      }
      
      // Model - use authenticated agent
      const modelActor = createModelActor(plugAgent)
      const agentActor = createAgentActor(plugAgent as any) 
      const coordinatorActor = createCoordinatorActor(plugAgent as any)
      const econActor = createEconActor(plugAgent as any)
      
      const [models, modelAudit] = await Promise.all([
        modelActor.list_models([]),
        modelActor.get_audit_log(),
      ])
      const list = models as any[]
      const counts = list.reduce((acc: any, m: any) => {
        acc.total += 1
        const st = Object.keys(m.state || {})[0] || 'Pending'
        acc[st.toLowerCase()] = (acc[st.toLowerCase()] || 0) + 1
        return acc
      }, { total: 0, active: 0, pending: 0, deprecated: 0 })
      setModelStats(counts)
      setAudit((modelAudit as any[]).slice(-10).reverse())

      // Agent
      const ah = await agentActor.health()
      setAgentHealth(ah)
      try {
        const ls: any = await agentActor.get_loader_stats()
        // get_loader_stats in agent API is Result<String, String> in our IDL mapping
        if (ls && typeof ls === 'object' && 'Ok' in ls) {
          const val = (ls as any).Ok
          setLoaderStats(typeof val === 'string' ? JSON.parse(val) : val)
        } else if (typeof ls === 'string') {
          setLoaderStats(JSON.parse(ls))
        }
      } catch {}

      // Coordinator
      const ch = await coordinatorActor.health()
      setRoutingHealth(ch)
      try {
        const rs: any = await coordinatorActor.get_routing_stats([])
        if (rs && 'Ok' in rs) setRoutingStats(rs.Ok as any[])
        else setRoutingStats([])
      } catch {}

      // Econ
      const [eh, pol, adms] = await Promise.all([
        econActor.health(),
        econActor.policy(),
        econActor.list_admins(),
      ])
      setEconHealth(eh)
      setPolicy(pol)
      setAdmins(adms as any[])

      setHealth({ model: 'OK', agent: ah, coordinator: ch, econ: eh })
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  
  if (!isPlugAvailable) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Admin</h1>
          <p className="text-textOnDark/70 mb-4">Plug wallet not found. Please install Plug wallet extension.</p>
        </Card>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Admin</h1>
          <p className="text-textOnDark/70 mb-4">Authentication required to access admin panel.</p>
          <Button onClick={refreshAll}>Connect & Access Admin</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">Admin Dashboards</h1>
          <p className="text-textOnDark/70">Operations • Finance • Catalog Admin</p>
        </div>
        <Button variant="outline" onClick={refreshAll} loading={loading}>Refresh</Button>
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
          {/* Health Overview */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Health Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Model', ok: !!health?.model },
                { name: 'Agent', ok: !!health?.agent },
                { name: 'Coordinator', ok: !!health?.coordinator },
                { name: 'Economics', ok: !!health?.econ },
              ].map((h) => (
                <div key={h.name} className="p-3 bg-primary/40 rounded border border-accentGold/20 flex items-center justify-between">
                  <span className="text-textOnDark/80">{h.name}</span>
                  <Badge variant={h.ok ? 'success' : 'error'} size="sm">{h.ok ? 'OK' : 'Down'}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Ops Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-accentGold mb-4">Agent Ops</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Stat label="Model Bound" value={String(agentHealth?.model_bound ?? false)} />
                <Stat label="Queue Depth" value={String(agentHealth?.queue_depth ?? 0)} />
                <Stat label="Cache Hit Rate" value={`${(agentHealth?.cache_hit_rate ?? 0).toFixed?.(2) ?? 0}%`} />
                <Stat label="Warm Set Utilization" value={`${(agentHealth?.warm_set_utilization ?? 0).toFixed?.(2) ?? 0}%`} />
              </div>
              {loaderStats && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <Stat label="Chunks Loaded" value={`${loaderStats.chunks_loaded}/${loaderStats.total_chunks}`} />
                  <Stat label="Cache Entries" value={String(loaderStats.cache_entries)} />
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-accentGold mb-4">Routing & Swarm</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Stat label="Total Agents" value={String(routingHealth?.total_agents ?? 0)} />
                <Stat label="Active Agents" value={String(routingHealth?.active_agents ?? 0)} />
                <Stat label="Total Bounties" value={String(routingHealth?.total_bounties ?? 0)} />
                <Stat label="Active Bounties" value={String(routingHealth?.active_bounties ?? 0)} />
              </div>
              {routingStats?.length > 0 && (
                <div className="mt-4 text-sm">
                  <p className="text-textOnDark/70 mb-1">Top Agent Stats</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {routingStats.slice(0, 5).map((s: any) => (
                      <div key={s.agent_id} className="flex justify-between bg-primary/40 rounded px-2 py-1 border border-accentGold/20">
                        <span className="truncate mr-3">{s.agent_id}</span>
                        <span>{(s.success_rate * 100).toFixed(1)}% • {s.total_requests} req</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Finance Dashboard */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Finance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Stat label="Total Volume" value={String(econHealth?.total_volume ?? 0)} />
              <Stat label="Protocol Fees" value={String(econHealth?.protocol_fees_collected ?? 0)} />
              <Stat label="Active Escrows" value={String(econHealth?.active_escrows ?? 0)} />
              <Stat label="Avg Job Cost" value={String(econHealth?.average_job_cost ?? 0)} />
            </div>
            {policy && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Stat label="Protocol Fee %" value={`${policy.protocol_fee_percentage}%`} />
                <Stat label="Agent Fee %" value={`${policy.agent_fee_percentage}%`} />
                <Stat label="Min Fee" value={String(policy.minimum_fee)} />
                <Stat label="Admins" value={String(admins.length)} />
              </div>
            )}
          </Card>

          {/* Catalog Admin */}
          <Card>
            <h3 className="text-lg font-semibold text-accentGold mb-4">Catalog Admin</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <Stat label="Total Models" value={String(modelStats.total)} />
              <Stat label="Active" value={String(modelStats.active)} />
              <Stat label="Pending" value={String(modelStats.pending)} />
              <Stat label="Deprecated" value={String(modelStats.deprecated)} />
            </div>
            <div>
              <p className="text-textOnDark/70 mb-2">Recent Audit Events</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {audit.map((e: any, idx: number) => (
                  <div key={idx} className="text-sm bg-primary/40 border border-accentGold/20 rounded px-3 py-2">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs">{e.model_id}</span>
                      <span className="text-textOnDark/60 text-xs">{new Date(Number(e.timestamp || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-textOnDark/80">{Object.keys(e.event_type || {})[0]}</span>
                      <span className="text-textOnDark/60 truncate ml-3">{e.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

export default Admin


