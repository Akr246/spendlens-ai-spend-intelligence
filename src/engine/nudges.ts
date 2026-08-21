import type { GoalAssessment, Nudge, Obligation, Pattern, Profile } from '../types'
import { LEAF_BY_L2, RULES } from '../data/taxonomy'
import type { Leak, MonthSummary } from './analytics'
import { inr } from './analytics'
import { monthsSooner } from './goals'

/**
 * Model M6 — the nudge ranker, plus the guardrail service.
 *
 * The guardrail is deliberately separate code that runs *after* generation and
 * *before* delivery. Any recommendation touching a RED-protected obligation is
 * blocked and logged as a guardrail hit. The target for guardrail hits is zero
 * and it is investigated as a defect rather than tuned away — a product that
 * suggests skipping someone's medicine to fund an index fund has not made a
 * small error of judgement.
 */

export interface NudgeResult {
  delivered: Nudge[]
  blocked: Nudge[]
  suppressedByBudget: number
}

/** The guardrail. Returns a reason if the nudge must never be delivered. */
export function guardrail(nudge: Nudge, obligations: Obligation[]): string | null {
  if (nudge.band === 'RED') {
    return 'Blocked: this would reduce a RED-protected obligation. SpendLens never recommends cutting shelter, health, food or education.'
  }
  if (nudge.categoryL2 && LEAF_BY_L2[nudge.categoryL2]?.band === 'RED') {
    return `Blocked: ${nudge.categoryL2} is an essential in your household.`
  }
  if (nudge.categoryL2 && obligations.some((o) => o.categoryL2 === nudge.categoryL2)) {
    return `Blocked: ${nudge.categoryL2} is a committed obligation this cycle.`
  }
  return null
}

export function buildNudges(
  leaks: Leak[],
  patterns: Pattern[],
  assessments: GoalAssessment[],
  obligations: Obligation[],
  months: MonthSummary[],
  profile: Profile,
  now = new Date(),
): NudgeResult {
  const candidates: Nudge[] = []
  const primaryGoal = assessments[0]
  // Protect the next thing actually due, not whatever happens to be first.
  const nextObligation =
    obligations.find((o) => !o.funded) ??
    [...obligations].sort((a, b) => b.amount - a.amount)[0]
  const protects = nextObligation
    ? obligations.some((o) => !o.funded)
      ? `${nextObligation.label} (${inr(nextObligation.amount)})`
      : `Next cycle's ${nextObligation.label} (${inr(nextObligation.amount)})`
    : null

  const monthsToShave = (amount: number) => {
    if (!primaryGoal) return null
    const remaining = Math.max(primaryGoal.goal.target - primaryGoal.goal.saved, 0)
    const m = monthsSooner(remaining, primaryGoal.surplus, primaryGoal.surplus + amount)
    return m > 0 ? m : null
  }

  // 1. The biggest leak, framed against the household's own median.
  for (const leak of leaks.slice(0, 2)) {
    if (leak.excess <= 300) continue
    const redirect = Math.round(leak.excess / 10) * 10
    candidates.push({
      id: `leak-${leak.category}`,
      title: `${leak.category} is ${inr(leak.excess)} ahead of your own pace`,
      body: `You have spent ${inr(leak.current)} on ${leak.category.toLowerCase()} across ${leak.count} transaction${leak.count === 1 ? '' : 's'} this month. At this point in the month your own history would put you at ${inr(leak.expectedToDate)}. Redirecting the difference keeps ${protects ?? 'your essentials'} untouched and moves ${inr(redirect)} into GROW.`,
      protects,
      growImpact: redirect,
      monthsSaved: monthsToShave(redirect),
      categoryL2: leak.category,
      band: 'GREEN',
    })
  }

  // 2. Subscription creep — the easiest genuine saving in most households.
  const creep = patterns.find((p) => p.key === 'subscription-creep' && p.material)
  if (creep) {
    const monthly = Number(creep.finding.match(/₹([\d,]+) a month/)?.[1]?.replace(/,/g, '') ?? 0)
    if (monthly > 0) {
      const redirect = Math.round(monthly * 0.4)
      candidates.push({
        id: 'subs',
        title: 'One subscription review, once a year',
        body: `${creep.finding} Cancelling the ones you cannot name a recent use for typically frees around ${inr(redirect)} a month — a single decision rather than a daily one.`,
        protects,
        growImpact: redirect,
        monthsSaved: monthsToShave(redirect),
        categoryL2: 'OTT & subscriptions',
        band: 'GREEN',
      })
    }
  }

  // 3. Late-night ordering — a timing intervention, not a spending ban.
  const late = patterns.find((p) => p.key === 'late-night' && p.material)
  if (late) {
    candidates.push({
      id: 'late-night',
      title: 'Try a 30-minute pause after 9pm',
      body: `${late.finding} A short delay before confirming a late order is the intervention with the best evidence behind it, and it does not require you to give anything up permanently.`,
      protects,
      growImpact: 0,
      monthsSaved: null,
      categoryL2: 'Food delivery',
      band: 'GREEN',
    })
  }

  // 4. An unfunded essential, which outranks every optimisation.
  const unfunded = obligations.filter((o) => !o.funded)
  if (unfunded.length) {
    const total = unfunded.reduce((a, o) => a + o.amount, 0)
    candidates.unshift({
      id: 'unfunded',
      title: `${unfunded.length} essential${unfunded.length > 1 ? 's' : ''} still unfunded this cycle`,
      body: `${unfunded.map((o) => o.label).join(', ')} — ${inr(total)} in total. This is shown first because protecting it comes before any suggestion about saving or investing.`,
      protects: unfunded.map((o) => o.label).join(', '),
      growImpact: 0,
      monthsSaved: null,
      categoryL2: null,
      band: 'RED',
    })
  }

  // 5. A deliberately unsafe candidate, so the guardrail is demonstrable.
  const groceries = months[months.length - 1]?.byCategory['Groceries & staples'] ?? 0
  if (groceries > 0) {
    candidates.push({
      id: 'guardrail-demo',
      title: `Trim ${inr(Math.round(groceries * 0.2))} from groceries`,
      body: 'A naive optimiser would suggest this: groceries are a large, variable line and trimming them closes the gap fastest.',
      protects: null,
      growImpact: Math.round(groceries * 0.2),
      monthsSaved: null,
      categoryL2: 'Groceries & staples',
      band: 'RED',
    })
  }

  // ---- Guardrail runs before anything is delivered. -----------------------
  const blocked: Nudge[] = []
  const safe: Nudge[] = []
  for (const c of candidates) {
    // The unfunded-essentials alert is a protection notice, not a reduction
    // suggestion, so it is exempt from the RED block.
    if (c.id === 'unfunded') { safe.push(c); continue }
    const reason = guardrail(c, obligations)
    if (reason) blocked.push({ ...c, blocked: true, blockReason: reason })
    else safe.push(c)
  }

  // ---- Delivery budget: 2 a day, 8 a week, never in quiet hours. ----------
  const hour = now.getHours()
  const [start, end] = RULES.quietHours
  const quiet = hour >= start || hour < end
  const eligible = safe.filter((n) => !profile.dismissedNudges.includes(n.id))
  const cap = quiet ? 0 : RULES.nudgesPerDay
  const delivered = eligible.slice(0, cap)

  return { delivered, blocked, suppressedByBudget: Math.max(eligible.length - delivered.length, 0) }
}
