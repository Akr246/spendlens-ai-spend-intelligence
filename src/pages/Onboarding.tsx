import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { PERSONAS } from '../data/personas'
import { inr } from '../engine/analytics'
import { BandChip, Callout, Card } from '../components/ui'
import { ArrowRight, CheckIcon, LockIcon, ShieldIcon } from '../components/Icons'
import type { PersonaKey } from '../types'

/**
 * Goal-first onboarding.
 *
 * The order here is a deliberate product decision with a cost: asking four
 * questions before requesting bank access delays the moment real data arrives.
 * It is done anyway, because a user who has already said what they are worried
 * about has a reason to complete the consent step that follows.
 */
export default function Onboarding() {
  const { actions } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [persona, setPersona] = useState<PersonaKey>('rohit')
  const [income, setIncome] = useState(92000)
  const [dependants, setDependants] = useState(0)
  const [worry, setWorry] = useState('I finish every month at zero and I cannot say where it went.')
  const [consent, setConsent] = useState(false)

  const choose = (key: PersonaKey) => {
    const p = PERSONAS.find((x) => x.key === key)!
    setPersona(key)
    setIncome(p.monthlyIncome)
    setDependants(p.dependants)
    setWorry(p.worry)
  }

  const finish = () => {
    actions.switchPersona(persona)
    actions.completeOnboarding({ monthlyIncome: income, dependants, topWorry: worry, onboarded: true })
    navigate('/app')
  }

  const steps = ['Household', 'Your money', 'What worries you', 'Consent']

  return (
    <div className="min-h-dvh bg-ink-25">
      <header className="border-b border-ink-300/70 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><ShieldIcon size={17} /></span>
          <span className="text-sm font-bold text-ink-900">SpendLens</span>
          <button onClick={() => navigate('/')} className="ml-auto text-[13px] text-ink-600 underline underline-offset-2">Back to the case study</button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <ol className="mb-5 flex items-center gap-1.5" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1.5">
              <span className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-ink-300'}`} />
            </li>
          ))}
        </ol>
        <p className="label mb-3">Step {step + 1} of 4 · {steps[step]}</p>

        {step === 0 && (
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-ink-900">Which household should SpendLens read?</h1>
            <p className="text-[13px] leading-relaxed text-ink-600">
              This is a public demo, so it ships with four synthetic Indian households instead of asking for your bank.
              Each one exercises a different part of the product. You can switch later, or import your own bank CSV from Account.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PERSONAS.map((p) => (
                <button key={p.key} onClick={() => choose(p.key)}
                  className={`card p-4 text-left transition-colors ${persona === p.key ? 'border-brand ring-1 ring-brand' : 'hover:border-ink-400'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-900">{p.name}</span>
                    {persona === p.key && <CheckIcon size={16} className="text-brand" />}
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">{p.label}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">{p.blurb}</p>
                  <p className="tnum mt-2 text-[12px] text-ink-700">{inr(p.monthlyIncome)}/month · {p.city}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-ink-900">What comes in, and who depends on it?</h1>
            <Card>
              <label className="label mb-1 block" htmlFor="income">Monthly take-home</label>
              <input id="income" type="number" className="field tnum" value={income} onChange={(e) => setIncome(Number(e.target.value))} />
              <p className="mt-1.5 text-[12px] text-ink-600">Pre-filled from the household you chose. Every default in this flow is visible and editable — never silently applied.</p>
              <label className="label mb-1 mt-4 block" htmlFor="deps">People depending on this income (including you)</label>
              <input id="deps" type="number" min={1} max={8} className="field tnum" value={Math.max(dependants, 1)} onChange={(e) => setDependants(Number(e.target.value))} />
              <p className="mt-1.5 text-[12px] text-ink-600">Used for one thing only: the grocery ceiling, above which food spend stops being automatically protected.</p>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-ink-900">What is the money worry you would fix first?</h1>
            <Card>
              <textarea className="field min-h-[96px]" value={worry} onChange={(e) => setWorry(e.target.value)} />
              <p className="mt-2 text-[12px] leading-relaxed text-ink-600">
                SpendLens asks this before asking for bank access. It is the reason the first screen you see is about you rather than about a pie chart.
              </p>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-ink-900">What SpendLens will read</h1>
            <Card>
              <div className="mb-3 flex items-center gap-2 text-brand"><LockIcon size={16} /><span className="text-[13px] font-semibold">Consent summary</span></div>
              <dl className="divide-y divide-ink-300/60 text-[13px]">
                {[
                  ['Purpose', 'Classify your spending into essential and flexible, and assess whether your goals are reachable.'],
                  ['Data types', 'Transaction date, amount, merchant and narration from the accounts you link. No credentials, ever.'],
                  ['Frequency', 'Once daily, before 07:00 IST.'],
                  ['Duration', '12 months, then it expires and must be granted again.'],
                  ['Withdrawal', 'Revoke any time from Account. Fetching stops immediately and derived data is purged within 24 hours.'],
                  ['In this demo', 'Nothing leaves your browser. There is no server, no account and no network call. Data lives in this browser only.'],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-2">
                    <dt className="label pt-0.5">{k}</dt><dd className="leading-relaxed text-ink-700">{v}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg bg-ink-50 p-3">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span className="text-[13px] leading-relaxed text-ink-700">I understand what will be read and why.</span>
              </label>
              <div className="mt-3">
                <Callout tone="RED" title="What you are agreeing to first">
                  Your <BandChip band="RED" size="sm" /> obligations — shelter, health, food, education — are protected before anything else is discussed.
                  SpendLens will never suggest reducing them.
                </Callout>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3 ? (
            <button className="btn-primary ml-auto" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button>
          ) : (
            <button className="btn-primary ml-auto disabled:opacity-40" disabled={!consent} onClick={finish}>
              Link and continue <ArrowRight size={16} />
            </button>
          )}
        </div>
        {step === 3 && !consent && <p className="mt-2 text-right text-[12px] text-ink-600">Declining is a real option — it just ends the demo here.</p>}
      </div>
    </div>
  )
}
