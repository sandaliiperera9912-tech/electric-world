import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, Star, Smartphone, Laptop, Headphones, Tv, Monitor, Camera, Home, Package } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { cn, formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phones: Smartphone, laptops: Laptop, audio: Headphones,
  tvs: Tv, monitors: Monitor, cameras: Camera, appliances: Home,
}

const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'badge-blue',
  'New': 'badge-purple',
  'Top Rated': 'badge-orange',
  'Deal': 'badge-green',
}

interface ProductCardProps {
  product: Product
  onWishlistToggle?: (productId: string) => void
  isWishlisted?: boolean
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted = false }: ProductCardProps) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const CategoryIcon = CATEGORY_ICONS[product.category] || Package

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    onWishlistToggle?.(product.id)
  }

  return (
    <div
      className="product-card group flex flex-col h-full"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative h-44 rounded-xl bg-dark-muted mb-4 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <CategoryIcon className="w-16 h-16 text-dark-border group-hover:text-text-muted transition-colors duration-300" />
        )}

        {product.badge && (
          <span className={cn('absolute top-3 left-3', BADGE_STYLES[product.badge] || 'badge-blue')}>
            {product.badge}
          </span>
        )}

        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 badge bg-red-500/15 text-red-400 border border-red-500/20">
            Only {product.stock} left
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-dark-bg/70 flex items-center justify-center rounded-xl">
            <span className="badge bg-dark-muted border border-dark-border text-text-muted">Out of Stock</span>
          </div>
        )}

        {/* Wishlist button */}
        {onWishlistToggle && (
          <button
            onClick={handleWishlist}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              'opacity-0 group-hover:opacity-100',
              isWishlisted
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : 'bg-dark-muted border border-dark-border text-text-muted hover:text-red-400'
            )}
            aria-label="Toggle wishlist"
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-red-400')} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2">
        <p className="text-xs text-text-muted capitalize font-medium tracking-wide">{product.category}</p>
        <h3 className="font-heading font-semibold text-text-primary text-sm leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-text-muted leading-relaxed line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                className={cn('w-3.5 h-3.5', s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-border')}
              />
            ))}
          </div>
          <span className="text-xs text-text-muted">
            {product.rating.toFixed(1)} ({product.review_count.toLocaleString()})
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-dark-border">
          <div>
            <span className="font-heading font-bold text-text-primary">{formatPrice(product.price)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95',
              added
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400',
              product.stock === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
