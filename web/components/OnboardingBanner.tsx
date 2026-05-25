'use client'

import { useState } from 'react'

interface Props {
  hasCv:  boolean
}

export default function OnboardingBanner({ hasCv }: Props) {
  const [dismissed, setDismissed] = useState(false)

  // Only show to new users who haven't saved a CV yet
  if (hasCv || dismissed) return null

  const steps = [
    {
      num: '1',
      done: false,
      title: 'Get your free Gemini API key',
      body: (
        <>
          Go to{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            aistudio.google.com/app/apikey
          </a>
          , sign in with Google, click Create API key. Takes 2 minutes. Free tier: 1,500 requests/day.
        </>
      ),
    },
    {
      num: '2',
      done: false,
      title: 'Paste your CV below',
      body: 'Upload your CV as a PDF or paste it as plain text in the Master CV tab. This is what the AI rewrites for each job.',
    },
    {
      num: '3',
      done: false,
      title: 'Install the Chrome extension',
      body: (
        <>
          Install from the Chrome Web Store (search &ldquo;Naukrify&rdquo;). Open the extension popup,
          paste your Gemini key and your account sync token (in Settings), then click Sync.
        </>
      ),
    },
    {
      num: '4',
      done: false,
      title: 'Go to a LinkedIn job and click Tailor with AI',
      body: 'Your tailored CV summary and cover letter appear in under 30 seconds. Copy and apply.',
    },
  ]

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
        {steps.map((s) => (
          <li key={s.num} className="flex gap-3">
            <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {s.num}
            </span>
            <div>
              <p className="text-sm font-medium text-indigo-900">{s.title}</p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
