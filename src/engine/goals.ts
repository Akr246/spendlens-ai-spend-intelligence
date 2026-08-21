import type { Goal, GoalAssessment, Txn, TradeOff } from '../types'
import { EASE_BY_L2, LEAF_BY_L2 } from '../data/taxonomy'
import type { MonthSummary } from './analytics'
import { bandTotal, redFloor, trailingMedian } from './analytics'

/**
 * Model M5 — goal refinement.
 *
 * This is the capability the product exists for: turning "an MBA in three
 * years" into a monthly number, an honest verdict, and — when it does not fit —
 * three specific trade-offs drawn from the household's own spending.
 *
 * The rule that matters most is the one about honesty. A shortfall is stated in
 * rupees. It is never softened into "nearly there", because the entire value of
 * a feasibility verdict is that it can say no.
 */

/** Months saved by raising the monthly contribution, or 0 when not meaningful. */
export function monthsSooner(remaining: number, surplus: number, newSurplus: number): number {
  if (newSurplus <= 0) return 0
  const HORIZON = 480 // 40 years
  const before = surplus > 0 ? Math.ceil(remaining / surplus) : Infinity
  const after = Math.ceil(remaining / newSurplus)
  if (before > HORIZON || after > HORIZON) return 0
  return Math.max(before - after, 0)
}

const monthsBetween = (from: Date, to: Date) =>
  Math.max((to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 0)

export function assessGoal(
  goal: Goal,
  months: MonthSummary[],
  txns: Txn[],
  income: number,
  now = new Date(),
): GoalAssessment {
  const monthsRemaining = Math.max(monthsBetween(now, new Date(goal.targetDate)), 1)
  const remaining = Math.max(goal.target - goal.saved, 0)
  const requiredMonthly = Math.round(remaining / monthsRemaining)

  const floor = redFloor(months)
  const greenHabit = bandTotal(months, 'GREEN', 3)
  const growAlready = bandTotal(months, 'GROW', 3)
  // Surplus is what is genuinely uncommitted: income, less the essentials that
  // must be protected, less the discretionary habit that actually exists.
  const surplus = Math.round(income - floor - greenHabit + growAlready)
  const gap = Math.max(requiredMonthly - surplus, 0)

  let verdict: GoalAssessment['verdict'] = 'On track'
  if (requiredMonthly > surplus) verdict = 'Not feasible'
  else if (requiredMonthly > surplus * 0.8) verdict = 'At risk'

  const tradeOffs = gap > 0 ? buildTradeOffs(months, txns, gap, remaining, surplus) : []
  const noGreenLeft = gap > 0 && tradeOffs.length === 0

  let projectedDate: string | null = null
  if (surplus > 0) {
    const monthsNeeded = Math.ceil(remaining / surplus)
    const p = new Date(now.getFullYear(), now.getMonth() + monthsNeeded, 1)
    projectedDate = p.toISOString().slice(0, 10)
  }

  return { goal, monthsRemaining, requiredMonthly, surplus, gap, verdict, projectedDate, tradeOffs, noGreenLeft }
}

/**
 * Trade-offs are always drawn from the user's own GREEN categories. Generic
 * advice ("spend less on eating out") is not actionable; "your ₹9,400 of food
 * delivery, cut by 45%, is ₹4,230 a month" is.
 */
function buildTradeOffs(
  months: MonthSummary[],
  _txns: Txn[],
  gap: number,
  remaining: number,
  surplus: number,
): TradeOff[] {
  const current = months[months.length - 1]
  if (!current) return []
  const candidates: TradeOff[] = []

  for (const [category, amount] of Object.entries(current.byCategory)) {
    const leaf = LEAF_BY_L2[category]
    if (!leaf || leaf.band !== 'GREEN') continue
    const ease = EASE_BY_L2[category]
    if (!ease) continue
    const typical = Math.max(trailingMedian(months, category), amount) || amount
    const freeable = Math.round((typical * ease.maxCut) / 10) * 10
    if (freeable < 250) continue
    const newSurplus = surplus + freeable
    // Where the current surplus is near zero, "months sooner" explodes into a
    // meaningless number. Above a 40-year horizon the honest statement is that
    // the goal is not reachable on today's behaviour, not that this change buys
    // you 300 months.
    const monthsSaved = monthsSooner(remaining, surplus, newSurplus)
    candidates.push({
      categoryL2: category,
      currentMonthly: Math.round(typical),
      freeable,
      monthsSaved,
      ease: ease.ease,
      rationale: ease.why,
    })
  }

  // Rank by what actually closes the gap, then by behavioural ease. A large
  // saving the household will never sustain is not a better option than a
  // smaller one they will.
  const easeRank = { Easy: 0, Moderate: 1, Hard: 2 } as const
  candidates.sort((a, b) => {
    const aCovers = Math.min(a.freeable, gap) / gap
    const bCovers = Math.min(b.freeable, gap) / gap
    if (Math.abs(aCovers - bCovers) > 0.12) return bCovers - aCovers
    return easeRank[a.ease] - easeRank[b.ease]
  })

  return candidates.slice(0, 4)
}

export function verdictTone(verdict: GoalAssessment['verdict']) {
  switch (verdict) {
    case 'On track':     return { fg: 'text-green-band', bg: 'bg-green-surface', bd: 'border-green-border' }
    case 'At risk':      return { fg: 'text-amber-band', bg: 'bg-amber-surface', bd: 'border-amber-border' }
    case 'Not feasible': return { fg: 'text-red-band',   bg: 'bg-red-surface',   bd: 'border-red-border' }
  }
}
