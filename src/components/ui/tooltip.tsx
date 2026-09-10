import { useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Lightweight hover/focus tooltip — no portal, positioned against the trigger. */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-[240px] rounded-lg bg-navy-900 px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-pop animate-fade-in',
            side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
            side === 'bottom' && 'top-full left-1/2 mt-2 -translate-x-1/2',
            side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2',
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
