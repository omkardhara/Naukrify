'use client'

import { useState, useEffect } from 'react'

export default function PaymentSuccessBanner() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-300 rounded-lg px-4 py-3 text-sm text-green-800">
      <svg className="w-5 h-5 shrink-0 mt-0.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="flex-1">
        <strong>Payment received.</strong> Full access is now active. If the upgrade badge above
        hasn&apos;t refreshed yet, reload the page in a moment.
      </p>
      <button onClick={() => setVisible(false)} className="text-green-600 hover:text-green-800 ml-2 shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
