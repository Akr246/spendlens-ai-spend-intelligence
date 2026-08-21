import { useState } from 'react'
import type { Nudge } from '../types'
import { useStore } from '../store/store'
import { inr, months as fmtMonths } from '../engine/analytics'
import { BandChip } from './ui'

const REASONS = ['Not relevant to me', 'I already handle this', 'The category is wrong', 'Too personal']

/**
 * A nudge card.
 *
 * Every suggestion states the essential it protects and the goal impact in
 * rupees, so the trade-off is legible rather than implied. "Not relevant" is a
 * first-class action: it logs a negative label and suppresses similar
 * suggestions, which is what stops the product from nagging.
 */
export default function NudgeCard({ nudge }: { nudge: Nudge }) {
  const { actions } = useStore()
  const [asking, setAsking] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  if (done) {
    return (
      <div className="card p-4 text-[13px] text-ink-600">
        {done === 'act' ? 'Marked as acted on. It will not be repeated this cycle.' : `Noted: "${done}". Similar suggestions are suppressed for 60 days and the reason is logged as a negative label.`}
      </div>
    )
  }

  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-ink-900">{nudge.title}</h3>
        <BandChip band={nudge.band} size="sm" />
      </div>
      <p className="text-[13px] leading-relaxed text-ink-700">{nudge.body}</p>

      <dl className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50 p-3 text-[12px]">
        <div>
          <dt className="label">Protects</dt>
          <dd className="mt-0.5 text-ink-900">{nudge.protects ?? 'Your essentials'}</dd>
        </div>
        <div>
          <dt className="label">Goal impact</dt>
          <dd className="tnum mt-0.5 text-ink-900">
            {nudge.growImpact > 0 ? `${inr(nudge.growImpact)}/month` : 'Timing, not amount'}
            {nudge.monthsSaved ? ` · ${fmtMonths(nudge.monthsSaved)} sooner` : ''}
          </dd>
        </div>
      </dl>

      {asking ? (
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r} className="btn-ghost btn-sm" onClick={() => { actions.dismissNudge(nudge.id); setDone(r) }}>{r}</button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" onClick={() => { actions.dismissNudge(nudge.id); setDone('act') }}>Act on this</button>
          <button className="btn-ghost btn-sm" onClick={() => { actions.dismissNudge(nudge.id); setDone('Snoozed') }}>Snooze</button>
          <button className="btn-ghost btn-sm" onClick={() => setAsking(true)}>Not relevant</button>
        </div>
      )}
    </article>
  )
}
