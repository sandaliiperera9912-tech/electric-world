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
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal)
  const freeShippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-dark-card border-l border-dark-border flex flex-col shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
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

        {/* Content */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-20 h-20 rounded-full bg-dark-muted flex items-center justify-center">
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
              <div className="px-6 py-3 bg-blue-500/5 border-b border-dark-border">
                <p className="text-xs text-text-secondary mb-2">
                  Add <span className="text-blue-400 font-semibold">{formatPrice(freeShippingRemaining)}</span> more for free shipping!
                </p>
                <div className="h-1.5 bg-dark-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="px-6 py-3 bg-green-500/5 border-b border-dark-border">
                <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> You qualify for free shipping!
                </p>
              </div>
            )}

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 items-start">
                  {/* Product image placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-dark-muted border border-dark-border flex items-center justify-center shrink-0 overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="w-6 h-6 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">{product.category}</p>
                    <p className="text-sm font-semibold text-blue-400 mt-1">{formatPrice(product.price)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-dark-muted border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/20 transition-all active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium text-text-primary w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQty(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-dark-muted border border-dark-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/20 transition-all active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => removeItem(product.id)}
                        className="ml-auto text-text-muted hover:text-red-400 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-dark-border px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-heading font-bold text-text-primary text-lg">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Shipping</span>
                <span className={cartTotal >= FREE_SHIPPING_THRESHOLD ? 'text-green-400' : 'text-text-muted'}>
                  {cartTotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-primary w-full text-center mt-1"
              >
                Checkout →
              </button>
              <button
                onClick={onClose}
                className="btn-ghost w-full text-center text-sm"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
