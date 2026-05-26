'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function downloadRtf(text: string, filename: string) {
  let rtfBody = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if      (text[i] === '\\') rtfBody += '\\\\'
    else if (text[i] === '{')  rtfBody += '\\{'
    else if (text[i] === '}')  rtfBody += '\\}'
    else if (text[i] === '\n') rtfBody += '\\par\n'
    else if (code > 127)       rtfBody += '\\u' + code + '?'
    else                       rtfBody += text[i]
  }
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\n\\f0\\fs24 ${rtfBody}\n}`
  const blob = new Blob([rtf], { type: 'application/rtf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type Status = 'drafted' | 'applied' | 'replied' | 'interview' | 'rejected' | 'offered'

interface Application {
  id: string
  company: string | null
  role_title: string | null
  job_url: string | null
  source: string
  cover_letter: string | null
  cv_summary: string | null
  status: Status
  created_at: string
}

const COLUMNS: { id: Status; label: string; colour: string }[] = [
  { id: 'drafted',   label: 'Drafted',   colour: 'bg-gray-100 text-gray-700'   },
  { id: 'applied',   label: 'Applied',   colour: 'bg-blue-100 text-blue-700'   },
  { id: 'replied',   label: 'Replied',   colour: 'bg-yellow-100 text-yellow-700' },
  { id: 'interview', label: 'Interview', colour: 'bg-purple-100 text-purple-700' },
  { id: 'rejected',  label: 'Rejected',  colour: 'bg-red-100 text-red-700'     },
  { id: 'offered',   label: 'Offered',   colour: 'bg-green-100 text-green-700' },
]

const STATUS_MOVES: Record<Status, Status | null> = {
  drafted:   'applied',
  applied:   'replied',
  replied:   'interview',
  interview: 'offered',
  rejected:  null,
  offered:   null,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function ApplicationTracker({ userId }: { userId: string }) {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('applications')
      .select('id,company,role_title,job_url,source,cover_letter,cv_summary,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setApps((data as Application[]) ?? [])
        setLoading(false)
      })
  }, [userId])

  async function moveStatus(appId: string, next: Status) {
    const supabase = createClient()
    const { error } = await supabase
      .from('applications')
      .update({ status: next })
      .eq('id', appId)
    if (!error) {
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: next } : a)))
    }
  }

  async function markRejected(appId: string) {
    await moveStatus(appId, 'rejected')
  }

  async function deleteApp(appId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('applications').delete().eq('id', appId)
    if (!error) setApps((prev) => prev.filter((a) => a.id !== appId))
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-6 text-center">Loading applications...</p>
  }

  if (apps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-base font-medium mb-1">No applications yet</p>
        <p className="text-sm">
          Use the extension on a LinkedIn job page to tailor your CV. Each generation is
          logged here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {COLUMNS.map((col) => {
        const colApps = apps.filter((a) => a.status === col.id)
        if (colApps.length === 0) return null
        return (
          <div key={col.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.colour}`}>
                {col.label}
              </span>
              <span className="text-xs text-gray-400">{colApps.length}</span>
            </div>
            <div className="space-y-2">
              {colApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  expanded={expandedId === app.id}
                  onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  onMove={() => {
                    const next = STATUS_MOVES[app.status]
                    if (next) moveStatus(app.id, next)
                  }}
                  onReject={() => markRejected(app.id)}
                  onDelete={() => deleteApp(app.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CardProps {
  app: Application
  expanded: boolean
  onToggle: () => void
  onMove: () => void
  onReject: () => void
  onDelete: () => void
}

function AppCard({ app, expanded, onToggle, onMove, onReject, onDelete }: CardProps) {
  const next = STATUS_MOVES[app.status]
  const nextLabel = next
    ? COLUMNS.find((c) => c.id === next)?.label
    : null

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div
        className="flex items-start justify-between px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {app.company || 'Unknown company'}
          </p>
          <p className="text-xs text-gray-500 truncate">{app.role_title || 'Unknown role'}</p>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <span className="text-xs text-gray-400 capitalize">{app.source}</span>
          <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {app.job_url && (
            <a
              href={app.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              View job posting
            </a>
          )}

          {app.cover_letter && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Cover letter</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {app.cover_letter}
              </p>
              <button
                className="mt-1 text-xs text-indigo-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(app.cover_letter!)
                }}
              >
                Copy
              </button>
            </div>
          )}

          {app.cv_summary && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">CV summary</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {app.cv_summary}
              </p>
              <div className="mt-1 flex gap-3">
                <button
                  className="text-xs text-indigo-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(app.cv_summary!)
                  }}
                >
                  Copy
                </button>
                <button
                  className="text-xs text-indigo-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    const slug = (s: string | null) =>
                      (s ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    downloadRtf(
                      app.cv_summary!,
                      `${slug(app.company)}__${slug(app.role_title)}__cv-summary.rtf`,
                    )
                  }}
                >
                  Download RTF
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {nextLabel && (
              <button
                onClick={(e) => { e.stopPropagation(); onMove() }}
                className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Mark as {nextLabel}
              </button>
            )}
            {app.status !== 'rejected' && app.status !== 'offered' && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject() }}
                className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
              >
                Rejected
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
