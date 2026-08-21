import type { Band } from '../types'

/**
 * The RED / GREEN / AMBER / GROW taxonomy.
 *
 * This is the single source of truth for the classifier, the priority menu bar
 * and every analytics cut in the app — the same role tab 03 plays in the
 * product workbook. Nothing else in the codebase may define a band.
 */

export interface Leaf {
  l1: string
  l2: string
  band: Band
  /** What the category covers, shown in the taxonomy explorer. */
  covers: string
  /** How the classifier decides. Shown verbatim in the UI for explainability. */
  rule: string
  /** Product behaviour attached to the leaf. */
  behaviour: string
  /** Can the user promote/demote this leaf for their own household? */
  userMovable: boolean
  /** Rough monthly ceiling factor applied per dependant, for RED food only. */
  ceilingPerHead?: number
}

export const TAXONOMY: Leaf[] = [
  // ---------------------------------------------------------------- RED
  { l1: 'Shelter', l2: 'Rent', band: 'RED', covers: 'House rent, brokerage, deposit',
    rule: 'Merchant category = real estate, or narration matches a rent pattern', behaviour: 'Never nudged. Alerted if unfunded 5 days before due date.', userMovable: false },
  { l1: 'Shelter', l2: 'Home loan EMI', band: 'RED', covers: 'Principal and interest on a housing loan',
    rule: 'Recurring debit to a lender within a 2% amount tolerance', behaviour: 'Protected floor. Treated as a hard commitment by the forecaster.', userMovable: false },
  { l1: 'Shelter', l2: 'Utilities', band: 'RED', covers: 'Electricity, water, gas, broadband, society maintenance',
    rule: 'Biller registry match', behaviour: 'Protected. Flagged if it rises more than 20% month on month.', userMovable: false },
  { l1: 'Health', l2: 'Health insurance', band: 'RED', covers: 'Individual and family floater premiums',
    rule: 'Insurer merchant list', behaviour: 'Highest protection weight. Lapse warning at T-15 days.', userMovable: false },
  { l1: 'Health', l2: 'Doctor & diagnostics', band: 'RED', covers: 'Consultations, labs, imaging',
    rule: 'MCC 8011 / 8071 plus merchant matching', behaviour: 'Protected. Never nudged down.', userMovable: false },
  { l1: 'Health', l2: 'Pharmacy', band: 'RED', covers: 'Prescription and chronic medication',
    rule: 'MCC 5912', behaviour: 'Protected. Chronic recurrence is detected and forecast.', userMovable: false },
  { l1: 'Food', l2: 'Groceries & staples', band: 'RED', covers: 'Supermarket, kirana, staples, quick-commerce grocery baskets',
    rule: 'MCC 5411, with a line-item split for quick commerce', behaviour: 'Protected up to the household ceiling; spend above it becomes AMBER.', userMovable: false, ceilingPerHead: 5200 },
  { l1: 'Food', l2: 'Milk & daily fresh', band: 'RED', covers: 'Dairy, vegetables, fruit subscriptions',
    rule: 'Merchant list plus recurrence', behaviour: 'Protected.', userMovable: false },
  { l1: 'Education', l2: 'School & college fees', band: 'RED', covers: 'Tuition, term and exam fees',
    rule: 'Institution registry plus narration pattern', behaviour: 'Protected. Fee cycle surfaced 45 days ahead.', userMovable: false },
  { l1: 'Education', l2: 'Books & supplies', band: 'RED', covers: 'Textbooks, stationery, uniforms, study devices',
    rule: 'MCC 5942 plus intent tagging', behaviour: 'Protected within an annual cap.', userMovable: false },
  { l1: 'Education', l2: 'Upskilling', band: 'RED', covers: 'Professional courses tied to a stated career goal',
    rule: 'Requires a link to an active education or career goal', behaviour: 'RED only while linked to a live goal, otherwise GREEN.', userMovable: true },

  // -------------------------------------------------------------- GREEN
  { l1: 'Entertainment', l2: 'OTT & subscriptions', band: 'GREEN', covers: 'Streaming, music, gaming subscriptions',
    rule: 'Merchant list plus a recurring flag', behaviour: 'Prime nudge target. Duplicate and dormant subscriptions surfaced.', userMovable: true },
  { l1: 'Entertainment', l2: 'Movies & events', band: 'GREEN', covers: 'Cinema, concerts, ticketed events',
    rule: 'MCC 7832 / 7922', behaviour: 'Nudged with a monthly allowance, never a ban.', userMovable: true },
  { l1: 'Entertainment', l2: 'Gaming', band: 'GREEN', covers: 'Console and mobile game credits, in-app purchases',
    rule: 'App-store merchant plus MCC 7994', behaviour: 'Highest impulse weighting. Cooling-off nudge on same-day repeats.', userMovable: true },
  { l1: 'Restaurants', l2: 'Dine-in', band: 'GREEN', covers: 'Restaurants, cafes, bars',
    rule: 'MCC 5812 / 5813', behaviour: 'Weekly cadence insight.', userMovable: true },
  { l1: 'Restaurants', l2: 'Food delivery', band: 'GREEN', covers: 'App-based prepared food delivery',
    rule: 'Merchant list, explicitly split from quick-commerce grocery', behaviour: 'Late-night ordering patterns flagged.', userMovable: true },
  { l1: 'Travel', l2: 'Leisure travel', band: 'GREEN', covers: 'Flights, hotels, holiday packages',
    rule: 'MCC 4511 / 7011', behaviour: 'Suggested as a funded GREEN goal instead of an impulse booking.', userMovable: true },
  { l1: 'Travel', l2: 'Ride-hailing', band: 'GREEN', covers: 'Cabs and autos outside the declared commute pattern',
    rule: 'Geo and time heuristics against the commute baseline', behaviour: 'Commute rides become AMBER and are excluded from the leak score.', userMovable: true },
  { l1: 'Fashion', l2: 'Apparel & accessories', band: 'GREEN', covers: 'Clothing, footwear, bags, jewellery',
    rule: 'MCC 5651 / 5691', behaviour: 'Sale-season spike detection.', userMovable: true },
  { l1: 'Electronics', l2: 'Gadgets & devices', band: 'GREEN', covers: 'Phones, laptops, audio, wearables',
    rule: 'MCC 5732 plus basket line items', behaviour: 'EMI-conversion warning when a one-off becomes a 12-month commitment.', userMovable: true },
  { l1: 'Personal care', l2: 'Grooming & wellness', band: 'GREEN', covers: 'Salon, spa, cosmetics, gym',
    rule: 'MCC 7230 / 7298', behaviour: 'Soft nudge only. Never framed as waste.', userMovable: true },
  { l1: 'Gifting', l2: 'Gifts & celebrations', band: 'GREEN', covers: 'Festivals, weddings, gifting',
    rule: 'Seasonal model plus merchant list', behaviour: 'Festival spend is forecast and funded, never shamed.', userMovable: true },

  // -------------------------------------------------------------- AMBER
  { l1: 'Ambiguous', l2: 'Mixed basket', band: 'AMBER', covers: 'One order containing both RED and GREEN line items',
    rule: 'Line-item split; falls back to asking the user once', behaviour: 'Split at line-item level. Below 0.70 split confidence, ask and learn.', userMovable: false },
  { l1: 'Ambiguous', l2: 'Cash withdrawal', band: 'AMBER', covers: 'ATM cash with unknown downstream use',
    rule: 'Unclassifiable without user input', behaviour: 'Ask once per pattern, then apply the learned default silently.', userMovable: false },
  { l1: 'Ambiguous', l2: 'Self / family transfer', band: 'AMBER', covers: 'Account-to-account transfers',
    rule: 'Counterparty graph', behaviour: 'Excluded from both band totals so money is never double counted.', userMovable: false },
  { l1: 'Ambiguous', l2: 'Commute', band: 'AMBER', covers: 'Rides inside the established commute pattern',
    rule: 'Matches the weekday commute geo/time baseline', behaviour: 'Excluded from the leak score. Charging someone for going to work loses them.', userMovable: false },

  // --------------------------------------------------------------- GROW
  { l1: 'Investment', l2: 'SIP & mutual funds', band: 'GROW', covers: 'Systematic investment plans, lumpsum purchases',
    rule: 'AMC and registrar merchant list', behaviour: 'Counts toward the North Star Metric. Never counted as spend.', userMovable: false },
  { l1: 'Investment', l2: 'PPF / EPF / NPS', band: 'GROW', covers: 'Statutory and voluntary retirement contributions',
    rule: 'Biller and employer registry', behaviour: 'EPF is auto-detected from the salary credit.', userMovable: false },
  { l1: 'Savings', l2: 'Emergency fund', band: 'GROW', covers: 'Transfers into a declared savings pot',
    rule: 'User-declared account tag', behaviour: 'Counts toward GROW.', userMovable: false },
]

