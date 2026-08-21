import type { Band, Obligation, Profile, Txn } from '../types'
import { LEAF_BY_L2, RULES } from '../data/taxonomy'

/** Month key, e.g. "2026-08". */
export const monthKey = (iso: string) => iso.slice(0, 7)

export const inr = (n: number, opts: { paise?: boolean } = {}) =>
  '₹' + Math.round(n).toLocaleString('en-IN', opts.paise ? { minimumFractionDigits: 2 } : undefined)

/**
 * Durations in the honest unit. "156 months sooner" is arithmetically true and
 * cognitively useless; "13 years sooner" is the same fact, readable.
 */
export function months(n: number): string {
  if (n <= 0) return ''
  if (n < 24) return `${n} month${n === 1 ? '' : 's'}`
  const y = n / 12
  return `${y >= 10 ? Math.round(y) : y.toFixed(1)} years`
}

/** Indian grouping, no symbol. */
export const num = (n: number) => Math.round(n).toLocaleString('en-IN')

export interface MonthSummary {
  key: string
  label: string
  income: number
  red: number
  green: number
  amber: number
  grow: number
  outflow: number
  byCategory: Record<string, number>
}

const MONTH_LABEL = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

export function summariseMonths(txns: Txn[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>()
  for (const t of txns) {
    const k = monthKey(t.date)
    if (!map.has(k)) map.set(k, { key: k, label: MONTH_LABEL(k), income: 0, red: 0, green: 0, amber: 0, grow: 0, outflow: 0, byCategory: {} })
    const s = map.get(k)!
    if (t.direction === 'credit') { s.income += t.amount; continue }
    if (t.excluded) continue
    s.outflow += t.amount
    if (t.lineItems?.length) {
      for (const li of t.lineItems) {
        if (li.band === 'RED') s.red += li.amount
        else if (li.band === 'GREEN') s.green += li.amount
        s.byCategory[li.categoryL2] = (s.byCategory[li.categoryL2] ?? 0) + li.amount
      }
      continue
    }
    if (t.band === 'RED') s.red += t.amount
    else if (t.band === 'GREEN') s.green += t.amount
    else if (t.band === 'GROW') s.grow += t.amount
    else s.amber += t.amount
    s.byCategory[t.categoryL2] = (s.byCategory[t.categoryL2] ?? 0) + t.amount
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
}

/** How far into the current month we are, 0–1. One definition, used everywhere. */
export function paceFactor(now = new Date()): number {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.min(now.getDate(), daysInMonth) / daysInMonth
}

/** Trailing median of a category's monthly spend, excluding the current month. */
export function trailingMedian(months: MonthSummary[], category: string, excludeCurrent = true): number {
  const pool = excludeCurrent ? months.slice(0, -1) : months
  const vals = pool.map((m) => m.byCategory[category] ?? 0).filter((v) => v > 0)
  if (!vals.length) return 0
  vals.sort((a, b) => a - b)
  const mid = Math.floor(vals.length / 2)
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2
}

export function bandTotal(months: MonthSummary[], band: Exclude<Band, 'AMBER'>, count = 3): number {
  const pool = months.slice(-count - 1, -1)
  if (!pool.length) return 0
  const k = band === 'RED' ? 'red' : band === 'GREEN' ? 'green' : 'grow'
  return pool.reduce((a, m) => a + (m[k] as number), 0) / pool.length
}

/** Trailing monthly income; used as the planning envelope. */
export function incomeStats(months: MonthSummary[]): { mean: number; conservative: number; variance: number } {
  const pool = months.slice(0, -1).map((m) => m.income).filter((v) => v > 0)
  if (!pool.length) return { mean: 0, conservative: 0, variance: 0 }
  const mean = pool.reduce((a, b) => a + b, 0) / pool.length
  const sorted = [...pool].sort((a, b) => a - b)
  // 30th percentile — the conservative envelope used for variable incomes.
  const conservative = sorted[Math.max(0, Math.floor(sorted.length * 0.3) - (sorted.length > 2 ? 0 : 0))] ?? mean
  const sd = Math.sqrt(pool.reduce((a, b) => a + (b - mean) ** 2, 0) / pool.length)
  return { mean, conservative, variance: mean ? sd / mean : 0 }
}

/**
 * Recurring RED commitments for the current cycle, with funded state.
 *
 * Keyed by merchant rather than category: rent, broadband and society
 * maintenance are all "Utilities or Shelter" but they are three separate
 * obligations with three separate due dates, and a household thinks about them
 * that way.
 */
export function currentObligations(txns: Txn[], now = new Date()): Obligation[] {
  const thisMonth = monthKey(now.toISOString())
  const byMerchant = new Map<string, { amounts: number[]; days: number[]; categoryL2: string; fundedOn?: string }>()

  for (const t of txns) {
    if (t.direction === 'credit' || t.excluded) continue
    if (t.band !== 'RED' || !t.recurring) continue
    if (!LEAF_BY_L2[t.categoryL2]) continue
    const rec = byMerchant.get(t.merchant) ?? { amounts: [], days: [], categoryL2: t.categoryL2 }
    rec.amounts.push(t.amount)
    rec.days.push(new Date(t.date).getDate())
    if (monthKey(t.date) === thisMonth) rec.fundedOn = t.date
    byMerchant.set(t.merchant, rec)
  }

  return [...byMerchant.entries()]
    .filter(([, rec]) => rec.amounts.length >= 2) // one sighting is not yet a commitment
    .map(([merchant, rec], i) => {
      const amount = Math.round(rec.amounts.reduce((a, b) => a + b, 0) / rec.amounts.length)
      const dueDay = Math.round(rec.days.reduce((a, b) => a + b, 0) / rec.days.length)
      return {
        id: `ob${i}`,
        label: merchant,
        categoryL2: rec.categoryL2,
        amount,
        dueDay: Math.min(Math.max(dueDay, 1), 28),
        funded: Boolean(rec.fundedOn),
        fundedOn: rec.fundedOn,
      } satisfies Obligation
    })
    .sort((a, b) => Number(a.funded) - Number(b.funded) || a.dueDay - b.dueDay)
}

export function daysUntil(dueDay: number, now = new Date()): number {
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay)
  if (thisMonth >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return Math.round((+thisMonth - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
  }
  const next = new Date(now.getFullYear(), now.getMonth() + 1, dueDay)
  return Math.round((+next - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
}

/** The RED floor: what must be funded before anything else is discussed. */
export function redFloor(months: MonthSummary[]): number {
  return bandTotal(months, 'RED', 3)
}

/**
 * Behaviour-derived GREEN allowance.
 *
 * Built from the household's own trailing behaviour rather than a generic
 * 50/30/20 rule, because generic budgets get ignored. Two guards matter:
 * the allowance never proposes a cut deeper than 40% in one step, and where
 * income genuinely does not leave room for the current habit it says so
 * plainly instead of quietly returning zero.
 */
export function greenAllowance(months: MonthSummary[], profile: Profile): {
  value: number; derivation: string; squeezed: boolean
} {
  const behaviour = bandTotal(months, 'GREEN', 3)
  if (profile.greenAllowance) {
    return { value: profile.greenAllowance, derivation: 'You set this allowance yourself.', squeezed: false }
  }
  const { mean } = incomeStats(months)
  const floor = redFloor(months)
  const growTarget = mean * RULES.targetGrowShare
  const headroom = mean - floor - growTarget
  // Never propose a cut deeper than 40% in one step. An allowance the household
  // cannot hit is the same as no allowance, except that it also feels punitive.
  const gentlest = behaviour * 0.6
  const squeezed = headroom < gentlest
  const raw = squeezed ? gentlest : Math.min(headroom, behaviour * 0.9)
  const value = Math.max(Math.round(raw / 100) * 100, 0)

  const derivation = squeezed
    ? `Your trailing three-month discretionary spend is ${inr(behaviour)}. After a protected floor of ${inr(floor)} and a ${RULES.targetGrowShare * 100}% GROW target, your income of ${inr(mean)} leaves only ${inr(Math.max(headroom, 0))} — less than this allowance. That gap is real: on current commitments there is not room for both the habit and the savings target, and the honest options are a smaller GROW target, a lower floor, or more income. The allowance shown is the gentlest single step, a 40% trim, rather than a number you could not hit.`
    : `Your trailing three-month discretionary spend is ${inr(behaviour)}. After your RED floor of ${inr(floor)} and a ${RULES.targetGrowShare * 100}% GROW target, your income leaves ${inr(headroom)}. The allowance is the gentler of those two, so it is a trim rather than a shock.`

  return { value, derivation, squeezed }
}

export interface Leak {
  category: string
  current: number
  median: number
  /** The median pro-rated to the point in the month we have actually reached. */
  expectedToDate: number
  excess: number
  example: Txn | null
  count: number
}

/**
 * The GREEN categories furthest above this household's own pace.
 *
 * The comparison is pro-rated: on the 20th of a month you have only lived
 * two-thirds of it, so comparing a partial month against a full-month median
 * would tell every user, every month, that they were doing well until the last
 * week. The baseline is always the household's own history, never a population
 * average — the income bands in this market are too different for that to mean
 * anything.
 */
export function topLeaks(txns: Txn[], months: MonthSummary[], limit = 3, now = new Date()): Leak[] {
  const current = months[months.length - 1]
  if (!current) return []
  const pace = paceFactor(now)

  const leaks: Leak[] = []
  for (const [category, amount] of Object.entries(current.byCategory)) {
    const leaf = LEAF_BY_L2[category]
    if (!leaf || leaf.band !== 'GREEN') continue
    const median = trailingMedian(months, category)
    const expectedToDate = Math.round(median * pace)
    // Count line-item contributions too, so a split basket is not reported as
    // spend with zero transactions behind it.
    const inCat = txns.filter(
      (t) =>
        monthKey(t.date) === current.key &&
        t.direction === 'debit' &&
        (t.categoryL2 === category || t.lineItems?.some((li) => li.categoryL2 === category)),
    )
    const example = [...inCat].sort((a, b) => b.amount - a.amount)[0] ?? null
    leaks.push({ category, current: amount, median, expectedToDate, excess: amount - expectedToDate, example, count: inCat.length })
  }

  const above = leaks.filter((l) => l.excess > 0).sort((a, b) => b.excess - a.excess)
  const rest = leaks.filter((l) => l.excess <= 0).sort((a, b) => b.current - a.current)
  return [...above, ...rest].slice(0, limit)
}

/** Groceries are protected only up to a per-household ceiling. */
export function groceryCeiling(profile: Profile): number {
  const heads = Math.max(profile.dependants, 1)
  return (LEAF_BY_L2['Groceries & staples'].ceilingPerHead ?? 5000) * heads
}

/**
 * North Star Metric: Goal-Aligned Rupees.
 *
 * Rupees moved into GROW, plus the reduction in flexible spend measured against
 * this household's own baseline — pro-rated to how far into the month we are.
 * Without the pro-rating every household would score brilliantly on the 3rd and
 * badly on the 28th, which would make the number worse than useless.
 */
export function goalAlignedRupees(months: MonthSummary[], now = new Date()): {
  value: number; growPart: number; reductionPart: number; baseline: number; baselineToDate: number
} {
  const current = months[months.length - 1]
  if (!current) return { value: 0, growPart: 0, reductionPart: 0, baseline: 0, baselineToDate: 0 }
  const pace = paceFactor(now)
  const baseline = bandTotal(months, 'GREEN', 3)
  const baselineToDate = Math.round(baseline * pace)
  const reductionPart = Math.max(baselineToDate - current.green, 0)
  return { value: current.grow + reductionPart, growPart: current.grow, reductionPart, baseline, baselineToDate }
}

export function reviewQueue(txns: Txn[]): Txn[] {
  return txns.filter((t) => !t.excluded && !t.overridden && t.direction === 'debit' && (t.band === 'AMBER' || t.confidence < RULES.askThreshold))
}
