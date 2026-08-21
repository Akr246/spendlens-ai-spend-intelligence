import { useState } from 'react'
import { useStore } from '../store/store'
import type { Goal } from '../types'
import { inr, months as fmtMonths } from '../engine/analytics'
import { verdictTone } from '../engine/goals'
import { GOAL_TEMPLATES } from '../data/personas'
import { Callout, Card, EmptyState, Meter, Modal, SectionTitle } from '../components/ui'
import { TargetIcon } from '../components/Icons'

/**
 * Goals — the capability the whole product exists for.
 *
 * A stated goal becomes a monthly number, an honest verdict, and, when it does
 * not fit, three specific trade-offs drawn from this household's own spending.
 * The shortfall is stated in rupees and never softened.
 */
export default function Goals() {
  const { assessments, actions, income, floor } = useStore()
  const [editing, setEditing] = useState<Goal | null>(null)
  const [whatIf, setWhatIf] = useState<Record<string, number>>({})

  const blank = (): Goal => ({
    id: `g${Date.now()}`,
    name: '',
    target: 500000,
    saved: 0,
    targetDate: new Date(new Date().getFullYear() + 2, new Date().getMonth(), 1).toISOString().slice(0, 10),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle hint={`Assessed against a take-home of ${inr(income)} and a protected floor of ${inr(floor)}.`}>Goals</SectionTitle>
        <button className="btn-primary btn-sm" onClick={() => setEditing(blank())}>Add a goal</button>
      </div>

      {assessments.length > 1 && (
        <Callout tone="AMBER" title="Each goal below is assessed on its own">
          Together they need{' '}
          <span className="tnum font-semibold">{inr(assessments.reduce((a, x) => a + x.requiredMonthly, 0))}</span> a month against a
          surplus of <span className="tnum font-semibold">{inr(assessments[0].surplus)}</span>. Real households sequence goals rather than
          funding them in parallel, so treat these as separate questions — or shorten one target date and lengthen another until the
          combined figure fits.
        </Callout>
      )}

      {assessments.length === 0 && (
        <EmptyState title="No goals yet" body="A goal is what turns a spending report into a plan. Start from a template — every pre-filled number is labelled with the assumption behind it."
          action={<button className="btn-primary btn-sm mt-2" onClick={() => setEditing(blank())}>Add your first goal</button>} />
      )}

      {assessments.map((a) => {
        const tone = verdictTone(a.verdict)
        const extra = whatIf[a.goal.id] ?? 0
        const newSurplus = a.surplus + extra
        const remaining = Math.max(a.goal.target - a.goal.saved, 0)
        const monthsAt = newSurplus > 0 ? Math.ceil(remaining / newSurplus) : null
        const projected = monthsAt
          ? new Date(new Date().getFullYear(), new Date().getMonth() + monthsAt, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
          : 'never at this rate'

        return (
          <Card key={a.goal.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold text-ink-900">{a.goal.name}</h3>
                <p className="tnum mt-0.5 text-[13px] text-ink-600">
                  {inr(a.goal.saved)} of {inr(a.goal.target)} · target {new Date(a.goal.targetDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {a.monthsRemaining} months left
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[12px] font-bold ${tone.bg} ${tone.fg} ${tone.bd}`}>{a.verdict}</span>
            </div>

            <div className="mt-3"><Meter value={a.goal.saved} max={a.goal.target} band="GROW" label={`${a.goal.name} progress`} /></div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Needed each month', inr(a.requiredMonthly)],
                ['Your surplus', inr(a.surplus)],
                ['Shortfall', a.gap > 0 ? inr(a.gap) : 'None'],
                ['On current behaviour', a.projectedDate ? new Date(a.projectedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Not reachable'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-ink-50 p-2.5">
                  <dt className="label">{k}</dt>
                  <dd className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>

            {a.gap > 0 && (
              <p className="mt-3 rounded-lg border border-red-border bg-red-surface px-3 py-2.5 text-[13px] leading-relaxed text-red-deep">
                You are <span className="tnum font-bold">{inr(a.gap)}</span> short every month. Not nearly there — short, by that amount.
              </p>
            )}

            {a.tradeOffs.length > 0 && (
              <div className="mt-4">
                <p className="label mb-2">Three ways to close it, from your own spending</p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {a.tradeOffs.slice(0, 3).map((t) => (
                    <li key={t.categoryL2} className="rounded-lg border border-ink-300/70 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-medium text-ink-900">{t.categoryL2}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.ease === 'Easy' ? 'bg-green-surface text-green-band' : t.ease === 'Moderate' ? 'bg-amber-surface text-amber-band' : 'bg-red-surface text-red-band'
                        }`}>{t.ease}</span>
                      </div>
                      <p className="tnum mt-1 text-[13px] text-ink-900">
                        Frees {inr(t.freeable)}/month from {inr(t.currentMonthly)}
                        {t.monthsSaved > 0 && <span className="text-grow-band"> · {fmtMonths(t.monthsSaved)} sooner</span>}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-600">{t.rationale}</p>
                      <button className="btn-ghost btn-sm mt-2"
                        onClick={() => setWhatIf((w) => ({ ...w, [a.goal.id]: (w[a.goal.id] ?? 0) === t.freeable ? 0 : t.freeable }))}>
                        {extra === t.freeable ? 'Remove from what-if' : 'Try it'}
                      </button>
                    </li>
                  ))}
                  <li className="rounded-lg border border-dashed border-ink-300 p-3">
                    <p className="text-[14px] font-medium text-ink-900">None of these</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
                      A first-class option. Extending the target date or lowering the target are real answers, and choosing this is
                      studied rather than treated as a failure.
                    </p>
                    <button className="btn-ghost btn-sm mt-2" onClick={() => setEditing(a.goal)}>Change the goal instead</button>
                  </li>
                </ul>
              </div>
            )}

            {a.noGreenLeft && (
              <Callout tone="AMBER" title="There is nothing flexible left to cut">
                Your discretionary spending is already minimal, so SpendLens will not invent an option that does not exist. Extending the
                horizon or lowering the target is the honest route here.
              </Callout>
            )}

            <div className="mt-4 rounded-lg bg-grow-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="label">What if you put aside more each month?</p>
                <span className="tnum text-[13px] font-semibold text-grow-band">+{inr(extra)} → finishes {projected}</span>
              </div>
              <input type="range" min={0} max={Math.max(a.requiredMonthly, 5000)} step={250} value={extra}
                onChange={(e) => setWhatIf((w) => ({ ...w, [a.goal.id]: Number(e.target.value) }))}
                className="mt-2 w-full accent-grow-band" aria-label="Extra monthly contribution" />
            </div>

            <div className="mt-3 flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setEditing(a.goal)}>Edit</button>
              <button className="btn-ghost btn-sm" onClick={() => actions.removeGoal(a.goal.id)}>Delete</button>
            </div>
          </Card>
        )
      })}

      {editing && <GoalEditor goal={editing} onClose={() => setEditing(null)} onSave={(g) => { actions.upsertGoal(g); setEditing(null) }} />}
    </div>
  )
}

