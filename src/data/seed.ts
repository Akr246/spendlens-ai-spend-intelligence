import type { PersonaKey, Txn } from '../types'
import { MERCHANT_BY_NAME } from './merchants'

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-random source.
 * The demo data has to be identical on every load, otherwise the
 * behavioural patterns the app claims to detect would change between
 * refreshes and nobody could trust a screenshot of it.
 * ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEEDS: Record<PersonaKey, number> = { rohit: 20260820, priya: 77003411, arjun: 19731102, sneha: 41200877 }

interface Ctx {
  rnd: () => number
  out: Txn[]
  n: number
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length]
}
function jitter(rnd: () => number, base: number, spread: number): number {
  return Math.round((base * (1 + (rnd() - 0.5) * 2 * spread)) / 10) * 10
}
function iso(d: Date, hour: number, minute: number): string {
  const x = new Date(d)
  x.setHours(hour, minute, 0, 0)
  return x.toISOString()
}

function push(
  ctx: Ctx,
  merchantName: string,
  date: Date,
  hour: number,
  amount: number,
  opts: { recurring?: boolean; narrationSuffix?: string; direction?: 'debit' | 'credit' } = {},
) {
  const m = MERCHANT_BY_NAME[merchantName]
  if (!m || amount <= 0) return
  ctx.n += 1
  ctx.out.push({
    id: `t${ctx.n.toString().padStart(4, '0')}`,
    date: iso(date, hour, Math.floor(ctx.rnd() * 60)),
    amount,
    direction: opts.direction ?? 'debit',
    merchant: m.name,
    narration: m.narration + (opts.narrationSuffix ?? ''),
    source: 'aa',
    categoryL1: '',
    categoryL2: '',
    band: 'AMBER',
    confidence: 0,
    recurring: opts.recurring,
  })
}

function pushIncome(ctx: Ctx, date: Date, amount: number, label: string) {
  ctx.n += 1
  ctx.out.push({
    id: `t${ctx.n.toString().padStart(4, '0')}`,
    date: iso(date, 10, 12),
    amount,
    direction: 'credit',
    merchant: label,
    narration: `NEFT-CR-${label.toUpperCase()}-SALARY`,
    source: 'aa',
    categoryL1: 'Income',
    categoryL2: 'Income',
    band: 'GROW',
    confidence: 1,
    recurring: true,
  })
}

const d = (y: number, m: number, day: number) => new Date(y, m, day)

/**
 * Generates roughly six months of history for a persona.
 *
 * The generator deliberately encodes the behaviours the product claims to
 * detect — payday clustering, late-night food ordering, sale-season spikes,
 * subscription creep — so the pattern engine has something real to find rather
 * than a hardcoded answer to display.
 */
