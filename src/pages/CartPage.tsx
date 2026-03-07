import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, Zap, ArrowRight, Package } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useCart } from '@/store/cartContext'
import { formatPrice } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD = 75

export default function CartPage() {
  const { cartItems, removeItem, updateQty, cartTotal, cartCount } = useCart()
  const navigate = useNavigate()

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal)
  const freeShippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)
  const shipping = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Shopping Cart</h1>
          {cartCount > 0 && (
            <p className="text-text-muted mb-8">{cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
          )}

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-24 h-24 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-text-muted" />
              </div>
              <div className="text-center">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-2">Your cart is empty</h2>
                <p className="text-text-muted">Looks like you haven't added anything yet.</p>
              </div>
              <Link to="/products" className="btn-primary flex items-center gap-2">
                <Package className="w-4 h-4" />
                Browse Electronics
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">

              {/* Cart items */}
              <div className="lg:col-span-2 space-y-4">

                {/* Free shipping bar */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                  {freeShippingRemaining > 0 ? (
                    <>
                      <p className="text-sm text-text-secondary mb-2">
                        Add <span className="text-blue-400 font-semibold">{formatPrice(freeShippingRemaining)}</span> more for free shipping!
                      </p>
                      <div className="h-2 bg-dark-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-green-400 font-medium flex items-center gap-1.5">
                      <Zap className="w-4 h-4" strokeWidth={2.5} />
                      You qualify for free shipping!
                    </p>
                  )}
                </div>

                {/* Item list */}
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="bg-dark-card border border-dark-border rounded-xl p-5 flex gap-4">
                    <Link
                      to={`/products/${product.id}`}
                      className="w-20 h-20 rounded-xl bg-dark-muted border border-dark-border flex items-center justify-center shrink-0 overflow-hidden hover:border-blue-500/30 transition-all"
                    >
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Zap className="w-8 h-8 text-text-muted" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-text-muted capitalize mb-1">{product.category}</p>
                          <Link
                            to={`/products/${product.id}`}
                            className="font-heading font-semibold text-text-primary hover:text-blue-400 transition-colors line-clamp-2 text-sm"
                          >
                            {product.name}
                          </Link>
                        </div>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-text-muted hover:text-red-400 transition-colors p-1 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
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
                        </div>
                        <p className="font-heading font-bold text-text-primary">
                          {formatPrice(product.price * quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2">
                  <Link to="/products" className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 sticky top-24">
                  <h2 className="font-heading font-bold text-lg text-text-primary mb-5">Order Summary</h2>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal ({cartCount} items)</span>
                      <span className="text-text-primary font-medium">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Shipping</span>
                      <span className={shipping === 0 ? 'text-green-400 font-medium' : 'text-text-primary'}>
                        {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="border-t border-dark-border pt-3 flex justify-between">
                      <span className="font-heading font-semibold text-text-primary">Total</span>
                      <span className="font-heading font-bold text-xl text-text-primary">{formatPrice(cartTotal + shipping)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-4 mt-4 text-text-muted text-xs">
                    <span className="flex items-center gap-1">🔒 Secure checkout</span>
                    <span>·</span>
                    <span>Powered by Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
