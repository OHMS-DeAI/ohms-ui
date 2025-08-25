import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAgent } from '../context/AgentContext'
import Button from './Button'
import SimpleUserAvatar from './SimpleUserAvatar'

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { isConnected, isConnecting, connect } = useAgent()

  // User navigation - for regular users
  const userNav = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Chat with AI', href: '/chat', current: location.pathname === '/chat' },
    { name: 'Coordinator', href: '/coordinator', current: location.pathname === '/coordinator' },
    { name: 'Create Agents', href: '/create-agent', current: location.pathname === '/create-agent' },
    { name: 'My Agents', href: '/agents', current: location.pathname === '/agents' },
    { name: 'Subscription', href: '/subscription', current: location.pathname === '/subscription' },
    { name: 'Models', href: '/models', current: location.pathname === '/models' },
    { name: 'Economics', href: '/economics', current: location.pathname === '/economics' },
    { name: 'Verify', href: '/verify', current: location.pathname === '/verify' },
  ]

  // Admin navigation - dynamically loaded based on user context
  const { isAdmin } = useAgent()
  const adminNav = isAdmin ? [
    { name: 'Admin Dashboard', href: '/admin', current: location.pathname === '/admin' },
    { name: 'Platform Curation', href: '/admin/novaq', current: location.pathname === '/admin/novaq' },
    { name: 'Performance Monitor', href: '/admin/performance', current: location.pathname === '/admin/performance' },
    { name: 'NOVAQ Dashboard', href: '/admin/novaq-dashboard', current: location.pathname === '/admin/novaq-dashboard' },
  ] : []

  // Legacy navigation for backward compatibility
  const legacyNav = [
    { name: 'Starter Packs', href: '/starter-packs', current: location.pathname === '/starter-packs' },
    { name: 'AI Wizard', href: '/wizard', current: location.pathname === '/wizard' },
    { name: 'Agent Creator', href: '/agent-creator', current: location.pathname === '/agent-creator' },
  ]

  // Combine navigation based on user role (hide admin nav from non-admin users)
  const navigation = [...userNav, ...(isAdmin ? adminNav : []), ...legacyNav]

  return (
    <header className="glass-morph sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-3 text-2xl font-bold text-secondary hover:text-secondary-light transition-all duration-300 transform hover:scale-105"
            >
              <img
                src="/ohms-logo.png"
                alt="OHMS"
                className="h-10 w-auto"
              />
              <span className="bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
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
                    ? 'bg-secondary text-white shadow-lg glow-on-hover'
                    : 'text-text-primary hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Internet Identity v2 Authentication */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <SimpleUserAvatar size="sm" />
            ) : (
              <Button 
                size="sm" 
                onClick={connect} 
                disabled={isConnecting}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-none"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Internet Identity
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-primary hover:text-secondary p-3 rounded-lg hover:bg-secondary/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          <div className="md:hidden pb-4 border-t border-border mt-4">
            <nav className="flex flex-col space-y-2 pt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-4 rounded-lg text-sm font-medium transition-all duration-300 min-h-[48px] flex items-center ${
                    item.current
                      ? 'bg-secondary text-white'
                      : 'text-text-primary hover:bg-secondary/20 hover:text-secondary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex gap-2 px-4">
                {isConnected ? (
                  <div className="w-full">
                    <SimpleUserAvatar 
                      size="md" 
                      className="w-full"
                    />
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    fullWidth 
                    onClick={() => { connect(); setIsMobileMenuOpen(false) }}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-none"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Internet Identity
                      </>
                    )}
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