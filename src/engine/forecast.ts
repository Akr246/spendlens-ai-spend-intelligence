import type { ForecastPoint, ForecastResult, Obligation, Txn } from '../types'
import type { MonthSummary } from './analytics'
import { bandTotal, incomeStats, monthKey } from './analytics'

/**
 * Model M4 — 90-day cashflow path.
 *
 * Two design rules from the spec are load-bearing here. A forecast is drawn as
 * a confidence band, never a single line, because a single line is a claim to
 * certainty a 90-day projection cannot support. And where income variance is
 * high, the envelope uses the conservative income rather than the average, and
 * says so in the interface.
 */
export function forecast(
  txns: Txn[],
  months: MonthSummary[],
  obligations: Obligation[],
  openingBalance: number,
  now = new Date(),
  horizonDays = 90,
): ForecastResult {
  const { mean, conservative, variance } = incomeStats(months)
  const useConservative = variance > 0.25
  const incomeUsed = Math.round(useConservative ? conservative : mean)

  const greenHabit = bandTotal(months, 'GREEN', 3)
  const growHabit = bandTotal(months, 'GROW', 3)
  const redRecurring = obligations.reduce((a, o) => a + o.amount, 0)
  const redVariable = Math.max(bandTotal(months, 'RED', 3) - redRecurring, 0)
  // Undecided spend is still money leaving the account. Omitting it because it
  // is unclassified would quietly flatter every projection.
  const amberHabit = (() => {
    const pool = months.slice(-4, -1)
    return pool.length ? pool.reduce((a, m) => a + m.amber, 0) / pool.length : 0
  })()
  const dailyBurn = (greenHabit + redVariable + growHabit + amberHabit) / 30

  // Income arrives on the day it has historically arrived.
  const incomeDays = txns
    .filter((t) => t.direction === 'credit')
    .map((t) => new Date(t.date).getDate())
  const payday = incomeDays.length
    ? Math.round(incomeDays.reduce((a, b) => a + b, 0) / incomeDays.length)
    : 1

  const points: ForecastPoint[] = []
  const shortfallDates: ForecastResult['shortfallDates'] = []
  let balance = openingBalance
  const sd = Math.max(greenHabit * 0.22, 2500)

  for (let i = 0; i <= horizonDays; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const dom = day.getDate()

    if (i > 0) {
      balance -= dailyBurn
      if (dom === payday) balance += incomeUsed
      const due = obligations.find((o) => o.dueDay === dom)
      if (due) balance -= due.amount
    }

    // Uncertainty widens with the square root of time, which is the honest
    // shape: tomorrow is nearly knowable, day 90 is not.
    const spread = sd * Math.sqrt(i / 30)
    const point: ForecastPoint = {
      date: day.toISOString().slice(0, 10),
      balance: Math.round(balance),
      low: Math.round(balance - spread),
      high: Math.round(balance + spread),
    }

    const dueToday = obligations.find((o) => o.dueDay === dom)
    if (dueToday && i > 0) {
      point.obligation = { label: dueToday.label, amount: dueToday.amount }
      // The question that matters is not "is the balance negative" but
      // "would the next essential clear".
      if (balance < 0) {
        point.shortfall = Math.abs(Math.round(balance))
        shortfallDates.push({ date: point.date, label: dueToday.label, gap: Math.abs(Math.round(balance)) })
      }
    }
    points.push(point)
  }

  return {
    points,
    shortfallDates,
    openingBalance,
    usedConservativeIncome: useConservative,
    incomeUsed,
    incomeVariance: variance,
  }
}

/** Derives an opening balance from the ledger so the demo needs no bank feed. */
export function deriveOpeningBalance(txns: Txn[], seedBalance: number, now = new Date()): number {
  const thisMonth = monthKey(now.toISOString())
  const net = txns
    .filter((t) => monthKey(t.date) === thisMonth)
    .reduce((a, t) => a + (t.direction === 'credit' ? t.amount : -t.amount), 0)
  return Math.max(Math.round(seedBalance + net), 500)
}
