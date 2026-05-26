'use client'

import { useState, useEffect } from 'react'

interface Question {
  category: string
  question: string
  framework: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  OPENING:       'bg-blue-50   border-blue-200   text-blue-800',
  BEHAVIORAL:    'bg-purple-50 border-purple-200 text-purple-800',
  'ROLE-SPECIFIC': 'bg-green-50  border-green-200  text-green-800',
  SITUATION:     'bg-orange-50 border-orange-200 text-orange-800',
}

const CATEGORY_LABELS: Record<string, string> = {
  OPENING:       'Opening',
  BEHAVIORAL:    'Behavioral',
  'ROLE-SPECIFIC': 'Role-specific',
  SITUATION:     'Situation',
}

interface Props {
  cv: string
}

export default function InterviewPrep({ cv }: Props) {
  const [jd, setJd]               = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [loading, setLoading]     = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError]         = useState('')
  const [expanded, setExpanded]   = useState<Set<number>>(new Set())

  // Restore key from sessionStorage (clears when tab closes — key stays browser-only)
  useEffect(() => {
    const saved = sessionStorage.getItem('naukrify_prep_key')
    if (saved) setGeminiKey(saved)
  }, [])

  function toggleExpanded(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(questions.map((_, i) => i)))
  }
  function collapseAll() {
    setExpanded(new Set())
  }

  async function generate() {
    if (!jd.trim() || jd.trim().length < 100) {
      setError('Paste the full job description (at least 100 characters).')
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

    // Save key in session (cleared on tab close)
    sessionStorage.setItem('naukrify_prep_key', geminiKey.trim())

    const prompt = buildPrompt(jd.trim(), cv.trim())

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              thinkingConfig: { thinkingBudget: 0 },
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = (err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`
        setError(msg)
        return
      }

      const data = await res.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

      // Strip markdown fences if present
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

      const parsed: Question[] = JSON.parse(jsonText)
      setQuestions(parsed)
      // Expand all by default
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
      <div className="text-sm text-gray-500 leading-relaxed">
        Paste the job description for the role you are preparing for. Naukrify will generate
        12 tailored interview questions with answer frameworks based on your CV.
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={7}
            placeholder="Paste the full JD here — role, requirements, responsibilities..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

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
            Used only in your browser — never sent to Naukrify servers. Stays for this browser session.
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              aistudio.google.com
            </a>.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating questions...' : 'Generate interview questions'}
        </button>
      </div>

      {/* Results */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-gray-200 pt-5">
            <h3 className="font-semibold text-gray-900">
              {questions.length} questions for this role
            </h3>
            <div className="flex gap-3 text-xs">
              <button onClick={expandAll}  className="text-indigo-600 hover:underline">Expand all</button>
              <button onClick={collapseAll} className="text-gray-500 hover:underline">Collapse all</button>
              <button
                onClick={() => window.print()}
                className="text-gray-500 hover:underline"
              >
                Print / Save PDF
              </button>
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
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpanded(idx)}
                      className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 pr-4">{question}</span>
                      <span className="text-gray-400 shrink-0 mt-0.5">
                        {expanded.has(idx) ? '▲' : '▼'}
                      </span>
                    </button>

                    {expanded.has(idx) && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 mt-3 uppercase tracking-wide">
                          Answer framework
                        </p>
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

          <p className="text-xs text-gray-400 pt-2">
            Frameworks are based on your CV. Tailor them with specifics before your interview.
            Regenerate to get a different question set.
          </p>
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
2. BEHAVIORAL (past situations using STAR method — Situation, Task, Action, Result)
3. ROLE-SPECIFIC (technical, functional, or domain skills required by this JD)
4. SITUATION (hypothetical or scenario-based — "What would you do if...")

For each question, provide:
- The question text (as a real interviewer would ask it)
- A 2-3 bullet answer framework using ONLY the candidate's actual experience from the CV above
- Do NOT invent experience. If the CV lacks a directly relevant skill, bridge from what they DO have — be honest about it

RULES:
- No em-dashes
- No banned AI slop (leverage, synergy, passionate, holistic, etc.)
- India context: mention LPA if salary is discussed, use India-specific role norms (notice period, reporting structures)
- Be specific to THIS JD and THIS candidate's CV
- Keep answer framework bullets concise: 1 sentence each
- JSON ONLY — no preamble, no markdown wrapper

Return a JSON array exactly like this:
[
  {
    "category": "OPENING",
    "question": "Tell me about yourself and why this role appeals to you.",
    "framework": [
      "Open with current role and 1-2 headline achievements (use specific numbers from CV)",
      "Bridge to what in this JD excited you — reference a specific requirement or company detail",
      "Close with a forward-looking line: what you want to build or solve in this role"
    ]
  }
]`
}
