import { supabase } from './supabase'
import { openaiClient, AI_MODEL } from './openai'
import type { Product } from '@/types'

interface RecommendedProduct extends Product {
  reason: string
}

export async function getRecommendations(
  productId: string,
  userId: string | null
): Promise<RecommendedProduct[]> {
  try {
    // Get the base product
    const { data: baseProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!baseProduct) return []

    const bp = baseProduct as Product

    // Get same-category products within ±30% price range (excluding the current product)
    const minPrice = bp.price * 0.7
    const maxPrice = bp.price * 1.3

    let query = supabase
      .from('products')
      .select('*')
      .eq('category', bp.category)
      .neq('id', productId)
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('rating', { ascending: false })
      .limit(8)

    // Exclude products user has already ordered
    if (userId) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .in(
          'order_id',
          (await supabase.from('orders').select('id').eq('user_id', userId)).data?.map(o => o.id) || []
        )
      const orderedIds = orderItems?.map(oi => oi.product_id) || []
      if (orderedIds.length > 0) {
        query = query.not('id', 'in', `(${orderedIds.join(',')})`)
      }
    }

    const { data: candidates } = await query
    if (!candidates || candidates.length === 0) {
      return await getFallbackRecommendations(bp.category, productId)
    }

    const products = candidates as Product[]

    // Use OpenAI to select the best 4 and generate reasons
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY
    if (!hasOpenAI || products.length <= 4) {
      return products.slice(0, 4).map(p => ({
        ...p,
        reason: `Similar ${p.category} in the same price range with ${p.rating}★ rating`,
      }))
    }

    const productList = products.map(p => `ID: ${p.id} | ${p.name} | $${p.price} | ${p.rating}★`).join('\n')

    const aiResponse = await openaiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a product recommendation expert for an electronics store. Select the best 4 products and give a one-line reason for each.',
        },
        {
          role: 'user',
          content: `Customer viewed: **${bp.name}** ($${bp.price})\n\nChoose the best 4 from these alternatives and give a compelling one-line reason:\n${productList}\n\nRespond with JSON array: [{"id": "...", "reason": "..."}]`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = aiResponse.choices[0].message.content || '{"recommendations":[]}'
    const parsed = JSON.parse(content) as { recommendations?: Array<{ id: string; reason: string }> }
    const recs = parsed.recommendations || []

    return recs
      .slice(0, 4)
      .map(rec => {
        const product = products.find(p => p.id === rec.id)
        if (!product) return null
        return { ...product, reason: rec.reason }
      })
      .filter(Boolean) as RecommendedProduct[]

  } catch (err) {
    console.error('Recommendations error:', err)
    return []
  }
}

async function getFallbackRecommendations(category: string, excludeId: string): Promise<RecommendedProduct[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .neq('id', excludeId)
    .order('review_count', { ascending: false })
    .limit(4)

  return (data as Product[] || []).map(p => ({
    ...p,
    reason: `Top-rated ${p.category} product with ${p.review_count.toLocaleString()} reviews`,
  }))
}

export async function getPersonalizedHomepage(userId: string | null): Promise<Product[]> {
  // If logged in, use order history + last viewed category
  const lastCategory = localStorage.getItem('ew_last_category')

  if (userId) {
    // Get recently ordered categories
    const { data: orders } = await supabase
      .from('orders')
      .select('items:order_items(product:products(category))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    const categories = new Set<string>()
    if (lastCategory) categories.add(lastCategory)

    orders?.forEach(o => {
      const items = (o as { items?: unknown[] }).items
      if (Array.isArray(items)) {
        items.forEach((item: unknown) => {
          const i = item as { product?: { category?: string } }
          if (i.product?.category) categories.add(i.product.category)
        })
      }
    })

    if (categories.size > 0) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('category', Array.from(categories))
        .order('rating', { ascending: false })
        .limit(8)
      if (data && data.length > 0) return data as Product[]
    }
  }

  // Fallback: bestsellers
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('review_count', { ascending: false })
    .limit(8)

  return (data as Product[]) || []
}
