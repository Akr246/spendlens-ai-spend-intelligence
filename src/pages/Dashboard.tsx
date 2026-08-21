import { Link } from 'react-router-dom'
import { useStore } from '../store/store'
import { daysUntil, inr } from '../engine/analytics'
import { BandChip, Callout, Card, Meter, SectionTitle, Stat } from '../components/ui'
import { BandBars, SplitBar } from '../components/charts'
import { AlertIcon, ArrowRight, CheckIcon, ClockIcon, SparkIcon } from '../components/Icons'
import NudgeCard from '../components/NudgeCard'

/**
 * Home answers exactly one question: am I safe this month?
 * Everything else on the screen is subordinate to that headline.
 */
export default function Dashboard() {
  const { months, obligations, allowance, leaks, nudges, gar, queue, assessments, projection, now } = useStore()
  const current = months[months.length - 1]
  const funded = obligations.filter((o) => o.funded).length
  const unfunded = obligations.filter((o) => !o.funded)
  const allSafe = unfunded.length === 0
  const primary = assessments[0]

  return (
    <div className="space-y-5">
      {/* Headline */}
      <section className={`rounded-card border p-5 ${allSafe ? 'border-green-border bg-green-surface' : 'border-red-border bg-red-surface'}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 ${allSafe ? 'text-green-band' : 'text-red-band'}`}>
            {allSafe ? <CheckIcon size={22} /> : <AlertIcon size={22} />}
          </span>
          <div className="min-w-0">
            <h1 className={`text-xl font-bold leading-tight ${allSafe ? 'text-green-deep' : 'text-red-deep'}`}>
              {funded} of {obligations.length} essentials funded this cycle
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
              {allSafe
                ? 'Everything that must be paid this month has been. What follows is about what you do with the rest.'
                : `${unfunded.map((o) => o.label).join(', ')} still to come — ${inr(unfunded.reduce((a, o) => a + o.amount, 0))} in total.`}
            </p>
            <p className="mt-2 text-[11px] text-ink-600">
              Last updated {now.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · demo ledger, regenerated each visit
            </p>
          </div>
        </div>
      </section>

      {/* Band split */}
      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink-900">This month, {current?.label}</h2>
          <span className="tnum text-[13px] text-ink-600">{inr(current?.outflow ?? 0)} out of {inr(current?.income ?? 0)} in</span>
        </div>
        <SplitBar red={current?.red ?? 0} green={current?.green ?? 0} amber={current?.amber ?? 0} grow={current?.grow ?? 0} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Essential" tone="RED" value={inr(current?.red ?? 0)} sub={<Link className="underline underline-offset-2" to="/red">See obligations</Link>} />
          <Stat label="Flexible" tone="GREEN" value={inr(current?.green ?? 0)} sub={<Link className="underline underline-offset-2" to="/green">See the leaks</Link>} />
          <Stat label="Grow" tone="GROW" value={inr(current?.grow ?? 0)} sub="Into savings and investments" />
          <Stat label="Undecided" tone="AMBER" value={inr(current?.amber ?? 0)} sub={queue.length ? <Link className="underline underline-offset-2" to="/transactions">{queue.length} to review</Link> : 'Nothing waiting'} />
        </div>
      </Card>

      {/* Allowance + goal */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint={allowance.derivation}>Flexible allowance</SectionTitle>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="tnum text-[22px] font-bold text-ink-900">{inr(current?.green ?? 0)}</span>
            <span className="tnum text-[13px] text-ink-600">of {inr(allowance.value)}</span>
          </div>
          <Meter value={current?.green ?? 0} max={allowance.value} band="GREEN" label="Flexible spend against allowance" />
          <p className="mt-2 text-[12px] text-ink-600">
            {(current?.green ?? 0) > allowance.value
              ? `You are ${inr((current?.green ?? 0) - allowance.value)} above your allowance. That is information, not a verdict — the essentials are unaffected.`
              : `${inr(allowance.value - (current?.green ?? 0))} left before you reach your own limit.`}
          </p>
        </Card>

        {primary && (
          <Card>
            <SectionTitle hint={`Target ${inr(primary.goal.target)} by ${new Date(primary.goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}>
              {primary.goal.name}
            </SectionTitle>
            <div className="flex items-center gap-2">
              <BandChip band={primary.verdict === 'On track' ? 'GREEN' : primary.verdict === 'At risk' ? 'AMBER' : 'RED'} label={primary.verdict.toUpperCase()} />
              <span className="tnum text-[13px] text-ink-700">{inr(primary.requiredMonthly)}/month needed</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
              {primary.gap > 0
                ? `You are ${inr(primary.gap)} short each month. Not "nearly there" — short, by that amount.`
                : `Your surplus of ${inr(primary.surplus)} covers it with ${inr(primary.surplus - primary.requiredMonthly)} to spare.`}
            </p>
            <Link to="/goals" className="btn-ghost btn-sm mt-3">See the trade-offs <ArrowRight size={14} /></Link>
          </Card>
        )}
      </div>

      {/* Nudges */}
      <section>
        <SectionTitle hint={`At most ${2} a day, never between 10pm and 8am, and every one names the essential it protects. ${nudges.suppressedByBudget > 0 ? `${nudges.suppressedByBudget} more were held back by the delivery budget.` : ''}`}>
          Today&rsquo;s suggestions
        </SectionTitle>
        {nudges.delivered.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {nudges.delivered.map((n) => <NudgeCard key={n.id} nudge={n} />)}
          </div>
        ) : (
          <Callout tone="GREEN" title="Nothing worth interrupting you for">
            Either the delivery budget is spent, it is quiet hours, or there is genuinely nothing useful to say today. Sending nothing is a valid output.
          </Callout>
        )}
        {nudges.blocked.length > 0 && (
          <div className="mt-3">
            <Callout tone="RED" title={`${nudges.blocked.length} suggestion${nudges.blocked.length > 1 ? 's' : ''} blocked by the guardrail`}>
              {nudges.blocked.map((b) => (
                <p key={b.id} className="mb-1 last:mb-0">
                  <span className="font-medium">&ldquo;{b.title}&rdquo;</span> — {b.blockReason}
                </p>
              ))}
              <p className="mt-2 text-[12px] text-ink-600">
                The guardrail runs after generation and before delivery. It is separate code from the ranker on purpose, and a blocked
                suggestion is treated as a defect to investigate rather than a number to tune down.
              </p>
            </Callout>
          </div>
        )}
      </section>

      {/* Leaks preview */}
      {leaks.length > 0 && (
        <Card>
          <SectionTitle hint="Compared against your own trailing median, pro-rated to how far into the month you are — never against other people.">Where this month differs</SectionTitle>
          <ul className="divide-y divide-ink-300/60">
            {leaks.map((l) => (
              <li key={l.category} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink-900">{l.category}</p>
                  <p className="text-[12px] text-ink-600">
                    {l.count} transaction{l.count === 1 ? '' : 's'} · by this point you would usually be at {inr(l.expectedToDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tnum text-[14px] font-semibold text-ink-900">{inr(l.current)}</p>
                  <p className={`tnum text-[12px] ${l.excess > 0 ? 'text-amber-band' : 'text-green-band'}`}>
                    {l.excess > 0 ? `+${inr(l.excess)}` : `${inr(l.excess)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="Six months of your own history, banded.">How the split has moved</SectionTitle>
          <BandBars months={months} />
        </Card>
        <Card>
          <SectionTitle hint="Rupees into GROW, plus the verified reduction in flexible spend against your own baseline.">
            Goal-aligned rupees
          </SectionTitle>
          <p className="tnum text-[28px] font-bold text-grow-band">{inr(gar.value)}</p>
          <ul className="mt-2 space-y-1 text-[13px] text-ink-700">
            <li className="flex justify-between"><span>Moved into GROW</span><span className="tnum">{inr(gar.growPart)}</span></li>
            <li className="flex justify-between"><span>Under your own pace ({inr(gar.baselineToDate)} by now, from a {inr(gar.baseline)} month)</span><span className="tnum">{inr(gar.reductionPart)}</span></li>
          </ul>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-600">
            <SparkIcon size={14} /> This is the one number the product is judged on.
          </div>
        </Card>
      </div>

      {projection.shortfallDates.length > 0 && (
        <Callout tone="AMBER" title="Something in the next 90 days needs attention">
          <p className="mb-1">
            On {new Date(projection.shortfallDates[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })},
            {' '}{projection.shortfallDates[0].label} is projected to fall short by {inr(projection.shortfallDates[0].gap)}.
          </p>
          <Link to="/forecast" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
            <ClockIcon size={13} /> See the 90-day path
          </Link>
        </Callout>
      )}

      {obligations.some((o) => !o.funded) && (
        <Card>
          <SectionTitle hint="Sorted by urgency, not by size.">Next essentials due</SectionTitle>
          <ul className="divide-y divide-ink-300/60">
            {obligations.filter((o) => !o.funded).slice(0, 4).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[14px] text-ink-900">{o.label}</span>
                <span className="flex items-center gap-3">
                  <span className="tnum text-[13px] text-ink-700">{inr(o.amount)}</span>
                  <span className="rounded-full bg-red-surface px-2 py-0.5 text-[11px] font-semibold text-red-band">
                    in {daysUntil(o.dueDay, now)} day{daysUntil(o.dueDay, now) === 1 ? '' : 's'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
