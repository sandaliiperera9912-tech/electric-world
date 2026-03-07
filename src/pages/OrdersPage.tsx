import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  processing: { icon: Package,      color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Processing' },
  shipped:    { icon: Truck,        color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Shipped' },
  delivered:  { icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-400/10',  label: 'Delivered' },
  cancelled:  { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10',    label: 'Cancelled' },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*, items:order_items(id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || [])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-8">My Orders</h1>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-dark-muted animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-24 h-24 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                <Package className="w-12 h-12 text-text-muted" />
              </div>
              <div className="text-center">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-2">No orders yet</h2>
                <p className="text-text-muted text-sm">Your order history will appear here after your first purchase.</p>
              </div>
              <Link to="/products" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const StatusIcon = cfg.icon
                const itemCount = order.items?.length || 0

                return (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="block bg-dark-card border border-dark-border rounded-xl p-5 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-text-primary font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <span className={`badge text-xs px-2 py-0.5 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-text-muted text-sm mt-0.5">
                          {formatDate(order.created_at)} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-text-primary">{formatPrice(order.total)}</p>
                        <ChevronRight className="w-4 h-4 text-text-muted ml-auto mt-1 group-hover:text-text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
