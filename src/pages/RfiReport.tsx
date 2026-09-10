import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard'
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AXIS_STYLE, ChartCard, ChartTooltipBox } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { RfiDetailDrawer } from '@/components/pending/RfiDetailDrawer'
import { useReportData } from '@/hooks/useReportData'
import { getRfiReport } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { PENDING_REASONS } from '@/data/mockInsuranceData'
import type { PendingRecord, RfiRow, RfiStatus } from '@/types'
import { count, inr, inrCompact, pct, shortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const RFI_TONE: Record<RfiStatus, 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'accent'> = {
  Open: 'warn',
  Responded: 'info',
  'Under Review': 'accent',
  Waived: 'neutral',
  Closed: 'good',
}

const AGE_BANDS: Record<string, [number, number]> = {
  '0–3': [0, 3],
  '4–7': [4, 7],
  '8–15': [8, 15],
  '16–30': [16, 30],
  '30+': [31, 99999],
}

const columns: Column<RfiRow>[] = [
  {
    key: 'id',
    header: 'RFI no',
    accessor: (r) => r.id,
    cell: (r) => <span className="num font-medium text-navy-900">{r.id}</span>,
    width: '120px',
  },
  {
    key: 'requirement',
    header: 'Requirement',
    accessor: (r) => r.requirement,
    cell: (r) => (
      <span className="flex items-center gap-1.5 font-medium text-navy-900">
        {r.requirement}
        {r.overdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neg" />}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    cell: (r) => <StatusBadge value={r.status} tone={RFI_TONE[r.status]} />,
  },
  { key: 'responsibility', header: 'Sits with', accessor: (r) => r.responsibility },
  {
    key: 'ageDays',
    header: 'Age',
    accessor: (r) => r.ageDays,
    cell: (r) => (
      <span className={cn('num font-medium', r.ageDays > 30 ? 'text-neg' : r.ageDays > 15 ? 'text-warn' : 'text-navy-700')}>
        {r.ageDays} d
      </span>
    ),
    align: 'right',
  },
  {
    key: 'dueBy',
    header: 'Due by',
    accessor: (r) => r.dueBy,
    cell: (r) => (
      <span className={cn('num', r.overdue ? 'font-medium text-neg' : 'text-navy-600')}>{shortDate(r.dueBy)}</span>
    ),
  },
  {
    key: 'raisedOn',
    header: 'Raised on',
    accessor: (r) => r.raisedOn,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.raisedOn)}</span>,
    optional: true,
  },
  {
    key: 'proposalNo',
    header: 'Proposal no',
    accessor: (r) => r.proposalNo,
    cell: (r) => <span className="num text-navy-600">{r.proposalNo}</span>,
  },
  { key: 'customer', header: 'Customer', accessor: (r) => r.customer },
  { key: 'product', header: 'Product', accessor: (r) => r.product, optional: true },
  { key: 'channel', header: 'Channel', accessor: (r) => r.channel, optional: true },
  { key: 'branch', header: 'Branch', accessor: (r) => r.branch },
  { key: 'region', header: 'Region', accessor: (r) => r.region, optional: true },
  { key: 'advisor', header: 'Advisor', accessor: (r) => r.advisor },
  { key: 'manager', header: 'Manager', accessor: (r) => r.manager, optional: true },
  {
    key: 'annualPremium',
    header: 'Premium held',
    accessor: (r) => r.annualPremium,
    cell: (r) => <span className="num font-medium text-navy-900">{inr(r.annualPremium)}</span>,
    align: 'right',
  },
  { key: 'caseReason', header: 'Case reason', accessor: (r) => r.caseReason, optional: true },
  {
    key: 'followUps',
    header: 'Follow-ups',
    accessor: (r) => r.followUps.length,
    cell: (r) => <span className="num text-navy-600">{r.followUps.length}</span>,
    align: 'right',
    optional: true,
  },
]

export default function RfiReport() {
  const { data, loading } = useReportData(getRfiReport)
  const { reset } = useFilters()
  const [scope, setScope] = useState<'open' | 'overdue' | 'all'>('open')
  const [owner, setOwner] = useState<string | null>(null)
  const [band, setBand] = useState<string | null>(null)
  const [openCase, setOpenCase] = useState<PendingRecord | null>(null)

  const rows = (data?.rows ?? []).filter((r) => {
    const settled = r.status === 'Closed' || r.status === 'Waived'
    if (scope === 'open' && settled) return false
    if (scope === 'overdue' && !r.overdue) return false
    if (owner && r.responsibility !== owner) return false
    if (band) {
      const [min, max] = AGE_BANDS[band]
      if (r.ageDays < min || r.ageDays > max) return false
    }
    return true
  })

  const drilled = owner || band

  return (
    <>
      <PageHeader
        title="RFI report"
        description="Every requirement raised against a pending case, one row per requirement. Open a row for the case and its full follow-up history."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Reports' }, { label: 'RFI' }]}
        actions={
          <div className="inline-flex rounded-lg border border-line bg-white p-0.5">
            {(
              [
                { key: 'open', label: 'Open' },
                { key: 'overdue', label: 'Past due' },
                { key: 'all', label: 'All' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setScope(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  scope === t.key ? 'bg-navy-800 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <ReportFilters statusGroup={{ key: 'statuses', title: 'Case reason', options: PENDING_REASONS }} />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {loading || !data
            ? Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => <MetricCard key={k.key} kpi={k} invertChange={k.key !== 'rfiReview'} />)}
        </section>

        {loading || !data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartSkeleton height={240} />
            <ChartSkeleton height={240} />
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="How long requirements have been open"
              description="Days since the requirement was raised. Click a band to filter the table."
              height={240}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ageBands} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#EAF2FB" vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#DCE7F3' }} />
                  <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                  <RTooltip
                    cursor={{ fill: '#EFF5FC' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <ChartTooltipBox
                          label={`${label} days`}
                          rows={[
                            { name: 'Requirements', value: count(Number(payload[0].value)) },
                            { name: 'Premium held', value: inrCompact(Number(payload[0].payload.premium)) },
                          ]}
                        />
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={64}
                    cursor="pointer"
                    onClick={(entry: { name?: string }) => setBand((b) => (b === entry?.name ? null : (entry?.name ?? null)))}
                  >
                    {data.ageBands.map((b, i) => (
                      <Cell
                        key={b.name}
                        fill={band && band !== b.name ? '#D2E4F6' : i >= 3 ? '#B45309' : i === 2 ? '#3390EF' : '#1476E0'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <AnalyticsCard
              title="Who the requirement sits with"
              description="Click to filter. Anything with the customer or the advisor is chaseable from the branch."
              bodyClassName="px-0 pb-2"
            >
              <ul className="divide-y divide-line">
                {data.byResponsibility.map((r) => {
                  const max = Math.max(...data.byResponsibility.map((x) => x.value), 1)
                  const selected = owner === r.name
                  return (
                    <li key={r.name}>
                      <button
                        onClick={() => setOwner(selected ? null : r.name)}
                        className={cn('w-full px-5 py-2 text-left transition-colors hover:bg-reef-50/50', selected && 'bg-reef-50')}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={cn('text-[13px] font-medium', selected ? 'text-reef-700' : 'text-navy-800')}>
                            {r.name}
                          </span>
                          <span className="num text-[12px] text-navy-500">
                            {count(r.value)} · {pct(data.summary.open ? (r.value / data.summary.open) * 100 : 0, 0)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-50">
                          <div
                            className={cn('h-full rounded-full transition-[width] duration-500', selected ? 'bg-reef-600' : 'bg-navy-300')}
                            style={{ width: `${(r.value / max) * 100}%` }}
                          />
                        </div>
                      </button>
                    </li>
                  )
                })}
                {data.byResponsibility.length === 0 && (
                  <li className="py-10 text-center text-[13px] text-navy-400">No open requirements in this view.</li>
                )}
              </ul>
            </AnalyticsCard>
          </section>
        )}

        {!loading && data && data.byRequirement.length > 0 && (
          <AnalyticsCard
            title="Most requested requirements"
            description="What underwriting asks for most often — the shortlist worth fixing at submission instead of chasing later."
            bodyClassName="pb-5"
          >
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {data.byRequirement.slice(0, 8).map((d) => {
                const max = Math.max(...data.byRequirement.map((x) => x.value), 1)
                return (
                  <li key={d.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[12.5px] text-navy-700">{d.name}</span>
                      <span className="num text-[12px] text-navy-500">{count(d.value)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-50">
                      <div className="h-full rounded-full bg-reef-500" style={{ width: `${(d.value / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </AnalyticsCard>
        )}

        {drilled && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-reef-200 bg-reef-50 px-3 py-2">
            <span className="text-[12px] font-medium text-reef-800">
              Drilled into {[owner, band ? `${band} days` : null].filter(Boolean).join(' · ')} — {count(rows.length)} requirements
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-reef-700 hover:bg-reef-100"
              onClick={() => {
                setOwner(null)
                setBand(null)
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear drill-down
            </Button>
          </div>
        )}

        {loading || !data ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.rowId}
            exportName="rfi-report"
            initialSort={{ key: 'ageDays', dir: 'desc' }}
            emptyAction={{ label: 'Reset filters', onClick: reset }}
            onRowClick={(r) => setOpenCase(r.case)}
          />
        )}
      </div>

      <RfiDetailDrawer record={openCase} onClose={() => setOpenCase(null)} />
    </>
  )
}
