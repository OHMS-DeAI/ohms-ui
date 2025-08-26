import { useAgent } from '../context/AgentContext'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import SEOHead from '../components/SEOHead'

const Home = () => {
  const { isConnected, isConnecting, userProfile, connect } = useAgent()
  const navigate = useNavigate()

  // Structured data for OHMS organization
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OHMS",
    "url": "https://ohms.ai",
    "logo": "https://ohms.ai/ohms-logo.png",
    "description": "On-Chain Hosting for Multi-Agent Systems - Revolutionizing AI deployment with adaptive models, smart agents, and decentralized coordination on the Internet Computer Protocol",
    "foundingDate": "2024",
    "sameAs": [
      "https://github.com/your-org/ohms-2.0",
      "https://twitter.com/ohms_ai"
    ],
    "offers": [
      {
        "@type": "Product",
        "name": "OHMS AI Platform",
        "description": "Autonomous AI agent platform with NOVAQ compression and advanced AI integration",
        "category": "AI Platform"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@ohms.ai",
      "contactType": "customer service"
    }
  }

  return (
    <>
      <SEOHead
        title="Home"
        description="OHMS - On-Chain Hosting for Multi-Agent Systems. Revolutionary AI platform with adaptive models, smart agents, and decentralized coordination powered by advanced AI and Internet Computer Protocol."
        keywords={['OHMS', 'AI agents', 'decentralized AI', 'blockchain AI', 'autonomous agents', 'NOVAQ compression', 'smart agents']}
        canonical="/"
        ogImage="/ohms-logo.png"
        ogType="website"
        structuredData={structuredData}
      />
      <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-20 relative">
        <div className="relative z-10">
          <h1 className="text-7xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-secondary via-secondary-light to-secondary bg-clip-text text-transparent animate-pulse">
              OHMS
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-text-secondary mb-4 font-light">
            On-Chain Hosting for Multi-Agent Systems
          </p>
          <p className="text-lg text-text-muted mb-12 max-w-2xl mx-auto">
            Revolutionizing AI deployment with adaptive models, smart agents, and decentralized coordination
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isConnected ? (
              <>
                <Button size="lg" onClick={() => navigate('/chat')}>
                  💬 Chat with AI
                </Button>
                <Button size="lg" onClick={() => navigate('/coordinator')}>
                  🎯 Build Workflows
                </Button>
                <Button size="lg" onClick={() => navigate('/starter-packs')}>
                  🚀 Get Started with Starter Packs
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/wizard')}>
                  🧙‍♂️ Try AI Wizard
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-surface border border-border rounded-lg p-6">
                  <p className="text-text-primary text-center mb-4">
                    🆔 Authenticate with Internet Identity v2 to access OHMS platform
                  </p>
                  <p className="text-text-secondary text-center text-sm mb-4">
                    Your Google account will be used for subscription management
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
                        Authenticating...
                      </>
                    ) : (
                      '🆔 Connect with Internet Identity v2'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          

        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <h2 className="text-4xl font-bold text-center text-text-primary mb-12">
          Core Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-secondary font-semibold text-xl mb-3">Adaptive Models</h3>
            <p className="text-text-secondary leading-relaxed">
              APQ-compressed neural models for efficient on-chain inference with dynamic optimization
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-accent font-semibold text-xl mb-3">Smart Agents</h3>
            <p className="text-text-secondary leading-relaxed">
              Deterministic AI agents with encrypted memory and intelligent caching systems
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accent-light/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-accent-light font-semibold text-xl mb-3">Coordination</h3>
            <p className="text-text-secondary leading-relaxed">
              Intelligent routing and bounty-based task distribution across the network
            </p>
          </div>
          
          <div className="glass-morph rounded-xl p-8 glow-on-hover transform transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-accent-success/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-accent-success font-semibold text-xl mb-3">Economics</h3>
            <p className="text-text-secondary leading-relaxed">
              Fair payment system with automated escrow and settlement mechanisms
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="py-16">
        <h2 className="text-4xl font-bold text-center text-text-primary mb-12">
          Get Started in Minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-secondary font-semibold text-xl mb-3">Starter Packs</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Pre-configured AI workflows for common business tasks. Choose from content creation, data analysis, and more.
            </p>
            <Button variant="outline" fullWidth onClick={() => navigate('/starter-packs')}>
              Browse Starter Packs
            </Button>
          </Card>
          
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🧙‍♂️</div>
            <h3 className="text-accent font-semibold text-xl mb-3">AI Wizard</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Guided interface to create custom AI tasks. Just describe what you need and let our wizard handle the rest.
            </p>
            <Button variant="outline" fullWidth onClick={() => navigate('/wizard')}>
              Launch AI Wizard
            </Button>
          </Card>
          
          <Card hover className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-accent-light font-semibold text-xl mb-3">Expert Mode</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
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
          <Card className="text-center bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/30">
            <h3 className="text-2xl font-bold text-secondary mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Authenticate with Internet Identity v2 to access AI agents, subscription management, and deploy smart contracts on the Internet Computer.
            </p>
            <Button onClick={connect} disabled={isConnecting} size="lg">
              {isConnecting ? 'Authenticating...' : '🆔 Connect with Internet Identity v2'}
            </Button>
          </Card>
        </div>
      )}
    </div>
    </>
  )
}

export default Home