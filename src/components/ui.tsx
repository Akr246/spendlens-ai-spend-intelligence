import React from 'react'
import type { Band } from '../types'
import { BAND_META } from '../data/taxonomy'
import { HelpIcon, LeafIcon, ShieldIcon, SproutIcon } from './Icons'

/* ------------------------------------------------------------------ band */

export function BandIcon({ band, size = 14, className }: { band: Band; size?: number; className?: string }) {
  switch (band) {
    case 'RED': return <ShieldIcon size={size} className={className} />
    case 'GREEN': return <LeafIcon size={size} className={className} />
    case 'GROW': return <SproutIcon size={size} className={className} />
    default: return <HelpIcon size={size} className={className} />
  }
}

const BAND_CLASS: Record<Band, string> = {
  RED: 'bg-red-surface text-red-band border-red-border',
  GREEN: 'bg-green-surface text-green-band border-green-border',
  AMBER: 'bg-amber-surface text-amber-band border-amber-border',
  GROW: 'bg-grow-surface text-grow-band border-grow-border',
}

/**
 * The band chip. Colour, icon and word always travel together — meaning is
 * never carried by colour alone.
 */
export function BandChip({ band, label, size = 'md' }: { band: Band; label?: string; size?: 'sm' | 'md' }) {
  const meta = BAND_META[band]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${BAND_CLASS[band]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      <BandIcon band={band} size={size === 'sm' ? 11 : 13} />
      {label ?? meta.word}
    </span>
  )
}

export const BAND_HEX: Record<Band, string> = {
  RED: '#B42318', GREEN: '#027A48', AMBER: '#B54708', GROW: '#6941C6',
}

/* ---------------------------------------------------------------- layout */

export function Card({ children, className = '', as: As = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' | 'li' }) {
  return <As className={`card p-4 sm:p-5 ${className}`}>{children}</As>
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-ink-900">{children}</h2>
      {hint && <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{hint}</p>}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'ink', icon }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'ink' | Band; icon?: React.ReactNode
}) {
  const toneClass = tone === 'ink' ? 'text-ink-900' : { RED: 'text-red-band', GREEN: 'text-green-band', AMBER: 'text-amber-band', GROW: 'text-grow-band' }[tone]
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-ink-600">
        {icon}
        <span className="label">{label}</span>
      </div>
      <div className={`tnum mt-1.5 text-[22px] font-bold leading-tight ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-[12px] leading-snug text-ink-600">{sub}</div>}
    </div>
  )
}

/** A neutral progress meter. Never framed as pass/fail. */
export function Meter({ value, max, band = 'GREEN', label }: { value: number; max: number; band?: Band; label?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = max > 0 && value > max
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: over ? BAND_HEX.AMBER : BAND_HEX[band] }} />
      </div>
    </div>
  )
}

export function Callout({ tone = 'brand', title, children }: { tone?: 'brand' | Band; title?: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    brand: 'border-l-brand bg-brand-50',
    RED: 'border-l-red-band bg-red-surface',
    GREEN: 'border-l-green-band bg-green-surface',
    AMBER: 'border-l-amber-band bg-amber-surface',
    GROW: 'border-l-grow-band bg-grow-surface',
  }
  return (
    <div className={`rounded-r-lg border-l-4 px-4 py-3 ${map[tone]}`}>
      {title && <p className="mb-1 text-[13px] font-semibold text-ink-900">{title}</p>}
      <div className="text-[13px] leading-relaxed text-ink-700">{children}</div>
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-ink-900">{title}</p>
      <p className="max-w-md text-[13px] leading-relaxed text-ink-600">{body}</p>
      {action}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-600">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-ink-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className={`relative max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-card ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-ink-600 hover:bg-ink-100" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
