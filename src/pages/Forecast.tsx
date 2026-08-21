import { useStore } from '../store/store'
import { inr } from '../engine/analytics'
import { Callout, Card, SectionTitle, Stat } from '../components/ui'
import { ForecastChart } from '../components/charts'
import { AlertIcon, CheckIcon } from '../components/Icons'

/**
 * The 90-day cashflow path.
 *
 * The question this page answers is not "will my balance go negative" but
 * "would the next essential clear". That is the framing the RED floor makes
 * possible, and it is why the markers on the chart are obligations rather than
 * arbitrary dates.
 */
export default function Forecast() {
  const { projection, obligations } = useStore()
  const shortfalls = projection.shortfallDates
  const end = projection.points[projection.points.length - 1]

  return (
    <div className="space-y-5">
      <SectionTitle hint="Projected from your own recurring commitments, income cadence and discretionary habit. A band, not a line — a 90-day projection cannot honestly claim more precision than that.">
        90-day outlook
      </SectionTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Balance today" value={inr(projection.openingBalance)} />
        <Stat label="Projected in 90 days" tone={end && end.balance < 0 ? 'RED' : 'GROW'} value={inr(end?.balance ?? 0)}
          sub={end ? `Range ${inr(end.low)} to ${inr(end.high)}` : undefined} />
        <Stat label="Essentials at risk" tone={shortfalls.length ? 'RED' : 'GREEN'} value={shortfalls.length}
          sub={shortfalls.length ? 'Dates where an essential would not clear' : 'Every essential clears on the projection'} />
      </div>

      <Card>
        <ForecastChart points={projection.points} shortfalls={shortfalls.map((s) => s.date)} />
      </Card>

      {projection.usedConservativeIncome && (
        <Callout tone="AMBER" title="Your income varies, so this uses the conservative figure">
          Income variance across your history is {(projection.incomeVariance * 100).toFixed(0)}%, which is above the 25% threshold. The
          projection therefore uses {inr(projection.incomeUsed)} — roughly your thirtieth-percentile month — rather than your average.
          Planning a variable income on its average is how a good quarter pays for a bad one only in hindsight.
        </Callout>
      )}

      {shortfalls.length > 0 ? (
        <Card className="border-red-border">
          <SectionTitle hint="Each of these is a date on which a protected obligation is projected to fall short.">
            <span className="inline-flex items-center gap-2 text-red-band"><AlertIcon size={18} /> Dates that need attention</span>
          </SectionTitle>
          <ul className="divide-y divide-ink-300/60">
            {shortfalls.map((s) => (
              <li key={s.date + s.label} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-[14px] font-medium text-ink-900">{s.label}</p>
                  <p className="text-[12px] text-ink-600">{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <span className="tnum rounded-full bg-red-surface px-2.5 py-1 text-[12px] font-bold text-red-band">short {inr(s.gap)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Callout tone="GREEN" title="Every essential clears on this projection">
          <span className="inline-flex items-center gap-2"><CheckIcon size={15} /> Nothing in the next 90 days is projected to go unfunded. The band is wide by design, so treat this as reassurance rather than a promise.</span>
        </Callout>
      )}

      <Card>
        <SectionTitle hint="These are the commitments the projection treats as fixed.">Committed obligations</SectionTitle>
        <ul className="divide-y divide-ink-300/60">
          {obligations.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
              <span className="text-ink-900">{o.label}</span>
              <span className="flex items-center gap-3 text-ink-600">
                <span>day {o.dueDay}</span>
                <span className="tnum font-semibold text-ink-900">{inr(o.amount)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
