'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

interface Props {
  userEmail: string
  userName: string
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutButton({ userEmail, userName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout() {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Payment system failed to load. Check your internet connection and try again.')

      const orderRes = await fetch('/api/razorpay/create-order', { method: 'POST' })
      if (!orderRes.ok) throw new Error('Could not create order. Please try again.')
      const { orderId, amount, currency } = await orderRes.json()

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          order_id:    orderId,
          name:        'Naukrify',
          description: '3 months full access — 3 tailored applications per day',
          prefill:     { name: userName, email: userEmail },
          theme:       { color: '#4f46e5' },
          handler: async (response: {
            razorpay_order_id:   string
            razorpay_payment_id: string
            razorpay_signature:  string
          }) => {
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId:   response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              })
              if (!verifyRes.ok) throw new Error('Payment verification failed. Contact support with your payment ID.')
              router.refresh()
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: { ondismiss: () => reject(new Error('cancelled')) },
        })
        rzp.open()
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'cancelled') {
        alert(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {loading ? 'Opening payment...' : 'Get full access — ₹499'}
    </button>
  )
}
