import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, CheckCircle, Truck, Clock, XCircle, ArrowLeft, Home } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', label: 'Pending' },
  processing: { icon: Package,      color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',     label: 'Processing' },
  shipped:    { icon: Truck,        color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', label: 'Shipped' },
  delivered:  { icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20',   label: 'Delivered' },
  cancelled:  { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       label: 'Cancelled' },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user) return
    supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setOrder(data as Order)
        setLoading(false)
      })
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="pt-24 px-4 max-w-3xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-dark-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <p className="text-text-muted">Order not found.</p>
          <Link to="/orders" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">Back to orders</Link>
        </div>
        <ChatWidget />
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const estimatedDelivery = new Date(order.created_at)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5)

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          <Link to="/orders" className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>

          {/* Success banner (for newly placed orders) */}
          {order.status === 'processing' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 mb-6 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
              <div>
                <p className="font-heading font-semibold text-green-400">Order placed successfully!</p>
                <p className="text-text-muted text-sm">You'll receive a confirmation email shortly.</p>
              </div>
            </div>
          )}

          {/* Order header */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Order ID</p>
                <p className="font-heading font-bold text-text-primary text-lg font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-text-muted text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className={`badge border ${statusCfg.bg} ${statusCfg.color} flex items-center gap-1.5 px-3 py-2`}>
                <StatusIcon className="w-4 h-4" />
                {statusCfg.label}
              </div>
            </div>

            {order.status !== 'cancelled' && (
              <div className="mt-4 pt-4 border-t border-dark-border flex items-center gap-2 text-sm text-text-muted">
                <Truck className="w-4 h-4 text-blue-400" />
                Estimated delivery: <span className="text-text-primary font-medium">
                  {estimatedDelivery.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-5">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-xl bg-dark-muted flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-text-muted">Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}</p>
                  </div>
                  <p className="font-heading font-semibold text-text-primary text-sm shrink-0">
                    {formatPrice(item.quantity * item.price_at_purchase)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
            <h2 className="font-heading font-semibold text-text-primary mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-primary">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Shipping</span>
                <span className="text-green-400">FREE</span>
              </div>
              <div className="flex justify-between font-heading font-bold pt-2 border-t border-dark-border text-base">
                <span className="text-text-primary">Total Paid</span>
                <span className="text-text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Continue Shopping
            </Link>
            <Link to="/orders" className="btn-ghost flex-1 flex items-center justify-center gap-2">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
