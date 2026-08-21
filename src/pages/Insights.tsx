import { useState } from 'react'
import { useStore } from '../store/store'
import { inr } from '../engine/analytics'
import { Callout, Card, Meter, Modal, SectionTitle } from '../components/ui'
import { BandBars } from '../components/charts'
import { SparkIcon } from '../components/Icons'
import type { Pattern } from '../types'
import { RULES } from '../data/taxonomy'

/**
 * Insights.
 *
 * Two rules from the spec are visible on this page. An immaterial pattern is
 * computed and then deliberately not promoted — an insight about a
 * two-hundred-rupee tendency is noise wearing the costume of intelligence. And
 * every insight can be opened to see the transactions behind it and disputed in
 * one tap.
 */
export default function Insights() {
  const { patterns, impulse, months, txns, gar } = useStore()
  const [open, setOpen] = useState<Pattern | null>(null)
  const [disputed, setDisputed] = useState<string[]>([])
  const material = patterns.filter((p) => p.material && !disputed.includes(p.key))
  const quiet = patterns.filter((p) => !p.material || disputed.includes(p.key))
  const current = months[months.length - 1]

  return (
    <div className="space-y-5">
      <SectionTitle hint="Behavioural patterns found in your own six months of history. Each one shows its evidence.">
        Insights
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="A composite of the signals below, weighted. Shown with its inputs because an unexplained score about your self-control is not something you should be asked to accept.">
            Impulse index
          </SectionTitle>
          <div className="flex items-end gap-3">
            <span className="tnum text-[40px] font-bold leading-none text-ink-900">{impulse.value}</span>
            <span className="pb-1.5 text-[13px] text-ink-600">out of 100</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {impulse.parts.map((p) => (
              <li key={p.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-ink-700">{p.label}</span>
                  <span className="tnum text-ink-900">{p.value}</span>
                </div>
                <Meter value={p.value} max={100} band="AMBER" label={p.label} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle hint="Six months, banded.">Your monthly report</SectionTitle>
          <BandBars months={months} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
            <div><dt className="label">This month out</dt><dd className="tnum mt-0.5 font-semibold">{inr(current?.outflow ?? 0)}</dd></div>
            <div><dt className="label">Goal-aligned rupees</dt><dd className="tnum mt-0.5 font-semibold text-grow-band">{inr(gar.value)}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="space-y-3">
        {material.map((p) => (
          <Card key={p.key}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-brand"><SparkIcon size={18} /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-900">{p.finding}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{p.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => setOpen(p)}>Why we think this</button>
                  <button className="btn-ghost btn-sm" onClick={() => setDisputed((d) => [...d, p.key])}>This is wrong about me</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!material.length && (
          <Callout tone="GREEN" title="Nothing material to report this month">
            Patterns were computed and none cleared the materiality threshold of {inr(RULES.patternMateriality)} a month. Saying nothing is
            the right answer more often than a product like this usually admits.
          </Callout>
        )}
      </div>

      {quiet.length > 0 && (
        <Card>
          <SectionTitle hint={`Computed, scored, and deliberately not promoted — each is below the ${inr(RULES.patternMateriality)}/month materiality floor, or you told us it was wrong.`}>
            Detected but not worth your attention
          </SectionTitle>
          <ul className="divide-y divide-ink-300/60">
            {quiet.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[14px] text-ink-900">{p.title}</p>
                  <p className="truncate text-[12px] text-ink-600">{p.finding}</p>
                </div>
                <button className="btn-ghost btn-sm shrink-0" onClick={() => setOpen(p)}>Look anyway</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ''} wide>
        {open && (
          <div className="space-y-4">
            <p className="text-[14px] leading-relaxed text-ink-900">{open.finding}</p>
            <p className="text-[13px] leading-relaxed text-ink-600">{open.detail}</p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-ink-50 p-3 text-[12px]">
              <div><dt className="label">Window</dt><dd className="mt-0.5 text-ink-900">{open.window}</dd></div>
              <div><dt className="label">Compared against</dt><dd className="mt-0.5 text-ink-900">{open.baseline}</dd></div>
            </dl>
            <div>
              <p className="label mb-1.5">The transactions behind it</p>
              <ul className="divide-y divide-ink-300/60 rounded-lg border border-ink-300/70">
                {open.evidenceIds.map((id) => {
                  const t = txns.find((x) => x.id === id)
                  if (!t) return null
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                      <span className="min-w-0 truncate">
                        {t.merchant}
                        <span className="ml-2 text-[11px] text-ink-600">
                          {new Date(t.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="tnum shrink-0 font-semibold">{inr(t.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => { setDisputed((d) => [...d, open.key]); setOpen(null) }}>
              This is wrong about me
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
