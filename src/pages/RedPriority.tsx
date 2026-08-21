import { useStore } from '../store/store'
import { daysUntil, groceryCeiling, inr, monthKey } from '../engine/analytics'
import { BandChip, Callout, Card, SectionTitle } from '../components/ui'
import { CheckIcon, ShieldIcon } from '../components/Icons'
import { LEAF_BY_L2 } from '../data/taxonomy'

/**
 * The RED tab.
 *
 * Sorted by days-to-due rather than by amount, because discovery research found
 * that households do not think in categories — they think in obligations with
 * deadlines. The success criterion is that someone can answer "am I safe this
 * month?" in under ten seconds without scrolling.
 */
export default function RedPriority() {
  const { obligations, txns, months, profile, now } = useStore()
  const current = months[months.length - 1]
  const unfunded = obligations.filter((o) => !o.funded)
  const thisMonth = monthKey(now.toISOString())

  const redThisMonth = txns.filter((t) => monthKey(t.date) === thisMonth && t.band === 'RED' && !t.excluded && t.direction === 'debit')
  const byCategory = new Map<string, number>()
  for (const t of redThisMonth) byCategory.set(t.categoryL2, (byCategory.get(t.categoryL2) ?? 0) + t.amount)

  const ceiling = groceryCeiling(profile)
  const grocery = byCategory.get('Groceries & staples') ?? 0
  const overCeiling = Math.max(grocery - ceiling, 0)

  return (
    <div className="space-y-5">
      <header className="rounded-card border border-red-border bg-red-surface p-5">
        <div className="flex items-center gap-2 text-red-band">
          <ShieldIcon size={20} />
          <BandChip band="RED" />
        </div>
        <h1 className="mt-2 text-xl font-bold text-red-deep">
          {obligations.length - unfunded.length} of {obligations.length} essentials funded
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
          Shelter, health, food and education. These are protected before anything else is discussed, and SpendLens will never
          suggest reducing them.
        </p>
        <p className="tnum mt-2 text-[13px] text-ink-700">{inr(current?.red ?? 0)} of essential spend this month</p>
      </header>

      <Card>
        <SectionTitle hint="Unfunded items are pinned to the top and everything is ordered by how soon it is due.">
          Obligations this cycle
        </SectionTitle>
        <ul className="divide-y divide-ink-300/60">
          {obligations.map((o) => {
            const days = daysUntil(o.dueDay, now)
            return (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${o.funded ? 'bg-green-surface text-green-band' : 'bg-red-surface text-red-band'}`}>
                  {o.funded ? <CheckIcon size={15} /> : <ShieldIcon size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink-900">{o.label}</p>
                  <p className="text-[12px] text-ink-600">
                    {o.funded
                      ? `Paid on ${new Date(o.fundedOn!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                      : `Due on the ${o.dueDay}${o.dueDay === 1 ? 'st' : o.dueDay === 2 ? 'nd' : o.dueDay === 3 ? 'rd' : 'th'}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[14px] font-semibold text-ink-900">{inr(o.amount)}</p>
                  {!o.funded && (
                    <p className={`text-[12px] font-medium ${days <= 5 ? 'text-red-band' : 'text-ink-600'}`}>
                      in {days} day{days === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {!obligations.length && <p className="py-4 text-[13px] text-ink-600">No recurring essentials detected yet. They appear once two months of history exist.</p>}
      </Card>

      <Card>
        <SectionTitle hint="Every essential category you have spent on this month, whether or not it recurs.">
          Where the essential spend went
        </SectionTitle>
        <ul className="divide-y divide-ink-300/60">
          {[...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
            <li key={cat} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] text-ink-900">{cat}</span>
                <span className="tnum text-[14px] font-semibold text-ink-900">{inr(amount)}</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-600">{LEAF_BY_L2[cat]?.behaviour}</p>
            </li>
          ))}
        </ul>
      </Card>

      {overCeiling > 0 && (
        <Callout tone="AMBER" title="Groceries are protected up to a ceiling, not without limit">
          Your household ceiling is {inr(ceiling)} a month, derived from {Math.max(profile.dependants, 1)} {Math.max(profile.dependants, 1) === 1 ? 'person' : 'people'}.
          You have spent {inr(grocery)}, so {inr(overCeiling)} of it sits above the ceiling and is treated as a decision rather than an
          automatic essential. Without a ceiling, &ldquo;it was groceries&rdquo; becomes an unlimited exemption.
        </Callout>
      )}

      <Callout tone="RED" title="The one rule">
        No recommendation in this product may reduce anything on this page. A guardrail service evaluates every suggestion before
        delivery and blocks the ones that would — you can see it working on the home screen.
      </Callout>
    </div>
  )
}
