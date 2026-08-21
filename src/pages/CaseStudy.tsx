import { Link } from 'react-router-dom'
import { BandChip, Callout, Card } from '../components/ui'
import { ArrowRight, GithubIcon, ShieldIcon } from '../components/Icons'
import { TAXONOMY } from '../data/taxonomy'

/**
 * Derive the repository URL from wherever this is being served.
 *
 * On GitHub Pages the host is <user>.github.io and the first path segment is
 * the repo name, so the link is always correct without hardcoding a username
 * that would rot the moment someone forked it.
 */
function repoUrl(): string {
  if (typeof window === 'undefined') return 'https://github.com'
  const { hostname, pathname } = window.location
  const m = hostname.match(/^([^.]+)\.github\.io$/)
  const repo = pathname.split('/').filter(Boolean)[0]
  if (m && repo) return `https://github.com/${m[1]}/${repo}`
  if (m) return `https://github.com/${m[1]}`
  return 'https://github.com'
}

const REPO = repoUrl()

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-ink-300/70 py-10">
      <p className="label mb-2 text-brand">{eyebrow}</p>
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="max-w-3xl text-[15px] leading-relaxed text-ink-700">{children}</p>
)

export default function CaseStudy() {
  const bandCount = (b: string) => TAXONOMY.filter((l) => l.band === b).length

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-ink-300/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><ShieldIcon size={17} /></span>
          <span className="text-sm font-bold text-ink-900">SpendLens</span>
          <nav className="ml-auto flex items-center gap-1.5">
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><GithubIcon size={14} /> <span className="hidden sm:inline">Code</span></a>
            <Link to="/app" className="btn-primary btn-sm">Open the app <ArrowRight size={14} /></Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5">
        {/* ------------------------------------------------------------ hero */}
        <section className="py-12 sm:py-16">
          <p className="label mb-3 text-brand">Product case study · India · 2026</p>
          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-ink-900 sm:text-5xl">
            Most money apps tell you what you spent.<br />
            <span className="text-brand">SpendLens tells you what you must not touch.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-700">
            An AI behavioural spend-intelligence product for Indian households. It reads how a household actually behaves with money,
            classifies every rupee as <BandChip band="RED" size="sm" /> or <BandChip band="GREEN" size="sm" />, and refuses to let a
            discretionary choice quietly outcompete rent, health, food or education.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/app" className="btn-primary">Open the working app <ArrowRight size={16} /></Link>
            <a href="#decisions" className="btn-ghost">Read the decisions</a>
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-ghost"><GithubIcon size={15} /> Source</a>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['4', 'demo households, each stressing a different capability'],
              ['6', 'engines: classify, goals, forecast, patterns, nudges, import'],
              ['5', 'behavioural patterns detected from raw transactions'],
              ['0', 'servers — everything runs in the browser'],
            ].map(([n, l]) => (
              <div key={l} className="card p-4">
                <dt className="tnum text-2xl font-bold text-brand">{n}</dt>
                <dd className="mt-1 text-[12px] leading-snug text-ink-600">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* -------------------------------------------------------- problem */}
        <Section id="problem" eyebrow="The problem" title="Visibility went up. Control went down.">
          <P>
            An Indian salaried household today has more visibility into its spending than at any point in history. Every UPI payment
            fires a notification. Every bank app draws a monthly pie chart. And the most common complaint in the segment is not
            &ldquo;I don&rsquo;t know where my money went&rdquo; — it is <em>&ldquo;I know exactly where it went and I still couldn&rsquo;t stop it.&rdquo;</em>
          </P>
          <P>
            That gap exists because the category solves the wrong problem. Budgeting apps categorise the past. What they do not model is
            the behaviour that produces the number: the three revisits before an order, the clustering in the four days after salary
            lands, the sale notification that turns a browse into a purchase in eleven minutes, the five subscriptions nobody decided to
            keep.
          </P>
          <P>
            The consequence is not simply overspending. It is that discretionary spend outcompetes obligations. Rent gets paid because it
            must. The emergency fund and the education corpus lose every month to a hundred small decisions that each felt reasonable
            alone. The household is not reckless — it is running without a mechanism that protects the things it would itself say matter
            most.
          </P>
        </Section>

        {/* ------------------------------------------------------- research */}
        <Section id="research" eyebrow="Discovery" title="Four findings that changed the product">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['People think in obligations, not categories', 'Interviews kept returning to due dates, not spend types. The RED tab was rebuilt to sort by days-to-due, with unfunded items pinned — not by category total.'],
              ['A median of three revisits before a purchase', 'A diary study found discretionary purchases clustered between 9pm and midnight after repeated visits. That produced both the impulse model and the late-night pattern.'],
              ['Red was read as "you overspent"', 'Concept testing broke the colour metaphor immediately. Fixed structurally: every band carries a colour, an icon and a word — ESSENTIAL, FLEXIBLE. Colour never carries meaning alone.'],
              ['Consent is where the funnel dies', 'Abandonment fell from 6-in-10 to 2-in-10 once purpose, data types, duration and frequency moved above the fold and every piece of jargon got a one-line explanation.'],
            ].map(([t, b]) => (
              <Card key={t}>
                <h3 className="text-[15px] font-semibold text-ink-900">{t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{b}</p>
              </Card>
            ))}
          </div>
          <p className="text-[12px] italic text-ink-600">
            This is a portfolio build. The research above is the documented rationale from the product specification behind it, not
            fieldwork I am claiming to have run with real participants.
          </p>
        </Section>

        {/* ------------------------------------------------------ the model */}
        <Section id="model" eyebrow="The core model" title="Four bands, one non-negotiable rule">
          <P>
            Every rupee lands in one of four bands. The taxonomy is the single source of truth for the classifier, the navigation and every
            figure in the app — {TAXONOMY.length} leaf categories, each with an explicit classification rule and a stated product behaviour.
          </P>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['RED', 'Shelter, health, food, education. Protected first. Never the target of a reduction nudge.', bandCount('RED')],
              ['GREEN', 'Everything discretionary. Measured against an allowance derived from your own behaviour, not a generic rule.', bandCount('GREEN')],
              ['AMBER', 'Genuinely ambiguous. The product asks rather than showing a confident wrong answer.', bandCount('AMBER')],
              ['GROW', 'Money moving toward goals. Never counted as spend.', bandCount('GROW')],
            ] as const).map(([band, desc, n]) => (
              <Card key={band}>
                <div className="flex items-center justify-between">
                  <BandChip band={band} />
                  <span className="tnum text-[12px] text-ink-600">{n} categories</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{desc}</p>
              </Card>
            ))}
          </div>
          <Callout tone="RED" title="The one rule the product will not break">
            SpendLens never recommends reducing a RED-protected obligation. Not medicine, not school fees, not the health premium, not
            rent. It is enforced by a guardrail service that evaluates every recommendation before delivery — separate code from the
            ranker, on purpose. The app ships a deliberately unsafe candidate suggestion so you can watch the guardrail block it on the
            home screen.
          </Callout>
        </Section>

        {/* ----------------------------------------------------- decisions */}
        <Section id="decisions" eyebrow="Product decisions" title="Six choices, and what each one cost">
          <div className="space-y-3">
            {[
              ['Goal-first onboarding, before asking for bank access',
               'Delays the moment real data arrives — a genuine cost to time-to-value. Taken anyway: a user who has already said what they are worried about has a reason to finish the consent step that follows.'],
              ['Ask instead of guessing (the AMBER queue)',
               'A review queue looks like unfinished work, and there was pressure in the spec to let the model guess. A confident wrong band in a product that knows your rent is due is unrecoverable; a question is not.'],
              ['Compare users to themselves, never to a population',
               'Loses the easy engagement win of "you spend more than 70% of people like you". Across Indian income bands that comparison is close to meaningless, and it moralises.'],
              ['Say the number, refuse to soften it',
               'A verdict of Not feasible says Not feasible, with the gap in rupees. Encouraging phrasing tests better in the moment and destroys the only thing a feasibility verdict is for — its ability to say no.'],
              ['A hard nudge budget: two a day, eight a week, quiet hours',
               'Caps the engagement metric every growth conversation reaches for first. Nudge fatigue removes users faster than any missing feature, so opt-out rate is a guardrail with veto power.'],
              ['Trade-offs ranked by behavioural ease, not by size',
               'The largest available saving is often the one the household will never sustain. Cutting gifting is arithmetically efficient and culturally illiterate — so it ranks last, and "none of these" is a first-class option.'],
            ].map(([t, b], i) => (
              <Card key={t}>
                <div className="flex gap-3">
                  <span className="tnum shrink-0 text-[13px] font-bold text-brand">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink-900">{t}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{b}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------ how built */}
        <Section id="build" eyebrow="How it is built" title="Six engines, no backend">
          <P>
            Everything runs client-side: React, TypeScript, Vite, Tailwind, hand-rolled SVG charts and no charting dependency. There is no
            server, no account and no network call — which is also the honest architecture for a demo that invites you to import a real
            bank statement.
          </P>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink-300 text-ink-600">
                  <th className="py-2 pr-4 font-semibold">Engine</th>
                  <th className="py-2 pr-4 font-semibold">What it does</th>
                  <th className="py-2 font-semibold">The interesting part</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {[
                  ['classify.ts', 'Merchant registry → narration patterns → taxonomy → user overrides', 'Returns an explanation trace, not a score, so the UI can show a real "why we think this".'],
                  ['goals.ts', 'Refines a goal into a monthly figure, a verdict and ranked trade-offs', 'Trade-offs come from the household’s own categories, weighted by behavioural ease.'],
                  ['forecast.ts', '90-day balance path from recurring commitments and income cadence', 'Uncertainty widens with √t, and variable incomes switch to a 30th-percentile envelope.'],
                  ['patterns.ts', 'Payday clustering, late-night, weekend, sale spikes, subscription creep', 'Immaterial patterns are computed, scored, and deliberately not promoted.'],
                  ['nudges.ts', 'Ranks candidates, then a separate guardrail vetoes unsafe ones', 'The guardrail is independent code that runs after generation and before delivery.'],
                  ['csv.ts', 'Imports real Indian bank statements', 'Handles both single-amount and separate withdrawal/deposit layouts, and dd/mm/yyyy dates.'],
                ].map(([f, w, i]) => (
                  <tr key={f} className="border-b border-ink-300/50">
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-brand">{f}</td>
                    <td className="py-2.5 pr-4 text-ink-900">{w}</td>
                    <td className="py-2.5 text-ink-600">{i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            The demo ledger is generated by a seeded PRNG so it is identical on every load — otherwise the behavioural patterns the app
            claims to detect would shift between refreshes and no screenshot of it could be trusted. The generator deliberately encodes
            the behaviours the engines look for, so the pattern detector is finding something real rather than displaying a hardcoded
            answer.
          </P>
        </Section>

        {/* --------------------------------------------------------- a11y */}
        <Section id="craft" eyebrow="Craft" title="Accessibility and tone, treated as requirements">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Meaning never rides on colour alone', 'Band = colour + icon + word. Roughly one man in twelve cannot separate the red and green tokens by hue.'],
              ['Contrast and target sizes are specified, not eyeballed', 'Every band token carries a measured ratio against its background; interactive targets are 44pt minimum, including chart points.'],
              ['Indian number formatting throughout', '₹1,50,000 — never 150,000. A finance product that formats rupees like dollars announces in three seconds that it was not built for this market.'],
              ['Forecasts are bands, never lines', 'A single line is a claim to certainty a 90-day projection cannot support.'],
              ['No moralising vocabulary', 'The words are ESSENTIAL and FLEXIBLE. Not "good spend" and "bad spend". Festival and family spending is forecast and funded, never flagged.'],
              ['Reduced motion respected', 'Animation collapses to an instant cut when the OS asks for it.'],
            ].map(([t, b]) => (
              <Card key={t}>
                <h3 className="text-[14px] font-semibold text-ink-900">{t}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{b}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------- honest */}
        <Section id="limits" eyebrow="Honest limits" title="What this build is not">
          <Callout tone="AMBER" title="Read this before judging it as a product">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>There is no Account Aggregator integration. Real ingestion needs a licensed NBFC-AA, a consent artefact and an audit trail — none of which can live in a static site.</li>
              <li>The classifier is the rule layer only. In the specification an ML model handles the residue; the rule layer exists precisely because it is shippable alone, which is what makes this demo honest rather than a mock.</li>
              <li>There is no investment guidance. SEBI Investment Adviser regulation gates personalised investment advice in India, and building it before a legal opinion would be the expensive kind of optimism.</li>
              <li>Every figure — targets, incomes, ceilings, ease ratings — is a planning assumption chosen to make the models work end to end. None of it is researched market data.</li>
              <li>Nothing here is financial advice.</li>
            </ul>
          </Callout>
        </Section>

        {/* ---------------------------------------------------------- next */}
        <Section id="next" eyebrow="If this were the real thing" title="What comes next, in order">
          <ol className="space-y-2.5">
            {[
              'Freeze the taxonomy with a training-data plan attached, because changing it later means retraining a model and rewriting an interface.',
              'Contract a licensed NBFC-AA and build consent, ingestion, de-duplication and reconciliation before anything user-facing.',
              'Ship the classifier as rules first, add the ML layer in shadow, and promote only on a beat across every income-band slice.',
              'Run the closed beta against one number: does the median household reduce discretionary spend by more than 3% at month three? Below that, the thesis has failed and the plan re-scopes.',
              'Resolve the SEBI position in writing before a single line of the investment module ships.',
            ].map((s, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-ink-300/70 p-3">
                <span className="tnum shrink-0 text-[13px] font-bold text-brand">{i + 1}</span>
                <span className="text-[14px] leading-relaxed text-ink-700">{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="border-t border-ink-300/70 py-12 text-center">
          <h2 className="text-2xl font-bold text-ink-900">See it working</h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">
            Four households, six months of transactions, and every engine running live. Or import your own bank CSV — it never leaves your browser.
          </p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Link to="/app" className="btn-primary">Open the app <ArrowRight size={16} /></Link>
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-ghost"><GithubIcon size={15} /> View the code</a>
          </div>
        </section>

        <footer className="border-t border-ink-300/70 py-8 text-center text-[12px] leading-relaxed text-ink-600">
          <p>SpendLens — a portfolio product build. Not a financial product, not financial advice, and not affiliated with any bank or aggregator.</p>
          <p className="mt-1">All data is synthetic and stays in your browser. MIT licensed.</p>
        </footer>
      </div>
    </div>
  )
}
