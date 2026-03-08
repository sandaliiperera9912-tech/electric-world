import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Shield, Truck, ChevronRight, Zap } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useCart } from '@/store/cartContext'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'
import { formatPrice, cn } from '@/lib/utils'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface ShippingForm {
  name: string
  line1: string
  line2: string
  city: string
  postcode: string
  country: string
}

const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#E31A2D',
    colorBackground: '#ffffff',
    colorText: '#001C3F',
    colorDanger: '#E31A2D',
    colorTextSecondary: '#647A96',
    borderRadius: '12px',
    fontFamily: 'DM Sans, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #D9E1EB',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #102E5A',
      boxShadow: '0 0 0 3px rgba(16,46,90,0.12)',
    },
    '.Label': { color: '#647A96', fontWeight: '500' },
    '.Tab': { border: '1px solid #D9E1EB' },
    '.Tab--selected': { border: '1px solid #E31A2D', color: '#E31A2D' },
  },
}

function CheckoutForm({
  total,
  shippingForm,
}: {
  clientSecret?: string
  shipping?: number
  total: number
  shippingForm: ShippingForm
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { cartItems, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !user) return
    setProcessing(true)
    setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/orders' },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed.')
        setProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create order in Supabase
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            status: 'processing',
            total,
            stripe_payment_intent_id: paymentIntent.id,
            shipping_name: shippingForm.name,
            shipping_address_line1: shippingForm.line1,
            shipping_address_line2: shippingForm.line2,
            shipping_city: shippingForm.city,
            shipping_postcode: shippingForm.postcode,
            shipping_country: shippingForm.country,
          })
          .select('id')
          .single()

        if (orderError || !order) throw new Error('Failed to create order')

        // Insert order items
        const orderItems = cartItems.map(({ product, quantity }) => ({
          order_id: order.id,
          product_id: product.id,
          quantity,
          price_at_purchase: product.price,
        }))
        await supabase.from('order_items').insert(orderItems)

        clearCart()
        navigate(`/orders/${order.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}>
        <h3 className="font-heading font-semibold text-text-primary mb-4 text-sm">Payment Details</h3>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="bg-red-50 border border-brand-red/20 text-brand-red text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className={cn(
          'btn-primary w-full flex items-center justify-center gap-2 py-4',
          (processing || !stripe) && 'opacity-70 cursor-not-allowed'
        )}
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Place Order — {formatPrice(total)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
        <Shield className="w-3.5 h-3.5" />
        Secured by Stripe · SSL encrypted
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [clientSecret, setClientSecret] = useState('')
  const [serverTotal, setServerTotal] = useState(0)
  const [serverShipping, setServerShipping] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [step, setStep] = useState(1)

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    name: '', line1: '', line2: '', city: '', postcode: '', country: 'US',
  })

  const shippingValid = shippingForm.name && shippingForm.line1 && shippingForm.city && shippingForm.postcode

  useEffect(() => {
    // Wait for auth to finish loading before checking session
    if (authLoading) return

    if (!user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/checkout' } } })
      return
    }

    if (cartItems.length === 0) {
      navigate('/cart', { replace: true })
      return
    }

    const payload = {
      cartItems: cartItems.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
        priceHint: product.price,   // used as fallback if product isn't in DB yet
      })),
      userId: user.id,
    }

    const invokePaymentIntent = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

        const res = await fetch(
          `${supabaseUrl}/functions/v1/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify(payload),
          }
        )

        const json = await res.json()
        console.log('[Checkout] Edge Function response:', res.status, json)

        if (!res.ok || !json.clientSecret) {
          const msg = json?.error || `Server error ${res.status}`
          console.error('[Checkout] Edge Function error:', msg)
          setFetchError(`Payment error: ${msg}`)
          return
        }

        setClientSecret(json.clientSecret)
        setServerTotal(json.total)
        setServerShipping(json.shipping)
      } catch (err) {
        console.error('[Checkout] Network error:', err)
        setFetchError('Could not reach payment service. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    invokePaymentIntent()
  }, [user, authLoading, cartItems, navigate])

  // Don't render until we know the auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F6F8FA' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Checkout</h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            {['Shipping', 'Payment'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    step > i + 1
                      ? { background: '#16a34a', color: '#fff' }
                      : step === i + 1
                        ? { background: '#E31A2D', color: '#fff' }
                        : { background: '#EEF2F7', color: '#647A96' }
                  }
                >
                  {i + 1}
                </div>
                <span className={step === i + 1 ? 'text-text-primary font-medium' : 'text-text-muted'}>
                  {s}
                </span>
                {i < 1 && <ChevronRight className="w-4 h-4 text-text-muted" />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Step 1: Shipping */}
              <div
                className="bg-white rounded-xl p-6 transition-all"
                style={{ border: `1px solid ${step === 1 ? '#E31A2D' : '#D9E1EB'}`, boxShadow: '0 2px 16px rgba(0,28,63,0.06)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand-red" />
                    Shipping Address
                  </h2>
                  {step > 1 && (
                    <button onClick={() => setStep(1)} className="text-xs text-brand-red hover:text-brand-red-dark font-medium">
                      Edit
                    </button>
                  )}
                </div>

                {step === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={e => setShippingForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                        className="input-dark"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Address Line 1</label>
                      <input
                        type="text"
                        value={shippingForm.line1}
                        onChange={e => setShippingForm(prev => ({ ...prev, line1: e.target.value }))}
                        placeholder="123 Main Street"
                        className="input-dark"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Address Line 2 (optional)</label>
                      <input
                        type="text"
                        value={shippingForm.line2}
                        onChange={e => setShippingForm(prev => ({ ...prev, line2: e.target.value }))}
                        placeholder="Apartment, suite, etc."
                        className="input-dark"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-text-muted mb-1.5 block">City</label>
                        <input
                          type="text"
                          value={shippingForm.city}
                          onChange={e => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="New York"
                          className="input-dark"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-text-muted mb-1.5 block">Postcode / ZIP</label>
                        <input
                          type="text"
                          value={shippingForm.postcode}
                          onChange={e => setShippingForm(prev => ({ ...prev, postcode: e.target.value }))}
                          placeholder="10001"
                          className="input-dark"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted mb-1.5 block">Country</label>
                      <select
                        value={shippingForm.country}
                        onChange={e => setShippingForm(prev => ({ ...prev, country: e.target.value }))}
                        className="input-dark"
                      >
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="CA">Canada</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="JP">Japan</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!shippingValid}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      Continue to Payment
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-text-secondary space-y-1">
                    <p className="text-text-primary font-medium">{shippingForm.name}</p>
                    <p>{shippingForm.line1}{shippingForm.line2 ? `, ${shippingForm.line2}` : ''}</p>
                    <p>{shippingForm.city}, {shippingForm.postcode}</p>
                    <p>{shippingForm.country}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Payment */}
              {step === 2 && (
                <div
                  className="bg-white rounded-xl p-6"
                  style={{ border: '1px solid #E31A2D', boxShadow: '0 2px 16px rgba(0,28,63,0.06)' }}
                >
                  <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2 mb-5">
                    <Shield className="w-5 h-5 text-brand-red" />
                    Payment
                  </h2>

                  {fetchError ? (
                    <div className="bg-red-50 border border-brand-red/20 text-brand-red text-sm px-4 py-3 rounded-xl">
                      {fetchError}
                    </div>
                  ) : loading || !clientSecret ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                      <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                      <span className="text-text-muted text-sm">Initializing secure payment...</span>
                    </div>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                      <CheckoutForm
                        total={serverTotal}
                        shippingForm={shippingForm}
                      />
                    </Elements>
                  )}
                </div>
              )}
            </div>

            {/* Right: Order Summary */}
            <div>
              <div
                className="bg-white rounded-xl p-5 sticky top-24"
                style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 16px rgba(0,28,63,0.06)' }}
              >
                <h3 className="font-heading font-semibold text-text-primary mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3 items-center">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: '#F6F8FA', border: '1px solid #D9E1EB' }}
                      >
                        <Zap className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{product.name}</p>
                        <p className="text-xs text-text-muted">×{quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-brand-price shrink-0">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2" style={{ borderTop: '1px solid #D9E1EB' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Shipping</span>
                    <span className={serverShipping === 0 ? 'text-green-600 font-medium' : 'text-text-primary'}>
                      {serverShipping === 0 ? 'FREE' : formatPrice(serverShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between font-heading font-bold pt-2" style={{ borderTop: '1px solid #D9E1EB' }}>
                    <span className="text-text-primary">Total</span>
                    <span className="text-brand-price">{formatPrice(serverTotal || cartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
