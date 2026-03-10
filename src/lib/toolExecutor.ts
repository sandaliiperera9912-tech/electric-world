import { searchProducts } from './products'
import { supabase } from './supabase'
import { STATIC_PRODUCTS, searchStaticProducts, findStaticProduct } from './staticProducts'
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

        // Try Supabase first, fall back to static products
        let products: Product[] = []
        try {
          products = await searchProducts(query)
        } catch {
          // DB not available — use static
        }

        // If DB returned nothing, fall back to static catalog
        if (products.length === 0) {
          products = searchStaticProducts(query)
          // Still nothing — return full catalog for broad queries
          if (products.length === 0) {
            products = [...STATIC_PRODUCTS]
          }
        }

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

        let product: Product | null = null

        // 1. Try Supabase by UUID
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single()
          if (!error && data) product = data as Product
        } catch {
          // DB not available
        }

        // 2. Fall back to static products
        if (!product) {
          product = findStaticProduct(productId) ?? null
        }

        // 3. Last resort — search by productId as a name keyword
        if (!product) {
          const matches = searchStaticProducts(productId)
          if (matches.length > 0) product = matches[0]
        }

        if (!product) {
          return {
            success: false,
            message: `Sorry, I couldn't find that product. Try asking me to search for it first!`,
          }
        }

        addToCartFn(product, quantity as number)

        return {
          success: true,
          data: product,
          message: `Added **${product.name}** ×${quantity} to your cart ✓`,
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

        const selectQuery = 'id, status, total, created_at, order_items(quantity, product_name, price_at_purchase)'

        let query = supabase
          .from('orders')
          .select(selectQuery)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (orderId) {
          query = supabase
            .from('orders')
            .select(selectQuery)
            .eq('id', orderId)
            .eq('user_id', userId)
            .limit(1)
        }

        const { data: orders, error } = await query
        if (error || !orders || orders.length === 0) {
          return { success: true, data: [], message: "I couldn't find any orders for your account." }
        }

        const lines = orders.map((o: Record<string, unknown>) => {
          const items = Array.isArray(o.order_items) ? o.order_items : []
          const dateStr = new Date(o.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const itemNames = items.slice(0, 2).map((i: Record<string, unknown>) => i.product_name ?? 'Item').join(', ')
          const moreItems = items.length > 2 ? ` +${items.length - 2} more` : ''
          return `- Order **#${(o.id as string).slice(0, 8).toUpperCase()}** · ${dateStr}\n  Status: **${o.status}** · Total: **$${Number(o.total).toFixed(2)}**\n  Items: ${itemNames}${moreItems}`
        })

        return {
          success: true,
          data: orders,
          message: `Here are your recent orders:\n\n${lines.join('\n\n')}`,
        }
      }

      case 'compare_products': {
        const { productNames } = toolArgs as { productNames: string[] }

        const foundProducts: Product[] = []

        for (const nameOrId of productNames.slice(0, 4)) {
          let product: Product | null = null

          // Try Supabase by name (ilike search)
          try {
            const { data } = await supabase
              .from('products')
              .select('*')
              .ilike('name', `%${nameOrId}%`)
              .limit(1)
              .single()
            if (data) product = data as Product
          } catch { /* fallback */ }

          // Fall back to static products
          if (!product) {
            const matches = searchStaticProducts(nameOrId)
            if (matches.length > 0) product = matches[0]
          }

          if (product) foundProducts.push(product)
        }

        if (foundProducts.length < 2) {
          return {
            success: false,
            message: `I could only find ${foundProducts.length} of the products you mentioned. Could you be more specific with the product names?`,
          }
        }

        // Build comparison table
        const header = `| Feature | ${foundProducts.map(p => `**${p.name}**`).join(' | ')} |`
        const separator = `|---------|${foundProducts.map(() => '---------|').join('')}`
        const priceRow = `| 💰 Price | ${foundProducts.map(p => `$${p.price.toFixed(2)}`).join(' | ')} |`
        const ratingRow = `| ⭐ Rating | ${foundProducts.map(p => `${p.rating ?? 'N/A'}★ (${p.review_count ?? 0} reviews)`).join(' | ')} |`
        const categoryRow = `| 📦 Category | ${foundProducts.map(p => p.category).join(' | ')} |`
        const stockRow = `| 🏪 Stock | ${foundProducts.map(p => p.stock > 0 ? `${p.stock} units` : 'Out of stock').join(' | ')} |`

        const table = [header, separator, priceRow, ratingRow, categoryRow, stockRow].join('\n')

        // Pick best value recommendation
        const bestValue = foundProducts.reduce((best, p) =>
          (p.rating ?? 0) / p.price > (best.rating ?? 0) / best.price ? p : best
        )

        return {
          success: true,
          data: { products: foundProducts, isComparison: true },
          message: `Here's a side-by-side comparison:\n\n${table}\n\n**My Pick:** **${bestValue.name}** — best value for money at $${bestValue.price.toFixed(2)} with a ${bestValue.rating}★ rating.`,
        }
      }

      case 'redirect_to_checkout': {
        return {
          success: true,
          action: 'redirect',
          path: '/checkout',
          message: 'Taking you to checkout now 🛒 Your cart items are ready!',
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
