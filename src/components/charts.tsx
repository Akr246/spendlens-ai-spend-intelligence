import type { ForecastPoint } from '../types'
import type { MonthSummary } from '../engine/analytics'
import { inr } from '../engine/analytics'
import { BAND_HEX } from './ui'

/**
 * Hand-rolled SVG charts.
 *
 * No charting dependency: it keeps the bundle small, the build reproducible,
 * and — more usefully — it makes the two rules that matter enforceable. A
 * forecast is drawn as a confidence band rather than a single confident line,
 * and no series is distinguishable by hue alone.
 */

const fmtShort = (n: number) => {
  const a = Math.abs(n)
  if (a >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (a >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (a >= 1000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

export function ForecastChart({ points, shortfalls }: { points: ForecastPoint[]; shortfalls: string[] }) {
  const W = 720, H = 260, PAD = { t: 16, r: 16, b: 30, l: 52 }
  if (points.length < 2) return null
  const lows = points.map((p) => p.low)
  const highs = points.map((p) => p.high)
  const min = Math.min(...lows, 0)
  const max = Math.max(...highs)
  const span = max - min || 1
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b)

  const bandPath =
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.high).toFixed(1)}`).join(' ') +
    ' ' +
    [...points].reverse().map((p, i) => `L${x(points.length - 1 - i).toFixed(1)},${y(p.low).toFixed(1)}`).join(' ') +
    ' Z'
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
  const zeroY = y(0)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * span)

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`Projected balance over the next 90 days, shown as a confidence band. ${shortfalls.length ? `${shortfalls.length} dates where an essential would not clear.` : 'No dates where an essential would fail to clear.'}`}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#EAECF0" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#98A2B3">{fmtShort(t)}</text>
          </g>
        ))}
        {min < 0 && <line x1={PAD.l} x2={W - PAD.r} y1={zeroY} y2={zeroY} stroke="#B42318" strokeWidth="1.2" strokeDasharray="4 3" />}
        <path d={bandPath} fill={BAND_HEX.GROW} fillOpacity="0.2" />
        <path d={line} fill="none" stroke={BAND_HEX.GROW} strokeWidth="2.2" strokeLinejoin="round" />
        {points.map((p, i) =>
          p.obligation ? (
            <g key={p.date}>
              <line x1={x(i)} x2={x(i)} y1={PAD.t} y2={H - PAD.b} stroke={p.shortfall ? '#B42318' : '#D0D5DD'} strokeWidth="1" strokeDasharray={p.shortfall ? undefined : '3 3'} />
              <circle cx={x(i)} cy={y(p.balance)} r={p.shortfall ? 4.5 : 3} fill={p.shortfall ? '#B42318' : '#667085'} />
            </g>
          ) : null,
        )}
        {[0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#98A2B3">
            {new Date(points[i].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-600">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded" style={{ background: BAND_HEX.GROW }} />Projected balance</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: BAND_HEX.GROW, opacity: 0.2 }} />Confidence band</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-0.5" style={{ background: '#B42318' }} />Essential at risk</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-0.5 bg-ink-300" />Essential due</span>
      </figcaption>
    </figure>
  )
}

export function BandBars({ months, height = 150 }: { months: MonthSummary[]; height?: number }) {
  const data = months.slice(-6)
  if (!data.length) return null
  const max = Math.max(...data.map((m) => m.red + m.green + m.grow + m.amber), 1)
  // Explicit pixel heights rather than percentages: a percentage height inside
  // a flex child with an auto basis resolves to zero in every browser, which is
  // a silent way to ship an empty chart.
  const px = (v: number) => Math.max(Math.round((v / max) * height), v > 0 ? 2 : 0)
  return (
    <figure>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((m) => {
          const total = m.red + m.green + m.grow + m.amber
          return (
            <div key={m.key} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-md" title={`${m.label}: ${inr(total)}`}>
                <div style={{ height: px(m.grow), background: BAND_HEX.GROW }} />
                <div style={{ height: px(m.amber), background: BAND_HEX.AMBER }} />
                <div style={{ height: px(m.green), background: BAND_HEX.GREEN }} />
                <div style={{ height: px(m.red), background: BAND_HEX.RED }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-3">
        {data.map((m) => (
          <span key={m.key} className="flex-1 text-center text-[10px] leading-none text-ink-600">{m.label.split(' ')[0]}</span>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-600">
        {([['RED', 'Essential'], ['GREEN', 'Flexible'], ['AMBER', 'Undecided'], ['GROW', 'Grow']] as const).map(([b, l]) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: BAND_HEX[b] }} />{l}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export function SplitBar({ red, green, amber, grow }: { red: number; green: number; amber: number; grow: number }) {
  const total = red + green + amber + grow || 1
  const seg = [
    { v: red, c: BAND_HEX.RED, l: 'Essential' },
    { v: green, c: BAND_HEX.GREEN, l: 'Flexible' },
    { v: amber, c: BAND_HEX.AMBER, l: 'Undecided' },
    { v: grow, c: BAND_HEX.GROW, l: 'Grow' },
  ]
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100" role="img" aria-label={seg.map((s) => `${s.l} ${Math.round((s.v / total) * 100)}%`).join(', ')}>
      {seg.map((s) => (s.v > 0 ? <div key={s.l} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} title={`${s.l}: ${inr(s.v)}`} /> : null))}
    </div>
  )
}

export function CategoryBars({ rows }: { rows: { label: string; value: number; median?: number; band: keyof typeof BAND_HEX }[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.median ?? 0)), 1)
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink-700">{r.label}</span>
            <span className="tnum shrink-0 font-semibold text-ink-900">{inr(r.value)}</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-ink-100">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: BAND_HEX[r.band] }} />
            {r.median != null && r.median > 0 && (
              <span
                className="absolute top-[-3px] h-[16px] w-[2px] rounded bg-ink-600"
                style={{ left: `calc(${(r.median / max) * 100}% - 1px)` }}
                title={`Your usual month: ${inr(r.median)}`}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
