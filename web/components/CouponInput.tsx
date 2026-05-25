'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CouponInput() {
  const [code, setCode]       = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleRedeem() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { data, error } = await supabase.rpc('redeem_coupon', {
      coupon_code_input: trimmed,
    })

    if (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
      return
    }

    if (data.success) {
      setStatus('success')
      setMessage('Code applied. Full access unlocked.')
      setTimeout(() => router.refresh(), 1000)
      return
    }

    setStatus('error')
    setMessage(
      data.error === 'invalid_code'  ? 'Invalid code. Check and try again.' :
      data.error === 'limit_reached' ? 'This code has reached its limit.' :
      data.error === 'already_used'  ? 'You have already used this code.' :
                                       'Something went wrong. Please try again.'
    )
  }

  return (
    <div className="pt-3 border-t border-amber-200">
      <p className="text-xs text-gray-500 mb-2">Have a coupon code?</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setStatus('idle')
            setMessage('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="Enter code"
          maxLength={30}
          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <button
          onClick={handleRedeem}
          disabled={status === 'loading' || !code.trim()}
          className="bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {status === 'loading' ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {message && (
        <p className={`mt-1.5 text-xs ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
