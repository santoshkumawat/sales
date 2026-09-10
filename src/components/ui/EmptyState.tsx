import type { LucideIcon } from 'lucide-react'
import { SearchX } from 'lucide-react'
import { Button } from './button'

export function EmptyState({
  icon: Icon = SearchX,
  title = 'No records match these filters',
  message = 'Widen the period or clear a filter to bring records back.',
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-navy-800">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-navy-400">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
