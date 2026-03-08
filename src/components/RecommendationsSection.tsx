import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Zap } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { formatPrice } from '@/lib/utils'
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
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' })
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-bold text-2xl text-text-primary flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-red" strokeWidth={2.5} />
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-text-muted hover:text-text-primary"
            style={{ border: '1px solid #D9E1EB', background: '#FFFFFF' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-text-muted hover:text-text-primary"
            style={{ border: '1px solid #D9E1EB', background: '#FFFFFF' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {products.map(product => (
          <div
            key={product.id}
            className="shrink-0 w-56 rounded-card p-4 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 bg-white"
            style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div
              className="h-32 rounded-xl flex items-center justify-center mb-3 overflow-hidden"
              style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
            >
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-10 h-10 text-brand-header/20 group-hover:text-brand-header/40 transition-colors" />
              )}
            </div>

            <p className="font-heading font-semibold text-text-primary text-sm line-clamp-2 mb-1 group-hover:text-brand-red transition-colors">
              {product.name}
            </p>

            {product.reason && (
              <p className="text-xs text-text-muted line-clamp-2 mb-2 leading-relaxed">{product.reason}</p>
            )}

            <div className="flex items-center gap-1 mb-3">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-text-muted">{product.rating.toFixed(1)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-brand-price text-sm">{formatPrice(product.price)}</span>
              <button
                onClick={e => { e.stopPropagation(); addItem(product) }}
                className="p-1.5 rounded-lg bg-brand-red text-white hover:bg-brand-red-dark transition-all active:scale-95"
                style={{ boxShadow: '0 2px 6px rgba(227,26,45,0.3)' }}
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
