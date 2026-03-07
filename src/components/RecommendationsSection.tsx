import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Zap } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types'

interface RecommendedProduct extends Product {
  reason?: string
}

interface RecommendationsSectionProps {
  title?: string
  products: RecommendedProduct[]
}

export default function RecommendationsSection({
  title = 'You might also like',
  products,
}: RecommendationsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()
  const navigate = useNavigate()

  if (products.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 280
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-bold text-2xl text-text-primary flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-xl border border-dark-border text-text-muted hover:text-text-primary hover:border-white/20 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-xl border border-dark-border text-text-muted hover:text-text-primary hover:border-white/20 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
      >
        {products.map(product => (
          <div
            key={product.id}
            className="shrink-0 w-56 bg-dark-card border border-dark-border rounded-card p-4 cursor-pointer group hover:-translate-y-0.5 hover:border-blue-500/30 transition-all duration-200"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="h-32 rounded-xl bg-dark-muted flex items-center justify-center mb-3 overflow-hidden">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-10 h-10 text-dark-border group-hover:text-text-muted transition-colors" />
              )}
            </div>

            <p className="font-heading font-semibold text-text-primary text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
              {product.name}
            </p>

            {product.reason && (
              <p className="text-xs text-text-muted line-clamp-2 mb-2 leading-relaxed">{product.reason}</p>
            )}

            <div className="flex items-center gap-1 mb-3">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-text-muted">{product.rating.toFixed(1)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-text-primary text-sm">{formatPrice(product.price)}</span>
              <button
                onClick={e => { e.stopPropagation(); addItem(product) }}
                className={cn(
                  'p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400',
                  'hover:bg-blue-500/20 transition-all active:scale-95'
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
