import React, { useState, useEffect } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import Card from './Card'
import Badge from './Badge'

interface PerformanceMetrics {
  agent_creation_time: number
  model_compression_ratio: number
  platform_response_time: number
  autonomous_uptime: number
  novaq_efficiency: number
  user_count: number
  agents_created_daily: number
  revenue_mrr: number
  retention_rate: number
  satisfaction_score: number
}

interface AgentPerformance {
  agent_id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'error'
  tasks_completed: number
  success_rate: number
  avg_response_time: number
  resource_usage: number
  last_activity: string
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
  component: string
}

const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  target, 
  status 
}: { 
  title: string
  value: number | string
  unit?: string
  target?: number
  status?: 'good' | 'warning' | 'error'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-400 border-green-400/30'
      case 'warning': return 'text-yellow-400 border-yellow-400/30'
      case 'error': return 'text-red-400 border-red-400/30'
      default: return 'text-accentGold border-accentGold/30'
    }
  }

  return (
    <div className={`p-4 bg-primary/40 rounded border ${getStatusColor()}`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm opacity-60">{unit}</span>
      </div>
      {target && (
        <div className="mt-1 text-xs opacity-60">
          Target: {target}{unit}
        </div>
      )}
    </div>
  )
}

const AgentPerformanceCard = ({ agent }: { agent: AgentPerformance }) => {
  const getStatusBadge = () => {
    switch (agent.status) {
      case 'active': return <Badge variant="success" size="sm">Active</Badge>
      case 'idle': return <Badge variant="warning" size="sm">Idle</Badge>
      case 'error': return <Badge variant="error" size="sm">Error</Badge>
    }
  }

  return (
    <div className="p-4 bg-primary/20 rounded border border-accentGold/20">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-textOnDark">{agent.name}</h4>
        {getStatusBadge()}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-textOnDark/60">Type:</span>
          <span className="ml-2 text-textOnDark">{agent.type}</span>
        </div>
        <div>
          <span className="text-textOnDark/60">Tasks:</span>
          <span className="ml-2 text-textOnDark">{agent.tasks_completed}</span>
        </div>
        <div>
          <span className="text-textOnDark/60">Success:</span>
          <span className="ml-2 text-textOnDark">{agent.success_rate}%</span>
        </div>
        <div>
          <span className="text-textOnDark/60">Response:</span>
          <span className="ml-2 text-textOnDark">{agent.avg_response_time}ms</span>
        </div>
      </div>
    </div>
  )
}

