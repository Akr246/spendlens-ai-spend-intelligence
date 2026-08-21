import { useState } from 'react'
import { useStore } from '../store/store'
import { inr, monthKey, paceFactor, trailingMedian } from '../engine/analytics'
import { BandChip, Callout, Card, Meter, Modal, SectionTitle } from '../components/ui'
import { CategoryBars } from '../components/charts'
import { LeafIcon } from '../components/Icons'
import { LEAF_BY_L2 } from '../data/taxonomy'

/**
 * The GREEN tab.
 *
 * Tone is the design constraint here. Every leak names a real transaction so it
 * is specific, and nothing on this page uses the language of good and bad
 * spending — the words are ESSENTIAL and FLEXIBLE, never "waste".
 */
export default function GreenPriority() {
  const { months, leaks, allowance, txns, actions, profile, now } = useStore()
  const current = months[months.length - 1]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(allowance.value)
  const thisMonth = monthKey(now.toISOString())

  const rows = Object.entries(current?.byCategory ?? {})
    .filter(([cat]) => LEAF_BY_L2[cat]?.band === 'GREEN')
    .map(([label, value]) => ({
      label,
      value,
      // Every bar gets its pace marker, not only the three flagged as leaks.
      median: Math.round(trailingMedian(months, label) * paceFactor(now)),
      band: 'GREEN' as const,
    }))
    .sort((a, b) => b.value - a.value)

  const spent = current?.green ?? 0
  const pct = allowance.value ? Math.round((spent / allowance.value) * 100) : 0

  return (
    <div className="space-y-5">
      <header className="rounded-card border border-green-border bg-green-surface p-5">
        <div className="flex items-center gap-2 text-green-band"><LeafIcon size={20} /><BandChip band="GREEN" /></div>
        <h1 className="tnum mt-2 text-xl font-bold text-green-deep">{inr(spent)} of {inr(allowance.value)} used</h1>
        <div className="mt-3"><Meter value={spent} max={allowance.value} band="GREEN" label="Flexible spend against allowance" /></div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
          {pct > 100
            ? `${pct}% of your allowance. Your essentials are unaffected — this is a note about the flexible half of your money, not a verdict on you.`
            : `${pct}% of your allowance, with ${inr(allowance.value - spent)} left this month.`}
        </p>
        <button className="btn-ghost btn-sm mt-3" onClick={() => { setDraft(allowance.value); setEditing(true) }}>Adjust allowance</button>
      </header>

      {allowance.squeezed && (
        <Callout tone="AMBER" title="Your income does not currently leave room for both">
          {allowance.derivation}
        </Callout>
      )}

      <Card>
        <SectionTitle hint="Ranked by how far ahead of your own usual pace they are, pro-rated to today. Never a comparison against other people.">
          The three biggest differences this month
        </SectionTitle>
        {leaks.length ? (
          <ul className="space-y-4">
            {leaks.map((l) => (
              <li key={l.category} className="rounded-lg border border-ink-300/70 p-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold text-ink-900">{l.category}</span>
                  <span className="tnum text-[15px] font-semibold text-ink-900">{inr(l.current)}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                  {l.count} transaction{l.count === 1 ? '' : 's'} so far. A full month usually costs you {inr(l.median)}, which puts you
                  at {inr(l.expectedToDate)} by this point —{' '}
                  {l.excess > 0
                    ? `you are ${inr(l.excess)} ahead of that pace.`
                    : `you are ${inr(Math.abs(l.excess))} behind it, which is the direction you want.`}
                </p>
                {l.example && (
                  <p className="mt-2 rounded bg-ink-50 px-2.5 py-1.5 text-[12px] text-ink-700">
                    Largest single one: <span className="font-medium">{l.example.merchant}</span>,{' '}
                    <span className="tnum">{inr(l.example.amount)}</span> on{' '}
                    {new Date(l.example.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at{' '}
                    {new Date(l.example.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-600">Nothing is meaningfully above your usual month.</p>
        )}
      </Card>

      <Card>
        <SectionTitle hint="The marker on each bar is your own trailing median for that category.">Flexible spend by category</SectionTitle>
        {rows.length ? <CategoryBars rows={rows} /> : <p className="text-[13px] text-ink-600">No flexible spend recorded this month.</p>}
      </Card>

      <Card>
        <SectionTitle hint="A gym membership is flexible for most households and essential for someone managing a heart condition. Only you know which.">
          Move a category to essential
        </SectionTitle>
        <ul className="divide-y divide-ink-300/60">
          {Object.keys(current?.byCategory ?? {})
            .filter((c) => LEAF_BY_L2[c]?.userMovable)
            .map((cat) => {
              const promoted = profile.bandOverrides[cat] === 'RED'
              const monthly = current?.byCategory[cat] ?? 0
              return (
                <li key={cat} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[14px] text-ink-900">{cat}</p>
                    <p className="text-[12px] text-ink-600">
                      {promoted
                        ? `Protected in your RED floor. Adds ${inr(monthly)} to what must be funded first.`
                        : `Currently flexible. Promoting it adds ${inr(monthly)} to your protected floor and reduces this allowance by the same amount.`}
                    </p>
                  </div>
                  <button className="btn-ghost btn-sm shrink-0" onClick={() => actions.setBandOverride(cat, promoted ? null : 'RED')}>
                    {promoted ? 'Make flexible' : 'Make essential'}
                  </button>
                </li>
              )
            })}
        </ul>
      </Card>

      <Callout tone="GREEN" title="Why there is no shaming here">
        Festival, family and celebration spending is forecast and funded rather than flagged. A product that treats Diwali as a budget
        failure has misunderstood the households it is built for.
      </Callout>

      <Modal open={editing} onClose={() => setEditing(false)} title="Adjust your flexible allowance">
        <p className="mb-3 text-[13px] leading-relaxed text-ink-600">{allowance.derivation}</p>
        <label className="label mb-1 block" htmlFor="allow">Monthly allowance</label>
        <input id="allow" type="number" className="field tnum" value={draft} onChange={(e) => setDraft(Number(e.target.value))} />
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={() => { actions.setAllowance(draft); setEditing(false) }}>Save</button>
          <button className="btn-ghost" onClick={() => { actions.setAllowance(null); setEditing(false) }}>Reset to derived</button>
        </div>
        <p className="mt-3 text-[12px] text-ink-600">
          {txns.filter((t) => monthKey(t.date) === thisMonth).length} transactions were used to derive the suggested figure.
        </p>
      </Modal>
    </div>
  )
}
