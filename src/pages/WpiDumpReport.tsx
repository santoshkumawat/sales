import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AXIS_STYLE, CHART_COLORS, ChartCard, ChartTooltipBox } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { useReportData } from '@/hooks/useReportData'
import { getWpiReport } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { WPI_STATUSES } from '@/data/mockInsuranceData'
import type { WpiRecord } from '@/types'
import { count, inr, inrCompact, shortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const columns: Column<WpiRecord>[] = [
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
    key: 'wpiDate',
    header: 'WPI date',
    accessor: (r) => r.wpiDate,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.wpiDate)}</span>,
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
  { key: 'reason', header: 'WPI reason', accessor: (r) => r.reason },
  { key: 'status', header: 'Status', accessor: (r) => r.status, cell: (r) => <StatusBadge value={r.status} /> },
  { key: 'owner', header: 'Owner', accessor: (r) => r.owner, optional: true },
  { key: 'nextAction', header: 'Next action', accessor: (r) => r.nextAction },
  {
    key: 'lastUpdated',
    header: 'Last updated',
    accessor: (r) => r.lastUpdated,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.lastUpdated)}</span>,
    optional: true,
  },
]

export default function WpiDumpReport() {
  const { data, loading } = useReportData(getWpiReport)
  const { reset } = useFilters()
  const [drill, setDrill] = useState<{ kind: 'reason' | 'status'; value: string } | null>(null)

  const rows = (data?.rows ?? []).filter((r) =>
    !drill ? true : drill.kind === 'reason' ? r.reason === drill.value : r.status === drill.value,
  )

  const statusTotal = (data?.byStatus ?? []).reduce((s, d) => s + d.value, 0)

  return (
    <>
      <PageHeader
        title="WPI dump"
        description="Work pending with insurer — cases waiting on a requirement before they can be issued."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Reports' }, { label: 'WPI Dump' }]}
      />
      <ReportFilters statusGroup={{ key: 'statuses', title: 'WPI status', options: WPI_STATUSES }} />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {loading || !data
            ? Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => (
                <MetricCard key={k.key} kpi={k} invertChange={k.key !== 'wpiRes'} />
              ))}
        </section>

        {loading || !data ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartSkeleton height={250} />
            <ChartSkeleton height={250} />
            <ChartSkeleton height={250} />
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard
                title="Requirements holding cases back"
                description="Click a bar to filter the table to that reason."
                height={250}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byReason} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="#EEF2F8" horizontal={false} />
                    <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ ...AXIS_STYLE, fontFamily: '"IBM Plex Sans", sans-serif' }}
                      tickLine={false}
                      axisLine={false}
                      width={148}
                    />
                    <RTooltip
                      cursor={{ fill: '#F5F7FA' }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <ChartTooltipBox
                            label={String(label)}
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
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                      cursor="pointer"
                      onClick={(entry: { name?: string }) =>
                        entry?.name &&
                        setDrill((d) =>
                          d?.kind === 'reason' && d.value === entry.name ? null : { kind: 'reason', value: entry.name! },
                        )
                      }
                    >
                      {data.byReason.map((r) => (
                        <Cell
                          key={r.name}
                          fill={drill?.kind === 'reason' && drill.value !== r.name ? '#DCE4F0' : '#118E85'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard
              title="Case status"
              description="Where the desk currently stands."
              height={250}
              footer={
                <ul className="space-y-1.5">
                  {data.byStatus.map((s, i) => (
                    <li key={s.name}>
                      <button
                        onClick={() =>
                          setDrill((d) => (d?.kind === 'status' && d.value === s.name ? null : { kind: 'status', value: s.name }))
                        }
                        className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-[12px] hover:bg-navy-50"
                      >
                        <span className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-navy-600">{s.name}</span>
                        <span className="num ml-auto text-navy-900">{count(s.value)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="84%" paddingAngle={1.5}>
                    {data.byStatus.map((s, i) => (
                      <Cell key={s.name} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <ChartTooltipBox
                          label={String(payload[0].name)}
                          rows={[
                            { name: 'Cases', value: count(Number(payload[0].value)) },
                            {
                              name: 'Share',
                              value: `${statusTotal ? ((Number(payload[0].value) / statusTotal) * 100).toFixed(1) : '0.0'}%`,
                            },
                          ]}
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        )}

        {drill && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-reef-200 bg-reef-50 px-3 py-2">
            <span className="text-[12px] font-medium text-reef-800">
              Drilled into {drill.value} — {count(rows.length)} cases
            </span>
            <Button variant="ghost" size="sm" className="ml-auto text-reef-700 hover:bg-reef-100" onClick={() => setDrill(null)}>
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
            exportName="wpi-dump"
            initialSort={{ key: 'ageDays', dir: 'desc' }}
            emptyAction={{ label: 'Reset filters', onClick: reset }}
          />
        )}
      </div>
    </>
  )
}
