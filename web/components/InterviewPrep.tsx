'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Question {
  category: string
  question: string
  framework: string[]
}

interface Application {
  id: string
  company: string | null
  role_title: string | null
  cover_letter: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  OPENING:         'bg-blue-50   border-blue-200   text-blue-800',
  BEHAVIORAL:      'bg-purple-50 border-purple-200 text-purple-800',
  'ROLE-SPECIFIC': 'bg-green-50  border-green-200  text-green-800',
  SITUATION:       'bg-orange-50 border-orange-200 text-orange-800',
}

const CATEGORY_LABELS: Record<string, string> = {
  OPENING:         'Opening',
  BEHAVIORAL:      'Behavioral',
  'ROLE-SPECIFIC': 'Role-specific',
  SITUATION:       'Situation',
}

interface Props {
  cv: string
  userId: string
}

export default function InterviewPrep({ cv, userId }: Props) {
  const [apps, setApps]               = useState<Application[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>('manual')
  const [jd, setJd]                   = useState('')
  const [geminiKey, setGeminiKey]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [questions, setQuestions]     = useState<Question[]>([])
  const [error, setError]             = useState('')
  const [expanded, setExpanded]       = useState<Set<number>>(new Set())

  // Load applications for the dropdown
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('applications')
      .select('id,company,role_title,cover_letter')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setApps((data as Application[]) ?? []))
  }, [userId])

  // Restore Gemini key from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('naukrify_prep_key')
    if (saved) setGeminiKey(saved)
  }, [])

  // When user picks an application, pre-fill JD from cover letter context
  function handleAppSelect(id: string) {
    setSelectedAppId(id)
    setQuestions([])
    if (id === 'manual') {
      setJd('')
      return
    }
    const app = apps.find((a) => a.id === id)
    if (app?.cover_letter) {
      // Cover letter is generated FROM the JD — use it as context proxy
      setJd('')
    }
  }

  function toggleExpanded(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const selectedApp = apps.find((a) => a.id === selectedAppId)

  async function generate() {
    const isManual = selectedAppId === 'manual'
    const jdText   = isManual ? jd.trim() : jd.trim()

    if (!jdText || jdText.length < 50) {
      setError(isManual
        ? 'Paste the job description (at least 50 characters).'
        : 'Paste the job description for this role below — we use it to tailor the questions.')
      return
    }
    if (!geminiKey.trim()) {
      setError('Enter your Gemini API key.')
      return
    }
    if (!cv || cv.trim().length < 50) {
      setError('No CV found. Add your master CV in the CV tab first.')
      return
    }

    setError('')
    setLoading(true)
    setQuestions([])
    sessionStorage.setItem('naukrify_prep_key', geminiKey.trim())

    const context = selectedApp
      ? `Role: ${selectedApp.role_title ?? 'unknown'} at ${selectedApp.company ?? 'unknown'}\n\n`
      : ''

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(context + jdText, cv.trim()) }] }],
            generationConfig: {
              thinkingConfig: { thinkingBudget: 0 },
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError((err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`)
        return
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const raw      = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      const parsed: Question[] = JSON.parse(jsonText)
      setQuestions(parsed)
      setExpanded(new Set(parsed.map((_, i) => i)))
    } catch (e) {
      setError(e instanceof SyntaxError ? 'Could not parse Gemini response. Try again.' : String(e))
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(questions.map((q) => q.category))]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 leading-relaxed">
        Pick a job you applied for, or paste any job description. Naukrify generates
        12 tailored interview questions with answer frameworks based on your CV.
      </p>

      {/* Step 1: pick application or manual */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Which role are you preparing for?
        </label>
        <select
          value={selectedAppId}
          onChange={(e) => handleAppSelect(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {apps.length > 0 && (
            <optgroup label="From your applications">
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company ?? 'Unknown'} — {a.role_title ?? 'Unknown role'}
                </option>
              ))}
            </optgroup>
          )}
          <option value="manual">Paste a job description manually</option>
        </select>
      </div>

      {/* Step 2: JD input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {selectedAppId === 'manual'
            ? 'Job description'
            : `Job description for ${selectedApp?.role_title ?? 'this role'}`}
          <span className="text-red-500 ml-1">*</span>
        </label>
        {selectedAppId !== 'manual' && (
          <p className="text-xs text-gray-400 mb-2">
            Paste the JD from the job posting — or from your notes if you saved it.
          </p>
        )}
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={6}
          placeholder="Paste the job description here..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      </div>

      {/* Gemini key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gemini API key <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          placeholder="AIza..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Used only in your browser. Stays for this session.{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
            Get a free key
          </a>.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating questions...' : 'Generate interview questions'}
      </button>

      {/* Results */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-gray-900">{questions.length} questions</h3>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setExpanded(new Set(questions.map((_, i) => i)))} className="text-indigo-600 hover:underline">Expand all</button>
              <button onClick={() => setExpanded(new Set())} className="text-gray-500 hover:underline">Collapse all</button>
              <button onClick={() => window.print()} className="text-gray-500 hover:underline">Print</button>
            </div>
          </div>

          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h4 className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[cat] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                {CATEGORY_LABELS[cat] ?? cat}
              </h4>
              {questions
                .map((q, i) => ({ ...q, idx: i }))
                .filter((q) => q.category === cat)
                .map(({ question, framework, idx }) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(idx)}
                      className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 pr-4">{question}</span>
                      <span className="text-gray-400 shrink-0 mt-0.5">{expanded.has(idx) ? '▲' : '▼'}</span>
                    </button>
                    {expanded.has(idx) && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 mt-3 uppercase tracking-wide">Answer framework</p>
                        <ul className="space-y-1.5">
                          {framework.map((point, pi) => (
                            <li key={pi} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function buildPrompt(jd: string, cv: string): string {
  return `You are a professional interview coach for Indian job seekers.

JOB DESCRIPTION:
${jd}

CANDIDATE CV:
${cv.slice(0, 4000)}

Generate exactly 12 interview questions this candidate is likely to face for this specific role.
Group them into 4 categories of 3 questions each:
1. OPENING (introduce yourself, why this role, why this company)
2. BEHAVIORAL (past situations using STAR method)
3. ROLE-SPECIFIC (technical, functional, or domain skills from this JD)
4. SITUATION (hypothetical scenarios)

For each question, provide a 2-3 bullet answer framework using ONLY the candidate's actual CV experience. Do NOT invent experience.

RULES: No em-dashes. No AI slop words. India context. JSON ONLY.

Return a JSON array:
[{"category":"OPENING","question":"...","framework":["bullet 1","bullet 2","bullet 3"]}]`
}
