import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, Star, ShoppingCart, Search, Smartphone, Laptop,
  Headphones, Tv, Monitor, Camera, Home, Package,
  ArrowRight, TrendingUp, Shield, Truck
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useCart } from '@/store/cartContext'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types'

// Static products for Phase 2 (replaced with Supabase data in Phase 5)
const STATIC_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Sony WH-1000XM5', description: 'Industry-leading noise cancellation with 30hr battery, crystal-clear calls, and premium sound quality.',
    price: 349, category: 'audio', images: [], stock: 24, rating: 4.9, review_count: 2847, badge: 'Best Seller', created_at: '',
  },
  {
    id: '2', name: 'iPhone 15 Pro Max', description: 'Titanium design, A17 Pro chip, 48MP camera system with 5× optical zoom. The ultimate iPhone.',
    price: 1199, category: 'phones', images: [], stock: 12, rating: 4.8, review_count: 5621, badge: 'New', created_at: '',
  },
  {
    id: '3', name: 'MacBook Air M3', description: '18-hour battery, fanless design, blazing-fast M3 chip. Starts at just 2.7 lbs.',
    price: 1099, category: 'laptops', images: [], stock: 8, rating: 4.9, review_count: 3104, badge: 'Top Rated', created_at: '',
  },
  {
    id: '4', name: 'Samsung 65" QLED 4K', description: 'Quantum HDR 32x, 144Hz refresh rate, Dolby Atmos, and Samsung Gaming Hub built-in.',
    price: 1799, category: 'tvs', images: [], stock: 5, rating: 4.7, review_count: 1239, badge: 'Deal', created_at: '',
  },
  {
    id: '5', name: 'DJI Mini 4 Pro', description: '4K/60fps drone, tri-directional obstacle sensing, 34-min flight time. Under 249g.',
    price: 759, category: 'cameras', images: [], stock: 15, rating: 4.8, review_count: 876, badge: 'New', created_at: '',
  },
  {
    id: '6', name: 'LG UltraGear 27" QHD', description: '165Hz IPS panel, 1ms response, G-Sync compatible. Perfect for gaming and creative work.',
    price: 449, category: 'monitors', images: [], stock: 20, rating: 4.7, review_count: 1542, badge: null as unknown as string, created_at: '',
  },
  {
    id: '7', name: 'Dyson V15 Detect', description: 'Laser dust detection, 60-minute run time, LCD screen showing real-time particle data.',
    price: 749, category: 'appliances', images: [], stock: 10, rating: 4.8, review_count: 2103, badge: 'Top Rated', created_at: '',
  },
  {
    id: '8', name: 'Bose QuietComfort Ultra', description: 'Immersive spatial audio, world-class noise cancelling, 24-hour battery. Luxury redefined.',
    price: 329, category: 'audio', images: [], stock: 18, rating: 4.8, review_count: 1673, badge: null as unknown as string, created_at: '',
  },
]

