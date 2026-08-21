import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { PERSONAS } from '../data/personas'
import { TAXONOMY } from '../data/taxonomy'
import { inr } from '../engine/analytics'
import { parseCsv, SAMPLE_CSV } from '../engine/csv'
import { BandChip, Callout, Card, SectionTitle, Toggle } from '../components/ui'
import { UploadIcon } from '../components/Icons'
import type { PersonaKey } from '../types'

export default function Settings() {
  const { profile, actions, txns, imported, persona } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string[]>([])
  const [showTaxonomy, setShowTaxonomy] = useState(false)

  const handleFile = async (file: File) => {
    const text = await file.text()
    const result = parseCsv(text)
    if (result.txns.length) {
      actions.importTxns(result.txns)
      setImportMsg([
        `Imported ${result.txns.length} transactions. Columns detected: date "${result.detected.date}", description "${result.detected.narration}".`,
        ...result.errors,
        'They were classified by the same rule engine the demo data uses. Anything it was unsure about is waiting in Money › Needs a decision.',
      ])
    } else {
      setImportMsg(result.errors.length ? result.errors : ['Nothing could be read from that file.'])
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spendlens-sample-statement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(txns, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spendlens-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <SectionTitle hint="Everything here runs in your browser. There is no server, no account and no network call.">Account</SectionTitle>

      <Card>
        <SectionTitle hint="Each household exercises a different part of the product.">Switch household</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <button key={p.key} onClick={() => actions.switchPersona(p.key as PersonaKey)}
              className={`rounded-lg border p-3 text-left transition-colors ${profile.personaKey === p.key ? 'border-brand bg-brand-50' : 'border-ink-300 hover:bg-ink-50'}`}>
              <p className="text-[14px] font-semibold text-ink-900">{p.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">{p.label}</p>
              <p className="tnum mt-1 text-[12px] text-ink-600">{inr(p.monthlyIncome)}/month · {p.city}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-600">
          Currently showing {persona.name}{imported ? ', with your imported statement replacing the demo ledger' : ''}.
        </p>
      </Card>

      <Card>
        <SectionTitle hint="Bring a real bank statement. It never leaves this browser — the parser runs locally and there is nowhere for it to be sent.">
          Import your own statement
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" onClick={() => fileRef.current?.click()}><UploadIcon size={15} /> Choose a CSV</button>
          <button className="btn-ghost btn-sm" onClick={downloadSample}>Download a sample CSV</button>
          <button className="btn-ghost btn-sm" onClick={exportJson}>Export what is loaded</button>
          {imported && <button className="btn-ghost btn-sm" onClick={() => { actions.resetDemo(); setImportMsg(['Back to the demo ledger.']) }}>Back to demo data</button>}
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
        <p className="mt-3 text-[12px] leading-relaxed text-ink-600">
          Most Indian bank exports work as-is. The parser looks for a date column, a narration or description column, and either a single
          amount column or separate withdrawal and deposit columns.
        </p>
        {importMsg.length > 0 && (
          <div className="mt-3"><Callout tone="brand" title="Import result">{importMsg.map((m, i) => <p key={i} className="mb-1 last:mb-0">{m}</p>)}</Callout></div>
        )}
      </Card>

      <Card>
        <SectionTitle hint="In the specified product these are RBI Account Aggregator consent artefacts. Here they are shown to make the model concrete.">
          Consent
        </SectionTitle>
        <Toggle
          checked={profile.telemetryConsent}
          onChange={actions.setTelemetry}
          label="Shopping-behaviour telemetry"
          description="Separate from transaction access, off by default, and deleted within seven days of opting out. It powers browse-to-buy analysis and nothing else. Purpose limitation is enforced in the platform, not in policy: telemetry cannot be joined to transaction data without this specific consent."
        />
        <div className="mt-3 divide-y divide-ink-300/60 rounded-lg border border-ink-300/70 text-[13px]">
          {[
            ['Transaction access', 'Active · daily fetch before 07:00 IST · expires in 12 months'],
            ['Purpose', 'Priority classification and goal feasibility'],
            ['Revocation', 'Immediate. Derived data purged within 24 hours.'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
              <span className="font-medium text-ink-900">{k}</span><span className="text-ink-600">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle hint="Your household's promotions and demotions, plus every merchant correction you have made.">Your rules</SectionTitle>
        {Object.keys(profile.bandOverrides).length === 0 && Object.keys(profile.merchantOverrides).length === 0 ? (
          <p className="text-[13px] text-ink-600">No overrides yet. Correct a transaction, or promote a category from the GREEN tab, and it appears here.</p>
        ) : (
          <ul className="divide-y divide-ink-300/60">
            {Object.entries(profile.bandOverrides).map(([cat, band]) => (
              <li key={cat} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="text-ink-900">{cat}</span>
                <span className="flex items-center gap-2"><BandChip band={band} size="sm" />
                  <button className="text-ink-600 underline underline-offset-2" onClick={() => actions.setBandOverride(cat, null)}>Undo</button>
                </span>
              </li>
            ))}
            {Object.entries(profile.merchantOverrides).map(([m, v]) => (
              <li key={m} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="text-ink-900">{m}</span><span className="text-ink-600">→ {v.categoryL2}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle hint="The single source of truth for the classifier, the menu bar and every figure in this app.">
          The priority taxonomy
        </SectionTitle>
        <button className="btn-ghost btn-sm" onClick={() => setShowTaxonomy((v) => !v)}>
          {showTaxonomy ? 'Hide' : 'Show'} all {TAXONOMY.length} categories
        </button>
        {showTaxonomy && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-ink-300 text-ink-600">
                  <th className="py-2 pr-3 font-semibold">Band</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 font-semibold">Classification rule</th>
                  <th className="py-2 font-semibold">Product behaviour</th>
                </tr>
              </thead>
              <tbody>
                {TAXONOMY.map((l) => (
                  <tr key={l.l2} className="border-b border-ink-300/50 align-top">
                    <td className="py-2 pr-3"><BandChip band={l.band} size="sm" /></td>
                    <td className="py-2 pr-3 text-ink-900">{l.l1} › {l.l2}</td>
                    <td className="py-2 pr-3 text-ink-600">{l.rule}</td>
                    <td className="py-2 text-ink-600">{l.behaviour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle hint="Deletion means deletion — the whole local store, not a flag on a record.">Data</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={actions.resetDemo}>Reset this household</button>
          <button className="btn-ghost btn-sm" onClick={() => { actions.clearEverything(); navigate('/onboarding') }}>Delete everything and start over</button>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/case-study')}>Read the case study</button>
        </div>
      </Card>
    </div>
  )
}
