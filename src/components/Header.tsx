import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Button from './Button'

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { isWalletAvailable, isConnected, isConnecting, userProfile, connect, disconnect } = useAgent()

  const baseNav = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Starter Packs', href: '/starter-packs', current: location.pathname === '/starter-packs' },
    { name: 'AI Wizard', href: '/wizard', current: location.pathname === '/wizard' },
    { name: 'Models', href: '/models', current: location.pathname === '/models' },
    { name: 'Agents', href: '/agents', current: location.pathname === '/agents' },
    { name: 'Bounties', href: '/bounties', current: location.pathname === '/bounties' },
    { name: 'Economics', href: '/economics', current: location.pathname === '/economics' },
    { name: 'Verify', href: '/verify', current: location.pathname === '/verify' },
  ]
  // Show Admin link only when user has admin access
  const { isAdmin } = useAgent()
  const adminNav = isAdmin ? [{ name: 'Admin', href: '/admin', current: location.pathname === '/admin' }] : []
  const navigation = [...baseNav, ...adminNav]

  return (
    <header className="glass-morph sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-2xl font-bold text-accentGold hover:text-accentGold/80 transition-all duration-300 transform hover:scale-105"
            >
              <img 
                src="/ohms-logo.png" 
                alt="OHMS" 
                className="h-10 w-auto"
              />
              <span className="bg-gradient-to-r from-accentGold to-yellow-300 bg-clip-text text-transparent">
                OHMS
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  item.current
                    ? 'bg-accentGold text-primary shadow-lg glow-on-hover'
                    : 'text-textOnDark hover:bg-accentGold/20 hover:text-accentGold border border-transparent hover:border-accentGold/30'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Wallet / Identity */}
          <div className="hidden md:flex items-center gap-3">
            {!isWalletAvailable ? (
              <div className="text-xs text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30">
                Open Oisy
              </div>
            ) : isConnected && userProfile ? (
              <div className="flex items-center gap-2">
                <div className="text-xs text-textOnDark/80 px-3 py-1.5 rounded-lg border border-accentGold/30 bg-accentGold/10">
                  👤 {userProfile.name}
                </div>
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={connect} 
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    🔗 Connect Oisy
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-textOnDark hover:text-accentGold p-2 rounded-lg hover:bg-accentGold/10 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-accentGold/20 mt-4">
            <nav className="flex flex-col space-y-2 pt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    item.current
                      ? 'bg-accentGold text-primary'
                      : 'text-textOnDark hover:bg-accentGold/20 hover:text-accentGold'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex gap-2 px-4">
                {!isWalletAvailable ? (
                  <div className="text-xs text-red-300 px-3 py-2 rounded-lg border border-red-500/30 w-full text-center">
                    Open Oisy Wallet
                  </div>
                ) : isConnected && userProfile ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-textOnDark/80 px-3 py-2 rounded-lg border border-accentGold/30 bg-accentGold/10 w-full text-center">
                      👤 {userProfile.name}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      fullWidth 
                      onClick={() => { disconnect(); setIsMobileMenuOpen(false) }}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    fullWidth 
                    onClick={() => { connect(); setIsMobileMenuOpen(false) }}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : '🔗 Connect Oisy Wallet'}
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header