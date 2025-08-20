import { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import { isBraveBrowser } from '../utils/walletErrorHandler'
import Modal from './Modal'
import Button from './Button'
import LoadingSpinner from './LoadingSpinner'
import WalletConnectionError from './WalletConnectionError'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectMessage?: string
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  redirectMessage = "You need to connect your Oisy wallet to access this page."
}) => {
  const { isWalletAvailable, isConnecting, connect } = useAgent()
  const [error, setError] = useState<string>('')
  const [showErrorModal, setShowErrorModal] = useState(false)

  const handleConnect = async () => {
    try {
      setError('')
      const connected = await connect()
      if (connected) {
        onClose()
      }
    } catch (err: any) {
      // Check if it's a classified wallet error (with better error handling)
      if (err?.type && err?.message) {
        // This is a classified wallet error - show the enhanced error modal
        setShowErrorModal(true)
      } else {
        // Fallback to simple error display
        const errorMessage = err.message || 'Failed to connect to wallet'
        setError(errorMessage)
      }
    }
  }

  const handleOpenOisy = () => {
    window.open('https://oisy.com', '_blank')
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-accentGold/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-accentGold" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-accentGold mb-2">
            Authentication Required
          </h3>
          
          <p className="text-textOnDark/70 mb-6">
            {redirectMessage}
          </p>

          {/* Browser-specific notice */}
          {isBraveBrowser() && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-blue-300 text-sm font-medium">Brave Browser Detected</p>
              </div>
              <p className="text-blue-200 text-xs">
                If connection fails, try disabling Shields for this site (click the shield icon in address bar).
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

        {!isWalletAvailable ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm mb-2">
                🔌 Oisy wallet not available
              </p>
              <p className="text-textOnDark/60 text-xs mb-3">
                OISY wallet is required to access OHMS platform
              </p>
              <div className="text-textOnDark/50 text-xs space-y-1">
                <p>• Visit https://oisy.com to set up your wallet</p>
                <p>• Ensure OISY is open in another tab</p>
                <p>• Enable third-party cookies if needed</p>
              </div>
            </div>
            
            <Button 
              onClick={handleOpenOisy}
              className="w-full"
            >
              Open Oisy Wallet
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-accentGold/10 border border-accentGold/30 rounded-lg">
              <p className="text-textOnDark/80 text-sm mb-2">
                🔗 Ready to connect with Oisy wallet
              </p>
              <p className="text-textOnDark/60 text-xs">
                This will open a popup to authorize the connection
              </p>
            </div>

            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect Oisy Wallet'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
              disabled={isConnecting}
            >
              Cancel
            </Button>
          </div>
        )}

          <div className="mt-6 pt-4 border-t border-accentGold/20">
            <p className="text-xs text-textOnDark/50">
              Your connection will be remembered for future visits
            </p>
          </div>
        </div>
      </Modal>

      {/* Enhanced error modal for wallet connection issues */}
      <WalletConnectionError
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={handleConnect}
      />
    </>
  )
}

export default AuthModal