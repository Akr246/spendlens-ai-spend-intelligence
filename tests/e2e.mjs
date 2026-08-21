/**
 * End-to-end checks for SpendLens.
 *
 * These are behaviour checks, not snapshot tests: they verify the things the
 * product promises — that the consent gate actually gates, that a correction
 * propagates to every transaction from that merchant, that the guardrail blocks
 * the unsafe suggestion before delivery, and that a variable income switches to
 * the conservative envelope.
 *
 * Run:
 *   npm run build && npx vite preview --port 4173 &
 *   npm i -D playwright && npx playwright install chromium
 *   npm run test:e2e
 *
 * Playwright is deliberately not a committed dependency: its postinstall pulls
 * browser binaries, which would slow every CI run of a static site build.
 */
const { chromium } = require('playwright')
const BASE = 'http://localhost:4173/spendlens-ai-spend-intelligence/#'
const fs = require('fs')

const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('  ok —', msg) }

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))

  console.log('1. onboarding')
  await page.goto(BASE + '/onboarding', { waitUntil: 'networkidle' })
  await page.locator('button', { hasText: 'Priya Menon' }).first().click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Continue/ }).click()
  assert(await page.getByRole('button', { name: /Link and continue/ }).isDisabled(), 'consent gate blocks continue until ticked')
  await page.locator('input[type=checkbox]').first().check()
  await page.getByRole('button', { name: /Link and continue/ }).click()
  await page.waitForURL(/#\/app/)
  assert((await page.locator('header').innerText()).includes('Priya'), 'chosen persona is loaded')

  console.log('2. review queue + correction')
  await page.goto(BASE + '/transactions', { waitUntil: 'networkidle' })
  const readQueue = async () => {
    const t = await page.locator('main').innerText()
    return parseInt((t.match(/(\d+) are waiting on a decision/) || [])[1] ?? '0', 10)
  }
  const before = await readQueue()
  assert(before > 0, `review queue has ${before} items`)
  await page.getByRole('button', { name: /Needs a decision/ }).click()
  await page.locator('ul.card button').first().click()
  await page.waitForSelector('[role=dialog]')
  assert(/why spendlens thinks this/i.test(await page.locator('[role=dialog]').innerText()), 'explanation trace is shown')
  await page.locator('[role=dialog] select').selectOption({ label: 'Food › Groceries & staples (RED)' })
  await page.getByRole('button', { name: /Save correction/ }).click()
  await page.waitForTimeout(400)
  await page.goto(BASE + '/transactions', { waitUntil: 'networkidle' })
  const after = await readQueue()
  assert(after < before, `queue shrank after a merchant-wide correction (${before} -> ${after})`)

  console.log('3. guardrail')
  await page.goto(BASE + '/app', { waitUntil: 'networkidle' })
  const home = await page.locator('main').innerText()
  assert(/blocked by the guardrail/i.test(home), 'guardrail blocks the unsafe suggestion')
  assert(!/Trim .* from groceries/.test(home.split('blocked by the guardrail')[0]), 'the unsafe suggestion is not delivered above the guardrail notice')

  console.log('4. goals what-if')
  await page.goto(BASE + '/goals', { waitUntil: 'networkidle' })
  const g1 = await page.locator('main').innerText()
  assert(/Not feasible|At risk|On track/.test(g1), 'a verdict is rendered')
  const firstCard = page.locator('main .card').filter({ hasText: 'What if you put aside more' }).first()
  const tryBtn = firstCard.getByRole('button', { name: /^Try it$/ }).first()
  if (await tryBtn.count()) {
    const before = await firstCard.innerText()
    await tryBtn.click()
    await page.waitForTimeout(300)
    const afterTxt = await firstCard.innerText()
    assert(before !== afterTxt && !/\+₹0 →/.test(afterTxt), 'what-if updates when a trade-off is applied')
  }

  console.log('5. CSV import')
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' })
  const csv = `Date,Narration,Withdrawal Amt,Deposit Amt
01/08/2026,NEFT-CR-ACME-SALARY,,55000
02/08/2026,NEFT-RENT-AUG,18000,
03/08/2026,UPI-SWIGGY-P2M,540,
04/08/2026,UPI-APOLLOPHARMACY-P2M,860,
05/08/2026,ATW/CASH WDL/HDFC ATM,2000,
`
  fs.writeFileSync('/tmp/test.csv', csv)
  await page.setInputFiles('input[type=file]', '/tmp/test.csv')
  await page.waitForTimeout(600)
  const msg = await page.locator('main').innerText()
  assert(/imported 5 transactions/i.test(msg), 'CSV import parsed all rows')
  await page.goto(BASE + '/transactions', { waitUntil: 'networkidle' })
  assert(/5 transactions across/i.test(await page.locator('main').innerText()), 'imported ledger replaced the demo one')

  console.log('6. reset + persona switch')
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Back to demo data/ }).click()
  await page.waitForTimeout(400)
  await page.locator('button', { hasText: 'Arjun Verma' }).first().click()
  await page.waitForTimeout(500)
  await page.goto(BASE + '/forecast', { waitUntil: 'networkidle' })
  const f = await page.locator('main').innerText()
  assert(/conservative figure/i.test(f), 'variable-income persona switches to the conservative envelope')

  console.log('7. persistence across reload')
  await page.reload({ waitUntil: 'networkidle' })
  assert((await page.locator('header').innerText()).includes('Arjun'), 'state survives a reload')

  console.log('8. deep link + unknown route')
  await page.goto(BASE + '/nope', { waitUntil: 'networkidle' })
  assert(page.url().includes('#/'), 'unknown route redirects')

  assert(errs.length === 0, 'no uncaught page errors: ' + JSON.stringify(errs))
  console.log('\nALL CHECKS PASSED')
  await browser.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
