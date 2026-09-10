import { useState } from 'react'
import { RotateCcw, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PeriodSelector } from './PeriodSelector'
import { AppliedFilterChips } from './AppliedFilterChips'
import { AdvancedFilterDrawer, type FilterGroup } from './AdvancedFilterDrawer'
import { activeFilterCount, useFilters } from '@/context/FilterContext'
import { periodLabel } from '@/services/reportService'
import { shortDate } from '@/utils/format'
import { chainTo, getEmployee, teamSize } from '@/data/orgData'

export function ReportFilters({
  statusGroup,
  rightSlot,
}: {
  statusGroup?: FilterGroup
  rightSlot?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { filters, reset, setScope, rootEmployeeId } = useFilters()
  const active = activeFilterCount(filters)

  const scoped = filters.scopeEmployeeId !== rootEmployeeId ? getEmployee(filters.scopeEmployeeId) : undefined
  const scopeChain = scoped ? chainTo(scoped.id).slice(-3, -1).map((e) => e.name) : []

  return (
    <div className="space-y-3 border-b border-line bg-white px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <PeriodSelector />

        <Button variant="outline" size="md" onClick={() => setOpen(true)} className="relative">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {active > 0 && (
            <span className="num ml-0.5 rounded-md bg-reef-600 px-1.5 text-[11px] font-semibold text-white">
              {active}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="md" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <p className="hidden text-[12px] text-navy-400 sm:block">
            {periodLabel(filters.period)}
            <span className="num ml-2 text-navy-500">
              {shortDate(filters.range.start)} – {shortDate(filters.range.end)}
            </span>
          </p>
          {rightSlot}
        </div>
      </div>

      {scoped && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-3 py-2">
          <UserRound className="h-4 w-4 shrink-0 text-navy-500" />
          <span className="text-[12.5px] text-navy-700">
            Showing <span className="font-semibold">{scoped.name}</span>
            <span className="text-navy-500">
              {' '}
              · {scoped.roleLabel}
              {teamSize(scoped.id) > 0 ? ` and ${teamSize(scoped.id)} people below them` : ' (own book)'}
              {scopeChain.length > 0 ? ` · under ${scopeChain.join(' → ')}` : ''}
            </span>
          </span>
          <button
            onClick={() => setScope(null)}
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-navy-500 transition-colors hover:text-navy-900"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Back to my full book
          </button>
        </div>
      )}

      <AppliedFilterChips />

      <AdvancedFilterDrawer open={open} onClose={() => setOpen(false)} statusGroup={statusGroup} />
    </div>
  )
}
