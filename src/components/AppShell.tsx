import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { inr } from '../engine/analytics'
import { BandIcon } from './ui'
import { ChartIcon, HomeIcon, ListIcon, SettingsIcon, SparkIcon, TargetIcon, BookIcon } from './Icons'

/**
 * The persistent priority menu bar.
 *
 * This is the product's central navigation metaphor: the user always knows
 * which side of their money they are looking at. The active tab is signalled by
 * colour, an icon and a text label — never colour alone.
 */
function PriorityMenuBar() {
  const { months, allowance, obligations } = useStore()
  const current = months[months.length - 1]
  const unfunded = obligations.filter((o) => !o.funded).length
  const green = current?.green ?? 0

  const tab = (to: string, band: 'RED' | 'GREEN', title: string, sub: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex min-h-[44px] flex-1 items-center gap-2.5 border-b-[3px] px-3 py-2.5 transition-colors sm:px-4',
          isActive
            ? band === 'RED'
              ? 'border-red-band bg-red-surface text-red-band'
              : 'border-green-band bg-green-surface text-green-band'
            : 'border-transparent text-ink-600 hover:bg-ink-50',
        ].join(' ')
      }
    >
      <BandIcon band={band} size={17} />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">{title}</span>
        <span className="tnum block truncate text-[11px] leading-tight opacity-80">{sub}</span>
      </span>
    </NavLink>
  )

  return (
    <nav className="flex border-b border-ink-300/70 bg-white" aria-label="Priority">
      {tab('/red', 'RED', 'RED Priority', unfunded ? `${unfunded} essential${unfunded > 1 ? 's' : ''} unfunded` : 'All essentials funded')}
      {tab('/green', 'GREEN', 'GREEN Priority', `${inr(green)} of ${inr(allowance.value)} used`)}
    </nav>
  )
}

const NAV = [
  { to: '/app', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Money', Icon: ListIcon },
  { to: '/goals', label: 'Goals', Icon: TargetIcon },
  { to: '/insights', label: 'Insights', Icon: SparkIcon },
  { to: '/forecast', label: 'Forecast', Icon: ChartIcon },
  { to: '/settings', label: 'Account', Icon: SettingsIcon },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { persona, queue, gar } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-ink-25 pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-ink-300/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><BandIcon band="RED" size={17} /></span>
            <span>
              <span className="block text-sm font-bold leading-tight text-ink-900">SpendLens</span>
              <span className="block text-[11px] leading-tight text-ink-600">{persona.name} · {persona.city}</span>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <span className="label block">Goal-aligned this month</span>
              <span className="tnum block text-[15px] font-bold text-grow-band">{inr(gar.value)}</span>
            </div>
            <NavLink to="/case-study" className="btn-ghost btn-sm hidden sm:inline-flex" title="The product case study">
              <BookIcon size={14} /> Case study
            </NavLink>
          </div>
        </div>
        <PriorityMenuBar />
        <nav aria-label="Sections" className="hidden border-t border-ink-300/50 bg-white sm:block">
          <div className="mx-auto flex max-w-5xl gap-1 px-2">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex min-h-[42px] items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium ${
                    isActive ? 'border-brand text-brand' : 'border-transparent text-ink-600 hover:text-ink-900'
                  }`
                }>
                <Icon size={15} />{label}
                {to === '/transactions' && queue.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-amber-surface px-1.5 py-0.5 text-[10px] font-bold text-amber-band">{queue.length}</span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      {/* Mobile tab bar. 44pt targets, labels always visible. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-300/70 bg-white sm:hidden" aria-label="Sections">
        {NAV.map(({ to, label, Icon, end }) => {
          const active = end ? pathname === to : pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} end={end}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? 'text-brand' : 'text-ink-600'}`}>
              <Icon size={18} />{label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