export function generateTransactions(personaKey: PersonaKey, now = new Date()): Txn[] {
  const rnd = mulberry32(SEEDS[personaKey])
  const ctx: Ctx = { rnd, out: [], n: 0 }
  const MONTHS = 6

  for (let back = MONTHS - 1; back >= 0; back--) {
    const anchor = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const y = anchor.getFullYear()
    const m = anchor.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const isCurrent = back === 0
    const lastDay = isCurrent ? Math.max(now.getDate(), 1) : daysInMonth
    const has = (day: number) => day <= lastDay
    /** Sale season: two of the six months carry a retail spike. */
    const saleMonth = back === 2 || back === 4

    switch (personaKey) {
      case 'rohit': {
        if (has(1)) pushIncome(ctx, d(y, m, 1), 92000, 'Nimbus Software')
        if (has(3)) push(ctx, 'Landlord (rent)', d(y, m, 3), 9, 28000, { recurring: true })
        if (has(8)) push(ctx, 'BESCOM', d(y, m, 8), 11, jitter(rnd, 1850, 0.25), { recurring: true })
        if (has(9)) push(ctx, 'ACT Fibernet', d(y, m, 9), 11, 1349, { recurring: true })
        if (has(12)) push(ctx, 'Society maintenance', d(y, m, 12), 12, 3200, { recurring: true })
        if (has(15)) push(ctx, 'Star Health', d(y, m, 15), 10, 2180, { recurring: true })
        if (has(2)) push(ctx, 'Netflix', d(y, m, 2), 6, 649, { recurring: true })
        if (has(4)) push(ctx, 'Spotify', d(y, m, 4), 6, 119, { recurring: true })
        if (has(6)) push(ctx, 'Disney+ Hotstar', d(y, m, 6), 6, 299, { recurring: true })
        if (has(11)) push(ctx, 'Amazon Prime', d(y, m, 11), 6, 299, { recurring: true })
        // Subscription creep: two more pile on in the later months.
        if (back <= 2 && has(14)) push(ctx, 'JioSaavn', d(y, m, 14), 6, 149, { recurring: true })
        if (back <= 1 && has(18)) push(ctx, 'Steam', d(y, m, 18), 21, jitter(rnd, 1400, 0.5))
        if (back <= 3 && has(20)) push(ctx, 'Zerodha Coin', d(y, m, 20), 10, 5000, { recurring: true })

        // Groceries — light, because he rarely cooks.
        for (const day of [7, 19, 27]) if (has(day)) push(ctx, pick(rnd, ['DMart', 'Zepto', 'BigBasket']), d(y, m, day), 19, jitter(rnd, 1900, 0.4))

        // Food delivery — the signature leak. Payday clustered, late-night biased.
        const deliveries = 30 + Math.floor(rnd() * 7)
        for (let i = 0; i < deliveries; i++) {
          const clustered = rnd() < 0.45
          const day = clustered ? 1 + Math.floor(rnd() * 5) : 1 + Math.floor(rnd() * daysInMonth)
          if (!has(day)) continue
          const lateNight = rnd() < 0.42
          const hour = lateNight ? 21 + Math.floor(rnd() * 3) : 12 + Math.floor(rnd() * 8)
          push(ctx, pick(rnd, ['Swiggy', 'Zomato']), d(y, m, day), Math.min(hour, 23), jitter(rnd, 520, 0.55))
        }
        // Weekend dine-in.
        for (let day = 1; day <= daysInMonth; day++) {
          const wd = new Date(y, m, day).getDay()
          if ((wd === 5 || wd === 6) && rnd() < 0.6 && has(day))
            push(ctx, pick(rnd, ['Toit Brewpub', 'Third Wave Coffee']), d(y, m, day), 20, jitter(rnd, 1550, 0.5))
        }
        // Commute vs leisure rides.
        for (let i = 0; i < 18; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (!has(day)) continue
          const wd = new Date(y, m, day).getDay()
          const commute = wd >= 1 && wd <= 5 && rnd() < 0.6
          push(ctx, pick(rnd, ['Uber', 'Ola', 'Rapido']), d(y, m, day), commute ? 9 : 22, jitter(rnd, commute ? 160 : 340, 0.4), {
            narrationSuffix: commute ? ' COMMUTE' : '',
          })
        }
        // Fashion and gadgets, spiking in sale months.
        const fashionRuns = saleMonth ? 4 : 1
        for (let i = 0; i < fashionRuns; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Myntra', 'Ajio']), d(y, m, day), 23, jitter(rnd, saleMonth ? 2900 : 2200, 0.5))
        }
        if (saleMonth && has(22)) push(ctx, 'Croma', d(y, m, 22), 19, jitter(rnd, 18500, 0.3))
        if (has(16)) push(ctx, 'Google Play', d(y, m, 16), 23, jitter(rnd, 1400, 0.5))
        if (has(23)) push(ctx, 'Urban Company', d(y, m, 23), 12, jitter(rnd, 1500, 0.35))
        if (back === 3 && has(25)) push(ctx, 'Ferns N Petals', d(y, m, 25), 18, 3600)
        // Mixed baskets, cash, self transfer.
        for (const day of [10, 21]) if (has(day)) push(ctx, pick(rnd, ['Amazon', 'Flipkart']), d(y, m, day), 20, jitter(rnd, 2400, 0.6))
        if (has(13)) push(ctx, 'ATM cash', d(y, m, 13), 18, 3000)
        if (has(26)) push(ctx, 'Self transfer', d(y, m, 26), 15, 8000)
        if (has(24) && rnd() < 0.5) push(ctx, 'Apollo Pharmacy', d(y, m, 24), 19, jitter(rnd, 640, 0.5))
        break
      }

      case 'priya': {
        if (has(1)) pushIncome(ctx, d(y, m, 1), 41000, 'Vidya Vihar School')
        if (has(2)) pushIncome(ctx, d(y, m, 2), 20000, 'R Menon')
        if (has(5)) push(ctx, 'HDFC Home Loan', d(y, m, 5), 8, 19400, { recurring: true })
        if (has(9)) push(ctx, 'KSEB', d(y, m, 9), 11, jitter(rnd, 1420, 0.2), { recurring: true })
        if (has(10)) push(ctx, 'ACT Fibernet', d(y, m, 10), 11, 999, { recurring: true })
        if (has(15)) push(ctx, 'HDFC ERGO', d(y, m, 15), 10, 2650, { recurring: true })
        // School fees land quarterly — the event the RED tab exists to anticipate.
        if ((m % 3 === 0) && has(10)) push(ctx, 'School fee portal', d(y, m, 10), 10, 42000, { recurring: true })
        if (has(4)) push(ctx, 'Country Delight', d(y, m, 4), 7, 2400, { recurring: true })
        if (has(20)) push(ctx, 'Zerodha Coin', d(y, m, 20), 10, 4000, { recurring: true })
        if (has(21)) push(ctx, 'PPF', d(y, m, 21), 10, 3000, { recurring: true })
        if (has(7)) push(ctx, 'Disney+ Hotstar', d(y, m, 7), 6, 299, { recurring: true })
        for (const day of [3, 8, 14, 19, 24, 28]) if (has(day)) push(ctx, pick(rnd, ['DMart', 'BigBasket', 'Local kirana']), d(y, m, day), 18, jitter(rnd, 2600, 0.3))
        for (let i = 0; i < 5; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Swiggy', 'Zomato']), d(y, m, day), 20, jitter(rnd, 520, 0.4))
        }
        for (let i = 0; i < 2; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, 'Apollo Pharmacy', d(y, m, day), 19, jitter(rnd, 780, 0.5))
        }
        if (rnd() < 0.5 && has(17)) push(ctx, 'Apollo Diagnostics', d(y, m, 17), 11, jitter(rnd, 1500, 0.4))
        if (has(12)) push(ctx, 'Crossword', d(y, m, 12), 17, jitter(rnd, 900, 0.5))
        if (saleMonth && has(23)) push(ctx, 'Myntra', d(y, m, 23), 21, jitter(rnd, 3200, 0.4))
        // Festival spend: forecast and funded, never flagged.
        if (back === 3 && has(18)) push(ctx, 'Ferns N Petals', d(y, m, 18), 18, 4200)
        for (const day of [11, 25]) if (has(day)) push(ctx, 'Amazon', d(y, m, day), 20, jitter(rnd, 1800, 0.5))
        if (has(16)) push(ctx, 'ATM cash', d(y, m, 16), 17, 4000)
        if (has(6)) push(ctx, pick(rnd, ['Uber', 'Rapido']), d(y, m, 6), 8, jitter(rnd, 180, 0.3), { narrationSuffix: ' COMMUTE' })
        break
      }

      case 'arjun': {
        // Lumpy, irregular income — two or three receipts a month, wildly uneven.
        const receipts = 2 + Math.floor(rnd() * 2)
        for (let i = 0; i < receipts; i++) {
          const day = 2 + Math.floor(rnd() * 24)
          if (!has(day)) continue
          const thin = back === 1 || back === 4
          pushIncome(ctx, d(y, m, day), jitter(rnd, thin ? 26000 : 52000, 0.55), 'Verma Printers')
        }
        if (has(3)) push(ctx, 'Landlord (rent)', d(y, m, 3), 9, 34000, { recurring: true })
        if (has(6)) push(ctx, 'BESCOM', d(y, m, 6), 11, jitter(rnd, 3100, 0.3), { recurring: true })
        if (has(15)) push(ctx, 'Star Health', d(y, m, 15), 10, 4900, { recurring: true })
        if ((m % 3 === 1) && has(12)) push(ctx, 'School fee portal', d(y, m, 12), 10, 58000, { recurring: true })
        if (has(9)) push(ctx, 'ACT Fibernet', d(y, m, 9), 11, 1499, { recurring: true })
        for (const day of [5, 13, 21, 27]) if (has(day)) push(ctx, pick(rnd, ['DMart', 'BigBasket']), d(y, m, day), 19, jitter(rnd, 3400, 0.35))
        for (let i = 0; i < 7; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Swiggy', 'Saravana Bhavan']), d(y, m, day), 21, jitter(rnd, 700, 0.5))
        }
        for (const day of [8, 18, 28]) if (has(day)) push(ctx, 'ATM cash', d(y, m, day), 12, jitter(rnd, 12000, 0.4))
        for (const day of [14, 24]) if (has(day)) push(ctx, 'Self transfer', d(y, m, day), 15, jitter(rnd, 20000, 0.5))
        if (has(11)) push(ctx, 'Amazon', d(y, m, 11), 20, jitter(rnd, 5200, 0.6))
        if (has(17)) push(ctx, 'Apollo Pharmacy', d(y, m, 17), 19, jitter(rnd, 1100, 0.4))
        if (back === 2 && has(20)) push(ctx, 'MakeMyTrip', d(y, m, 20), 22, 31000)
        if (has(19)) push(ctx, 'Netflix', d(y, m, 19), 6, 649, { recurring: true })
        break
      }

      case 'sneha': {
        if (has(1)) pushIncome(ctx, d(y, m, 1), 38000, 'Brightline Media')
        if (has(4)) push(ctx, 'Landlord (rent)', d(y, m, 4), 9, 11000, { recurring: true })
        if (has(8)) push(ctx, 'BESCOM', d(y, m, 8), 11, jitter(rnd, 720, 0.25), { recurring: true })
        if (has(9)) push(ctx, 'ACT Fibernet', d(y, m, 9), 11, 799, { recurring: true })
        if (has(2)) push(ctx, 'Spotify', d(y, m, 2), 6, 119, { recurring: true })
        if (has(5)) push(ctx, 'Disney+ Hotstar', d(y, m, 5), 6, 299, { recurring: true })
        if (back <= 2 && has(13)) push(ctx, 'Netflix', d(y, m, 13), 6, 499, { recurring: true })
        if (back <= 1 && has(20)) push(ctx, 'Cult.fit', d(y, m, 20), 7, 1499, { recurring: true })
        for (const day of [6, 16, 26]) if (has(day)) push(ctx, pick(rnd, ['Zepto', 'Local kirana']), d(y, m, day), 20, jitter(rnd, 1400, 0.4))
        for (let i = 0; i < 12; i++) {
          const clustered = rnd() < 0.5
          const day = clustered ? 1 + Math.floor(rnd() * 6) : 1 + Math.floor(rnd() * daysInMonth)
          if (!has(day)) continue
          push(ctx, pick(rnd, ['Swiggy', 'Zomato']), d(y, m, day), rnd() < 0.4 ? 22 : 14, jitter(rnd, 340, 0.5))
        }
        for (let i = 0; i < (saleMonth ? 3 : 1); i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Myntra', 'Ajio']), d(y, m, day), 23, jitter(rnd, saleMonth ? 2100 : 1200, 0.5))
        }
        for (let i = 0; i < 3; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Third Wave Coffee', 'Saravana Bhavan']), d(y, m, day), 19, jitter(rnd, 620, 0.5))
        }
        if (has(15)) push(ctx, 'Amazon', d(y, m, 15), 21, jitter(rnd, 1500, 0.6))
        if (has(22)) push(ctx, 'ATM cash', d(y, m, 22), 18, 2000)
        for (let i = 0; i < 6; i++) {
          const day = 1 + Math.floor(rnd() * daysInMonth)
          if (has(day)) push(ctx, pick(rnd, ['Rapido', 'Uber']), d(y, m, day), 9, jitter(rnd, 120, 0.3), { narrationSuffix: ' COMMUTE' })
        }
        break
      }
    }
  }

  return ctx.out.sort((a, b) => (a.date < b.date ? 1 : -1))
}
