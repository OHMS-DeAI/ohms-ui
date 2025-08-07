import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Starter Packs', href: '/starter-packs', current: location.pathname === '/starter-packs' },
    { name: 'AI Wizard', href: '/wizard', current: location.pathname === '/wizard' },
    { name: 'Models', href: '/models', current: location.pathname === '/models' },
    { name: 'Agents', href: '/agents', current: location.pathname === '/agents' },
    { name: 'Bounties', href: '/bounties', current: location.pathname === '/bounties' },
    { name: 'Economics', href: '/economics', current: location.pathname === '/economics' },
    { name: 'Verify', href: '/verify', current: location.pathname === '/verify' },
  ]

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
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header