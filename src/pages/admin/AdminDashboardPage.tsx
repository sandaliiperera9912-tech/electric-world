import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Star, TrendingUp, Plus, ArrowRight, Activity, Pencil, Trash2, Truck } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  avgRating: number
  byCategory: { category: string; count: number }[]
  recentProducts: { id: string; name: string; price: number; category: string; stock: number; rating: number }[]
}

interface LogEntry {
  id: string
  admin_name: string
  action: string
  target_name: string | null
  details: Record<string, string> | null
  created_at: string
}

const ACTION_META: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  create_product:       { label: 'Added product',   color: '#16a34a', Icon: Package },
  update_product:       { label: 'Updated product', color: '#1d4ed8', Icon: Pencil },
  delete_product:       { label: 'Deleted product', color: '#b91c1c', Icon: Trash2 },
  update_order_status:  { label: 'Order status →',  color: '#7c3aed', Icon: Truck },
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('admin_logs')
      .select('id, admin_name, action, target_name, details, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setLogs(data as LogEntry[]) })
      .finally(() => setLogsLoading(false))
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          supabase.from('products').select('id, name, price, category, stock, rating'),
          supabase.from('orders').select('total, status'),
        ])

        const products = productsRes.data || []
        const orders = ordersRes.data || []

        const byCategory = products.reduce<Record<string, number>>((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1
          return acc
        }, {})

        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
        const avgRating = products.length
          ? products.reduce((s, p) => s + (p.rating || 0), 0) / products.length
          : 0

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          avgRating,
          byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
          recentProducts: products.slice(0, 6),
        })
      } catch {
        setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, avgRating: 0, byCategory: [], recentProducts: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Products', value: stats?.totalProducts ?? '—', icon: Package, color: '#102E5A' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: '#E31A2D' },
    { label: 'Total Revenue', value: stats ? formatPrice(stats.totalRevenue) : '—', icon: TrendingUp, color: '#16a34a' },
    { label: 'Avg Rating', value: stats ? `${stats.avgRating.toFixed(1)} ★` : '—', icon: Star, color: '#d97706' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-text-primary">Dashboard</h1>
            <p className="text-text-muted text-sm mt-0.5">Welcome back, Admin</p>
          </div>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: '#E31A2D', boxShadow: '0 2px 10px rgba(227,26,45,0.3)' }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-5" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 w-10 rounded-xl" style={{ background: '#EEF2F7' }} />
                  <div className="h-7 w-16 rounded-lg" style={{ background: '#EEF2F7' }} />
                  <div className="h-3 w-20 rounded" style={{ background: '#EEF2F7' }} />
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${card.color}15` }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <p className="font-heading font-bold text-2xl text-text-primary">{card.value}</p>
                  <p className="text-text-muted text-xs mt-1">{card.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Products */}
          <div className="lg:col-span-2 bg-white rounded-xl" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #D9E1EB' }}>
              <h2 className="font-heading font-semibold text-text-primary">Products</h2>
              <Link to="/admin/products" className="text-xs text-brand-red hover:text-brand-red-dark font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: '#D9E1EB' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                    <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: '#EEF2F7' }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-36 rounded" style={{ background: '#EEF2F7' }} />
                      <div className="h-3 w-20 rounded" style={{ background: '#EEF2F7' }} />
                    </div>
                    <div className="h-4 w-14 rounded" style={{ background: '#EEF2F7' }} />
                  </div>
                ))
              ) : stats?.recentProducts.length === 0 ? (
                <div className="px-5 py-10 text-center text-text-muted text-sm">
                  No products yet. <Link to="/admin/products/new" className="text-brand-red font-medium">Add your first product →</Link>
                </div>
              ) : (
                stats?.recentProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-muted/40 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}>
                      <Package className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                      <p className="text-xs text-text-muted capitalize">{p.category} · Stock: {p.stock}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand-price">{formatPrice(p.price)}</p>
                      <p className="text-xs text-yellow-600">{p.rating.toFixed(1)} ★</p>
                    </div>
                    <Link to={`/admin/products/edit/${p.id}`} className="ml-2 text-xs text-brand-red hover:underline font-medium shrink-0">
                      Edit
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #D9E1EB' }}>
              <h2 className="font-heading font-semibold text-text-primary">By Category</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 rounded" style={{ background: '#EEF2F7' }} />
                      <div className="h-3 w-6 rounded" style={{ background: '#EEF2F7' }} />
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#EEF2F7' }} />
                  </div>
                ))
              ) : stats?.byCategory.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">No data yet</p>
              ) : (
                stats?.byCategory.map(({ category, count }) => {
                  const pct = Math.round((count / (stats.totalProducts || 1)) * 100)
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-text-secondary capitalize">{category}</span>
                        <span className="text-text-muted">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF2F7' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#E31A2D' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #D9E1EB' }}>
            <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-red" />
              Recent Activity
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#D9E1EB' }}>
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: '#EEF2F7' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-48 rounded" style={{ background: '#EEF2F7' }} />
                    <div className="h-3 w-28 rounded" style={{ background: '#EEF2F7' }} />
                  </div>
                  <div className="h-3 w-20 rounded" style={{ background: '#EEF2F7' }} />
                </div>
              ))
            ) : logs.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                No activity yet. Actions you take in the admin panel will appear here.
              </p>
            ) : (
              logs.map(log => {
                const meta = ACTION_META[log.action] ?? { label: log.action, color: '#6b7280', Icon: Activity }
                const { Icon } = meta
                const timeAgo = new Date(log.created_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })
                const statusSuffix = log.action === 'update_order_status' && log.details
                  ? ` ${log.details.oldStatus} → ${log.details.newStatus}`
                  : ''
                return (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-dark-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {meta.label}{statusSuffix}
                        {log.target_name && <span className="font-normal text-text-muted"> — {log.target_name}</span>}
                      </p>
                      <p className="text-xs text-text-muted">by {log.admin_name}</p>
                    </div>
                    <span className="text-xs text-text-muted shrink-0">{timeAgo}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
