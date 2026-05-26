'use client'

import { useState } from 'react'
import CvEditor from './CvEditor'
import PdfUpload from './PdfUpload'
import VariantEditor from './VariantEditor'
import ApplicationTracker from './ApplicationTracker'
import InterviewPrep from './InterviewPrep'

interface Variant {
  id: string
  name: string
  tilt_notes: string | null
}

interface Props {
  userId: string
  initialCv: string
  initialName: string
  initialPhone: string
  initialVariants: Variant[]
}

type Tab = 'cv' | 'variants' | 'applications' | 'prep'

export default function DashboardTabs({
  userId,
  initialCv,
  initialName,
  initialPhone,
  initialVariants,
}: Props) {
  const [tab, setTab] = useState<Tab>('cv')
  // pdfText + editorKey: when a PDF is uploaded, remount CvEditor with the extracted text
  const [pdfText, setPdfText]   = useState<string | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  // Track cv changes so InterviewPrep always gets the latest saved CV
  const [liveCv, setLiveCv] = useState(initialCv)

  function handlePdfExtracted(text: string) {
    setPdfText(text)
    setEditorKey((k) => k + 1)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cv',           label: 'Master CV' },
    { id: 'variants',     label: 'Role tilts' },
    { id: 'applications', label: 'Applications' },
    { id: 'prep',         label: 'Interview prep' },
  ]

  return (
    <div>
      {/* Tab strip */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cv' && (
        <div className="space-y-5">
          <PdfUpload onExtracted={handlePdfExtracted} />
          <CvEditor
            key={editorKey}
            userId={userId}
            initialCv={pdfText ?? initialCv}
            initialName={initialName}
            initialPhone={initialPhone}
            onSaved={setLiveCv}
          />
        </div>
      )}

      {tab === 'variants' && (
        <VariantEditor userId={userId} initialVariants={initialVariants} />
      )}

      {tab === 'applications' && (
        <ApplicationTracker userId={userId} />
      )}

      {tab === 'prep' && (
        <InterviewPrep cv={liveCv || initialCv} userId={userId} />
      )}
    </div>
  )
}
