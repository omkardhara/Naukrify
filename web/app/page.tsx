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

      {/* ── How it works ── */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Install the Chrome extension',
                body: 'One click from the Chrome Web Store. Paste your free Gemini API key. Done.',
              },
              {
                step: '2',
                title: 'Open any LinkedIn job',
                body: 'Click the "Tailor with AI" button. It reads the job description and your CV automatically.',
              },
              {
                step: '3',
                title: 'Copy and apply',
                body: 'Get a tailored CV summary and a 130-word cover letter in under 30 seconds. Review, copy, send.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">What makes it different</h2>
        <div className="grid sm:grid-cols-3 gap-8">
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
              body: 'Every generation is logged automatically. Move applications from Drafted to Offered. All in one place.',
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
              'Application tracker with status pipeline',
              'Your own Gemini key — zero ongoing cost',
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

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-xs text-gray-400">
        <p>Naukrify — built for India job hunters. Questions? omkar@naukrify.com</p>
      </footer>
    </div>
  )
}
