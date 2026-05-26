'use client'

import { useState } from 'react'

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
    <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-700">Extension sync token</p>
        <button
          onClick={() => setVisible((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Open the Naukrify extension popup, paste this token in the Account token field,
        and click Sync. Your CV and tilts will load from your account automatically.
        Also available in Settings.
      </p>

      {visible && (
        <div className="flex items-start gap-2 mb-2">
          <code className="flex-1 text-xs break-all bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-700 leading-relaxed select-all">
            {accessToken}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}
