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
  theme: 'night' as const,
  variables: {
    colorPrimary: '#3b82f6',
    colorBackground: '#0d0d14',
    colorText: '#e8e6f0',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'DM Sans, sans-serif',
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
      <div className="bg-dark-muted/30 rounded-xl p-5 border border-dark-border">
        <h3 className="font-heading font-semibold text-text-primary mb-4 text-sm">Payment Details</h3>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
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
  const { user } = useAuth()
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
    if (!user || cartItems.length === 0) {
      navigate('/cart', { replace: true })
      return
    }

    const payload = {
      cartItems: cartItems.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })),
      userId: user.id,
    }

    supabase.functions
      .invoke('create-payment-intent', { body: payload })
      .then(({ data, error }) => {
        if (error || !data?.clientSecret) {
          setFetchError('Failed to initialize payment. Please try again.')
          return
        }
        setClientSecret(data.clientSecret)
        setServerTotal(data.total)
        setServerShipping(data.shipping)
      })
      .catch(() => setFetchError('Payment service unavailable. Please try again later.'))
      .finally(() => setLoading(false))
  }, [user, cartItems, navigate])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Checkout</h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            {['Shipping', 'Payment'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-dark-muted text-text-muted'
                )}>
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
              <div className={cn('bg-dark-card border rounded-xl p-6 transition-all', step === 1 ? 'border-blue-500/30' : 'border-dark-border')}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    Shipping Address
                  </h2>
                  {step > 1 && (
                    <button onClick={() => setStep(1)} className="text-xs text-blue-400 hover:text-blue-300">
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
                <div className="bg-dark-card border border-blue-500/30 rounded-xl p-6">
                  <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2 mb-5">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Payment
                  </h2>

                  {fetchError ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                      {fetchError}
                    </div>
                  ) : loading || !clientSecret ? (
                    <div className="flex items-center justify-center py-10 gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
              <div className="bg-dark-card border border-dark-border rounded-xl p-5 sticky top-24">
                <h3 className="font-heading font-semibold text-text-primary mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-lg bg-dark-muted flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{product.name}</p>
                        <p className="text-xs text-text-muted">×{quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-text-primary shrink-0">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dark-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-primary">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Shipping</span>
                    <span className={serverShipping === 0 ? 'text-green-400' : 'text-text-primary'}>
                      {serverShipping === 0 ? 'FREE' : formatPrice(serverShipping)}
                    </span>
                  </div>
                  <div className="flex justify-between font-heading font-bold pt-2 border-t border-dark-border">
                    <span className="text-text-primary">Total</span>
                    <span className="text-text-primary">{formatPrice(serverTotal || cartTotal)}</span>
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
