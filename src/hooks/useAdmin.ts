import { useAgent } from '../context/AgentContext'

export const useAdmin = () => {
  const { isAdmin, adminData, refreshAdminData, checkAdminStatus } = useAgent()
  
  return {
    isAdmin,
    adminData,
    refreshAdminData,
    checkAdminStatus,
    
    // Convenience getters for specific admin data
    systemHealth: adminData?.health || null,
    modelStats: adminData?.modelStats || { total: 0, active: 0, pending: 0, deprecated: 0 },
    agentHealth: adminData?.agentHealth || null,
    routingHealth: adminData?.routingHealth || null,
    econHealth: adminData?.econHealth || null,
    
    // System status helpers
    isSystemHealthy: () => {
      if (!adminData?.health) return null
      const { model, agent, coordinator, econ } = adminData.health
      return !!(model && agent && coordinator && econ)
    },
    
    getSystemAlerts: (): Array<{type: string, message: string}> => {
      const alerts: Array<{type: string, message: string}> = []
      if (!adminData?.health) return alerts
      
      const { health } = adminData
      if (!health.model) alerts.push({ type: 'error', message: 'Model service down' })
      if (!health.agent) alerts.push({ type: 'error', message: 'Agent service down' })
      if (!health.coordinator) alerts.push({ type: 'error', message: 'Coordinator service down' })
      if (!health.econ) alerts.push({ type: 'error', message: 'Economics service down' })
      
      return alerts
    }
  }
}