import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAgent } from '../context/AgentContext'
import AuthModal from './AuthModal'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, isConnecting } = useAgent()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // If user is not connected and not connecting, show auth modal
    if (!isConnecting && !isConnected && location.pathname !== '/') {
      console.log('🔒 Protected route access requires authentication')
      setShowAuthModal(true)
    } else if (isConnected) {
      setShowAuthModal(false)
    }
  }, [isConnected, isConnecting, location.pathname])

  // Show loading while connecting
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-textOnDark/70 mt-4">Connecting to wallet...</p>
        </div>
      </div>
    )
  }

  // If on home page, always allow access
  if (location.pathname === '/') {
    return <>{children}</>
  }

  // For protected routes, show auth modal if not connected
  if (!isConnected) {
    const handleModalClose = () => {
      setShowAuthModal(false)
      // Only redirect to home if user is still not connected (cancelled modal)
      if (!isConnected) {
        navigate('/', { replace: true })
      }
    }

    return (
      <>
        {/* Show auth modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={handleModalClose}
          redirectMessage={`Connect your Oisy wallet to access ${getPageName(location.pathname)}.`}
        />
        
        {/* Show a placeholder while modal is open */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-textOnDark/50">Authentication required...</p>
          </div>
        </div>
      </>
    )
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

// Helper function to get user-friendly page names
const getPageName = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/starter-packs': 'Starter Packs',
    '/wizard': 'AI Wizard', 
    '/models': 'Model Catalog',
    '/agents': 'Agents Console',
    '/bounties': 'Bounties',
    '/economics': 'Economics',
    '/receipts': 'Receipts',
    '/verify': 'Verify'
  }
  
  return routes[pathname] || 'this page'
}

export default ProtectedRoute