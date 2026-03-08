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
import { STATIC_PRODUCTS } from '@/lib/staticProducts'
import type { Product } from '@/types'

const CATEGORIES = [
  { label: 'All',        value: 'all',       icon: Package },
  { label: 'Phones',     value: 'phones',    icon: Smartphone },
  { label: 'Laptops',    value: 'laptops',   icon: Laptop },
  { label: 'Audio',      value: 'audio',     icon: Headphones },
  { label: 'TVs',        value: 'tvs',       icon: Tv },
  { label: 'Monitors',   value: 'monitors',  icon: Monitor },
  { label: 'Cameras',    value: 'cameras',   icon: Camera },
  { label: 'Appliances', value: 'appliances',icon: Home },
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phones: Smartphone, laptops: Laptop, audio: Headphones,
  tvs: Tv, monitors: Monitor, cameras: Camera, appliances: Home,
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'badge-blue',
  'New':         'badge-red',
  'Top Rated':   'badge-orange',
  'Deal':        'badge-green',
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            className={cn('w-3.5 h-3.5', s <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-gray-200')}
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
      {/* Image */}
      <div className="relative h-44 rounded-xl mb-4 flex items-center justify-center overflow-hidden"
        style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
      >
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <CategoryIcon className="w-16 h-16 text-brand-header/20 group-hover:text-brand-header/40 transition-colors" />
        )}
        {product.badge && (
          <span className={cn('absolute top-3 left-3', BADGE_STYLES[product.badge] || 'badge-blue')}>
            {product.badge}
          </span>
        )}
        {product.stock <= 5 && (
          <span className="absolute top-3 right-3 badge bg-red-100 text-brand-red border border-brand-red/20">
            Low Stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 gap-2">
        <p className="text-xs text-text-muted capitalize font-medium tracking-wide">{product.category}</p>
        <h3 className="font-heading font-semibold text-text-primary text-sm leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>
        <StarRating rating={product.rating} count={product.review_count} />

        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #D9E1EB' }}>
          <span className="font-heading font-bold text-brand-price text-base">{formatPrice(product.price)}</span>
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-brand-red-dark transition-all active:scale-95"
            style={{ boxShadow: '0 2px 8px rgba(227,26,45,0.25)' }}
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
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const navigate = useNavigate()
  const { addItem } = useCart()

  // Fetch from Supabase; fall back to static data if empty/error
  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setProducts(data as Product[])
          }
          // else keep STATIC_PRODUCTS as fallback
        })
        .finally(() => setLoadingProducts(false))
    })
  }, [])

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  useEffect(() => {
    if (activeCategory !== 'all') localStorage.setItem('ew_last_category', activeCategory)
  }, [activeCategory])

  return (
    <div className="min-h-screen" style={{ background: '#F6F8FA' }}>
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section
        className="relative pt-24 pb-20 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #001C3F 0%, #00295F 50%, #102E5A 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #E31A2D, transparent)' }} />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: 'rgba(227,26,45,0.15)', border: '1px solid rgba(227,26,45,0.3)', color: '#fca5a5' }}
              >
                <Zap className="w-4 h-4" strokeWidth={2.5} />
                AI-Powered Electronics Marketplace
              </div>

              <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight text-white">
                Shop Smarter<br />with{' '}
                <span style={{ color: '#E31A2D' }}>Volt AI</span>
              </h1>

              <p className="text-blue-100 text-lg leading-relaxed max-w-lg opacity-90">
                Discover 8,000+ premium electronics. Let our AI assistant find the perfect product, compare specs, and help you get the best deal — all in one conversation.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
                    chatBtn?.click()
                  }}
                  className="flex items-center gap-2 bg-brand-red text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-red-dark transition-all active:scale-95"
                  style={{ boxShadow: '0 4px 16px rgba(227,26,45,0.4)' }}
                >
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  Ask Volt AI
                </button>
                <Link
                  to="/products"
                  className="btn-ghost-light flex items-center gap-2"
                >
                  Browse All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: Package, label: '8,000+ Products' },
                  { icon: Star,    label: '4.8★ Avg Rating' },
                  { icon: Truck,   label: 'Free Shipping $75+' },
                  { icon: Shield,  label: '1-Year Warranty' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 text-blue-200 text-sm opacity-90">
                    <s.icon className="w-4 h-4 text-brand-red" />
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Featured product card */}
            <div className="relative">
              <div className="rounded-2xl p-6 shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="badge bg-brand-red text-white border-0">Featured</span>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    4.9
                  </div>
                </div>

                <div className="h-40 rounded-xl overflow-hidden mb-4">
                  <img
                    src="/featured-product.jpg"
                    alt="Sony WH-1000XM5"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-heading font-bold text-white text-xl mb-1">Sony WH-1000XM5</h3>
                <p className="text-blue-200 text-sm mb-4 opacity-80">Industry-leading noise cancellation · 30hr battery</p>

                {/* Rating bars */}
                <div className="space-y-1.5 mb-5">
                  {[['82%', '5★'], ['14%', '4★'], ['4%', '3★']].map(([w, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-white/50 w-5 text-right">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: w, background: '#E31A2D' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-heading font-bold text-white">$349</p>
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      In stock · Ships today
                    </p>
                  </div>
                  <button
                    onClick={() => addItem(STATIC_PRODUCTS[0])}
                    className="flex items-center gap-2 bg-brand-red text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-red-dark transition-all active:scale-95"
                    style={{ boxShadow: '0 4px 12px rgba(227,26,45,0.4)' }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                style={{ background: '#E31A2D' }}
              >
                ⚡ AI-Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TRENDING BAR ══════════ */}
      <section className="py-3 px-4 bg-white border-b border-dark-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm font-medium shrink-0">
            <TrendingUp className="w-4 h-4 text-brand-red" />
            Trending:
          </div>
          {['iPhone 15 Pro', 'MacBook Air M3', 'Sony XM5', 'DJI Mini 4 Pro', 'Samsung QLED'].map(term => (
            <button
              key={term}
              onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
              className="text-sm text-text-secondary hover:text-brand-red transition-colors font-medium"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURED PRODUCTS ══════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-heading font-bold text-3xl text-text-primary">Featured Products</h2>
              <p className="text-text-muted mt-1">Curated picks from our top categories</p>
            </div>
            <Link
              to="/products"
              className="text-sm text-brand-red hover:text-brand-red-dark flex items-center gap-1 font-semibold transition-colors"
            >
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-all border',
                    activeCategory === cat.value
                      ? 'text-white border-brand-red'
                      : 'border-dark-border text-text-secondary hover:text-brand-navy hover:border-brand-header/40 bg-white'
                  )}
                  style={activeCategory === cat.value ? { background: '#E31A2D', boxShadow: '0 2px 10px rgba(227,26,45,0.3)' } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Search filter */}
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
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1px solid #D9E1EB', background: '#fff' }}>
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 bg-gray-100 rounded w-1/4" />
                      <div className="h-8 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}>
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

      {/* ══════════ WHY ELECTRIC WORLD ══════════ */}
      <section className="py-16 px-4" style={{ background: '#F6F8FA', borderTop: '1px solid #D9E1EB' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading font-bold text-3xl text-text-primary text-center mb-3">
            Why Electric World?
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
            Combining cutting-edge AI with a curated electronics catalog to make shopping effortless.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap,    title: 'Volt AI Assistant', desc: 'Personalised recommendations and answers 24/7 from our AI shopping expert.' },
              { icon: Shield, title: '1-Year Warranty',   desc: 'All products include manufacturer warranty. Extended plans at checkout.' },
              { icon: Truck,  title: 'Free Shipping',     desc: 'Free standard shipping on all orders over $75. Express delivery available.' },
              { icon: Star,   title: 'Verified Reviews',  desc: 'Only buyers can leave reviews. Real ratings from real customers.' },
            ].map(f => (
              <div key={f.title} className="bg-white border rounded-card p-6 text-center transition-all hover:-translate-y-1"
                style={{ borderColor: '#D9E1EB', boxShadow: '0 2px 16px rgba(0,28,63,0.06)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(227,26,45,0.08)' }}
                >
                  <f.icon className="w-6 h-6 text-brand-red" />
                </div>
                <h3 className="font-heading font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl p-10 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #001C3F 0%, #00295F 100%)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10"
              style={{ background: 'radial-gradient(circle, #E31A2D, transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="relative">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="font-heading font-bold text-3xl text-white mb-3">Not sure what to buy?</h2>
              <p className="text-blue-200 mb-6 max-w-md mx-auto opacity-90">
                Tell Volt AI your budget and use case. It'll recommend the perfect product in seconds.
              </p>
              <button
                onClick={() => {
                  const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
                  chatBtn?.click()
                }}
                className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-red-dark transition-all active:scale-95"
                style={{ boxShadow: '0 4px 16px rgba(227,26,45,0.4)' }}
              >
                <Zap className="w-4 h-4" strokeWidth={2.5} />
                Chat with Volt AI
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: '#001C3F', borderTop: '2px solid #102E5A' }}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-red rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-heading font-bold text-white">Electric World</span>
            </div>
            <p className="text-blue-300 text-sm opacity-70">© 2026 Electric World. All rights reserved.</p>
            <div className="flex gap-5 text-sm text-blue-300 opacity-70">
              <Link to="/support"  className="hover:text-white transition-colors">Support</Link>
              <Link to="/products" className="hover:text-white transition-colors">Products</Link>
              <a href="mailto:support@electricworld.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}

