'use client'

import { useState } from 'react'

export default function StripeCheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      if (!res.ok) throw new Error('Could not create checkout. Please try again.')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="shrink-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 10h18M7 15h.01M11 15h2M3 6l2-2h14l2 2v12l-2 2H5l-2-2V6z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {loading ? 'Opening...' : 'Pay with card (USD $5.99)'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
