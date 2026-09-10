import { CalendarDays } from 'lucide-react'
import type { PeriodKey } from '@/types'
import { useFilters } from '@/context/FilterContext'
import { cn } from '@/utils/cn'
import { Tooltip } from '@/components/ui/tooltip'

const PERIODS: { key: PeriodKey; label: string; hint: string }[] = [
  { key: 'FTD', label: 'FTD', hint: 'For the day — today only' },
  { key: 'MTD', label: 'MTD', hint: 'Month to date' },
  { key: 'YTD', label: 'YTD', hint: 'Financial year to date (from 1 April)' },
  { key: 'ITD', label: 'ITD', hint: 'Inception to date' },
]

export function PeriodSelector() {
  const { filters, setPeriod } = useFilters()
  const custom = filters.period === 'CUSTOM'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
        {PERIODS.map((p) => (
          <Tooltip key={p.key} content={p.hint}>
            <button
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                filters.period === p.key ? 'bg-navy-800 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800',
              )}
            >
              {p.label}
            </button>
          </Tooltip>
        ))}
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1',
          custom ? 'border-reef-400' : 'border-line',
        )}
      >
        <CalendarDays className="h-4 w-4 text-navy-300" />
        <input
          type="date"
          value={filters.range.start}
          max={filters.range.end}
          onChange={(e) => setPeriod('CUSTOM', { ...filters.range, start: e.target.value })}
          className="num w-[118px] bg-transparent text-[12px] text-navy-700 focus:outline-none"
          aria-label="Start date"
        />
        <span className="text-navy-200">–</span>
        <input
          type="date"
          value={filters.range.end}
          min={filters.range.start}
          onChange={(e) => setPeriod('CUSTOM', { ...filters.range, end: e.target.value })}
          className="num w-[118px] bg-transparent text-[12px] text-navy-700 focus:outline-none"
          aria-label="End date"
        />
      </div>
    </div>
  )
}
