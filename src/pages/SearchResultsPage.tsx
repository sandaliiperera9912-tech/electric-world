import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Smartphone, Laptop, Headphones, Tv, Monitor, Camera, Home } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton'
import { searchProducts } from '@/lib/products'
import type { Product } from '@/types'

const SUGGESTED_CATEGORIES = [
  { label: 'Phones', slug: 'phones', icon: Smartphone },
  { label: 'Laptops', slug: 'laptops', icon: Laptop },
  { label: 'Audio', slug: 'audio', icon: Headphones },
  { label: 'TVs', slug: 'tvs', icon: Tv },
  { label: 'Monitors', slug: 'monitors', icon: Monitor },
  { label: 'Cameras', slug: 'cameras', icon: Camera },
  { label: 'Appliances', slug: 'appliances', icon: Home },
]

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setProducts([])
      return
    }
    setLoading(true)
    searchProducts(query)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8">
            {query ? (
              <>
                <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                  <Search className="w-4 h-4" />
                  Search results for
                </div>
                <h1 className="font-heading font-bold text-3xl text-text-primary">
                  "{query}"
                </h1>
                {!loading && (
                  <p className="text-text-muted mt-1">
                    {products.length === 0 ? 'No results found' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
                  </p>
                )}
              </>
            ) : (
              <h1 className="font-heading font-bold text-3xl text-text-primary">Search Products</h1>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-heading font-semibold text-xl text-text-primary mb-2">
                  {query ? `No results for "${query}"` : 'Enter a search term'}
                </h3>
                <p className="text-text-muted text-sm max-w-sm">
                  {query
                    ? "Try different keywords, or browse a category below."
                    : "Use the search bar above to find electronics."}
                </p>
              </div>

              <div>
                <p className="text-text-muted text-sm text-center mb-4">Browse by category</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {SUGGESTED_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <Link
                        key={cat.slug}
                        to={`/category/${cat.slug}`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-border text-text-secondary hover:text-text-primary hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-sm font-medium"
                      >
                        <Icon className="w-4 h-4 text-blue-400" />
                        {cat.label}
                      </Link>
                    )
                  })}
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