export const LEAF_BY_L2: Record<string, Leaf> = Object.fromEntries(TAXONOMY.map((l) => [l.l2, l]))

export const BAND_META: Record<Band, {
  label: string; word: string; icon: string; text: string; surface: string; border: string; help: string
}> = {
  RED:   { label: 'RED Priority',   word: 'ESSENTIAL', icon: 'shield', text: 'text-red-band',   surface: 'bg-red-surface',   border: 'border-red-border',
           help: 'Non-negotiable needs: shelter, health, food, education. Protected first, never the target of a reduction nudge.' },
  GREEN: { label: 'GREEN Priority', word: 'FLEXIBLE',  icon: 'leaf',   text: 'text-green-band', surface: 'bg-green-surface', border: 'border-green-border',
           help: 'Discretionary spend you choose, and could choose differently. The only band nudges may target.' },
  AMBER: { label: 'Needs a decision', word: 'AMBER',   icon: 'help',   text: 'text-amber-band', surface: 'bg-amber-surface', border: 'border-amber-border',
           help: 'Genuinely ambiguous. SpendLens asks rather than showing you a confident wrong answer.' },
  GROW:  { label: 'GROW',           word: 'GROW',      icon: 'sprout', text: 'text-grow-band',  surface: 'bg-grow-surface',  border: 'border-grow-border',
           help: 'Money moving toward your goals rather than out of the household. Never counted as spend.' },
}

