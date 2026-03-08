import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package, AlertCircle } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORIES = ['all', 'phones', 'laptops', 'audio', 'tvs', 'monitors', 'cameras', 'appliances']

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase.from('products').select('*').order('created_at', { ascending: false })
      if (category !== 'all') q = q.eq('category', category)
      if (search) q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      const { data, error: err } = await q
      if (err) throw err
      setProducts((data as Product[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const { error: err } = await supabase.from('products').delete().eq('id', id)
      if (err) throw err
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const BADGE_COLORS: Record<string, string> = {
    phones: 'bg-blue-100 text-blue-700', laptops: 'bg-purple-100 text-purple-700',
    audio: 'bg-green-100 text-green-700', tvs: 'bg-orange-100 text-orange-700',
    monitors: 'bg-cyan-100 text-cyan-700', cameras: 'bg-pink-100 text-pink-700',
    appliances: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl text-text-primary">Products</h1>
            <p className="text-text-muted text-sm">{products.length} product{products.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 self-start"
            style={{ background: '#E31A2D', boxShadow: '0 2px 10px rgba(227,26,45,0.3)' }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-brand-red/20 text-brand-red text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-brand-red/60 hover:text-brand-red">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-dark pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize',
                  category === cat
                    ? 'text-white border-brand-red'
                    : 'border-dark-border text-text-muted hover:text-text-primary bg-white'
                )}
                style={category === cat ? { background: '#E31A2D' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
          {loading ? (
            <div className="divide-y" style={{ borderColor: '#D9E1EB' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: '#EEF2F7' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded" style={{ background: '#EEF2F7' }} />
                    <div className="h-3 w-72 rounded" style={{ background: '#EEF2F7' }} />
                  </div>
                  <div className="h-4 w-16 rounded" style={{ background: '#EEF2F7' }} />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg" style={{ background: '#EEF2F7' }} />
                    <div className="w-8 h-8 rounded-lg" style={{ background: '#EEF2F7' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}>
                <Package className="w-7 h-7 text-text-muted" />
              </div>
              <div className="text-center">
                <p className="font-heading font-semibold text-text-primary mb-1">No products found</p>
                <p className="text-text-muted text-sm">
                  {search || category !== 'all' ? 'Try adjusting your filters' : 'Add your first product to get started'}
                </p>
              </div>
              {!search && category === 'all' && (
                <Link to="/admin/products/new" className="btn-primary text-sm px-4 py-2">
                  Add Product
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F6F8FA', borderBottom: '1px solid #D9E1EB' }}>
                    {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-text-muted px-5 py-3 first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#D9E1EB' }}>
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-dark-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                          >
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-text-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate max-w-[180px]">{product.name}</p>
                            <p className="text-xs text-text-muted truncate max-w-[180px]">{product.description?.slice(0, 50)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full capitalize', BADGE_COLORS[product.category] || 'bg-gray-100 text-gray-700')}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-brand-price">{formatPrice(product.price)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-sm font-medium', product.stock <= 5 ? 'text-brand-red' : 'text-text-primary')}>
                          {product.stock}
                          {product.stock <= 5 && <span className="text-xs ml-1">(low)</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-yellow-600 font-medium">{product.rating.toFixed(1)} ★</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-header transition-all hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-brand-red transition-all hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,28,63,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ border: '1px solid #D9E1EB', boxShadow: '0 16px 48px rgba(0,28,63,0.15)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEE2E2' }}>
              <Trash2 className="w-6 h-6 text-brand-red" />
            </div>
            <h3 className="font-heading font-bold text-text-primary text-center mb-2">Delete Product?</h3>
            <p className="text-text-muted text-sm text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border text-text-secondary hover:bg-dark-muted transition-all"
                style={{ borderColor: '#D9E1EB' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: '#E31A2D' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
