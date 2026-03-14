import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from '@/store/authContext'

export function useWishlist() {
  const { user } = useAuth()
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Load wishlist product IDs for the logged-in user
  useEffect(() => {
    if (!user) { setWishlistIds(new Set()); return }
    setLoading(true)
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setWishlistIds(new Set(data.map((r: { product_id: string }) => r.product_id)))
      })
      .finally(() => setLoading(false))
  }, [user])

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  )

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) return

    if (wishlistIds.has(productId)) {
      // Remove
      setWishlistIds(prev => { const s = new Set(prev); s.delete(productId); return s })
      await supabase.from('wishlists').delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
    } else {
      // Add
      setWishlistIds(prev => new Set(prev).add(productId))
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })
    }
  }, [user, wishlistIds])

  return { isWishlisted, toggleWishlist, wishlistIds, loading }
}
