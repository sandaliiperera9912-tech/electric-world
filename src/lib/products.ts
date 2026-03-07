import { supabase } from './supabase'
import type { Product } from '@/types'

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'top_rated' | 'newest'
  limit?: number
  offset?: number
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from('products').select('*')

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.minRating !== undefined) {
    query = query.gte('rating', filters.minRating)
  }

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'top_rated':
      query = query.order('rating', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('review_count', { ascending: false })
  }

  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return (data as Product[]) || []
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data as Product
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', slug)
    .order('review_count', { ascending: false })
  if (error) throw error
  return (data as Product[]) || []
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('rating', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data as Product[]) || []
}
