import { searchProducts } from './products'
import { supabase } from './supabase'
import type { CartItemLocal, Product } from '@/types'

interface ToolResult {
  success: boolean
  data?: unknown
  message?: string
  action?: string
  path?: string
}

export async function executeToolCall(
  toolName: string,
  toolArgs: Record<string, unknown>,
  userId: string | null,
  cartItems: CartItemLocal[],
  addToCartFn: (product: Product, qty?: number) => void
): Promise<ToolResult> {
  try {
    switch (toolName) {

      case 'search_products': {
        const { query, category, minPrice, maxPrice } = toolArgs as {
          query: string
          category?: string
          minPrice?: number
          maxPrice?: number
        }
        const products = await searchProducts(query)
        const filtered = products
          .filter(p => !category || p.category === category)
          .filter(p => !minPrice || p.price >= minPrice)
          .filter(p => !maxPrice || p.price <= maxPrice)
          .slice(0, 5)

        return {
          success: true,
          data: filtered,
          message: filtered.length === 0
            ? `No products found for "${query}"`
            : `Found ${filtered.length} products matching "${query}"`,
        }
      }

      case 'add_to_cart': {
        const { productId, quantity = 1 } = toolArgs as { productId: string; quantity?: number }

        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error || !product) {
          return { success: false, message: 'Product not found.' }
        }

        addToCartFn(product as Product, quantity as number)

        return {
          success: true,
          data: product,
          message: `Added **${(product as Product).name}** (×${quantity}) to your cart ✓`,
        }
      }

      case 'get_cart_items': {
        if (cartItems.length === 0) {
          return { success: true, data: [], message: 'Your cart is currently empty.' }
        }
        const summary = cartItems
          .map(i => `- **${i.product.name}** ×${i.quantity} — $${(i.product.price * i.quantity).toFixed(2)}`)
          .join('\n')
        const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
        return {
          success: true,
          data: cartItems,
          message: `Your cart (${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}):\n${summary}\n\n**Total: $${total.toFixed(2)}**`,
        }
      }

      case 'get_order_status': {
        if (!userId) {
          return { success: false, message: 'Please sign in to view your orders.' }
        }
        const { orderId } = toolArgs as { orderId?: string }

        let query = supabase
          .from('orders')
          .select('id, status, total, created_at, items:order_items(id)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (orderId) {
          query = supabase
            .from('orders')
            .select('id, status, total, created_at, items:order_items(id)')
            .eq('id', orderId)
            .eq('user_id', userId)
            .limit(1)
        }

        const { data: orders, error } = await query
        if (error || !orders || orders.length === 0) {
          return { success: true, data: [], message: "I couldn't find any orders for your account." }
        }

        const lines = orders.map((o: Record<string, unknown>) => {
          const items = Array.isArray(o.items) ? o.items : []
          const dateStr = new Date(o.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return `- Order **#${(o.id as string).slice(0, 8).toUpperCase()}** (${dateStr}) — **${o.status}** — $${Number(o.total).toFixed(2)} (${items.length} item${items.length !== 1 ? 's' : ''})`
        })

        return {
          success: true,
          data: orders,
          message: `Here are your recent orders:\n${lines.join('\n')}`,
        }
      }

      case 'redirect_to_checkout': {
        return {
          success: true,
          action: 'redirect',
          path: '/checkout',
          message: "Taking you to checkout now 🛒 Your cart items are ready!",
        }
      }

      default:
        return { success: false, message: `Unknown tool: ${toolName}` }
    }
  } catch (err) {
    return {
      success: false,
      message: `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}
