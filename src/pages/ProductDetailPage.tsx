import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Star, ShoppingCart, Heart, ChevronLeft, Plus, Minus,
  Package, Truck, Shield, RotateCcw, Smartphone, Laptop,
  Headphones, Tv, Monitor, Camera, Home
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton'
import { getProductById } from '@/lib/products'
import { useCart } from '@/store/cartContext'
import { useWishlist } from '@/lib/useWishlist'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phones: Smartphone, laptops: Laptop, audio: Headphones,
  tvs: Tv, monitors: Monitor, cameras: Camera, appliances: Home,
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { isWishlisted, toggleWishlist } = useWishlist()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProductById(id)
      .then(data => setProduct(data))
      .catch(() => navigate('/products', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <ProductCardSkeleton />
            <div className="space-y-4">
              {[80, 60, 40, 40, 30].map((w, i) => (
                <div key={i} className={`h-4 rounded-full bg-dark-muted animate-pulse`} style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const CategoryIcon = CATEGORY_ICONS[product.category] || Package
  const maxQty = Math.min(10, product.stock)

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-text-primary transition-colors">Products</Link>
            <span>/</span>
            <Link to={`/category/${product.category}`} className="hover:text-text-primary transition-colors capitalize">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-text-primary truncate max-w-xs">{product.name}</span>
          </nav>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="grid lg:grid-cols-2 gap-12">

            {/* Left: Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <CategoryIcon className="w-32 h-32 text-dark-border" />
                )}
              </div>

              {product.images?.length > 1 && (
                <div className="flex gap-3">
                  {product.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl bg-dark-muted border border-dark-border overflow-hidden cursor-pointer hover:border-blue-500/40 transition-all">
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {product.badge && (
                    <span className="badge-blue">{product.badge}</span>
                  )}
                  <span className="text-xs text-text-muted capitalize font-medium">{product.category}</span>
                </div>
                <h1 className="font-heading font-bold text-3xl text-text-primary leading-tight mb-3">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        className={cn('w-5 h-5', s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-border')}
                      />
                    ))}
                  </div>
                  <span className="text-text-primary font-semibold">{product.rating.toFixed(1)}</span>
                  <span className="text-text-muted text-sm">({product.review_count.toLocaleString()} reviews)</span>
                </div>

                <p className="text-text-secondary leading-relaxed">{product.description}</p>
              </div>

              {/* Price & stock */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-bold text-4xl text-text-primary">{formatPrice(product.price)}</p>
                  </div>
                  <div className={cn(
                    'badge',
                    product.stock > 10
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : product.stock > 0
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}>
                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                  </div>
                </div>

                {/* Quantity */}
                {product.stock > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-text-secondary">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-dark-muted border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-semibold text-text-primary">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        className="w-8 h-8 rounded-lg bg-dark-muted border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all active:scale-95',
                      added
                        ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                        : 'btn-primary',
                      product.stock === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {added ? 'Added to Cart!' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => product && toggleWishlist(product.id)}
                    className={cn(
                      'w-12 h-12 rounded-xl border flex items-center justify-center transition-all active:scale-95',
                      product && isWishlisted(product.id)
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'border-dark-border text-text-muted hover:text-red-400 hover:border-red-500/30'
                    )}
                    title={product && isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={cn('w-5 h-5', product && isWishlisted(product.id) && 'fill-red-400')} />
                  </button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Truck, text: 'Free Shipping', sub: 'On orders over $75' },
                  { icon: Shield, text: '1-Year Warranty', sub: 'Manufacturer guarantee' },
                  { icon: RotateCcw, text: '30-Day Returns', sub: 'Hassle-free returns' },
                  { icon: Package, text: 'Secure Packaging', sub: 'Ships same day' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 bg-dark-muted/50 rounded-xl p-3">
                    <item.icon className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{item.text}</p>
                      <p className="text-xs text-text-muted">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews section placeholder */}
          <div className="mt-16 border-t border-dark-border pt-12">
            <h2 className="font-heading font-bold text-2xl text-text-primary mb-6">Customer Reviews</h2>

            {/* Rating breakdown */}
            <div className="flex gap-8 items-start flex-wrap">
              <div className="text-center">
                <p className="font-heading font-bold text-6xl text-text-primary">{product.rating.toFixed(1)}</p>
                <div className="flex justify-center gap-0.5 my-2">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-5 h-5', s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-border')} />
                  ))}
                </div>
                <p className="text-text-muted text-sm">{product.review_count.toLocaleString()} reviews</p>
              </div>

              <div className="flex-1 min-w-48 space-y-2">
                {[5,4,3,2,1].map((stars, i) => {
                  const widths = ['72%', '18%', '6%', '2%', '2%']
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-xs text-text-muted w-3">{stars}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-dark-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                          style={{ width: widths[i] }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-8">{widths[i]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-text-muted text-sm mt-6 italic">
              Connect Supabase to load and submit real reviews in Phase 5.
            </p>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
