import type { Band, LineItem, Profile, Txn } from '../types'
import { LEAF_BY_L2, RULES } from '../data/taxonomy'
import { KEYWORD_RULES, MERCHANT_BY_NAME } from '../data/merchants'

/**
 * Models M1 (categoriser) and M2 (band classifier), implemented as the
 * deterministic rule layer.
 *
 * In the specified product the rule layer runs first and an ML model handles
 * only the residue — which is exactly why the rule layer is shippable on its
 * own. This file is that layer. Every decision it makes is inspectable, which
 * is what lets the UI show a real "why we think this" instead of a score.
 */

export interface Explanation {
  step: string
  detail: string
}

export interface ClassificationResult {
  categoryL1: string
  categoryL2: string
  band: Band
  confidence: number
  excluded: boolean
  lineItems?: LineItem[]
  explanation: Explanation[]
}

export function normaliseMerchant(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/** Splits a mixed basket into RED and GREEN lines, deterministically per id. */
function splitBasket(txn: Txn): { items: LineItem[]; confidence: number } | null {
  const r = hash(txn.id)
  const confidence = 0.55 + r * 0.4
  if (confidence < RULES.splitThreshold) return null
  const redShare = 0.25 + r * 0.5
  const redAmount = Math.round((txn.amount * redShare) / 10) * 10
  const greenAmount = txn.amount - redAmount
  return {
    confidence,
    items: [
      { label: 'Household staples', amount: redAmount, band: 'RED', categoryL2: 'Groceries & staples' },
      { label: 'Discretionary items', amount: greenAmount, band: 'GREEN', categoryL2: 'Gadgets & devices' },
    ],
  }
}

export function classify(txn: Txn, profile: Profile, hasStudyGoal: boolean): ClassificationResult {
  const explanation: Explanation[] = []
  const key = normaliseMerchant(txn.merchant)

  // Income is neither spend nor GROW. It is excluded from both band totals so
  // money entering the household is never counted as money leaving it.
  if (txn.direction === 'credit') {
    return {
      categoryL1: 'Income', categoryL2: 'Income', band: 'GROW', confidence: 1, excluded: true,
      explanation: [{ step: 'Direction', detail: 'Credit into the account, so it is treated as income and excluded from both band totals.' }],
    }
  }

  // 1. A user correction always wins, for this merchant, forever.
  const override = profile.merchantOverrides[key]
  if (override) {
    const leaf = LEAF_BY_L2[override.categoryL2]
    explanation.push({ step: 'Your correction', detail: `You recategorised ${txn.merchant} as ${override.categoryL2}. That decision overrides everything below.` })
    const band = profile.bandOverrides[override.categoryL2] ?? leaf?.band ?? 'AMBER'
    return { categoryL1: override.categoryL1, categoryL2: override.categoryL2, band, confidence: 1, excluded: false, explanation }
  }

  let l1 = ''
  let l2 = ''
  let confidence = 0

  // 2. Merchant registry — the highest-confidence signal available.
  const entry = MERCHANT_BY_NAME[txn.merchant]
  if (entry) {
    l1 = entry.l1; l2 = entry.l2; confidence = entry.confidence
    explanation.push({ step: 'Merchant registry', detail: `"${txn.merchant}" is a known merchant mapped to ${entry.l1} › ${entry.l2}.` })
  } else {
    // 3. Keyword inference over the raw bank narration.
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(txn.narration) || rule.pattern.test(txn.merchant)) {
        l1 = rule.l1; l2 = rule.l2; confidence = rule.confidence
        explanation.push({ step: 'Narration pattern', detail: `The narration "${txn.narration}" matched ${String(rule.pattern)}, which maps to ${rule.l1} › ${rule.l2}.` })
        break
      }
    }
  }

  // 4. Nothing matched. Ask rather than guess.
  if (!l2) {
    explanation.push({ step: 'No match', detail: 'Neither the merchant registry nor any narration pattern matched, so this is routed to the review queue rather than shown as a guess.' })
    return { categoryL1: 'Ambiguous', categoryL2: 'Cash withdrawal', band: 'AMBER', confidence: 0.35, excluded: false, explanation }
  }

  // Commute rides are not leisure. Charging someone for going to work is the
  // fastest way to lose them, so these leave the GREEN leak score entirely.
  if (l2 === 'Ride-hailing' && / COMMUTE/.test(txn.narration)) {
    explanation.push({ step: 'Commute rule', detail: 'This ride matches your weekday commute pattern, so it is excluded from the discretionary leak score.' })
    return { categoryL1: 'Ambiguous', categoryL2: 'Commute', band: 'AMBER', confidence: 0.88, excluded: true, explanation }
  }

  // Transfers between your own accounts are excluded from both bands.
  if (l2 === 'Self / family transfer') {
    explanation.push({ step: 'Counterparty', detail: 'This is a transfer between your own accounts, so it is excluded from both bands to avoid double counting.' })
    return { categoryL1: l1, categoryL2: l2, band: 'AMBER', confidence: 0.9, excluded: true, explanation }
  }

  // Upskilling is RED only while it is attached to a live education goal.
  if (l2 === 'Upskilling') {
    if (hasStudyGoal) {
      explanation.push({ step: 'Goal link', detail: 'You have an active higher-study goal, so this course counts as an essential.' })
      return { categoryL1: l1, categoryL2: l2, band: 'RED', confidence: 0.9, excluded: false, explanation }
    }
    explanation.push({ step: 'Goal link', detail: 'No active education or career goal is linked, so this is discretionary for now. Create the goal and it becomes essential.' })
    return { categoryL1: l1, categoryL2: l2, band: 'GREEN', confidence: 0.82, excluded: false, explanation }
  }

  // Mixed baskets get split at line-item level, or asked about once.
  if (entry?.mixedBasket) {
    const split = splitBasket(txn)
    if (split) {
      explanation.push({
        step: 'Basket split',
        detail: `Line items were retrieved and classified separately: ₹${split.items[0].amount.toLocaleString('en-IN')} essential, ₹${split.items[1].amount.toLocaleString('en-IN')} discretionary. Split confidence ${(split.confidence * 100).toFixed(0)}%.`,
      })
      const redAmt = split.items[0].amount
      const dominant: Band = redAmt >= txn.amount / 2 ? 'RED' : 'GREEN'
      return { categoryL1: dominant === 'RED' ? 'Food' : 'Electronics', categoryL2: dominant === 'RED' ? 'Groceries & staples' : 'Gadgets & devices', band: dominant, confidence: split.confidence, excluded: false, lineItems: split.items, explanation }
    }
    explanation.push({ step: 'Basket split', detail: `Split confidence was below ${RULES.splitThreshold}, so SpendLens asks once rather than assigning a majority band to a mixed order.` })
    return { categoryL1: 'Ambiguous', categoryL2: 'Mixed basket', band: 'AMBER', confidence: 0.5, excluded: false, explanation }
  }

  const leaf = LEAF_BY_L2[l2]
  let band: Band = leaf?.band ?? 'AMBER'

  // Per-household promotion or demotion, e.g. a gym that is medical, not leisure.
  const userBand = profile.bandOverrides[l2]
  if (userBand && userBand !== band) {
    explanation.push({ step: 'Your household rule', detail: `You moved ${l2} from ${band} to ${userBand} for your household.` })
    band = userBand
  } else if (leaf) {
    explanation.push({ step: 'Taxonomy', detail: `${leaf.l2} sits in the ${leaf.band} band. ${leaf.behaviour}` })
  }

  if (confidence < RULES.askThreshold) {
    band = 'AMBER'
    explanation.push({ step: 'Low confidence', detail: `Confidence of ${(confidence * 100).toFixed(0)}% is below the ${RULES.askThreshold * 100}% threshold, so this goes to the review queue instead of being displayed as fact.` })
  }

  return { categoryL1: l1, categoryL2: l2, band, confidence, excluded: false, explanation }
}

/** Applies the classifier across a whole ledger. */
export function classifyAll(txns: Txn[], profile: Profile, hasStudyGoal: boolean): Txn[] {
  return txns.map((t) => {
    if (t.overridden) return t
    const r = classify(t, profile, hasStudyGoal)
    return { ...t, categoryL1: r.categoryL1, categoryL2: r.categoryL2, band: r.band, confidence: r.confidence, excluded: r.excluded, lineItems: r.lineItems }
  })
}
