import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton'
import { getProducts } from '@/lib/products'
import { useWishlist } from '@/lib/useWishlist'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { useSearchParams } from 'react-router-dom'

const CATEGORIES = ['phones', 'laptops', 'audio', 'tvs', 'monitors', 'cameras', 'appliances']
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
]

const PAGE_SIZE = 12

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000])
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState<string>(searchParams.get('sort') || 'featured')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const { isWishlisted, toggleWishlist } = useWishlist()

  const fetchProducts = useCallback(async (reset = false) => {
    setLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const data = await getProducts({
        category: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 3000 ? priceRange[1] : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sort: sort as 'featured' | 'price_asc' | 'price_desc' | 'top_rated' | 'newest',
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      })

      if (reset) {
        setProducts(data)
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCategories, priceRange, minRating, sort, page])

  useEffect(() => {
    fetchProducts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, priceRange, minRating, sort])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
    fetchProducts(false)
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-text-primary mb-3 text-sm">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-dark-border bg-dark-muted accent-blue-500"
              />
              <span className={cn(
                'text-sm capitalize transition-colors',
                selectedCategories.includes(cat) ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
              )}>
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-dark-border pt-6">
        <h3 className="font-heading font-semibold text-text-primary mb-3 text-sm">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}{priceRange[1] >= 3000 ? '+' : ''}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3000}
            step={50}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-dark-border pt-6">
        <h3 className="font-heading font-semibold text-text-primary mb-3 text-sm">Minimum Rating</h3>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-pill border transition-all',
                minRating === r
                  ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400'
                  : 'border-dark-border text-text-muted hover:border-white/20'
              )}
            >
              {r === 0 ? 'Any' : `${r}★+`}
            </button>
          ))}
        </div>
      </div>

      {(selectedCategories.length > 0 || priceRange[1] < 3000 || minRating > 0) && (
        <button
          onClick={() => { setSelectedCategories([]); setPriceRange([0, 3000]); setMinRating(0) }}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-text-primary mb-1">All Products</h1>
            <p className="text-text-muted">
              {loading ? 'Loading...' : `${products.length}${hasMore ? '+' : ''} products`}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Sidebar — desktop */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0">

              {/* Top bar */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <button
                  onClick={() => setFilterOpen(prev => !prev)}
                  className="lg:hidden flex items-center gap-2 btn-ghost text-sm px-4 py-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {(selectedCategories.length + (priceRange[1] < 3000 ? 1 : 0) + (minRating > 0 ? 1 : 0)) > 0 && (
                    <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      {selectedCategories.length + (priceRange[1] < 3000 ? 1 : 0) + (minRating > 0 ? 1 : 0)}
                    </span>
                  )}
                </button>

                <div className="relative ml-auto">
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="appearance-none bg-dark-muted border border-dark-border rounded-xl px-4 py-2.5 pr-8 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Mobile filter drawer */}
              {filterOpen && (
                <div className="lg:hidden bg-dark-card border border-dark-border rounded-xl p-5 mb-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-text-primary">Filters</h3>
                    <button onClick={() => setFilterOpen(false)}>
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>
                  <FilterSidebar />
                </div>
              )}

              {/* Active filters */}
              {selectedCategories.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {selectedCategories.map(cat => (
                    <span
                      key={cat}
                      className="badge-blue flex items-center gap-1.5 cursor-pointer hover:bg-blue-500/25"
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                      <X className="w-3 h-3" />
                    </span>
                  ))}
                </div>
              )}

              {/* Grid */}
              {loading && products.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="text-5xl">🔍</div>
                  <h3 className="font-heading font-semibold text-text-primary">No products found</h3>
                  <p className="text-text-muted text-sm text-center max-w-xs">
                    Try adjusting your filters or browse a different category.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isWishlisted={isWishlisted(product.id)}
                        onWishlistToggle={toggleWishlist}
                      />
                    ))}
                    {loading && Array.from({ length: 3 }).map((_, i) => (
                      <ProductCardSkeleton key={`sk-${i}`} />
                    ))}
                  </div>

                  {hasMore && !loading && (
                    <div className="text-center mt-10">
                      <button onClick={loadMore} className="btn-ghost px-8">
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
