'use client'

import { useState } from 'react'

/**
 * Slice 1 dev helper: shows the Supabase access token so the user can
 * copy it into the extension popup's "Account token" field.
 *
 * TODO Slice 2: delete this component and its usage in dashboard/page.tsx.
 * Replace with the real extension OAuth handshake.
 */
export default function TokenDisplay({ accessToken }: { accessToken: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!accessToken) return null

  function handleCopy() {
    navigator.clipboard.writeText(accessToken).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-amber-800">
          Extension sync token{' '}
          <span className="font-normal text-amber-600 text-xs">
            — dev helper, removed in Slice 2
          </span>
        </p>
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-xs text-amber-600 hover:text-amber-800 underline"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>

      {visible && (
        <div className="flex items-start gap-2 mb-2">
          <code className="flex-1 text-xs break-all bg-amber-100 rounded px-2 py-1.5 text-amber-900 leading-relaxed select-all">
            {accessToken}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <p className="text-xs text-amber-600">
        Copy this token, open the Naukrify extension popup, paste it into the
        &ldquo;Account token&rdquo; field, and click Sync. Your CV loads from
        your account.
      </p>
    </div>
  )
}
