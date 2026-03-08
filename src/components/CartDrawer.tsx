import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, ShoppingCart, Plus, Minus, Trash2, Zap } from 'lucide-react'
import { useCart } from '@/store/cartContext'
import { formatPrice } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

const FREE_SHIPPING_THRESHOLD = 75

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cartItems, removeItem, updateQty, cartTotal, cartCount } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal)
  const freeShippingProgress   = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 animate-fade-in"
        style={{ background: 'rgba(0,28,63,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl animate-slide-up"
        style={{ background: '#FFFFFF', borderLeft: '1px solid #D9E1EB' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #D9E1EB' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-red" />
            <h2 className="font-heading font-semibold text-text-primary text-lg">
              Cart
              {cartCount > 0 && (
                <span className="ml-2 text-sm font-normal text-text-muted">
                  ({cartCount} item{cartCount !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-dark-muted transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Empty state */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
            >
              <ShoppingCart className="w-10 h-10 text-text-muted" />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-semibold text-text-primary mb-1">Your cart is empty</h3>
              <p className="text-text-muted text-sm">Add some electronics to get started!</p>
            </div>
            <Link
              to="/products"
              onClick={onClose}
              className="btn-primary text-sm px-5 py-2.5 rounded-xl"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping bar */}
            {freeShippingRemaining > 0 ? (
              <div className="px-6 py-3" style={{ background: '#F6F8FA', borderBottom: '1px solid #D9E1EB' }}>
                <p className="text-xs text-text-secondary mb-2">
                  Add <span className="text-brand-red font-semibold">{formatPrice(freeShippingRemaining)}</span> more for free shipping!
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#D9E1EB' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%`, background: '#E31A2D' }}
                  />
                </div>
              </div>
            ) : (
              <div className="px-6 py-3" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> You qualify for free shipping!
                </p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                  >
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="w-6 h-6 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">{product.category}</p>
                    <p className="text-sm font-bold text-brand-price mt-1">{formatPrice(product.price)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"
                        style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold text-text-primary w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQty(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-all active:scale-95"
                        style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="ml-auto text-text-muted hover:text-brand-red transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <p className="text-sm font-bold text-text-primary">{formatPrice(product.price * quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 space-y-3" style={{ borderTop: '1px solid #D9E1EB' }}>
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Subtotal</span>
                <span className="font-heading font-bold text-text-primary text-xl">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Shipping</span>
                <span className={cartTotal >= FREE_SHIPPING_THRESHOLD ? 'text-green-600 font-medium' : 'text-text-muted'}>
                  {cartTotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>
              <button
                onClick={() => { onClose(); navigate('/checkout') }}
                className="btn-primary w-full text-center mt-1"
              >
                Checkout →
              </button>
              <button onClick={onClose} className="btn-ghost w-full text-center text-sm">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
