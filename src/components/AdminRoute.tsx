import { useEffect, useState } from 'react'
import { useAgent } from '../context/AgentContext'
import LoadingSpinner from './LoadingSpinner'
import Card from './Card'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isWalletAvailable, createAuthAgent, isAdmin: hasAdminRole, checkAdminStatus } = useAgent()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isWalletAvailable) {

        setLoading(false)
        return
      }
      
      try {
        await createAuthAgent()
        const admin = await checkAdminStatus()
        setIsAdmin(admin || hasAdminRole)
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    
    verifyAdminAccess()
  }, [isWalletAvailable, createAuthAgent, hasAdminRole, checkAdminStatus])

  if (loading) {
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
          <h1 className="text-3xl font-bold text-accentGold mb-4">Admin Access Required</h1>
          <p className="text-textOnDark/70 mb-4">OISY wallet not available. Please open OISY wallet.</p>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Admin Access Required</h1>
          <p className="text-textOnDark/70 mb-4">You do not have admin privileges to access this page.</p>
          <p className="text-textOnDark/60 text-sm">Please contact the platform administrator if you believe this is an error.</p>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute
