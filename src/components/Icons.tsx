/**
 * Inline icons.
 *
 * Every priority band ships an icon as well as a colour. This is not
 * decoration: concept testing found the colours alone were read as
 * "you have overspent", and roughly one man in twelve cannot separate the
 * red and green tokens by hue at all.
 */
type P = { className?: string; size?: number }
const base = (size = 16) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const })

export const ShieldIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6l7-3z" /></svg>
)
export const LeafIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M4 20c0-8 5-13 16-14 0 10-5 15-13 15H4z" /><path d="M9 15c2-3 4-4.5 7-6" /></svg>
)
export const HelpIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 115 .9c-.4 1.2-2.2 1.5-2.4 3" /><circle cx="12" cy="17" r=".8" fill="currentColor" /></svg>
)
export const SproutIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M12 21v-8" /><path d="M12 13c0-3.3-2.5-5-5.5-5 0 3 2 5 5.5 5z" /><path d="M12 13c0-3.9 2.9-6 6-6 0 3.5-2.4 6-6 6z" /></svg>
)
export const ArrowRight = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const CheckIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg>
)
export const AlertIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M12 4l9 16H3l9-16z" /><path d="M12 10v4" /><circle cx="12" cy="17" r=".8" fill="currentColor" /></svg>
)
export const ClockIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const UploadIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" /></svg>
)
export const SparkIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
)
export const LockIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
)
export const ChartIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M4 20V6M4 20h16" /><path d="M8 20v-6M12 20V9M16 20v-4M20 20v-9" /></svg>
)
export const ListIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
)
export const TargetIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".9" fill="currentColor" /></svg>
)
export const SettingsIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2L5.6 5.6" /></svg>
)
export const HomeIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></svg>
)
export const BookIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className} aria-hidden="true"><path d="M5 4h9a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" /><path d="M8 20a3 3 0 01-3-3" /></svg>
)
export const GithubIcon = ({ className, size }: P) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.570 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0022 12.25C22 6.58 17.52 2 12 2z" /></svg>
)
