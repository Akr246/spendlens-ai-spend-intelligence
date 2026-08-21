import type { Txn } from '../types'

/**
 * CSV import.
 *
 * Accepts the shape most Indian bank exports actually have, rather than a
 * single rigid template: a date column, a narration or description column, and
 * either a signed amount or separate debit and credit columns.
 */
export interface ImportResult {
  txns: Txn[]
  errors: string[]
  detected: { date: string; narration: string; debit?: string; credit?: string; amount?: string }
}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date'],
  narration: ['narration', 'description', 'particulars', 'remarks', 'details', 'transaction remarks', 'merchant'],
  debit: ['debit', 'withdrawal', 'withdrawal amt', 'withdrawal amount', 'dr', 'debit amount'],
  credit: ['credit', 'deposit', 'deposit amt', 'deposit amount', 'cr', 'credit amount'],
  amount: ['amount', 'amt', 'transaction amount'],
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function matchHeader(headers: string[], key: string): number {
  const aliases = HEADER_ALIASES[key]
  return headers.findIndex((h) => aliases.includes(h.toLowerCase().trim()))
}

function parseAmount(raw: string): number {
  const n = Number(String(raw).replace(/[₹,\s]/g, '').replace(/[()]/g, ''))
  return Number.isFinite(n) ? Math.abs(n) : 0
}

function parseDate(raw: string): string | null {
  const s = raw.trim()
  // dd/mm/yyyy and dd-mm-yyyy are the Indian bank default.
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    const dt = new Date(year, Number(m) - 1, Number(d), 12, 0, 0)
    return Number.isNaN(+dt) ? null : dt.toISOString()
  }
  const dt = new Date(s)
  return Number.isNaN(+dt) ? null : dt.toISOString()
}

export function parseCsv(text: string): ImportResult {
  const errors: string[] = []
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length < 2) {
    return { txns: [], errors: ['The file has no data rows.'], detected: { date: '', narration: '' } }
  }
  const headers = splitCsvLine(lines[0])
  const iDate = matchHeader(headers, 'date')
  const iNarr = matchHeader(headers, 'narration')
  const iDebit = matchHeader(headers, 'debit')
  const iCredit = matchHeader(headers, 'credit')
  const iAmount = matchHeader(headers, 'amount')

  if (iDate < 0) errors.push('No date column found. Expected one of: ' + HEADER_ALIASES.date.join(', ') + '.')
  if (iNarr < 0) errors.push('No description column found. Expected one of: ' + HEADER_ALIASES.narration.join(', ') + '.')
  if (iDebit < 0 && iAmount < 0) errors.push('No amount column found. Expected either a single amount column, or separate debit and credit columns.')
  if (errors.length) {
    return { txns: [], errors, detected: { date: headers[iDate] ?? '', narration: headers[iNarr] ?? '' } }
  }

  const txns: Txn[] = []
  let skipped = 0
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const date = parseDate(cells[iDate] ?? '')
    if (!date) { skipped++; continue }
    const narration = cells[iNarr] ?? ''
    let amount = 0
    let direction: 'debit' | 'credit' = 'debit'
    if (iDebit >= 0 || iCredit >= 0) {
      const dr = iDebit >= 0 ? parseAmount(cells[iDebit] ?? '') : 0
      const cr = iCredit >= 0 ? parseAmount(cells[iCredit] ?? '') : 0
      if (cr > 0 && dr === 0) { amount = cr; direction = 'credit' } else { amount = dr }
    } else {
      const raw = cells[iAmount] ?? ''
      amount = parseAmount(raw)
      if (/^-/.test(raw.trim()) === false && /cr\b/i.test(raw)) direction = 'credit'
    }
    if (amount <= 0) { skipped++; continue }
    txns.push({
      id: `csv${i}`,
      date,
      amount,
      direction,
      merchant: narration.split(/[-/]/).filter(Boolean)[1]?.trim() || narration.slice(0, 28) || 'Unknown',
      narration,
      source: 'csv',
      categoryL1: '', categoryL2: '', band: 'AMBER', confidence: 0,
    })
  }
  if (skipped) errors.push(`${skipped} row${skipped > 1 ? 's were' : ' was'} skipped because the date or amount could not be read.`)
  return {
    txns: txns.sort((a, b) => (a.date < b.date ? 1 : -1)),
    errors,
    detected: { date: headers[iDate], narration: headers[iNarr], debit: headers[iDebit], credit: headers[iCredit], amount: headers[iAmount] },
  }
}

export const SAMPLE_CSV = `Date,Narration,Withdrawal Amt,Deposit Amt
01/08/2026,NEFT-CR-NIMBUS SOFTWARE-SALARY,,92000
03/08/2026,NEFT-RENT-AUG-S KRISHNAN,28000,
04/08/2026,UPI-SWIGGY-P2M,486,
05/08/2026,UPI-ZEPTONOW-P2M,1840,
06/08/2026,ACH-D-NETFLIX ENTERTAIN,649,
08/08/2026,BBPS/BESCOM/ELECTRICITY,1910,
09/08/2026,UPI-MYNTRA DESIGNS-P2M,2410,
11/08/2026,UPI-APOLLOPHARMACY-P2M,640,
13/08/2026,ATW/CASH WDL/HDFC ATM,3000,
`
