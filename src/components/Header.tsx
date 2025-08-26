import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import Button from './Button'
import SimpleUserAvatar from './SimpleUserAvatar'

interface MegaMenuItem {
  name: string
  href: string
  description: string
}

interface NavigationItem {
  name: string
  href: string
  current: boolean
  external: boolean
  hasMegaMenu?: boolean
  megaMenuItems?: MegaMenuItem[]
}

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)

  const { isConnected, isConnecting, connect } = useAgent()

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveMegaMenu(null)
  }, [location.pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false)
        setActiveMegaMenu(null)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Streamlined navigation - essential items only
  const userNav: NavigationItem[] = [
    { name: 'Home', href: '/', current: location.pathname === '/', external: false },
    { name: 'Chat with AI', href: '/chat', current: location.pathname === '/chat', external: false },
    { name: 'Coordinator', href: '/coordinator', current: location.pathname === '/coordinator', external: false },
    { name: 'Create Agents', href: '/create-agent', current: location.pathname === '/create-agent', external: false },
    { name: 'My Agents', href: '/agents', current: location.pathname === '/agents', external: false },
  ]

  // Admin navigation - dynamically loaded based on user context
  const { isAdmin } = useAgent()
  const adminNav: NavigationItem[] = isAdmin ? [
    { name: 'Admin Dashboard', href: '/admin', current: location.pathname === '/admin', external: false },
    { name: 'Platform Curation', href: '/admin/novaq', current: location.pathname === '/admin/novaq', external: false },
    { name: 'Performance Monitor', href: '/admin/performance', current: location.pathname === '/admin/performance', external: false },
    { name: 'NOVAQ Dashboard', href: '/admin/novaq-dashboard', current: location.pathname === '/admin/novaq-dashboard', external: false },
  ] : []

  // Combine navigation based on user role (hide admin nav from non-admin users)
  const navigation = [...userNav, ...(isAdmin ? adminNav : [])]

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
          <nav className="hidden md:flex space-x-2 relative">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-1 ${
                      item.current
                        ? 'bg-secondary text-white shadow-lg glow-on-hover'
                        : 'text-text-primary hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30'
                    }`}
                  >
                    {item.name}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : item.hasMegaMenu ? (
                  <div className="relative">
                    <button
                      onMouseEnter={() => setActiveMegaMenu(item.name)}
                      onMouseLeave={() => setActiveMegaMenu(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-1 ${
                        item.current
                          ? 'bg-secondary text-white shadow-lg glow-on-hover'
                          : 'text-text-primary hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30'
                      }`}
                    >
                      {item.name}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega Menu */}
                    {activeMegaMenu === item.name && item.megaMenuItems && (
                      <div
                        className="absolute top-full left-0 mt-2 w-80 bg-primary border border-border rounded-lg shadow-xl z-50"
                        onMouseEnter={() => setActiveMegaMenu(item.name)}
                        onMouseLeave={() => setActiveMegaMenu(null)}
                      >
                        <div className="p-4">
                          <div className="space-y-2">
                            {item.megaMenuItems.map((megaItem) => (
                              <Link
                                key={megaItem.name}
                                to={megaItem.href}
                                className="block p-3 rounded-lg hover:bg-secondary/10 transition-colors group"
                              >
                                <div className="font-medium text-text-primary group-hover:text-secondary">
                                  {megaItem.name}
                                </div>
                                <div className="text-xs text-text-secondary mt-1">
                                  {megaItem.description}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                      item.current
                        ? 'bg-secondary text-white shadow-lg glow-on-hover'
                        : 'text-text-primary hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/30'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
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
              className="text-text-primary hover:text-secondary p-3 rounded-lg hover:bg-secondary/10 active:bg-secondary/20 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
              aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={isMobileMenuOpen}
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
          <div className="md:hidden pb-4 border-t border-border mt-4 mobile-menu-container">
            <nav className="flex flex-col space-y-1 pt-4">
              {navigation.map((item) => (
                item.hasMegaMenu ? (
                  <div key={item.name}>
                    <button
                      onClick={() => setActiveMegaMenu(activeMegaMenu === item.name ? null : item.name)}
                      className={`px-4 py-4 rounded-lg text-sm font-medium transition-all duration-300 min-h-[56px] flex items-center justify-between touch-manipulation w-full ${
                        item.current
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-text-primary hover:bg-secondary/20 hover:text-secondary active:bg-secondary/30'
                      }`}
                      aria-expanded={activeMegaMenu === item.name}
                    >
                      <span>{item.name}</span>
                      <svg
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${activeMegaMenu === item.name ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mobile Mega Menu */}
                    {activeMegaMenu === item.name && item.megaMenuItems && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-secondary/30 pl-4">
                        {item.megaMenuItems.map((megaItem) => (
                          <Link
                            key={megaItem.name}
                            to={megaItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-lg text-sm text-text-secondary hover:text-secondary hover:bg-secondary/10 transition-colors touch-manipulation"
                          >
                            <div className="font-medium">{megaItem.name}</div>
                            <div className="text-xs text-text-secondary/70 mt-1">{megaItem.description}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-4 rounded-lg text-sm font-medium transition-all duration-300 min-h-[56px] flex items-center justify-between touch-manipulation ${
                      item.current
                        ? 'bg-secondary text-white shadow-lg'
                        : 'text-text-primary hover:bg-secondary/20 hover:text-secondary active:bg-secondary/30'
                    }`}
                    role="menuitem"
                  >
                    <span>{item.name}</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-4 rounded-lg text-sm font-medium transition-all duration-300 min-h-[56px] flex items-center touch-manipulation ${
                      item.current
                        ? 'bg-secondary text-white shadow-lg'
                        : 'text-text-primary hover:bg-secondary/20 hover:text-secondary active:bg-secondary/30'
                    }`}
                    role="menuitem"
                  >
                    {item.name}
                  </Link>
                )
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
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 active:from-purple-800 active:to-purple-700 text-white border-none min-h-[48px] touch-manipulation"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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