function GoalEditor({ goal, onClose, onSave }: { goal: Goal; onClose: () => void; onSave: (g: Goal) => void }) {
  const [draft, setDraft] = useState(goal)
  const template = GOAL_TEMPLATES.find((t) => t.key === draft.templateKey)

  const applyTemplate = (key: string) => {
    const t = GOAL_TEMPLATES.find((x) => x.key === key)!
    setDraft((d) => ({
      ...d,
      templateKey: key,
      name: d.name || t.name,
      targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + t.months, 1).toISOString().slice(0, 10),
    }))
  }

  return (
    <Modal open onClose={onClose} title={goal.name ? 'Edit goal' : 'New goal'}>
      <div className="space-y-3">
        <div>
          <p className="label mb-1.5">Start from a template</p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_TEMPLATES.map((t) => (
              <button key={t.key} onClick={() => applyTemplate(t.key)}
                className={`btn btn-sm ${draft.templateKey === t.key ? 'bg-brand text-white' : 'border border-ink-300 bg-white text-ink-700'}`}>
                {t.name}
              </button>
            ))}
          </div>
          {template && <p className="mt-2 text-[12px] leading-relaxed text-ink-600">{template.note}</p>}
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="gname">Goal name</label>
          <input id="gname" className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. MBA fund" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1 block" htmlFor="gtarget">Target amount</label>
            <input id="gtarget" type="number" className="field tnum" value={draft.target} onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="gsaved">Already saved</label>
            <input id="gsaved" type="number" className="field tnum" value={draft.saved} onChange={(e) => setDraft({ ...draft, saved: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="label mb-1 block" htmlFor="gdate">Target date</label>
          <input id="gdate" type="date" className="field" value={draft.targetDate} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn-primary disabled:opacity-40" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>
            <TargetIcon size={15} /> Save goal
          </button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
