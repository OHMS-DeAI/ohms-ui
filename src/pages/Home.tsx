import { useAgent } from '../context/AgentContext'
import { useEffect } from 'react'

const Home = () => {
  const { connect, disconnect, isConnected, canisterIds } = useAgent()
  // const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [isConnected, connect])

  const testConnection = async () => {
    try {
      // Test connection by calling health endpoints
      const response = await fetch(`http://127.0.0.1:4943/api/v2/canister/${canisterIds.ohms_model}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/cbor',
        },
        body: new Uint8Array([]),
      })
      console.log('Connection test:', response.ok)
    } catch (error) {
      console.error('Connection test failed:', error)
    }
  }

  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-accentGold mb-8">
        OHMS
      </h1>
      <p className="text-2xl text-textOnDark/80 mb-12 max-w-3xl mx-auto">
        On-Chain Hosting for Multi-Agent Systems
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h3 className="text-accentGold font-semibold mb-2">Adaptive Models</h3>
          <p className="text-textOnDark/80 text-sm">
            APQ-compressed neural models for efficient on-chain inference
          </p>
        </div>
        
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h3 className="text-accentGold font-semibold mb-2">Smart Agents</h3>
          <p className="text-textOnDark/80 text-sm">
            Deterministic AI agents with encrypted memory and caching
          </p>
        </div>
        
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h3 className="text-accentGold font-semibold mb-2">Coordination</h3>
          <p className="text-textOnDark/80 text-sm">
            Intelligent routing and bounty-based task distribution
          </p>
        </div>
        
        <div className="bg-primary/60 backdrop-blur-sm border border-accentGold/20 rounded-lg p-6">
          <h3 className="text-accentGold font-semibold mb-2">Economics</h3>
          <p className="text-textOnDark/80 text-sm">
            Fair payment system with escrow and settlement automation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-primary/40 backdrop-blur-sm border border-accentGold/20 rounded-lg p-4">
          <p className="text-textOnDark/80 mb-2">
            Connection Status: {' '}
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          
          <div className="space-x-4">
            <button
              onClick={connect}
              disabled={isConnected}
              className="px-4 py-2 bg-accentGold text-primary rounded disabled:opacity-50"
            >
              Connect
            </button>
            
            <button
              onClick={disconnect}
              disabled={!isConnected}
              className="px-4 py-2 border border-accentGold text-accentGold rounded disabled:opacity-50"
            >
              Disconnect
            </button>
            
            <button
              onClick={testConnection}
              disabled={!isConnected}
              className="px-4 py-2 border border-textOnDark/40 text-textOnDark rounded disabled:opacity-50"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="text-sm text-textOnDark/60">
          <p>Canister IDs:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(canisterIds).map(([name, id]) => (
              <p key={name} className="font-mono">
                {name}: {id}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home