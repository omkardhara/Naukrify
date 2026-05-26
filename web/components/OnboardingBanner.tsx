'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  hasCv: boolean
}

export default function OnboardingBanner({ hasCv }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (hasCv || dismissed) return null

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600 text-lg leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
      <p className="text-sm font-semibold text-indigo-800 mb-4">Get set up in 5 minutes</p>
      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <div>
            <p className="text-sm font-medium text-indigo-900">Get your free Gemini API key</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Go to{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                aistudio.google.com/app/apikey
              </a>
              , sign in with Google, click Create API key. Free tier: 1,500 requests/day. Takes 2 minutes.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <div>
            <p className="text-sm font-medium text-indigo-900">Paste your CV below</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Upload your CV as a PDF or paste it as plain text in the Master CV tab.
              Include your achievements with specific numbers. This is what the AI rewrites for each job.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            3
          </span>
          <div>
            <p className="text-sm font-medium text-indigo-900">Copy your sync token and install the extension</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Go to{' '}
              <Link href="/settings" className="underline font-medium">Settings</Link>
              {' '}and copy your Extension sync token. Install the Naukrify Chrome extension,
              open the popup, paste the token in Account token, and click Sync. Your CV loads automatically.
            </p>
          </div>
        </li>

        <li className="flex gap-3">
          <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
            4
          </span>
          <div>
            <p className="text-sm font-medium text-indigo-900">Open any job page and click Tailor with AI</p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Works on LinkedIn, Naukri, Wellfound, and Instahyre. Get a tailored CV summary and
              130-word cover letter in under 30 seconds. Paste the recruiter message to get a reply draft too.
            </p>
          </div>
        </li>
      </ol>
    </div>
  )
}
