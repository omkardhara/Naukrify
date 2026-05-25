'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Variant {
  id: string
  name: string
  tilt_notes: string | null
}

interface Props {
  userId: string
  initialVariants: Variant[]
}

export default function VariantEditor({ userId, initialVariants }: Props) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTilt, setNewTilt] = useState('')
  const [addStatus, setAddStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [savingId, setSavingId] = useState<string | null>(null)

  const supabase = createClient()

  async function handleAdd() {
    if (!newName.trim()) return
    setAddStatus('saving')
    const { data, error } = await supabase
      .from('cv_variants')
      .insert({ user_id: userId, name: newName.trim(), tilt_notes: newTilt.trim() })
      .select()
      .single()
    if (error || !data) {
      setAddStatus('error')
      return
    }
    setVariants((v) => [...v, data])
    setNewName('')
    setNewTilt('')
    setAdding(false)
    setAddStatus('idle')
  }

  async function handleDelete(id: string) {
    await supabase.from('cv_variants').delete().eq('id', id)
    setVariants((v) => v.filter((x) => x.id !== id))
  }

  async function handleSaveTilt(id: string, tilt_notes: string) {
    setSavingId(id)
    await supabase.from('cv_variants').update({ tilt_notes }).eq('id', id)
    setVariants((v) => v.map((x) => (x.id === id ? { ...x, tilt_notes } : x)))
    setSavingId(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Add a tilt for each type of role you&apos;re applying to. When you pick a
        tilt in the extension, Gemini uses those notes to angle the CV summary
        and cover letter for that role. No tilt = master CV with no angle.
      </p>

      {variants.length === 0 && !adding && (
        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
          No tilts yet. Add your first one below.
        </div>
      )}

      {variants.map((v) => (
        <VariantCard
          key={v.id}
          variant={v}
          saving={savingId === v.id}
          onSave={(tilt) => handleSaveTilt(v.id, tilt)}
          onDelete={() => handleDelete(v.id)}
        />
      ))}

      {adding ? (
        <div className="border border-indigo-200 bg-indigo-50/30 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tilt name
            </label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Brand Manager roles, Product at D2C startups"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions for Gemini
            </label>
            <textarea
              value={newTilt}
              onChange={(e) => setNewTilt(e.target.value)}
              rows={3}
              placeholder="e.g. Lead with the Mamaearth campaign and the 40% revenue result. Emphasise brand strategy and consumer insight. Downplay ops experience. Use marketing vocabulary, not startup jargon."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            <p className="mt-1 text-xs text-gray-400">
              Be specific. Name achievements, skills, or angles to emphasise or
              de-emphasise for this role type.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={addStatus === 'saving' || !newName.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {addStatus === 'saving' ? 'Saving...' : 'Add tilt'}
            </button>
            <button
              onClick={() => {
                setAdding(false)
                setNewName('')
                setNewTilt('')
                setAddStatus('idle')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            {addStatus === 'error' && (
              <span className="text-sm text-red-600">Save failed. Try again.</span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={variants.length >= 10}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-40 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add role tilt
          {variants.length >= 10 && (
            <span className="text-gray-400 font-normal">(max 10)</span>
          )}
        </button>
      )}
    </div>
  )
}

// ── Individual variant card ───────────────────────────────────────────────────

function VariantCard({
  variant,
  saving,
  onSave,
  onDelete,
}: {
  variant: Variant
  saving: boolean
  onSave: (tilt: string) => void
  onDelete: () => void
}) {
  const [tilt, setTilt] = useState(variant.tilt_notes ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{variant.name}</span>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            {open ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {!open && tilt && (
        <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">{tilt}</p>
      )}

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={tilt}
            onChange={(e) => setTilt(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <button
            onClick={() => {
              onSave(tilt)
              setOpen(false)
            }}
            disabled={saving}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
