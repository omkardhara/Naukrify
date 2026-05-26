import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { orderId, paymentId, signature } = (await request.json()) as {
    orderId: string
    paymentId: string
    signature: string
  }

  // Verify Razorpay signature: HMAC-SHA256 of "orderId|paymentId" with key secret
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  // Extend from current paid_until if still active, so early renewal isn't penalised
  const existing = await supabase
    .from('profiles')
    .select('paid_until')
    .eq('id', user.id)
    .maybeSingle()

  const currentExpiry = existing.data?.paid_until
  const baseDate = currentExpiry && new Date(currentExpiry) > new Date()
    ? new Date(currentExpiry)
    : new Date()
  const paidUntil = new Date(baseDate)
  paidUntil.setMonth(paidUntil.getMonth() + 3)

  const { error } = await supabase
    .from('profiles')
    .update({
      is_paid:    true,
      paid_at:    new Date().toISOString(),
      paid_until: paidUntil.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update paid status:', error)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
