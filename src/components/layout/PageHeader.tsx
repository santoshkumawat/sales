import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string
  description?: string
  crumbs: { label: string; to?: string }[]
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-white px-4 py-4 md:flex-row md:items-end md:justify-between md:px-6">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-navy-400">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-navy-200" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-navy-700">
                  {c.label}
                </Link>
              ) : (
                <span className="text-navy-500">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-navy-900 md:text-[22px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-navy-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
