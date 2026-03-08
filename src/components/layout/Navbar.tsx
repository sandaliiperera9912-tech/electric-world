import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Zap, Search, Menu, X, User, Heart } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { useAuth } from '@/store/authContext'
import CartDrawer from '@/components/CartDrawer'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { cartCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      {/* ── Main Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: '#102E5A', boxShadow: '0 2px 20px rgba(0,28,63,0.18)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading font-bold text-lg text-white leading-none">
                  Electric
                </span>
                <span className="font-heading font-bold text-lg text-brand-red leading-none ml-1">
                  World
                </span>
              </div>
            </Link>

            {/* Search — desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search phones, laptops, audio..."
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>
            </form>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-6">
              {[
                { to: '/products', label: 'Products' },
                { to: '/products?sort=price_asc', label: 'Deals' },
                { to: '/support', label: 'Support' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-white/80 hover:text-white transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Sign In / Profile */}
              {user ? (
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-xl border border-white/20 hover:border-white/40 font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors px-3 py-2 rounded-xl border border-white/20 hover:border-white/40 font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart — red badge */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-brand-red text-white font-semibold text-sm px-3 py-2 rounded-xl hover:bg-brand-red-dark transition-all active:scale-95"
                style={{ boxShadow: '0 2px 10px rgba(227,26,45,0.35)' }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:block">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-brand-red text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-brand-red">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-all"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-white/10 animate-fade-in">
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder="Search electronics..."
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
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
                    className="px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
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
