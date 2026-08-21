import { useMemo, useState } from 'react'
import { useStore } from '../store/store'
import type { Band, Txn } from '../types'
import { inr } from '../engine/analytics'
import { classify } from '../engine/classify'
import { TAXONOMY, LEAF_BY_L2, RULES } from '../data/taxonomy'
import { BandChip, Card, EmptyState, Modal, SectionTitle } from '../components/ui'
import { HelpIcon } from '../components/Icons'

const BANDS: (Band | 'ALL')[] = ['ALL', 'RED', 'GREEN', 'AMBER', 'GROW']

export default function Transactions() {
  const { txns, queue, actions, profile, goals } = useStore()
  const [band, setBand] = useState<Band | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [onlyQueue, setOnlyQueue] = useState(false)
  const [open, setOpen] = useState<Txn | null>(null)

  const hasStudyGoal = goals.some((g) => g.templateKey === 'higher-study')

  const filtered = useMemo(() => {
    const base = onlyQueue ? queue : txns
    return base
      .filter((t) => (band === 'ALL' ? true : t.band === band))
      .filter((t) => (query ? (t.merchant + ' ' + t.narration).toLowerCase().includes(query.toLowerCase()) : true))
      .slice(0, 200)
  }, [txns, queue, band, query, onlyQueue])

  const grouped = useMemo(() => {
    const m = new Map<string, Txn[]>()
    for (const t of filtered) {
      const day = t.date.slice(0, 10)
      m.set(day, [...(m.get(day) ?? []), t])
    }
    return [...m.entries()]
  }, [filtered])

  return (
    <div className="space-y-4">
      <SectionTitle hint={`${txns.length} transactions across six months. ${queue.length} are waiting on a decision from you.`}>
        Money
      </SectionTitle>

      {queue.length > 0 && (
        <Card className="border-amber-border bg-amber-surface">
          <div className="flex flex-wrap items-center gap-3">
            <HelpIcon size={18} className="text-amber-band" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-amber-deep">{queue.length} transactions need a decision</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-700">
                SpendLens was under {RULES.askThreshold * 100}% confident on these, so it asks instead of showing you a confident wrong
                answer. Most clear in a tap, and your answer is remembered for that merchant.
              </p>
            </div>
            <button className="btn-primary btn-sm" onClick={() => { setOnlyQueue(true); setBand('ALL') }}>Review them</button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input className="field max-w-xs flex-1" placeholder="Search merchant or narration" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search transactions" />
        <div className="flex flex-wrap gap-1.5">
          {BANDS.map((b) => (
            <button key={b} onClick={() => { setBand(b); setOnlyQueue(false) }}
              className={`btn btn-sm ${band === b && !onlyQueue ? 'bg-brand text-white' : 'border border-ink-300 bg-white text-ink-700'}`}>
              {b === 'ALL' ? 'All' : b}
            </button>
          ))}
          <button onClick={() => setOnlyQueue((v) => !v)}
            className={`btn btn-sm ${onlyQueue ? 'bg-amber-band text-white' : 'border border-ink-300 bg-white text-ink-700'}`}>
            Needs a decision
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState title="Nothing matches" body="Try a different band, or clear the search." />
      ) : (
        grouped.map(([day, items]) => (
          <div key={day}>
            <p className="sticky top-[112px] z-10 mb-1.5 bg-ink-25/95 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
              {new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
            </p>
            <ul className="card divide-y divide-ink-300/60 p-0">
              {items.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setOpen(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink-900">{t.merchant}</p>
                      <p className="truncate text-[12px] text-ink-600">
                        {t.categoryL2 || 'Unclassified'}
                        {t.overridden || profile.merchantOverrides[t.merchant.toLowerCase().replace(/[^a-z0-9]+/g, '')] ? ' · your correction' : ''}
                        {t.lineItems ? ' · split' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <BandChip band={t.band} size="sm" />
                      <span className={`tnum w-[92px] text-right text-[14px] font-semibold ${t.direction === 'credit' ? 'text-green-band' : 'text-ink-900'}`}>
                        {t.direction === 'credit' ? '+' : ''}{inr(t.amount)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {open && (
        <TxnDetail
          txn={open}
          onClose={() => setOpen(null)}
          onCorrect={(l1, l2, applyAll) => { actions.correctTransaction(open.id, l1, l2, applyAll); setOpen(null) }}
          explanation={classify(open, profile, hasStudyGoal).explanation}
        />
      )}
    </div>
  )
}

/**
 * Transaction detail.
 *
 * "Why this" lists the actual decision path rather than a score, and the
 * correction is deliberately frictionless: it is simultaneously the user's
 * repair mechanism and the product's richest training signal.
 */
function TxnDetail({ txn, onClose, onCorrect, explanation }: {
  txn: Txn
  onClose: () => void
  onCorrect: (l1: string, l2: string, applyAll: boolean) => void
  explanation: { step: string; detail: string }[]
}) {
  const [category, setCategory] = useState(txn.categoryL2)
  const [applyAll, setApplyAll] = useState(true)
  const leaf = LEAF_BY_L2[category]

  return (
    <Modal open onClose={onClose} title={txn.merchant} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tnum text-2xl font-bold text-ink-900">{txn.direction === 'credit' ? '+' : ''}{inr(txn.amount)}</span>
          <BandChip band={txn.band} />
          <span className="text-[12px] text-ink-600">
            {new Date(txn.date).toLocaleString('en-IN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="rounded-lg bg-ink-50 p-3">
          <p className="label mb-1">Bank narration</p>
          <p className="font-num break-all text-[12px] text-ink-700">{txn.narration}</p>
        </div>

        {txn.lineItems && (
          <div>
            <p className="label mb-1.5">Basket split</p>
            <ul className="divide-y divide-ink-300/60 rounded-lg border border-ink-300/70">
              {txn.lineItems.map((li) => (
                <li key={li.label} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="flex items-center gap-2 text-[13px] text-ink-900"><BandChip band={li.band} size="sm" />{li.label}</span>
                  <span className="tnum text-[13px] font-semibold">{inr(li.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="label mb-1.5">Why SpendLens thinks this</p>
          <ol className="space-y-2">
            {explanation.map((e, i) => (
              <li key={i} className="rounded-lg border border-ink-300/70 p-2.5">
                <p className="text-[12px] font-semibold text-ink-900">{e.step}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-700">{e.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[12px] text-ink-600">Confidence {(txn.confidence * 100).toFixed(0)}%.</p>
        </div>

        <div>
          <label className="label mb-1 block" htmlFor="cat">Recategorise</label>
          <select id="cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TAXONOMY.map((l) => <option key={l.l2} value={l.l2}>{l.l1} › {l.l2} ({l.band})</option>)}
          </select>
          {leaf && <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">{leaf.rule} — {leaf.behaviour}</p>}
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-[13px] text-ink-700">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />
            Apply to everything from {txn.merchant}, past and future
          </label>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={() => onCorrect(leaf?.l1 ?? txn.categoryL1, category, applyAll)}>Save correction</button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-600">
            Your correction overrides the classifier permanently. In the specified product it is also queued as a training label — the
            correction stream is the highest-signal research channel the product has.
          </p>
        </div>
      </div>
    </Modal>
  )
}
