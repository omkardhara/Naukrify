import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Only active when STRIPE_SECRET_KEY is configured
const stripeKey = process.env.STRIPE_SECRET_KEY
const priceId   = process.env.STRIPE_PRICE_ID // optional: pre-created price in Stripe dashboard

export async function POST() {
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = new Stripe(stripeKey)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://naukrify.com'

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode:             'payment',
    customer_email:   user.email,
    client_reference_id: user.id,
    metadata:         { user_id: user.id },
    success_url:      `${origin}/dashboard?payment=success`,
    cancel_url:       `${origin}/dashboard`,
    payment_method_types: ['card'],
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency:     'usd',
            unit_amount:  599,  // $5.99 in cents
            product_data: {
              name:        'Naukrify — 3 months access',
              description: '3 tailored applications per day. CV summary + cover letter. Application tracker.',
            },
          },
          quantity: 1,
        }],
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return NextResponse.json({ url: session.url })
}
