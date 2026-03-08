import { useEffect, useState } from 'react'
import { ShoppingBag, Search, Eye, RefreshCw, TrendingUp, Clock, CheckCircle2, Truck } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface OrderRow {
  id: string
  status: string
  total: number
  created_at: string
  shipping_name: string
  shipping_city: string
  shipping_country: string
  stripe_payment_intent_id: string
  item_count: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',    color: '#92400e', bg: '#fef3c7', icon: Clock },
  processing: { label: 'Processing', color: '#1d4ed8', bg: '#dbeafe', icon: RefreshCw },
  shipped:    { label: 'Shipped',    color: '#7c3aed', bg: '#ede9fe', icon: Truck },
  delivered:  { label: 'Delivered',  color: '#15803d', bg: '#dcfce7', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: '#b91c1c', bg: '#fee2e2', icon: Clock },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [orderItems, setOrderItems] = useState<Record<string, { name: string; image: string | null; qty: number; price: number }[]>>({})

  const fetchOrders = () => {
    setLoading(true)
    supabase
      .from('orders')
      .select(`
        id, status, total, created_at,
        shipping_name, shipping_city, shipping_country,
        stripe_payment_intent_id,
        order_items(id)
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setOrders(data.map((o: any) => ({
            ...o,
            item_count: o.order_items?.length ?? 0,
          })))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const loadItems = async (orderId: string) => {
    if (orderItems[orderId]) { setExpanded(expanded === orderId ? null : orderId); return }
    const { data } = await supabase
      .from('order_items')
      .select('quantity, price_at_purchase, product_name, product_image, products(name, images)')
      .eq('order_id', orderId)
    if (data) {
      setOrderItems(prev => ({
        ...prev,
        [orderId]: data.map((i: any) => ({
          name: i.product_name ?? i.products?.name ?? 'Product',
          image: i.product_image ?? i.products?.images?.[0] ?? null,
          qty: i.quantity,
          price: i.price_at_purchase,
        })),
      }))
    }
    setExpanded(expanded === orderId ? null : orderId)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdatingId(null)
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_name.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_city.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-text-primary">Orders</h1>
            <p className="text-text-muted text-sm mt-0.5">{orders.length} total orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all text-text-secondary hover:text-text-primary"
            style={{ border: '1px solid #D9E1EB', background: '#fff' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: TrendingUp, color: '#E31A2D' },
            { label: 'Total Orders',  value: orders.length,             icon: ShoppingBag, color: '#1d4ed8' },
            { label: 'Processing',    value: statusCounts['processing'] ?? 0, icon: RefreshCw, color: '#7c3aed' },
            { label: 'Delivered',     value: statusCounts['delivered']  ?? 0, icon: CheckCircle2, color: '#15803d' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1px solid #D9E1EB' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted font-medium">{s.label}</p>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="font-heading font-bold text-xl text-text-primary">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, order ID..."
              className="input-dark pl-9 text-sm w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-dark text-sm w-auto"
          >
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #D9E1EB' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
              <span className="text-text-muted text-sm">Loading orders...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingBag className="w-10 h-10 text-text-muted" />
              <p className="text-text-muted text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F6F8FA', borderBottom: '1px solid #D9E1EB' }}>
                    {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['processing']
                    const StatusIcon = cfg.icon
                    const isOpen = expanded === order.id
                    const date = new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })
                    return (
                      <>
                        <tr
                          key={order.id}
                          style={{ borderBottom: '1px solid #F6F8FA' }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-text-primary">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-text-primary">{order.shipping_name}</p>
                            <p className="text-xs text-text-muted">{order.shipping_city}, {order.shipping_country}</p>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{order.item_count} item{order.item_count !== 1 ? 's' : ''}</td>
                          <td className="px-4 py-3 font-semibold text-brand-price">{formatPrice(order.total)}</td>
                          <td className="px-4 py-3 text-text-muted text-xs">{date}</td>
                          <td className="px-4 py-3">
                            <select
                              value={order.status}
                              onChange={e => updateStatus(order.id, e.target.value)}
                              disabled={updatingId === order.id}
                              className="text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                                <option key={val} value={val}>{c.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => loadItems(order.id)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-text-secondary hover:text-text-primary"
                              style={{ border: '1px solid #D9E1EB' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isOpen ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row — order items */}
                        {isOpen && (
                          <tr key={`${order.id}-items`} style={{ background: '#F6F8FA', borderBottom: '1px solid #D9E1EB' }}>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Order Items</p>
                                {(orderItems[order.id] ?? []).map((item, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5" style={{ border: '1px solid #D9E1EB' }}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#EEF2F7', border: '1px solid #D9E1EB' }}>
                                        {item.image
                                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                          : <ShoppingBag className="w-3.5 h-3.5 text-text-muted" />}
                                      </div>
                                      <span className="text-sm font-medium text-text-primary">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-text-muted">
                                      <span>×{item.qty}</span>
                                      <span className="font-semibold text-text-primary">{formatPrice(item.price * item.qty)}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-end pt-1">
                                  <p className="text-sm font-bold text-brand-price">
                                    Order Total: {formatPrice(order.total)}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}
