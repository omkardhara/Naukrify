import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const keyId     = process.env.RAZORPAY_KEY_ID!
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  const receipt   = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:   49900, // Rs 499 in paise
      currency: 'INR',
      receipt,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Razorpay order creation failed:', err)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  const order = await response.json()
  return NextResponse.json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
  })
}
