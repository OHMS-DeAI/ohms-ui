import { useAdmin } from '../hooks/useAdmin'
import AdminOnly from './AdminOnly'
import Card from './Card'
import Badge from './Badge'

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 bg-primary/40 rounded border border-accentGold/20">
    <p className="text-sm text-textOnDark/60">{label}</p>
    <p className="text-textOnDark font-semibold">{value}</p>
  </div>
)

export const AgentAdminMetrics = () => {
  const { agentHealth, routingHealth, refreshAdminData } = useAdmin()

  return (
    <AdminOnly>
      <Card className="mt-4 border-accentGold/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accentGold">Admin: Agent Operations</h3>
          <button 
            onClick={refreshAdminData}
            className="text-xs text-accentGold hover:text-accentGold/80 transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {agentHealth && (
            <>
              <Stat label="Queue Depth" value={String(agentHealth.queue_depth ?? 0)} />
              <Stat label="Cache Hit Rate" value={`${(agentHealth.cache_hit_rate ?? 0).toFixed?.(2) ?? 0}%`} />
              <Stat label="Warm Set" value={`${(agentHealth.warm_set_utilization ?? 0).toFixed?.(2) ?? 0}%`} />
              <Stat label="Model Bound" value={String(agentHealth.model_bound ?? false)} />
            </>
          )}
          {routingHealth && (
            <>
              <Stat label="Total Agents" value={String(routingHealth.total_agents ?? 0)} />
              <Stat label="Active Agents" value={String(routingHealth.active_agents ?? 0)} />
              <Stat label="Total Bounties" value={String(routingHealth.total_bounties ?? 0)} />
              <Stat label="Active Bounties" value={String(routingHealth.active_bounties ?? 0)} />
            </>
          )}
        </div>
      </Card>
    </AdminOnly>
  )
}

export const ModelAdminMetrics = () => {
  const { modelStats, refreshAdminData } = useAdmin()

  return (
    <AdminOnly>
      <Card className="mt-4 border-accentGold/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accentGold">Admin: Model Statistics</h3>
          <button 
            onClick={refreshAdminData}
            className="text-xs text-accentGold hover:text-accentGold/80 transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total Models" value={String(modelStats.total)} />
          <Stat label="Active" value={String(modelStats.active)} />
          <Stat label="Pending" value={String(modelStats.pending)} />
          <Stat label="Deprecated" value={String(modelStats.deprecated)} />
        </div>
      </Card>
    </AdminOnly>
  )
}

export const EconomicsAdminMetrics = () => {
  const { econHealth, refreshAdminData } = useAdmin()

  return (
    <AdminOnly>
      <Card className="mt-4 border-accentGold/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accentGold">Admin: Economics Overview</h3>
          <button 
            onClick={refreshAdminData}
            className="text-xs text-accentGold hover:text-accentGold/80 transition-colors"
          >
            Refresh
          </button>
        </div>
        {econHealth && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total Volume" value={String(econHealth.total_volume ?? 0)} />
            <Stat label="Protocol Fees" value={String(econHealth.protocol_fees_collected ?? 0)} />
            <Stat label="Active Escrows" value={String(econHealth.active_escrows ?? 0)} />
            <Stat label="Avg Job Cost" value={String(econHealth.average_job_cost ?? 0)} />
          </div>
        )}
      </Card>
    </AdminOnly>
  )
}

export const SystemHealthBanner = () => {
  const { isAdmin, getSystemAlerts } = useAdmin()

  if (!isAdmin) return null

  const alerts = getSystemAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Badge variant="error" size="sm">System Alert</Badge>
        <span className="text-sm text-red-300">
          {alerts.length} service{alerts.length > 1 ? 's' : ''} experiencing issues
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {alerts.map((alert, idx) => (
          <div key={idx} className="text-xs text-red-300">
            • {alert.message}
          </div>
        ))}
      </div>
    </div>
  )
}