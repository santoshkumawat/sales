import { cn } from '@/utils/cn'

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'accent'

const TONE_MAP: Record<string, Tone> = {
  // submission
  Submitted: 'info',
  'Under Review': 'accent',
  Pending: 'warn',
  Issued: 'good',
  Declined: 'bad',
  Withdrawn: 'neutral',
  // policy
  'In Force': 'good',
  'Free Look': 'info',
  Lapsed: 'warn',
  Surrendered: 'bad',
  // wpi
  New: 'info',
  'In Progress': 'accent',
  'Action Required': 'bad',
  Resolved: 'good',
  // priority
  Critical: 'bad',
  High: 'warn',
  Normal: 'neutral',
}

const STYLES: Record<Tone, string> = {
  neutral: 'bg-navy-50 text-navy-600 ring-navy-100',
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warn: 'bg-amber-50 text-amber-700 ring-amber-100',
  bad: 'bg-red-50 text-red-700 ring-red-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  accent: 'bg-reef-50 text-reef-700 ring-reef-100',
}

export function StatusBadge({ value, tone }: { value: string; tone?: Tone }) {
  const resolved = tone ?? TONE_MAP[value] ?? 'neutral'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset whitespace-nowrap',
        STYLES[resolved],
      )}
    >
      {value}
    </span>
  )
}