export const RealTimePerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [agents, setAgents] = useState<AgentPerformance[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAdmin()

  // Simulate real-time data updates
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // In real implementation, these would be actual API calls
        const mockMetrics: PerformanceMetrics = {
          agent_creation_time: Math.random() * 25 + 5, // 5-30 seconds
          model_compression_ratio: Math.random() * 7 + 93, // 93-100x
          platform_response_time: Math.random() * 1 + 1, // 1-2 seconds
          autonomous_uptime: 99.5 + Math.random() * 0.4, // 99.5-99.9%
          novaq_efficiency: Math.random() * 2 + 8, // 8-10x throughput
          user_count: Math.floor(Math.random() * 500 + 1000), // 1000-1500
          agents_created_daily: Math.floor(Math.random() * 5000 + 8000), // 8000-13000
          revenue_mrr: Math.floor(Math.random() * 20000 + 40000), // 40K-60K
          retention_rate: 75 + Math.random() * 15, // 75-90%
          satisfaction_score: 4.2 + Math.random() * 0.6, // 4.2-4.8
        }

        const mockAgents: AgentPerformance[] = [
          {
            agent_id: 'agent-001',
            name: 'Python Code Assistant',
            type: 'code',
            status: 'active',
            tasks_completed: 247,
            success_rate: 96.8,
            avg_response_time: 850,
            resource_usage: 23.5,
            last_activity: '2 minutes ago'
          },
          {
            agent_id: 'agent-002', 
            name: 'Data Analysis Agent',
            type: 'data',
            status: 'active',
            tasks_completed: 189,
            success_rate: 94.2,
            avg_response_time: 1200,
            resource_usage: 31.8,
            last_activity: '5 minutes ago'
          },
          {
            agent_id: 'agent-003',
            name: 'Content Writer',
            type: 'content',
            status: 'idle',
            tasks_completed: 156,
            success_rate: 98.1,
            avg_response_time: 650,
            resource_usage: 12.3,
            last_activity: '18 minutes ago'
          }
        ]

        const mockAlerts: SystemAlert[] = []
        
        // Add alerts for poor performance
        if (mockMetrics.platform_response_time > 2.5) {
          mockAlerts.push({
            id: 'alert-001',
            type: 'warning',
            message: 'Platform response time above target (>3s)',
            timestamp: new Date().toISOString(),
            component: 'UI Backend'
          })
        }

        if (mockMetrics.autonomous_uptime < 99) {
          mockAlerts.push({
            id: 'alert-002',
            type: 'error',
            message: 'Autonomous agent uptime below threshold (<99%)',
            timestamp: new Date().toISOString(),
            component: 'Agent Coordinator'
          })
        }

        setMetrics(mockMetrics)
        setAgents(mockAgents)
        setAlerts(mockAlerts)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accentGold mx-auto"></div>
        <p className="mt-2 text-textOnDark/60">Loading performance metrics...</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <p className="text-textOnDark/60">Failed to load performance metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <h2 className="text-lg font-semibold text-red-400 mb-4">System Alerts</h2>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-red-500/20 rounded">
                <Badge variant="error" size="sm">{alert.type.toUpperCase()}</Badge>
                <div className="flex-1">
                  <p className="text-red-300">{alert.message}</p>
                  <p className="text-xs text-red-400/60">{alert.component} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technical Performance Metrics */}
      <Card>
        <h2 className="text-lg font-semibold text-accentGold mb-4">Technical Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Agent Creation Time"
            value={metrics.agent_creation_time.toFixed(1)}
            unit="s"
            target={30}
            status={metrics.agent_creation_time <= 30 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Model Compression"
            value={metrics.model_compression_ratio.toFixed(0)}
            unit="x"
            target={93}
            status={metrics.model_compression_ratio >= 93 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Platform Response"
            value={metrics.platform_response_time.toFixed(1)}
            unit="s"
            target={3}
            status={metrics.platform_response_time <= 3 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Autonomous Uptime"
            value={metrics.autonomous_uptime.toFixed(1)}
            unit="%"
            target={99.9}
            status={metrics.autonomous_uptime >= 99.9 ? 'good' : metrics.autonomous_uptime >= 99 ? 'warning' : 'error'}
          />
          <MetricCard
            title="NOVAQ Efficiency"
            value={metrics.novaq_efficiency.toFixed(1)}
            unit="x throughput"
            target={10}
            status={metrics.novaq_efficiency >= 10 ? 'good' : 'warning'}
          />
        </div>
      </Card>

      {/* Business Performance Metrics */}
      <Card>
        <h2 className="text-lg font-semibold text-accentGold mb-4">Business Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Active Users"
            value={metrics.user_count}
            target={1000}
            status={metrics.user_count >= 1000 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Agents Created Daily"
            value={metrics.agents_created_daily}
            target={10000}
            status={metrics.agents_created_daily >= 10000 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Monthly Recurring Revenue"
            value={`$${(metrics.revenue_mrr / 1000).toFixed(0)}K`}
            target={50}
            status={metrics.revenue_mrr >= 50000 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Retention Rate"
            value={metrics.retention_rate.toFixed(1)}
            unit="%"
            target={80}
            status={metrics.retention_rate >= 80 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Satisfaction Score"
            value={metrics.satisfaction_score.toFixed(1)}
            unit="/5"
            target={4.5}
            status={metrics.satisfaction_score >= 4.5 ? 'good' : 'warning'}
          />
        </div>
      </Card>

      {/* Agent Performance */}
      <Card>
        <h2 className="text-lg font-semibold text-accentGold mb-4">Agent Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <AgentPerformanceCard key={agent.agent_id} agent={agent} />
          ))}
        </div>
      </Card>

      {/* Real-time Updates Indicator */}
      <div className="text-center text-sm text-textOnDark/60">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Real-time monitoring active • Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default RealTimePerformanceMonitor