/** Behavioural difficulty of cutting a category, used to rank trade-offs. */
export const EASE_BY_L2: Record<string, { ease: 'Easy' | 'Moderate' | 'Hard'; maxCut: number; why: string }> = {
  'OTT & subscriptions':   { ease: 'Easy',     maxCut: 0.70, why: 'A one-time cancellation, not a repeated daily decision.' },
  'Gaming':                { ease: 'Moderate', maxCut: 0.60, why: 'Impulse-driven, but a spend cap works where willpower does not.' },
  'Food delivery':         { ease: 'Moderate', maxCut: 0.45, why: 'Frequent small decisions. Cutting by half is realistic; cutting to zero is not.' },
  'Dine-in':               { ease: 'Hard',     maxCut: 0.35, why: 'Usually social. Cutting it has a cost the spreadsheet cannot see.' },
  'Movies & events':       { ease: 'Moderate', maxCut: 0.50, why: 'Occasional and plannable.' },
  'Leisure travel':        { ease: 'Hard',     maxCut: 0.60, why: 'Lumpy and emotionally weighted; better deferred than removed.' },
  'Ride-hailing':          { ease: 'Moderate', maxCut: 0.40, why: 'Substitutable on some trips, not on others.' },
  'Apparel & accessories': { ease: 'Easy',     maxCut: 0.55, why: 'Highly responsive to a sale-season spending cap.' },
  'Gadgets & devices':     { ease: 'Easy',     maxCut: 0.80, why: 'Infrequent and deferrable. Deferring one purchase moves the goal a long way.' },
  'Grooming & wellness':   { ease: 'Hard',     maxCut: 0.30, why: 'Routine and identity-linked. Cut last.' },
  'Gifts & celebrations':  { ease: 'Hard',     maxCut: 0.20, why: 'Culturally significant. SpendLens forecasts and funds this rather than trimming it.' },
}

export const RULES = {
  /** Below this confidence a transaction goes to the review queue instead of being shown as fact. */
  askThreshold: 0.6,
  /** Below this the basket splitter asks rather than splitting silently. */
  splitThreshold: 0.7,
  /** Materiality floor for surfacing a behavioural pattern, in rupees per month. */
  patternMateriality: 800,
  /** Hard nudge delivery budget. */
  nudgesPerDay: 2,
  nudgesPerWeek: 8,
  quietHours: [22, 8] as [number, number],
  /** Target share of take-home routed to GROW once RED is funded. */
  targetGrowShare: 0.2,
}
