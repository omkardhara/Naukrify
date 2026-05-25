'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId:           string
  email:            string
  initialName:      string
  initialPhone:     string
  isPaid:           boolean
  paidUntil:        string | null
  totalGenerations: number
  accessToken:      string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function SettingsForm({
  userId, email, initialName, initialPhone,
  isPaid, paidUntil, totalGenerations, accessToken,
}: Props) {
  const [name, setName]   = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [tokenCopied, setTokenCopied]   = useState(false)

  const isActive = isPaid && paidUntil != null && new Date(paidUntil) > new Date()

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ name, phone }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCopyToken() {
    navigator.clipboard.writeText(accessToken).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-8">

      {/* Plan status */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Plan</h2>
        <div className={`rounded-lg border px-4 py-3 text-sm ${isActive ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {isActive ? (
            <p><span className="font-semibold">Full access</span> — valid until {formatDate(paidUntil!)}. 3 applications/day.</p>
          ) : isPaid ? (
            <p><span className="font-semibold">Plan expired</span> on {paidUntil ? formatDate(paidUntil) : 'unknown'}. Renew from the dashboard.</p>
          ) : (
            <p><span className="font-semibold">Free trial</span> — {totalGenerations}/10 applications used. <a href="/dashboard" className="underline">Upgrade on the dashboard.</a></p>
          )}
        </div>
      </section>

      {/* Profile */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              disabled
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Extension sync token */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">Extension sync token</h2>
        <p className="text-xs text-gray-500 mb-3">
          Copy this token, open the Naukrify Chrome extension popup, paste it in the
          Account token field, and click Sync. Refreshes every session — re-sync if
          the extension shows a token error.
        </p>
        {accessToken ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            {tokenVisible && (
              <code className="block text-xs break-all text-gray-700 leading-relaxed select-all">
                {accessToken}
              </code>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setTokenVisible((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {tokenVisible ? 'Hide' : 'Show token'}
              </button>
              <button
                onClick={handleCopyToken}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
              >
                {tokenCopied ? 'Copied!' : 'Copy token'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Sign out and back in to generate a fresh token.</p>
        )}
      </section>

      {/* Danger zone */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Account</h2>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Sign out
          </button>
        </form>
      </section>

    </div>
  )
}
