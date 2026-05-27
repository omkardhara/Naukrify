import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/LoginButton'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-extrabold text-indigo-600 tracking-tight">Naukrify</span>
        <LoginButton label="Sign in" />
      </header>

      {/* ── Hero ── */}
      <section className="text-center px-6 pt-16 pb-20 max-w-3xl mx-auto">
        <div className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Built for India
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
          Job hunting in India<br />
          <span className="text-indigo-600">takes 4 hours a day.</span><br />
          We get it to 30 minutes.
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
          AI-tailored CVs and cover letters for every application. Voice-filtered so it sounds
          like you, not a robot. Application tracker included. Bring your own free Gemini key.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <LoginButton label="Get started for ₹499" primary />
          <span className="text-sm text-gray-400">3 months access. 3 applications/day.</span>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          10 free trial applications. No card needed to start.
        </p>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-gray-100 px-6 py-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { stat: '30 sec',    label: 'CV + cover letter' },
            { stat: '5 sites',   label: 'LinkedIn, Naukri, Wellfound + more' },
            { stat: '1,500/day', label: 'Free Gemini calls' },
            { stat: '₹0',        label: 'Ongoing LLM cost' },
          ].map((item) => (
            <div key={item.stat}>
              <p className="text-2xl font-extrabold text-indigo-600">{item.stat}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Install the Chrome extension</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                One click from the Chrome Web Store. Paste your free Gemini API key. Done in under 2 minutes.
              </p>
              <a
                href="https://chrome.google.com/webstore/detail/naukrify"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                Install on Chrome
              </a>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Open any job page</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Works on LinkedIn, Naukri, Wellfound, Instahyre, and Hirect. Click the &quot;Tailor with AI&quot; button. It reads the job description and your CV automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Copy and apply</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Get a tailored CV summary and a 130-word cover letter in under 30 seconds. Review, copy, send.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">What makes it different</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: '📄',
              title: 'Tailored CV, every time',
              body: 'Reads the job description. Rewrites your CV summary to match the exact role. LPA-aware. Naukri-ready.',
            },
            {
              icon: '✍️',
              title: 'Cover letters that sound human',
              body: 'A voice-rules engine strips out AI slop words. No "passionate", no "leverage", no em-dashes. 130 words. Three paragraphs. Yours.',
            },
            {
              icon: '📊',
              title: 'Application tracker',
              body: 'Every generation is logged automatically. Move applications from Drafted to Offered. Notes and CSV export included.',
            },
            {
              icon: '💬',
              title: 'Recruiter reply drafts',
              body: 'Paste a recruiter message into the extension panel. Get a 60-word professional reply with one sharp clarifying question.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Voice filter before/after ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">The cover letter that sounds like you</h2>
          <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Most AI tools produce the same corporate slop. Naukrify runs every output through a voice-rules
            engine before showing it to you.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">
                Generic AI output (blocked)
              </p>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;I am deeply passionate about leveraging my robust skillset to unlock new paradigms
                at your innovative organization. My holistic approach to brand building seamlessly aligns
                with your transformative vision...&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {['passionate', 'leverage', 'robust', 'holistic', 'seamlessly', 'transformative'].map((w) => (
                  <span key={w} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full line-through">{w}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-3">
                Naukrify output (voice-filtered)
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                &ldquo;At Razorpay I built the sponsorship vertical from scratch. 12 brand partners,
                8 months, ₹2.4 Cr in revenue. Your JD asks for someone who can run the full BD cycle
                solo, and that&apos;s exactly what I did there...&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {['specific numbers', 'no AI slop', '130 words', 'your voice'].map((w) => (
                  <span key={w} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── India context callout ── */}
      <section className="bg-indigo-50 px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg font-semibold text-indigo-900 mb-2">
            Built for Naukri, Wellfound, and Instahyre. Not just LinkedIn.
          </p>
          <p className="text-sm text-indigo-700">
            LPA salary context. Notice period logic. Tier 1 MBA hierarchy. The nuances
            that US job hunt tools completely miss.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="pricing">
        <h2 className="text-2xl font-bold text-center mb-12">Simple pricing</h2>
        <div className="max-w-sm mx-auto rounded-2xl border-2 border-indigo-600 p-8 shadow-lg text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            3-month plan
          </p>
          <div className="flex items-end justify-center gap-1 mb-1">
            <span className="text-5xl font-extrabold">₹499</span>
          </div>
          <p className="text-sm text-gray-400 mb-6">one-time payment, 3 months access</p>

          <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
            {[
              '3 tailored applications per day',
              'CV summary + cover letter for each',
              'Voice-rules filter on every output',
              'Application tracker with notes and CSV export',
              'Recruiter reply drafts (paste message, get reply)',
              'Your own Gemini key, zero ongoing cost',
              '10 free trial applications to start',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <LoginButton label="Get started for ₹499" primary fullWidth />
          <p className="text-xs text-gray-400 mt-3">No card needed to try. Pay only when ready.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is a Gemini API key and how do I get one?',
                a: 'Google Gemini is a free AI. Go to aistudio.google.com/app/apikey, sign in with Google, and click "Create API key". Takes 2 minutes. Paste it into the Naukrify extension once and you\'re set.',
              },
              {
                q: 'Does it work on Naukri and Wellfound too?',
                a: 'Yes. The extension works on LinkedIn Jobs, Naukri, Wellfound, Instahyre, and Hirect. Click the "Tailor with AI" button that appears on any job page.',
              },
              {
                q: 'What happens to my CV data?',
                a: 'Your CV text is stored encrypted in Supabase (Postgres). Only you can see it. Your Gemini API key never leaves your browser. It is never sent to our servers.',
              },
              {
                q: 'Will I be charged monthly?',
                a: 'No. ₹499 is a one-time payment for 3 months of access. After 3 months you can renew or stop. There is no auto-renewal.',
              },
              {
                q: 'What if the extension doesn\'t find the job description?',
                a: 'Scroll the full job page so it loads, then click "Regenerate" in the panel. Works for most LinkedIn, Naukri, and Wellfound job pages. Unusual page layouts may not parse correctly.',
              },
              {
                q: 'Can I use my own voice or style?',
                a: 'Yes. Add "Voice notes" in the extension popup (e.g. "cool tone, no jargon, India context"). You can also create role tilts in the web dashboard to angle the CV for different role types.',
              },
              {
                q: 'Is there interview prep?',
                a: 'Yes. The web dashboard has an "Interview prep" tab. Paste any job description, enter your Gemini key, and get 12 tailored questions across 4 categories, with answer frameworks drawn from your actual CV.',
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-200 pb-6 last:border-0">
                <p className="font-semibold text-gray-900 mb-2">{item.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-xs text-gray-400 space-y-2">
        <p>Naukrify. Built for India job hunters. Questions? omkar@naukrify.com</p>
        <div className="flex items-center justify-center gap-4">
          <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  )
}
