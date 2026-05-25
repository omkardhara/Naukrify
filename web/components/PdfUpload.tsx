'use client'

import { useState, useCallback } from 'react'

interface Props {
  onExtracted: (text: string) => void
}

async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import keeps pdf.js out of the server bundle
  const pdfjsLib = await import('pdfjs-dist')

  // Serve worker from /public — copied there by the postinstall script
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: unknown) => {
        if (typeof item === 'object' && item !== null && 'str' in item) {
          return (item as { str: string }).str
        }
        return ''
      })
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n').trim()
}

type Status = 'idle' | 'extracting' | 'done' | 'image-pdf' | 'error'

export default function PdfUpload({ onExtracted }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error')
      return
    }
    setStatus('extracting')
    try {
      const text = await extractTextFromPdf(file)
      if (!text || text.replace(/\s/g, '').length < 80) {
        // Very little text extracted = likely an image-based / Canva PDF
        setStatus('image-pdf')
        return
      }
      onExtracted(text)
      setStatus('done')
    } catch (err) {
      console.error('PDF extraction error:', err)
      setStatus('error')
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // allow re-selecting same file
  }

  return (
    <div>
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-5 cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <svg
          className="w-7 h-7 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {status === 'extracting' ? (
          <span className="text-sm text-indigo-600">Extracting text from PDF...</span>
        ) : (
          <span className="text-sm text-gray-500">
            <span className="font-medium text-indigo-600">Upload CV as PDF</span> or drag
            and drop
          </span>
        )}
        <span className="text-xs text-gray-400">
          Text-based PDFs only. Max 5 MB. Exported from Word or Google Docs.
        </span>
      </label>
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={onFileInput}
      />

      {status === 'done' && (
        <p className="mt-2 text-sm text-green-600">
          Text extracted. Review the CV field below and click Save when happy.
        </p>
      )}
      {status === 'image-pdf' && (
        <p className="mt-2 text-sm text-amber-700">
          This PDF has no extractable text — it&apos;s likely a Canva export or
          scanned document. Export your CV from Google Docs or Word as a PDF
          instead, or paste the text directly.
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Could not read this file. Try a different PDF or paste your CV as text.
        </p>
      )}
    </div>
  )
}
