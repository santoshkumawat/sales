import type { ReactNode } from 'react'
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const CHART_COLORS = [
  '#118E85',
  '#28456C',
  '#66C6BC',
  '#5C7CA9',
  '#0A5C57',
  '#B6C5DD',
  '#B45309',
]

export const AXIS_STYLE = {
  fontSize: 11,
  fill: '#5C7CA9',
  fontFamily: '"IBM Plex Mono", monospace',
}

export function ChartTooltipBox({
  label,
  rows,
}: {
  label?: string
  rows: { name: string; value: string; color?: string }[]
}) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-pop">
      {label && <p className="mb-1 text-[12px] font-semibold text-navy-900">{label}</p>}
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2 text-[12px]">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}
            <span className="text-navy-500">{r.name}</span>
            <span className="num ml-auto font-medium text-navy-900">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChartCard({
  title,
  description,
  action,
  footer,
  height = 280,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  footer?: ReactNode
  height?: number
  children: ReactNode
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardBody className="pb-4">
        <div style={{ height }}>{children}</div>
        {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
      </CardBody>
    </Card>
  )
}
