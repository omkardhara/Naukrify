export const metadata = {
  title: 'Terms of Service — Naukrify',
  description: 'Terms of Service for Naukrify, the AI job hunt tool for India.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-xl font-extrabold text-indigo-600 tracking-tight">Naukrify</a>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">1. Service description</h2>
          <p className="text-sm text-gray-600">
            Naukrify is a job hunt tool that generates tailored CV summaries and cover letters using
            your own Google Gemini API key (BYOK — Bring Your Own Key). The service consists of a
            Chrome browser extension and a web application available at naukrify.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">2. Account and access</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>You must sign in with a valid Google account to use the service.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must not share your account with others.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">3. Free trial</h2>
          <p className="text-sm text-gray-600">
            New accounts receive 10 free applications in total (maximum 3 per day). No payment is
            required to use the free trial.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">4. Paid plan</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>The current price is ₹499 for 3 months of full access (3 applications per day).</li>
            <li>Payment is processed by Razorpay. By completing a purchase you also agree to Razorpay&apos;s terms.</li>
            <li>The paid plan is non-refundable. Once access is activated, we cannot issue refunds.</li>
            <li>Access expires at the end of the 3-month period. You may renew at the then-current price.</li>
            <li>Prices may change. Existing paid periods are not affected by price changes.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">5. Your content</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>You retain full ownership of your CV, cover letters, and any other content you create with Naukrify.</li>
            <li>You grant Naukrify a limited right to store and process your content solely to provide the service.</li>
            <li>You are responsible for ensuring your CV and application content is accurate and not fraudulent.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">6. Acceptable use</h2>
          <p className="text-sm text-gray-600 mb-2">You must not use Naukrify to:</p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>Generate fraudulent applications or misrepresent your qualifications.</li>
            <li>Violate the terms of service of LinkedIn, Naukri, Wellfound, Instahyre, or any other platform.</li>
            <li>Attempt to circumvent usage limits or access other users&apos; data.</li>
            <li>Reverse-engineer, scrape, or abuse the service.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">7. Gemini API</h2>
          <p className="text-sm text-gray-600">
            Text generation is powered by your own Google Gemini API key. You are responsible for
            complying with Google&apos;s Gemini API terms of service and usage policies. Naukrify does
            not store or proxy your Gemini API key.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">8. Availability and changes</h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>We aim for high availability but cannot guarantee uninterrupted service.</li>
            <li>We may update the service, including changing features, usage limits, or pricing. We will provide reasonable notice for changes that materially affect paid subscribers.</li>
            <li>We may terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">9. Limitation of liability</h2>
          <p className="text-sm text-gray-600">
            Naukrify is provided &quot;as is&quot; without warranty of any kind. We are not liable for any
            outcomes of job applications made using our service, including but not limited to rejections,
            offers, or employment decisions. Our total liability to you shall not exceed the amount
            you paid for the service in the 3 months preceding the claim.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">10. Governing law</h2>
          <p className="text-sm text-gray-600">
            These terms are governed by the laws of India. Disputes are subject to the exclusive
            jurisdiction of the courts of Mumbai, Maharashtra.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">11. Contact</h2>
          <p className="text-sm text-gray-600">
            Questions about these terms: <strong>omkar@naukrify.com</strong>
          </p>
        </section>
      </main>
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        <a href="/" className="hover:text-gray-600">Naukrify</a>
        {' · '}
        <a href="/privacy" className="hover:text-gray-600">Privacy</a>
      </footer>
    </div>
  )
}
