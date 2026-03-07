import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Smartphone, Laptop, Headphones, Tv, Monitor, Camera, Home, Package } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import ProductCard from '@/components/ProductCard'
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton'
import { getProductsByCategory } from '@/lib/products'
import type { Product } from '@/types'

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  phones:     { label: 'Smartphones', icon: Smartphone, desc: 'The latest smartphones with cutting-edge cameras, processors, and features.' },
  laptops:    { label: 'Laptops', icon: Laptop, desc: 'From ultrabooks to gaming powerhouses — laptops for every use case.' },
  audio:      { label: 'Audio', icon: Headphones, desc: 'Headphones, earbuds, and speakers for audiophiles and casual listeners alike.' },
  tvs:        { label: 'TVs', icon: Tv, desc: 'OLED, QLED, and LED TVs in sizes from 43" to 85" with 4K and 8K resolution.' },
  monitors:   { label: 'Monitors', icon: Monitor, desc: 'Gaming monitors, ultrawide displays, and professional colour-accurate screens.' },
  cameras:    { label: 'Cameras & Drones', icon: Camera, desc: 'DSLRs, mirrorless cameras, action cameras, and professional drones.' },
  appliances: { label: 'Home Appliances', icon: Home, desc: 'Smart vacuums, air purifiers, kitchen appliances, and more for your home.' },
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const meta = slug ? CATEGORY_META[slug] : null

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getProductsByCategory(slug)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug])

  if (!meta) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <p className="text-text-muted">Category not found.</p>
          <Link to="/products" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">Browse all products</Link>
        </div>
        <ChatWidget />
      </div>
    )
  }

  const { label, icon: Icon, desc } = meta

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
            <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-text-primary transition-colors">Products</Link>
            <span>/</span>
            <span className="text-text-primary">{label}</span>
          </nav>

          {/* Category banner */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="flex items-center gap-5 relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Icon className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-3xl text-text-primary mb-1">{label}</h1>
                <p className="text-text-muted max-w-xl">{desc}</p>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="font-heading font-bold text-2xl text-text-primary">{loading ? '—' : products.length}</p>
                <p className="text-text-muted text-sm">Products</p>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Package className="w-12 h-12 text-text-muted" />
              <h3 className="font-heading font-semibold text-text-primary">No products yet</h3>
              <p className="text-text-muted text-sm">Seed the database in Phase 3 to see products here.</p>
              <Link to="/products" className="btn-ghost text-sm px-5 py-2.5">Browse All Products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
