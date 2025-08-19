import React, { useState, useEffect } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import AdminRoute from '../components/AdminRoute'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { RealTimePerformanceMonitor } from '../components/PerformanceMonitor'
import { AgentAdminMetrics, ModelAdminMetrics, EconomicsAdminMetrics, SystemHealthBanner } from '../components/AdminMetrics'

interface PlatformAnalytics {
  user_journey: {
    signup_to_first_agent: number
    instruction_to_agent_creation: number
    agent_creation_success_rate: number
    upgrade_conversion_rate: number
  }
  resource_utilization: {
    cpu_usage: number
    memory_usage: number
    storage_usage: number
    network_bandwidth: number
  }
  quality_metrics: {
    instruction_analysis_accuracy: number
    agent_task_success_rate: number
    model_inference_accuracy: number
    user_satisfaction_score: number
  }
  cost_efficiency: {
    cost_per_agent_creation: number
    cost_per_inference: number
    storage_cost_per_gb: number
    total_operational_cost: number
  }
}

const AnalyticsCard = ({ 
  title, 
  metrics, 
  icon 
}: { 
  title: string
  metrics: Record<string, number | string>
  icon: string 
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-semibold text-accentGold">{title}</h3>
    </div>
    <div className="space-y-3">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center">
          <span className="text-sm text-textOnDark/70 capitalize">
            {key.replace(/_/g, ' ')}:
          </span>
          <span className="text-textOnDark font-medium">
            {typeof value === 'number' ? 
              (key.includes('rate') || key.includes('accuracy') || key.includes('score') ? 
                `${value.toFixed(1)}%` : 
                key.includes('cost') ? 
                  `$${value.toFixed(4)}` :
                  key.includes('time') ?
                    `${value.toFixed(1)}s` :
                    value.toFixed(1)
              ) : 
              value
            }
          </span>
        </div>
      ))}
    </div>
  </Card>
)

export const PerformanceDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { isAdmin, refreshAdminData } = useAdmin()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Mock analytics data - in real implementation would be API calls
        const mockAnalytics: PlatformAnalytics = {
          user_journey: {
            signup_to_first_agent: 4.2 + Math.random() * 1, // 4-5 minutes
            instruction_to_agent_creation: 25 + Math.random() * 10, // 25-35 seconds
            agent_creation_success_rate: 95 + Math.random() * 4, // 95-99%
            upgrade_conversion_rate: 15 + Math.random() * 10, // 15-25%
          },
          resource_utilization: {
            cpu_usage: 45 + Math.random() * 20, // 45-65%
            memory_usage: 60 + Math.random() * 15, // 60-75%
            storage_usage: 35 + Math.random() * 25, // 35-60%
            network_bandwidth: 70 + Math.random() * 20, // 70-90%
          },
          quality_metrics: {
            instruction_analysis_accuracy: 92 + Math.random() * 6, // 92-98%
            agent_task_success_rate: 88 + Math.random() * 10, // 88-98%
            model_inference_accuracy: 96 + Math.random() * 3, // 96-99%
            user_satisfaction_score: 4.2 + Math.random() * 0.6, // 4.2-4.8/5
          },
          cost_efficiency: {
            cost_per_agent_creation: 0.15 + Math.random() * 0.1, // $0.15-0.25
            cost_per_inference: 0.002 + Math.random() * 0.003, // $0.002-0.005
            storage_cost_per_gb: 0.023 + Math.random() * 0.007, // $0.023-0.030
            total_operational_cost: 1250 + Math.random() * 500, // $1250-1750
          }
        }

        setAnalytics(mockAnalytics)
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleExportMetrics = async () => {
    setExportLoading(true)
    try {
      // Mock export - in real implementation would generate and download CSV/PDF
      const exportData = {
        timestamp: new Date().toISOString(),
        performance_metrics: analytics,
        system_status: 'operational',
        export_format: 'csv'
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ohms-performance-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export metrics:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleRefreshAll = async () => {
    await refreshAdminData()
    setLastUpdate(new Date())
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-backgroundDark text-textOnDark p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-accentGold">Performance Dashboard</h1>
              <p className="mt-2 text-textOnDark/70">
                Real-time monitoring and analytics for OHMS 2.0 platform
              </p>
              <p className="text-sm text-textOnDark/50">
                Last updated: {lastUpdate.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                size="sm"
                className="border-accentGold/30 text-accentGold hover:bg-accentGold/10"
              >
                Refresh All
              </Button>
              <Button
                onClick={handleExportMetrics}
                disabled={exportLoading}
                size="sm"
                className="bg-accentGold text-backgroundDark hover:bg-accentGold/90"
              >
                {exportLoading ? 'Exporting...' : 'Export Report'}
              </Button>
            </div>
          </div>

          {/* System Health Banner */}
          <SystemHealthBanner />

          {/* Real-time Performance Monitor */}
          <div className="mb-8">
            <RealTimePerformanceMonitor />
          </div>

          {/* Admin Metrics Components */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <AgentAdminMetrics />
            <ModelAdminMetrics />
            <EconomicsAdminMetrics />
          </div>

          {/* Detailed Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsCard
                title="User Journey Analytics"
                metrics={{
                  'signup_to_first_agent': analytics.user_journey.signup_to_first_agent,
                  'instruction_to_agent_creation': analytics.user_journey.instruction_to_agent_creation,
                  'agent_creation_success_rate': analytics.user_journey.agent_creation_success_rate,
                  'upgrade_conversion_rate': analytics.user_journey.upgrade_conversion_rate
                }}
                icon="📊"
              />
              
              <AnalyticsCard
                title="Resource Utilization"
                metrics={{
                  'cpu_usage': analytics.resource_utilization.cpu_usage,
                  'memory_usage': analytics.resource_utilization.memory_usage,
                  'storage_usage': analytics.resource_utilization.storage_usage,
                  'network_bandwidth': analytics.resource_utilization.network_bandwidth
                }}
                icon="⚡"
              />
              
              <AnalyticsCard
                title="Quality Metrics"
                metrics={{
                  'instruction_analysis_accuracy': analytics.quality_metrics.instruction_analysis_accuracy,
                  'agent_task_success_rate': analytics.quality_metrics.agent_task_success_rate,
                  'model_inference_accuracy': analytics.quality_metrics.model_inference_accuracy,
                  'user_satisfaction_score': analytics.quality_metrics.user_satisfaction_score
                }}
                icon="🎯"
              />
              
              <AnalyticsCard
                title="Cost Efficiency"
                metrics={{
                  'cost_per_agent_creation': analytics.cost_efficiency.cost_per_agent_creation,
                  'cost_per_inference': analytics.cost_efficiency.cost_per_inference,
                  'storage_cost_per_gb': analytics.cost_efficiency.storage_cost_per_gb,
                  'total_operational_cost': analytics.cost_efficiency.total_operational_cost
                }}
                icon="💰"
              />
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-textOnDark/50">
            <p>OHMS 2.0 Performance Dashboard • Real-time monitoring active</p>
            <p className="mt-1">
              Platform Status: <Badge variant="success" size="sm">Operational</Badge>
            </p>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}

export default PerformanceDashboard