const CATEGORIES = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Phones', value: 'phones', icon: Smartphone },
  { label: 'Laptops', value: 'laptops', icon: Laptop },
  { label: 'Audio', value: 'audio', icon: Headphones },
  { label: 'TVs', value: 'tvs', icon: Tv },
  { label: 'Monitors', value: 'monitors', icon: Monitor },
  { label: 'Cameras', value: 'cameras', icon: Camera },
  { label: 'Appliances', value: 'appliances', icon: Home },
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phones: Smartphone, laptops: Laptop, audio: Headphones, tvs: Tv,
  monitors: Monitor, cameras: Camera, appliances: Home,
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'badge-blue', 'New': 'badge-purple', 'Top Rated': 'badge-orange', 'Deal': 'badge-green',
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn('w-3.5 h-3.5', star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-border')}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted font-medium">
        {rating.toFixed(1)}{count !== undefined && ` (${count.toLocaleString()})`}
      </span>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const CategoryIcon = CATEGORY_ICONS[product.category] || Package

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }

  return (
    <div
      className="product-card group flex flex-col h-full"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image area */}
      <div className="relative h-44 rounded-xl bg-dark-muted mb-4 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <CategoryIcon className="w-16 h-16 text-dark-border group-hover:text-text-muted transition-colors" />
        )}
        {product.badge && (
          <span className={cn('absolute top-3 left-3', BADGE_STYLES[product.badge] || 'badge-blue')}>
            {product.badge}
          </span>
        )}
        {product.stock <= 5 && (
          <span className="absolute top-3 right-3 badge bg-red-500/15 text-red-400 border border-red-500/20">
            Low Stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 gap-2">
        <p className="text-xs text-text-muted capitalize font-medium">{product.category}</p>
        <h3 className="font-heading font-semibold text-text-primary text-sm leading-snug group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>
        <StarRating rating={product.rating} count={product.review_count} />

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-dark-border">
          <span className="font-heading font-bold text-text-primary">{formatPrice(product.price)}</span>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const filtered = STATIC_PRODUCTS.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  // Track recently viewed category in localStorage
  useEffect(() => {
    if (activeCategory !== 'all') {
      localStorage.setItem('ew_last_category', activeCategory)
    }
  }, [activeCategory])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Hero copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <Zap className="w-4 h-4" strokeWidth={2.5} />
                AI-Powered Electronics Marketplace
              </div>

              <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight text-text-primary">
                Shop Smarter with{' '}
                <span className="gradient-text">Volt AI</span>
              </h1>

              <p className="text-text-secondary text-lg leading-relaxed max-w-lg">
                Discover 8,000+ premium electronics. Let our AI assistant find the perfect product, compare specs, and help you get the best deal — all in a single conversation.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
                    chatBtn?.click()
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  Ask Volt AI
                </button>
                <Link to="/products" className="btn-ghost flex items-center gap-2">
                  Browse All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: Package, label: '8,000+ Products' },
                  { icon: Star, label: '4.8★ Avg Rating' },
                  { icon: Truck, label: 'Free Shipping $75+' },
                  { icon: Shield, label: '1-Year Warranty' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-2 text-text-secondary text-sm">
                    <stat.icon className="w-4 h-4 text-blue-400" />
                    {stat.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Featured product card */}
            <div className="relative">
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl shadow-blue-500/5">
                <div className="flex items-start justify-between mb-4">
                  <span className="badge-blue">Featured</span>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    4.9
                  </div>
                </div>

                <div className="h-40 bg-dark-muted rounded-xl flex items-center justify-center mb-4">
                  <Headphones className="w-20 h-20 text-blue-400/40" />
                </div>

                <h3 className="font-heading font-bold text-text-primary text-xl mb-1">Sony WH-1000XM5</h3>
                <p className="text-text-muted text-sm mb-3">Industry-leading noise cancellation · 30hr battery</p>

                {/* Rating bar */}
                <div className="space-y-1 mb-4">
                  {[5, 4, 3].map((stars, i) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-text-muted w-3">{stars}</span>
                      <div className="flex-1 h-1.5 bg-dark-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: ['82%', '14%', '4%'][i] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-heading font-bold text-text-primary">$349</p>
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      In stock · Ships today
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const product = STATIC_PRODUCTS[0]
                      // eslint-disable-next-line react-hooks/rules-of-hooks
                      document.dispatchEvent(new CustomEvent('add-to-cart', { detail: product }))
                    }}
                    className="btn-primary py-2.5 flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                ⚡ AI-Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRENDING SECTION ===== */}
      <section className="py-8 px-4 border-y border-dark-border bg-dark-card/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm font-medium shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Trending:
          </div>
          {['iPhone 15 Pro', 'MacBook Air M3', 'Sony XM5', 'DJI Mini 4 Pro', 'Samsung QLED'].map(term => (
            <button
              key={term}
              onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
              className="text-sm text-text-secondary hover:text-blue-400 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* ===== PRODUCTS SECTION ===== */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading font-bold text-3xl text-text-primary">
                Featured Products
              </h2>
              <p className="text-text-muted mt-1">Curated picks from our top categories</p>
            </div>
            <Link
              to="/products"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-all border',
                    activeCategory === cat.value
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'border-dark-border text-text-secondary hover:text-text-primary hover:border-white/20 bg-dark-card'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Search within products */}
          <div className="relative mb-8 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter products..."
              className="input-dark pl-10 text-sm"
            />
          </div>

          {/* Product grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-dark-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-text-muted" />
              </div>
              <div className="text-center">
                <h3 className="font-heading font-semibold text-text-primary mb-1">No products found</h3>
                <p className="text-text-muted text-sm">Try a different category or search term</p>
              </div>
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery('') }}
                className="btn-ghost text-sm px-4 py-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== WHY ELECTRIC WORLD ===== */}
      <section className="py-16 px-4 border-t border-dark-border bg-dark-card/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-text-primary text-center mb-3">
            Why Electric World?
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
            We combine cutting-edge AI with a curated electronics catalog to make shopping effortless.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Volt AI Assistant', desc: 'Get personalised recommendations and answers 24/7 from our AI shopping expert.' },
              { icon: Shield, title: '1-Year Warranty', desc: 'All products include manufacturer warranty. Extended plans available at checkout.' },
              { icon: Truck, title: 'Free Shipping', desc: 'Free standard shipping on all orders over $75. Express delivery available.' },
              { icon: Star, title: 'Verified Reviews', desc: 'Only buyers can leave reviews. Real ratings from real customers you can trust.' },
            ].map(feature => (
              <div key={feature.title} className="bg-dark-card border border-dark-border rounded-card p-6 text-center hover:border-blue-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-heading font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-10 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
            <div className="relative">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="font-heading font-bold text-3xl text-text-primary mb-3">
                Not sure what to buy?
              </h2>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Tell Volt AI your budget and use case. It'll recommend the perfect product in seconds.
              </p>
              <button
                onClick={() => {
                  const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
                  chatBtn?.click()
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4" strokeWidth={2.5} />
                Chat with Volt AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-semibold text-text-primary">Electric World</span>
          </div>
          <p className="text-text-muted text-sm">© 2026 Electric World. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-text-muted">
            <Link to="/support" className="hover:text-text-primary transition-colors">Support</Link>
            <Link to="/products" className="hover:text-text-primary transition-colors">Products</Link>
            <a href="mailto:support@electricworld.com" className="hover:text-text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Volt AI Chat Widget */}
      <ChatWidget />
    </div>
  )
}
