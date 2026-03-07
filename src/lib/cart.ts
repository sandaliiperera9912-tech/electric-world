import { supabase } from './supabase'
import type { CartItem } from '@/types'

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (cartError || !cart) return []

  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('cart_id', cart.id)

  if (error) throw error
  return (data as CartItem[]) || []
}

async function getOrCreateCart(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) return existing.id

  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single()

  if (error) throw error
  return newCart.id
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const cartId = await getOrCreateCart(userId)

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, product_id: productId, quantity })
    if (error) throw error
  }
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
  if (error) throw error
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
  if (error) throw error
}

export async function clearCart(userId: string) {
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (cart) {
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id)
    if (error) throw error
  }
}
