import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

const stripeKey       = process.env.STRIPE_SECRET_KEY
const webhookSecret   = process.env.STRIPE_WEBHOOK_SECRET
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

// Disable body parsing — Stripe requires the raw body for signature verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey)

  const rawBody = await req.text()
  const sig     = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.user_id ?? session.client_reference_id

    if (userId && serviceRoleKey) {
      const supabase  = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
      )
      // Extend from current paid_until if still active (early renewal)
      const existing = await supabase.from('profiles').select('paid_until').eq('id', userId).maybeSingle()
      const currentExpiry = existing.data?.paid_until
      const baseDate = currentExpiry && new Date(currentExpiry) > new Date()
        ? new Date(currentExpiry)
        : new Date()
      const paidUntilDate = new Date(baseDate)
      paidUntilDate.setDate(paidUntilDate.getDate() + 90)
      const { error } = await supabase.from('profiles').update({
        is_paid:    true,
        paid_at:    new Date().toISOString(),
        paid_until: paidUntilDate.toISOString(),
      }).eq('id', userId)
      if (error) console.error('Stripe webhook DB update failed:', error.message)
    } else if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set — cannot update profile after Stripe payment')
    }
  }

  return NextResponse.json({ received: true })
}
