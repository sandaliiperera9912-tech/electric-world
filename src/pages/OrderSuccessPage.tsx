import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2, Package, Truck, MapPin, Receipt,
  ShoppingBag, Zap, ArrowRight, Home,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  product_name: string | null
  product_image: string | null
  products: { name: string; images: string[]; category: string } | null
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  shipping_name: string
  shipping_address_line1: string
  shipping_address_line2: string
  shipping_city: string
  shipping_postcode: string
  shipping_country: string
  stripe_payment_intent_id: string
  order_items: OrderItem[]
}

const STATUS_STEPS = ['Order Placed', 'Processing', 'Shipped', 'Delivered']

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('orders')
      .select(`*, order_items(*, products(name, images, category))`)
      .eq('id', id)
      .single()
      .then(({ data }) => { if (data) setOrder(data as Order) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
        <div className="text-center">
          <p className="text-text-muted mb-4">Order not found.</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  const shortId = order.id.slice(0, 8).toUpperCase()
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ background: '#F6F8FA' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Success Header */}
          <div
            className="rounded-2xl p-8 text-center mb-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #001C3F 0%, #00295F 100%)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-10"
              style={{ background: 'radial-gradient(circle, #E31A2D, transparent)', transform: 'translate(30%, -30%)' }} />
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="font-heading font-bold text-3xl text-white mb-2">
                Order Confirmed!
              </h1>
              <p className="text-blue-200 opacity-90 mb-4">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
              >
                <Receipt className="w-4 h-4" />
                Order #{shortId}
              </div>
              <p className="text-white/40 text-xs mt-2">{orderDate}</p>
            </div>
          </div>

          {/* Order Progress */}
          <div className="bg-white rounded-2xl p-6 mb-4" style={{ border: '1px solid #D9E1EB' }}>
            <h2 className="font-heading font-semibold text-text-primary mb-5 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-red" />
              Order Status
            </h2>
            <div className="relative flex justify-between">
              {/* Progress bar */}
              <div className="absolute top-4 left-0 right-0 h-0.5" style={{ background: '#D9E1EB', zIndex: 0 }}>
                <div
                  className="h-full transition-all"
                  style={{ background: '#E31A2D', width: '33%' }}
                />
              </div>
              {STATUS_STEPS.map((step, i) => {
                const active = i === 0
                const done = i === 0
                return (
                  <div key={step} className="relative flex flex-col items-center gap-2" style={{ zIndex: 1 }}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={
                        done
                          ? { background: '#E31A2D', color: '#fff' }
                          : active
                            ? { background: '#E31A2D', color: '#fff' }
                            : { background: '#EEF2F7', color: '#647A96', border: '2px solid #D9E1EB' }
                      }
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium text-center ${done || active ? 'text-text-primary' : 'text-text-muted'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl p-6 mb-4" style={{ border: '1px solid #D9E1EB' }}>
            <h2 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-red" />
              Items Ordered ({order.order_items.length})
            </h2>
            <div className="space-y-3">
              {order.order_items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                  >
                    {(item.product_image ?? item.products?.images?.[0]) ? (
                      <img src={item.product_image ?? item.products!.images[0]} alt={item.product_name ?? 'Product'} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="w-6 h-6 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.product_name ?? item.products?.name ?? 'Product'}</p>
                    <p className="text-xs text-text-muted capitalize">{item.products?.category ?? 'Electronics'} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-price shrink-0">
                    {formatPrice(item.price_at_purchase * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid #D9E1EB' }}>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-primary">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between font-heading font-bold pt-2" style={{ borderTop: '1px solid #D9E1EB' }}>
                <span className="text-text-primary">Total Paid</span>
                <span className="text-brand-price text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid #D9E1EB' }}>
            <h2 className="font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-red" />
              Shipping To
            </h2>
            <div className="text-sm text-text-secondary space-y-1">
              <p className="font-medium text-text-primary">{order.shipping_name}</p>
              <p>{order.shipping_address_line1}{order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ''}</p>
              <p>{order.shipping_city}, {order.shipping_postcode}</p>
              <p>{order.shipping_country}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-all text-white"
              style={{ background: '#E31A2D', boxShadow: '0 4px 14px rgba(227,26,45,0.3)' }}
            >
              <Home className="w-4 h-4" />
              Continue Shopping
            </Link>
            <Link
              to="/orders"
              className="flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-all text-text-primary hover:text-brand-red"
              style={{ border: '1px solid #D9E1EB', background: '#fff' }}
            >
              <ShoppingBag className="w-4 h-4" />
              View All Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
