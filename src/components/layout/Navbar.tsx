import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Zap, Search, Menu, X, User, Heart } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { useAuth } from '@/store/authContext'
import CartDrawer from '@/components/CartDrawer'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { cartCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        navigate(`/search?q=${encodeURIComponent(value.trim())}`)
      }
    }, 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-heading font-bold text-lg text-text-primary hidden sm:block">
                Electric <span className="gradient-text">World</span>
              </span>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search phones, laptops, audio..."
                  className="w-full bg-dark-muted border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </div>
            </form>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/products"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Products
              </Link>
              <Link
                to="/products?sort=price_asc"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Deals
              </Link>
              <Link
                to="/support"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Support
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2 rounded-xl border border-dark-border hover:border-white/20"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Profile</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2 rounded-xl border border-dark-border hover:border-white/20"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}

              <Link
                to="/wishlist"
                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-dark-muted transition-all"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-white text-dark-bg font-semibold text-sm px-3 py-2 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:block">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-dark-muted transition-all"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-dark-border animate-fade-in">
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search electronics..."
                    className="w-full bg-dark-muted border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                </div>
              </form>
              <div className="flex flex-col gap-1">
                {[
                  { to: '/products', label: 'Products' },
                  { to: '/products?sort=price_asc', label: 'Deals' },
                  { to: '/support', label: 'Support' },
                  { to: user ? '/profile' : '/login', label: user ? 'Profile' : 'Sign In' },
                  { to: '/wishlist', label: 'Wishlist' },
                ].map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-dark-muted rounded-xl transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
