export default function GeminiDisclaimer() {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
      <svg
        className="w-5 h-5 shrink-0 mt-0.5 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>
        <strong>Gemini free tier:</strong> 1,500 requests/day — enough for 500+
        job applications. No billing setup needed. If you hit the daily cap, it
        resets at 1:30 PM IST. Add a payment method in{' '}
        <a
          href="https://console.cloud.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-900"
        >
          Google Cloud Console
        </a>{' '}
        to get much higher limits without any charge on free-tier usage.
      </p>
    </div>
  )
}
