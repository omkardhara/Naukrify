export const metadata = {
  title: 'Privacy Policy — Naukrify',
  description: 'Privacy Policy for Naukrify, the AI job hunt tool for India.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-xl font-extrabold text-indigo-600 tracking-tight">Naukrify</a>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 prose prose-gray">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">What we collect</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Email address</strong> — from Google login. Used for authentication only.</li>
            <li><strong>Name and phone</strong> — optional fields you enter in your profile.</li>
            <li><strong>CV text</strong> — the plain text you paste or upload. Stored securely in Supabase Postgres so the extension can read it when tailoring applications.</li>
            <li><strong>Usage counts</strong> — how many applications you have generated. Used to enforce the trial and plan limits.</li>
            <li><strong>Application data</strong> — company name, role, cover letter and CV text generated for each job you apply to. Stored so you can track your pipeline.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">What we do NOT collect</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Your Gemini API key</strong> — this stays in your browser and is never sent to our servers.</li>
            <li><strong>Payment card details</strong> — all payments are processed by Razorpay. We only receive a confirmation of successful payment.</li>
            <li><strong>LinkedIn / Naukri / Wellfound credentials</strong> — we do not ask for or store job board passwords.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">How we use your data</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>To provide and improve the Naukrify service.</li>
            <li>To enforce usage limits (trial: 10 applications total, 3/day; paid: 3/day).</li>
            <li>To send transactional emails if you contact us for support.</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">We do not sell, rent, or share your data with third parties for marketing.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Data storage</h2>
          <p className="text-sm text-gray-600">
            Your data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure. Supabase uses
            industry-standard encryption at rest and in transit. Row-level security ensures each user
            can only access their own data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Third-party services</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Supabase</strong> — database and authentication.</li>
            <li><strong>Razorpay</strong> — payment processing (India). Governed by Razorpay&apos;s privacy policy.</li>
            <li><strong>Google Gemini</strong> — AI text generation. Your Gemini API key is stored locally in your browser and calls are made directly from your device. We do not proxy or log these calls.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your rights</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li><strong>Access</strong> — request a copy of your data by emailing us.</li>
            <li><strong>Deletion</strong> — request deletion of your account and all associated data by emailing us. We will delete within 14 business days.</li>
            <li><strong>Correction</strong> — update your name, phone, and CV directly in the dashboard.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-sm text-gray-600">
            For privacy requests or questions: <strong>omkar@naukrify.com</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This policy is governed by the laws of India. Disputes are subject to the jurisdiction of
            courts in Mumbai, Maharashtra.
          </p>
        </section>
      </main>
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        <a href="/" className="hover:text-gray-600">Naukrify</a>
        {' · '}
        <a href="/terms" className="hover:text-gray-600">Terms</a>
      </footer>
    </div>
  )
}
