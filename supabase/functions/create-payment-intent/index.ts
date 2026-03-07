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
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Fetch real product prices from Supabase (server-side, never trust client total)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const productIds = cartItems.map(i => i.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock')
      .in('id', productIds)

    if (productsError || !products) {
      throw new Error('Failed to fetch product prices')
    }

    // Calculate total server-side
    let totalCents = 0
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId)
      if (!product) throw new Error(`Product ${cartItem.productId} not found`)
      if (product.stock < cartItem.quantity) throw new Error(`Insufficient stock for product ${cartItem.productId}`)
      totalCents += Math.round(product.price * 100) * cartItem.quantity
    }

    // Add shipping ($5.99 if under $75, else free)
    const subtotalDollars = totalCents / 100
    const shippingCents = subtotalDollars >= 75 ? 0 : 599
    const grandTotalCents = totalCents + shippingCents

    // Create Stripe PaymentIntent
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: grandTotalCents,
      currency: 'usd',
      metadata: {
        userId,
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
