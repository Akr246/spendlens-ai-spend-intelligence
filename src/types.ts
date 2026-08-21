/** Core domain types for SpendLens. */

export type Band = 'RED' | 'GREEN' | 'AMBER' | 'GROW'

export type Direction = 'debit' | 'credit'

export interface LineItem {
  label: string
  amount: number
  band: Band
  categoryL2: string
}

export interface Txn {
  id: string
  /** ISO date-time, IST. */
  date: string
  /** Always positive. Use `direction` for sign. */
  amount: number
  direction: Direction
  merchant: string
  /** Raw bank narration, as it would arrive from an Account Aggregator fetch. */
  narration: string
  source: 'aa' | 'manual' | 'csv'
  categoryL1: string
  categoryL2: string
  band: Band
  /** 0–1. Below RULES.askThreshold the transaction is routed to the review queue. */
  confidence: number
  /** True once the user has recategorised it. User corrections always win. */
  overridden?: boolean
  /** Populated for mixed baskets that were split at line-item level. */
  lineItems?: LineItem[]
  /** Set when the transaction is excluded from both band totals (self transfers). */
  excluded?: boolean
  recurring?: boolean
}

export interface Obligation {
  id: string
  label: string
  categoryL2: string
  amount: number
  /** Day of month it is normally due. */
  dueDay: number
  funded: boolean
  fundedOn?: string
}

export type GoalVerdict = 'On track' | 'At risk' | 'Not feasible'

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  /** ISO date. */
  targetDate: string
  templateKey?: string
  note?: string
}

export interface TradeOff {
  categoryL2: string
  currentMonthly: number
  freeable: number
  monthsSaved: number
  ease: 'Easy' | 'Moderate' | 'Hard'
  rationale: string
}

export interface GoalAssessment {
  goal: Goal
  monthsRemaining: number
  requiredMonthly: number
  surplus: number
  gap: number
  verdict: GoalVerdict
  projectedDate: string | null
  tradeOffs: TradeOff[]
  /** True when there is no GREEN spend left to reallocate. */
  noGreenLeft: boolean
}

export interface Pattern {
  key: string
  title: string
  finding: string
  detail: string
  /** 0–100, how strong the effect is relative to the materiality threshold. */
  strength: number
  material: boolean
  evidenceIds: string[]
  window: string
  baseline: string
}

export interface Nudge {
  id: string
  title: string
  body: string
  protects: string | null
  growImpact: number
  monthsSaved: number | null
  categoryL2: string | null
  band: Band
  blocked?: boolean
  blockReason?: string
}

export interface ForecastPoint {
  date: string
  balance: number
  low: number
  high: number
  obligation?: { label: string; amount: number }
  shortfall?: number
}

export interface ForecastResult {
  points: ForecastPoint[]
  shortfallDates: { date: string; label: string; gap: number }[]
  openingBalance: number
  usedConservativeIncome: boolean
  incomeUsed: number
  incomeVariance: number
}

export type PersonaKey = 'rohit' | 'priya' | 'arjun' | 'sneha'

export interface Persona {
  key: PersonaKey
  name: string
  label: string
  age: number
  city: string
  role: string
  monthlyIncome: number
  variableIncome?: boolean
  dependants: number
  blurb: string
  worry: string
  openingBalance: number
}

export interface Profile {
  personaKey: PersonaKey
  displayName: string
  monthlyIncome: number
  dependants: number
  topWorry: string
  onboarded: boolean
  telemetryConsent: boolean
  /** Per-user promotion/demotion of an L2 category, e.g. gym -> RED. */
  bandOverrides: Record<string, Band>
  /** Merchant-level category corrections, keyed by normalised merchant. */
  merchantOverrides: Record<string, { categoryL1: string; categoryL2: string }>
  dismissedNudges: string[]
  greenAllowance: number | null
}
