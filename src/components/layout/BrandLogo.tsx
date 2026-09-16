import { cn } from '@/utils/cn'

/**
 * Placeholder brand mark for the fictional "XYZ Life" identity used
 * throughout this prototype. Drawn inline — no external asset, no real brand.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="XYZ Life">
      <path
        d="M12 2L4.5 5V11C4.5 16.1 7.7 20 12 21.7C16.3 20 19.5 16.1 19.5 11V5L12 2Z"
        fill="#154479"
      />
      <path
        d="M8.3 11.8L10.8 14.3L15.7 9"
        fill="none"
        stroke="#3390EF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 shadow-sm', className)}>
      <BrandMark className="h-5 w-5 shrink-0" />
      <span className="text-[13px] font-semibold leading-none text-navy-900">XYZ Life</span>
    </span>
  )
}
