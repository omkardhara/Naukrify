'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialCv: string
  initialName: string
  initialPhone: string
  onSaved?: (cv: string) => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function CvEditor({
  userId,
  initialCv,
  initialName,
  initialPhone,
  onSaved,
}: Props) {
  const [cv, setCv] = useState(initialCv)
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [status, setStatus] = useState<SaveStatus>('idle')

  const wordCount = cv.trim() ? cv.trim().split(/\s+/).length : 0

  async function handleSave() {
    setStatus('saving')
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      master_cv: cv,
      name,
      phone,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.error('Save failed:', error.message)
      setStatus('error')
    } else {
      setStatus('saved')
      onSaved?.(cv)
    }
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="cv-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="cv-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label
            htmlFor="cv-phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone
          </label>
          <input
            id="cv-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="cv-text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          CV text{' '}
          <span className="font-normal text-gray-400">
            {wordCount > 0 ? `${wordCount} words` : ''}
          </span>
        </label>
        <textarea
          id="cv-text"
          value={cv}
          onChange={(e) => setCv(e.target.value)}
          rows={22}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
          placeholder={
            'Paste your full CV as plain text.\n\n' +
            'Include: name and contact info, professional summary, work experience\n' +
            'with achievements and specific numbers (revenue, team size, growth %),\n' +
            'key skills, education, certifications.'
          }
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {status === 'saving' ? 'Saving...' : 'Save CV'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-600">Saved.</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-600">
            Save failed. Check your connection and try again.
          </span>
        )}
      </div>
    </div>
  )
}
