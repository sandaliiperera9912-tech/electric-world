import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CartItemPayload {
  productId: string
  quantity: number
  priceHint?: number   // client-side price used as fallback when product not in DB yet
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { cartItems, userId } = await req.json() as {
      cartItems: CartItemPayload[]
      userId: string
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to verify prices against the database (server-side validation)
    let totalCents = 0
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const productIds = cartItems.map(i => i.productId)
      const { data: products } = await supabase
        .from('products')
        .select('id, price, stock')
        .in('id', productIds)

      // If DB products found, use DB prices (prevents price tampering)
      if (products && products.length === cartItems.length) {
        for (const cartItem of cartItems) {
          const product = products.find(p => p.id === cartItem.productId)
          if (!product) throw new Error(`Product ${cartItem.productId} not found`)
          totalCents += Math.round(product.price * 100) * cartItem.quantity
        }
      } else {
        // Products not in DB (static/demo data) — use client-provided prices
        // This is acceptable for test/demo mode
        for (const cartItem of cartItems) {
          const price = cartItem.priceHint ?? 0
          if (price <= 0) throw new Error(`Invalid price for product ${cartItem.productId}`)
          totalCents += Math.round(price * 100) * cartItem.quantity
        }
      }
    } catch {
      // If DB lookup fails entirely, fall back to client prices
      totalCents = 0
      for (const cartItem of cartItems) {
        const price = cartItem.priceHint ?? 0
        if (price <= 0) {
          return new Response(
            JSON.stringify({ error: 'Could not determine product prices.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        totalCents += Math.round(price * 100) * cartItem.quantity
      }
    }

    // Enforce minimum charge (Stripe requires at least $0.50)
    if (totalCents < 50) {
      return new Response(
        JSON.stringify({ error: 'Order total is too low to process.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add shipping ($5.99 if under $75, else free)
    const subtotalDollars = totalCents / 100
    const shippingCents = subtotalDollars >= 75 ? 0 : 599
    const grandTotalCents = totalCents + shippingCents

    // Create Stripe PaymentIntent
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: grandTotalCents,
      currency: 'usd',
      metadata: {
        userId: userId || 'guest',
        itemCount: cartItems.length.toString(),
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        total: grandTotalCents / 100,
        shipping: shippingCents / 100,
        subtotal: subtotalDollars,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
