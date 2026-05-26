'use client'

import { useState, useCallback, useRef } from 'react'

interface Props {
  onExtracted: (text: string) => void
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
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

async function extractWithGemini(file: File, apiKey: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64,
              },
            },
            {
              text: 'Extract ALL text from this CV/resume exactly as it appears. Preserve structure: name, contact, summary, work experience, education, skills. Output plain text only. No commentary, no formatting changes.',
            },
          ],
        }],
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 4096,
        },
      }),
    }
  )

  if (res.status === 400) throw new Error('Invalid API key. Check your Gemini key and try again.')
  if (res.status === 403) throw new Error('API key does not have access to Gemini. Check key permissions.')
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini error ${res.status}: ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text.trim()) throw new Error('Gemini returned no text. Try a different PDF or paste your CV manually.')
  return text.trim()
}

type Status = 'idle' | 'extracting' | 'done' | 'image-pdf' | 'gemini-extracting' | 'error'

export default function PdfUpload({ onExtracted }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [dragging, setDragging] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiError, setGeminiError] = useState('')
  const pendingFileRef = useRef<File | null>(null)

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
        pendingFileRef.current = file
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

  async function handleGeminiExtract() {
    const key = geminiKey.trim()
    if (!key) { setGeminiError('Paste your Gemini API key first.'); return }
    const file = pendingFileRef.current
    if (!file) { setGeminiError('Upload a PDF first.'); return }

    setGeminiError('')
    setStatus('gemini-extracting')
    try {
      const text = await extractWithGemini(file, key)
      onExtracted(text)
      setStatus('done')
    } catch (err) {
      setStatus('image-pdf')
      setGeminiError(err instanceof Error ? err.message : 'Extraction failed. Try again.')
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
    e.target.value = ''
  }

  return (
    <div>
      <label
        htmlFor="pdf-upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
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
          <span className="text-sm text-indigo-600">Reading PDF...</span>
        ) : status === 'gemini-extracting' ? (
          <span className="text-sm text-indigo-600">Extracting with Gemini...</span>
        ) : (
          <span className="text-sm text-gray-500">
            <span className="font-medium text-indigo-600">Upload CV as PDF</span> or drag and drop
          </span>
        )}
        <span className="text-xs text-gray-400">Max 5 MB.</span>
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
          Text extracted. Review the CV below and click Save.
        </p>
      )}

      {(status === 'image-pdf' || status === 'gemini-extracting') && (
        <div className="mt-3 p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3">
          <p className="text-sm text-amber-800">
            This PDF has no extractable text (Canva export or scanned document). Use your Gemini key to read it,
            or paste your CV as plain text below.
          </p>
          <div className="space-y-2">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste Gemini API key (AIza...)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400">
              Key is used only for this extraction and not stored. Same key you use in the extension.
            </p>
            <button
              onClick={handleGeminiExtract}
              disabled={status === 'gemini-extracting'}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {status === 'gemini-extracting' ? 'Extracting...' : 'Extract with Gemini'}
            </button>
            {geminiError && <p className="text-xs text-red-600">{geminiError}</p>}
          </div>
        </div>
      )}

      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Could not read this file. Must be a PDF under 5 MB. Try a different file or paste your CV as text.
        </p>
      )}
    </div>
  )
}
