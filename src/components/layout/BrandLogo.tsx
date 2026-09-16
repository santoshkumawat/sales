import { cn } from '@/utils/cn'

/** Served from public/ — see vite's static asset handling. */
const logoUrl = '/xyz-life-insurance-logo.svg'

/**
 * Canara HSBC Life Insurance brand assets.
 *
 * The full logo appears in exactly one place — the sidebar header. Its wordmark
 * is dark, so it sits on a small white plate to stay legible on the navy rail.
 * `BrandMark` is just the left swoosh symbol, used when the sidebar is collapsed.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 31 25" className={className} role="img" aria-label="XYZ Life">
      <path
        d="M13.1497 23.9364L16.6917 19.2251L14.029 18.8567L12.5312 20.6754C12.2053 21.0714 11.6617 20.8335 11.3784 20.6303L3.70406 15.1152C3.41364 14.9066 3.65879 14.5404 3.95998 14.4903L11.6496 13.2152L12.5683 11.6384L0.562257 13.6297C0.114964 13.7028 -0.225213 14.2176 0.183087 14.5549L11.4434 23.8687C11.8414 24.1979 12.6943 24.5442 13.1497 23.9364Z"
        fill="#FFC20E"
      />
      <path
        d="M20.6388 0.55916L29.8787 17.5202C30.8212 19.2491 29.8742 21.0498 28.2585 20.8259L17.5477 19.3439L18.6099 17.5179L26.3393 18.5239C27.1429 18.635 27.0587 18.0787 26.7198 17.4551L20.2014 3.7637C20.0638 3.51175 19.5986 3.38035 19.4408 3.65263L12.2249 16.0364C12.0112 16.4035 11.9516 16.6478 12.4159 16.7119L15.468 17.1093L14.0285 18.8567L10.1534 18.3203C9.43094 18.2201 9.11496 17.5649 9.54299 16.8302L18.838 0.877041C19.2561 0.160003 20.0548 -0.511881 20.6388 0.55916Z"
        fill="#00ADEF"
      />
      <path
        d="M18.0319 17.4429L18.7813 16.4455L22.0867 12.0493C22.8222 11.0718 22.668 9.96415 21.669 10.129L15.8389 11.0962L15.0958 12.644L18.2224 12.1252C18.8965 12.0137 19.03 12.7849 18.5043 13.4234L16.3857 15.9953L15.4678 17.1092L12.9329 20.1874L15.0183 21.4503L18.0319 17.4429Z"
        fill="#FFC20E"
      />
    </svg>
  )
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex rounded-lg bg-white px-2.5 py-1.5 shadow-sm', className)}>
      <img src={logoUrl} alt="XYZ Life" className="h-7 w-auto" />
    </span>
  )
}
