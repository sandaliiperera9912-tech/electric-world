import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, Zap } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useAuth } from '@/store/authContext'
import { useCart } from '@/store/cartContext'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { WishlistItem } from '@/types'

export default function WishlistPage() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('wishlists')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setWishlist((data as WishlistItem[]) || [])
        setLoading(false)
      })
  }, [user])

  const removeFromWishlist = async (itemId: string) => {
    await supabase.from('wishlists').delete().eq('id', itemId)
    setWishlist(prev => prev.filter(w => w.id !== itemId))
  }

  const moveToCart = (item: WishlistItem) => {
    if (item.product) addItem(item.product)
    removeFromWishlist(item.id)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-8 flex items-center gap-3">
            <Heart className="w-7 h-7 text-red-400" />
            My Wishlist
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-dark-card border border-dark-border rounded-card h-64 animate-pulse" />
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-24 h-24 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                <Heart className="w-12 h-12 text-text-muted" />
              </div>
              <div className="text-center">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-2">Your wishlist is empty</h2>
                <p className="text-text-muted text-sm">Save items you love by clicking the ❤️ icon on any product.</p>
              </div>
              <Link to="/products" className="btn-primary flex items-center gap-2">
                <Zap className="w-4 h-4" strokeWidth={2.5} />
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlist.map(item => (
                <div key={item.id} className="bg-dark-card border border-dark-border rounded-card p-4 flex flex-col gap-3">
                  <Link to={`/products/${item.product_id}`} className="block">
                    <div className="h-40 rounded-xl bg-dark-muted flex items-center justify-center overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Zap className="w-10 h-10 text-text-muted" />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1">
                    <p className="text-xs text-text-muted capitalize mb-1">{item.product?.category}</p>
                    <Link to={`/products/${item.product_id}`} className="font-heading font-semibold text-text-primary hover:text-blue-400 transition-colors text-sm line-clamp-2">
                      {item.product?.name}
                    </Link>
                    <p className="font-heading font-bold text-text-primary mt-2">
                      {item.product ? formatPrice(item.product.price) : '—'}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => moveToCart(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="w-10 h-10 rounded-xl border border-dark-border text-text-muted hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
