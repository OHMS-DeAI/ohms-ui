import { useAgent } from '../context/AgentContext'
import { getUserFriendlyErrorMessage, getBrowserGuidance, isBraveBrowser } from '../utils/walletErrorHandler'
import Modal from './Modal'
import Button from './Button'

interface WalletConnectionErrorProps {
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
}

const WalletConnectionError = ({ isOpen, onClose, onRetry }: WalletConnectionErrorProps) => {
  const { connectionError, clearConnectionError } = useAgent()

  if (!connectionError) return null

  const handleClose = () => {
    clearConnectionError()
    onClose()
  }

  const handleRetry = () => {
    clearConnectionError()
    onRetry?.()
  }

  const userMessage = getUserFriendlyErrorMessage(connectionError)
  const browserGuidance = getBrowserGuidance()
  const isBrave = isBraveBrowser()

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Wallet Connection Issue">
      <div className="space-y-4">
        {/* Error Message */}
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <h4 className="font-medium text-red-300">Connection Failed</h4>
          </div>
          <p className="text-sm text-red-200">{userMessage}</p>
        </div>

        {/* Browser-Specific Guidance */}
        <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <h4 className="font-medium text-blue-300">{isBrave ? 'Brave Browser Detected' : 'Browser Guidance'}</h4>
          </div>
          <p className="text-sm text-blue-200 mb-3">{browserGuidance}</p>
          
          {isBrave && (
            <div className="text-xs text-blue-300 space-y-1">
              <p><strong>Steps for Brave:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-blue-200">
                <li>Click the Shield icon in the address bar</li>
                <li>Toggle "Shields Down" for this site</li>
                <li>Or go to Settings {'>'} Privacy {'>'} Third-party cookies and enable for this site</li>
                <li>Refresh the page and try connecting again</li>
              </ol>
            </div>
          )}
        </div>

        {/* Technical Details (for developers) */}
        {import.meta.env.DEV && (
          <details className="p-4 bg-gray-800 rounded-lg">
            <summary className="text-xs text-gray-400 cursor-pointer mb-2">
              Technical Details (Development Mode)
            </summary>
            <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  errorType: connectionError.type,
                  message: connectionError.message,
                  retryable: connectionError.retryable,
                  originalError: connectionError.originalError?.message
                },
                null,
                2
              )}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {connectionError.retryable && (
            <Button
              onClick={handleRetry}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Try Again
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default WalletConnectionError