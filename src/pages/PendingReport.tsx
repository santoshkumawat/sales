import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowUpRight, FileText, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard'
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AXIS_STYLE, ChartCard, ChartTooltipBox } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { useReportData } from '@/hooks/useReportData'
import { getPendingReport } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { useNavigate } from 'react-router-dom'
import { PENDING_REASONS } from '@/data/mockInsuranceData'
import type { PendingRecord } from '@/types'
import { RfiDetailDrawer } from '@/components/pending/RfiDetailDrawer'
import { summariseRfis } from '@/services/reportService'
import { count, inr, inrCompact, shortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const AGE_BANDS: Record<string, [number, number]> = {
  '0–3': [0, 3],
  '4–7': [4, 7],
  '8–15': [8, 15],
  '16–30': [16, 30],
  '30+': [31, 99999],
}

const columns: Column<PendingRecord>[] = [
  {
    key: 'proposalNo',
    header: 'Proposal no',
    accessor: (r) => r.proposalNo,
    cell: (r) => <span className="num font-medium text-navy-900">{r.proposalNo}</span>,
  },
  { key: 'customer', header: 'Customer', accessor: (r) => r.customer, cell: (r) => <span className="font-medium text-navy-900">{r.customer}</span> },
  { key: 'product', header: 'Product', accessor: (r) => r.product },
  { key: 'channel', header: 'Channel', accessor: (r) => r.channel, optional: true },
  { key: 'branch', header: 'Branch', accessor: (r) => r.branch },
  { key: 'region', header: 'Region', accessor: (r) => r.region, optional: true },
  { key: 'manager', header: 'Manager', accessor: (r) => r.manager, optional: true },
  { key: 'advisor', header: 'Advisor', accessor: (r) => r.advisor },
  {
    key: 'annualPremium',
    header: 'Annual premium',
    accessor: (r) => r.annualPremium,
    cell: (r) => <span className="num font-medium text-navy-900">{inr(r.annualPremium)}</span>,
    align: 'right',
  },
  {
    key: 'sumAssured',
    header: 'Sum assured',
    accessor: (r) => r.sumAssured,
    cell: (r) => <span className="num text-navy-600">{inr(r.sumAssured)}</span>,
    align: 'right',
    optional: true,
  },
  {
    key: 'submissionDate',
    header: 'Submitted',
    accessor: (r) => r.submissionDate,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.submissionDate)}</span>,
    optional: true,
  },
  {
    key: 'pendingSince',
    header: 'Pending since',
    accessor: (r) => r.pendingSince,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.pendingSince)}</span>,
  },
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
    key: 'openRfis',
    header: 'Open RFIs',
    accessor: (r) => r.openRfis,
    cell: (r) => {
      const overdue = r.rfis.some((x) => x.overdue)
      return (
        <span
          className={cn(
            'num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium ring-1 ring-inset',
            r.openRfis === 0
              ? 'bg-navy-50 text-navy-400 ring-navy-100'
              : overdue
                ? 'bg-red-50 text-red-700 ring-red-100'
                : 'bg-amber-50 text-amber-700 ring-amber-100',
          )}
        >
          {r.openRfis}
          {overdue && <AlertTriangle className="h-3 w-3" />}
        </span>
      )
    },
    align: 'right',
  },
  {
    key: 'oldestRfiDays',
    header: 'Oldest RFI',
    accessor: (r) => r.oldestRfiDays,
    cell: (r) => <span className="num text-navy-600">{r.oldestRfiDays ? `${r.oldestRfiDays} d` : '—'}</span>,
    align: 'right',
    optional: true,
  },
  { key: 'reason', header: 'Reason', accessor: (r) => r.reason },
  { key: 'subReason', header: 'Detail', accessor: (r) => r.subReason },
  { key: 'currentStage', header: 'Stage', accessor: (r) => r.currentStage, optional: true },
  { key: 'priority', header: 'Priority', accessor: (r) => r.priority, cell: (r) => <StatusBadge value={r.priority} /> },
  {
    key: 'lastFollowUp',
    header: 'Last follow-up',
    accessor: (r) => r.lastFollowUp,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.lastFollowUp)}</span>,
    optional: true,
  },
]

