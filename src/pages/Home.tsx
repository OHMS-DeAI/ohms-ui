import { useAgent } from '../context/AgentContext'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

const Home = () => {
  const { isWalletAvailable, isConnected, isConnecting, userProfile, connect } = useAgent()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-20 relative">
        <div className="relative z-10">
          <h1 className="text-7xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-accentGold via-yellow-300 to-accentGold bg-clip-text text-transparent animate-pulse">
              OHMS
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-textOnDark/90 mb-4 font-light">
            On-Chain Hosting for Multi-Agent Systems
          </p>
          <p className="text-lg text-textOnDark/70 mb-12 max-w-2xl mx-auto">
            Revolutionizing AI deployment with adaptive models, smart agents, and decentralized coordination
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isConnected ? (
              <>
                <Button size="lg" onClick={() => navigate('/starter-packs')}>
                  🚀 Get Started with Starter Packs
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/wizard')}>
                  🧙‍♂️ Try AI Wizard
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {!isWalletAvailable ? (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
                    <p className="text-red-300 text-center mb-4">
                      🔌 Oisy wallet not available
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => window.open('https://oisy.com', '_blank')}
                      className="w-full"
                    >
                      Open Oisy Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="bg-accentGold/10 border border-accentGold/30 rounded-lg p-6">
                    <p className="text-textOnDark text-center mb-4">
                      🔗 Connect your Oisy wallet to access OHMS platform
                    </p>
                    <Button 
                      size="lg" 
                      onClick={connect} 
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-5 h-5 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        '🔗 Connect Oisy Wallet'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Welcome message for connected users */}
          {isConnected && userProfile && (
            <div className="mb-8 bg-accentGold/10 border border-accentGold/30 rounded-lg p-4">
              <p className="text-textOnDark text-center">
                👋 Welcome back, <span className="font-semibold text-accentGold">{userProfile.name}</span>!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-4xl font-bold text-center text-accentGold mb-12">
          Core Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accentGold/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accentGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Adaptive Models</h3>
            <p className="text-textOnDark/80 leading-relaxed">
              APQ-compressed neural models for efficient on-chain inference with dynamic optimization
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accentGold/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accentGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Smart Agents</h3>
            <p className="text-textOnDark/80 leading-relaxed">
              Deterministic AI agents with encrypted memory and intelligent caching systems
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accentGold/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accentGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Coordination</h3>
            <p className="text-textOnDark/80 leading-relaxed">
              Intelligent routing and bounty-based task distribution across the network
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accentGold/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accentGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Economics</h3>
            <p className="text-textOnDark/80 leading-relaxed">
              Fair payment system with automated escrow and settlement mechanisms
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="py-16">
        <h2 className="text-4xl font-bold text-center text-accentGold mb-12">
          Get Started in Minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Starter Packs</h3>
            <p className="text-textOnDark/80 leading-relaxed mb-4">
              Pre-configured AI workflows for common business tasks. Choose from content creation, data analysis, and more.
            </p>
            <Button variant="outline" fullWidth onClick={() => navigate('/starter-packs')}>
              Browse Starter Packs
            </Button>
          </Card>
          
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🧙‍♂️</div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">AI Wizard</h3>
            <p className="text-textOnDark/80 leading-relaxed mb-4">
              Guided interface to create custom AI tasks. Just describe what you need and let our wizard handle the rest.
            </p>
            <Button variant="outline" fullWidth onClick={() => navigate('/wizard')}>
              Launch AI Wizard
            </Button>
          </Card>
          
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-accentGold font-semibold text-xl mb-3">Expert Mode</h3>
            <p className="text-textOnDark/80 leading-relaxed mb-4">
              Direct access to models, agents, and bounties for advanced users who want full control.
            </p>
            <Button variant="outline" fullWidth onClick={() => navigate('/models')}>
              Explore Models
            </Button>
          </Card>
        </div>
      </div>

      {/* Footer CTA for non-connected users */}
      {!isConnected && (
        <div className="py-16">
          <Card className="text-center bg-gradient-to-r from-accentGold/10 to-accentGold/5 border-accentGold/30">
            <h3 className="text-2xl font-bold text-accentGold mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-textOnDark/80 mb-6 max-w-md mx-auto">
              Connect your Oisy wallet to access AI agents, create bounties, and deploy smart contracts on the Internet Computer.
            </p>
            {!isWalletAvailable ? (
              <Button onClick={() => window.open('https://oisy.com', '_blank')} size="lg">
                Open Oisy Wallet
              </Button>
            ) : (
              <Button onClick={connect} disabled={isConnecting} size="lg">
                {isConnecting ? 'Connecting...' : '🔗 Connect Wallet'}
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default Home