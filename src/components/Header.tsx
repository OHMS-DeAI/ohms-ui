import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Agents', href: '/agents', current: location.pathname === '/agents' },
    { name: 'Bounties', href: '/bounties', current: location.pathname === '/bounties' },
    { name: 'Receipts', href: '/receipts', current: location.pathname === '/receipts' },
    { name: 'Verify', href: '/verify', current: location.pathname === '/verify' },
  ]

  return (
    <header className="bg-primary/80 backdrop-blur-sm border-b border-accentGold/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-accentGold">
              OHMS
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-accentGold text-primary'
                    : 'text-textOnDark hover:bg-accentGold/10 hover:text-accentGold'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header