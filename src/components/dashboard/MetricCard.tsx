import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { KpiValue } from '@/types'
import { cn } from '@/utils/cn'
import { signedPct } from '@/utils/format'
import { Tooltip } from '@/components/ui/tooltip'

export function MetricCard({
  kpi,
  invertChange = false,
  onClick,
  active,
}: {
  kpi: KpiValue
  /** For metrics where a rise is bad — pending, WPI, average age. */
  invertChange?: boolean
  onClick?: () => void
  active?: boolean
}) {
  const up = kpi.changePct > 0.05
  const down = kpi.changePct < -0.05
  const good = invertChange ? down : up
  const bad = invertChange ? up : down
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus
  const strokeColor = good ? '#0F7B54' : bad ? '#C0392B' : '#5C7CA9'

  const sparkData = kpi.spark.map((v, i) => ({ i, v }))

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cn(
        'surface flex flex-col p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-navy-200',
        active && 'border-reef-400 ring-1 ring-reef-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-navy-500">{kpi.label}</p>
        {kpi.hint && (
          <Tooltip content={kpi.hint}>
            <Info className="h-3.5 w-3.5 text-navy-200 hover:text-navy-400" />
          </Tooltip>
        )}
      </div>

      <p className="num mt-2 text-[26px] font-semibold leading-none text-navy-900">{kpi.display}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[12px] font-semibold',
              good && 'text-pos',
              bad && 'text-neg',
              !good && !bad && 'text-navy-400',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {signedPct(kpi.changePct)}
          </span>
          <p className="mt-0.5 truncate text-[11px] text-navy-400">
            vs <span className="num">{kpi.previousDisplay}</span> last period
          </p>
        </div>

        {sparkData.length > 1 && (
          <div className="h-9 w-[84px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${kpi.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={strokeColor}
                  strokeWidth={1.75}
                  fill={`url(#spark-${kpi.key})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