export default function PendingReport() {
  const { data, loading } = useReportData(getPendingReport)
  const { reset } = useFilters()
  const navigate = useNavigate()
  const [reason, setReason] = useState<string | null>(null)
  const [band, setBand] = useState<string | null>(null)
  const [openCase, setOpenCase] = useState<PendingRecord | null>(null)
  const [rfiOnly, setRfiOnly] = useState<'all' | 'open' | 'overdue'>('all')

  const rows = (data?.rows ?? []).filter((r) => {
    if (reason && r.reason !== reason) return false
    if (band) {
      const [min, max] = AGE_BANDS[band]
      if (r.ageDays < min || r.ageDays > max) return false
    }
    if (rfiOnly === 'open' && r.openRfis === 0) return false
    if (rfiOnly === 'overdue' && !r.rfis.some((x) => x.overdue)) return false
    return true
  })

  const rfi = summariseRfis(data?.rows ?? [])

  const drillActive = reason || band || rfiOnly !== 'all'

  return (
    <>
      <PageHeader
        title="Pending report"
        description="Cases sitting in the pipeline, aged from the day they went pending. Click a bar or a reason to drill in."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Reports' }, { label: 'Pending' }]}
      />
      <ReportFilters statusGroup={{ key: 'statuses', title: 'Pending reason', options: PENDING_REASONS }} />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {loading || !data
            ? Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => <MetricCard key={k.key} kpi={k} invertChange />)}
        </section>

        {loading || !data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartSkeleton height={240} />
            <ChartSkeleton height={240} />
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Ageing profile"
              description="Cases by days pending. Click a band to filter the table below."
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
                            { name: 'Cases', value: count(Number(payload[0].value)) },
                            { name: 'Premium', value: inrCompact(Number(payload[0].payload.premium)) },
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
                    onClick={(entry: { name?: string }) =>
                      setBand((b) => (b === entry?.name ? null : (entry?.name ?? null)))
                    }
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
              title="Why cases are stuck"
              description="Click a reason to see only those cases."
              bodyClassName="px-0 pb-2"
            >
              <ul className="divide-y divide-line">
                {data.byReason.map((r) => {
                  const max = Math.max(...data.byReason.map((x) => x.value), 1)
                  const selected = reason === r.name
                  return (
                    <li key={r.name}>
                      <button
                        onClick={() => setReason(selected ? null : r.name)}
                        className={cn(
                          'w-full px-5 py-2 text-left transition-colors hover:bg-reef-50/50',
                          selected && 'bg-reef-50',
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={cn('text-[13px] font-medium', selected ? 'text-reef-700' : 'text-navy-800')}>
                            {r.name}
                          </span>
                          <span className="num text-[12px] text-navy-500">
                            {count(r.value)} · {inrCompact(r.premium)}
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
                {data.byReason.length === 0 && (
                  <li className="py-10 text-center text-[13px] text-navy-400">No pending cases in this period.</li>
                )}
              </ul>
            </AnalyticsCard>
          </section>
        )}

        {!loading && data && (
          <div className="surface overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
              <div>
                <p className="text-[15px] font-semibold text-navy-900">Requirements for information</p>
                <p className="text-[13px] text-navy-400">
                  Open requirements across the cases in view. Filter here, or open the full RFI report.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/rfi')}>
                Open RFI report
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-5">
              {[
                { label: 'Open RFIs', value: count(rfi.open), filter: 'open' as const },
                { label: 'Past due', value: count(rfi.overdue), filter: 'overdue' as const, alert: rfi.overdue > 0 },
                { label: 'Awaiting our review', value: count(rfi.respondedAwaitingReview) },
                { label: 'Closed or waived', value: count(rfi.closedOrWaived) },
                { label: 'Average open age', value: `${rfi.averageOpenAgeDays.toFixed(1)} days` },
              ].map((cell) => (
                <button
                  key={cell.label}
                  onClick={() => cell.filter && setRfiOnly((v) => (v === cell.filter ? 'all' : cell.filter!))}
                  disabled={!cell.filter}
                  className={cn(
                    'bg-white px-5 py-3.5 text-left transition-colors',
                    cell.filter && 'hover:bg-reef-50/60',
                    cell.filter && rfiOnly === cell.filter && 'bg-reef-50',
                  )}
                >
                  <p className="text-[11px] text-navy-400">{cell.label}</p>
                  <p className={cn('num mt-1 text-[20px] font-semibold leading-none', cell.alert ? 'text-neg' : 'text-navy-900')}>
                    {cell.value}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {drillActive && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-reef-200 bg-reef-50 px-3 py-2">
            <span className="text-[12px] font-medium text-reef-800">
              Drilled into{' '}
              {[reason ? `${reason} pending` : null, band ? `${band} days` : null,
                rfiOnly === 'open' ? 'cases with open RFIs' : rfiOnly === 'overdue' ? 'cases with overdue RFIs' : null]
                .filter(Boolean)
                .join(' · ')}{' '}
              — {count(rows.length)} cases
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-reef-700 hover:bg-reef-100"
              onClick={() => {
                setReason(null)
                setBand(null)
                setRfiOnly('all')
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
            rowKey={(r) => r.id}
            exportName="pending-report"
            initialSort={{ key: 'ageDays', dir: 'desc' }}
            emptyAction={{ label: 'Reset filters', onClick: reset }}
            onRowClick={setOpenCase}
            toolbar={
              <span className="hidden items-center gap-1.5 text-[12px] text-navy-400 xl:flex">
                <FileText className="h-3.5 w-3.5" />
                Open a row for its requirement history
              </span>
            }
          />
        )}
      </div>

      <RfiDetailDrawer record={openCase} onClose={() => setOpenCase(null)} />
    </>
  )
}
