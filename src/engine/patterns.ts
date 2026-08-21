import type { Pattern, Txn } from '../types'
import { LEAF_BY_L2, RULES } from '../data/taxonomy'
import type { MonthSummary } from './analytics'
import { inr, monthKey, trailingMedian } from './analytics'

/**
 * Behavioural pattern detection.
 *
 * Five patterns, each surfaced only when its effect clears the materiality
 * threshold. An insight about a two-hundred-rupee tendency is noise wearing the
 * costume of intelligence, so an immaterial pattern is computed, scored and
 * then deliberately not shown.
 *
 * Every pattern carries the transactions behind it so the UI can render a real
 * "why we think this" rather than an unexplained score.
 */

const isGreen = (t: Txn) => LEAF_BY_L2[t.categoryL2]?.band === 'GREEN' && !t.excluded && t.direction === 'debit'

export function detectPatterns(txns: Txn[], months: MonthSummary[], now = new Date()): Pattern[] {
  const out: Pattern[] = []
  const recent = txns.filter((t) => {
    const age = (+now - +new Date(t.date)) / 86400000
    return age <= 92
  })
  const green = recent.filter(isGreen)
  const greenTotal = green.reduce((a, t) => a + t.amount, 0)
  if (!green.length) return out

  // ---------------------------------------------------------------- payday
  const paydays = txns.filter((t) => t.direction === 'credit').map((t) => new Date(t.date).getDate())
  const payday = paydays.length ? Math.round(paydays.reduce((a, b) => a + b, 0) / paydays.length) : 1
  const window = green.filter((t) => {
    const dom = new Date(t.date).getDate()
    return dom >= payday && dom < payday + 5
  })
  const windowShare = window.reduce((a, t) => a + t.amount, 0) / greenTotal
  const expected = 5 / 30
  const paydayExcess = (windowShare - expected) * greenTotal / 3
  out.push({
    key: 'payday',
    title: 'Payday clustering',
    finding: `${(windowShare * 100).toFixed(0)}% of your discretionary spending happens in the five days after money arrives.`,
    detail: `A flat month would put about ${(expected * 100).toFixed(0)}% in that window. The concentration costs roughly ${inr(Math.max(paydayExcess, 0))} a month over an evenly-spread version of the same habit — the spending is not larger, it is just decided while the balance still looks comfortable.`,
    strength: Math.min(Math.round((windowShare / expected) * 40), 100),
    material: paydayExcess >= RULES.patternMateriality,
    evidenceIds: window.slice(0, 6).map((t) => t.id),
    window: 'Last 3 months',
    baseline: 'An even spread across the month',
  })

  // ------------------------------------------------------------ late night
  const late = green.filter((t) => {
    const h = new Date(t.date).getHours()
    return h >= 21 || h < 1
  })
  const lateTotal = late.reduce((a, t) => a + t.amount, 0)
  const lateShare = lateTotal / greenTotal
  out.push({
    key: 'late-night',
    title: 'Late-night ordering',
    finding: `${(lateShare * 100).toFixed(0)}% of your discretionary spend happens after 9pm — ${late.length} transactions worth ${inr(lateTotal)}.`,
    detail: `Late-night orders are ${lateShare > 0.3 ? 'a large' : 'a modest'} share of the total and average ${inr(late.length ? lateTotal / late.length : 0)} each. The pattern matters because these are the decisions least likely to survive being made in the morning.`,
    strength: Math.min(Math.round(lateShare * 200), 100),
    material: lateTotal / 3 >= RULES.patternMateriality,
    evidenceIds: late.slice(0, 6).map((t) => t.id),
    window: 'Last 3 months',
    baseline: 'Your own daytime discretionary spend',
  })

  // --------------------------------------------------------------- weekend
  const weekend = green.filter((t) => [0, 5, 6].includes(new Date(t.date).getDay()))
  const weekendShare = weekend.reduce((a, t) => a + t.amount, 0) / greenTotal
  const weekendExcess = (weekendShare - 3 / 7) * greenTotal / 3
  out.push({
    key: 'weekend',
    title: 'Weekend concentration',
    finding: `${(weekendShare * 100).toFixed(0)}% of discretionary spend falls on Friday, Saturday or Sunday.`,
    detail: `Three days out of seven would be about 43% on a flat week. This is a normal shape for most households and is only worth acting on if the total is above your allowance — it is shown so you can rule it out, not because it is a problem.`,
    strength: Math.min(Math.round(weekendShare * 150), 100),
    material: weekendExcess >= RULES.patternMateriality,
    evidenceIds: weekend.slice(0, 6).map((t) => t.id),
    window: 'Last 3 months',
    baseline: 'An even spread across the week',
  })

  // ----------------------------------------------------------- sale spikes
  const spikeCats = ['Apparel & accessories', 'Gadgets & devices']
  for (const cat of spikeCats) {
    const median = trailingMedian(months, cat, false)
    const peakMonth = months.reduce<{ key: string; label: string; v: number }>(
      (best, m) => ((m.byCategory[cat] ?? 0) > best.v ? { key: m.key, label: m.label, v: m.byCategory[cat] ?? 0 } : best),
      { key: '', label: '', v: 0 },
    )
    if (!peakMonth.v || !median) continue
    const ratio = peakMonth.v / median
    if (ratio < 1.8) continue
    const ids = txns.filter((t) => monthKey(t.date) === peakMonth.key && t.categoryL2 === cat).map((t) => t.id)
    out.push({
      key: `sale-${cat}`,
      title: `Sale-season spike — ${cat.toLowerCase()}`,
      finding: `${peakMonth.label} was ${ratio.toFixed(1)}× your usual ${cat.toLowerCase()} spend: ${inr(peakMonth.v)} against a typical ${inr(median)}.`,
      detail: `Sale events do not create new needs; they compress a year of them into a fortnight. Knowing which month does this to you is what makes it possible to fund it deliberately instead of absorbing it.`,
      strength: Math.min(Math.round(ratio * 30), 100),
      material: peakMonth.v - median >= RULES.patternMateriality,
      evidenceIds: ids.slice(0, 6),
      window: 'Last 6 months',
      baseline: 'Your own median month for this category',
    })
  }

  // --------------------------------------------------- subscription creep
  const subs = new Map<string, { amount: number; firstSeen: string; count: number }>()
  for (const t of txns) {
    if (t.categoryL2 !== 'OTT & subscriptions' || t.direction !== 'debit') continue
    const rec = subs.get(t.merchant) ?? { amount: t.amount, firstSeen: t.date, count: 0 }
    rec.count += 1
    if (t.date < rec.firstSeen) rec.firstSeen = t.date
    subs.set(t.merchant, rec)
  }
  if (subs.size) {
    const monthly = [...subs.values()].reduce((a, s) => a + s.amount, 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
    const added = [...subs.entries()].filter(([, s]) => s.firstSeen > sixMonthsAgo && s.count <= 3)
    out.push({
      key: 'subscription-creep',
      title: 'Subscription creep',
      finding: `${subs.size} active subscriptions costing ${inr(monthly)} a month${added.length ? `, ${added.length} of them added recently` : ''}.`,
      detail: added.length
        ? `${added.map(([m]) => m).join(', ')} appeared in the last few months. Nobody decides to spend ${inr(monthly * 12)} a year on subscriptions; it accumulates one small decision at a time, which is exactly why it is worth a single deliberate review.`
        : `That is ${inr(monthly * 12)} a year. Worth one deliberate review rather than twelve unnoticed renewals.`,
      strength: Math.min(subs.size * 14, 100),
      material: monthly >= RULES.patternMateriality / 2,
      evidenceIds: txns.filter((t) => t.categoryL2 === 'OTT & subscriptions').slice(0, 6).map((t) => t.id),
      window: 'Last 6 months',
      baseline: 'Your subscription list six months ago',
    })
  }

  return out.sort((a, b) => Number(b.material) - Number(a.material) || b.strength - a.strength)
}

/**
 * Impulse index — a composite of the signals above, 0–100.
 * Presented with its inputs visible, because an unexplained score about
 * someone's self-control is not something they should be asked to accept.
 */
export function impulseIndex(patterns: Pattern[]): { value: number; parts: { label: string; value: number }[] } {
  const get = (k: string) => patterns.find((p) => p.key === k)?.strength ?? 0
  const parts = [
    { label: 'Late-night ordering', value: get('late-night') },
    { label: 'Payday clustering', value: get('payday') },
    { label: 'Sale-season spikes', value: Math.max(get('sale-Apparel & accessories'), get('sale-Gadgets & devices')) },
    { label: 'Subscription creep', value: get('subscription-creep') },
  ]
  const weights = [0.35, 0.3, 0.2, 0.15]
  const value = Math.round(parts.reduce((a, p, i) => a + p.value * weights[i], 0))
  return { value, parts }
}
