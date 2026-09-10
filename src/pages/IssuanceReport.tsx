import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ChartSkeleton, MetricCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AXIS_STYLE, ChartCard, ChartTooltipBox } from '@/components/charts/ChartCard'
import { useReportData } from '@/hooks/useReportData'
import { getIssuanceReport } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { POLICY_STATUSES } from '@/data/mockInsuranceData'
import type { IssuanceRecord } from '@/types'
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard'
import { count, inr, inrCompact, pct, shortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const columns: Column<IssuanceRecord>[] = [
  {
    key: 'issueDate',
    header: 'Issued',
    accessor: (r) => r.issueDate,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.issueDate)}</span>,
    width: '104px',
  },
  { key: 'proposalNo', header: 'Proposal no', accessor: (r) => r.proposalNo, cell: (r) => <span className="num text-navy-600">{r.proposalNo}</span> },
  {
    key: 'policyNo',
    header: 'Policy no',
    accessor: (r) => r.policyNo,
    cell: (r) => <span className="num font-medium text-navy-900">{r.policyNo}</span>,
  },
  { key: 'customer', header: 'Customer', accessor: (r) => r.customer, cell: (r) => <span className="font-medium text-navy-900">{r.customer}</span> },
  { key: 'product', header: 'Product', accessor: (r) => r.product },
  { key: 'channel', header: 'Channel', accessor: (r) => r.channel },
  { key: 'branch', header: 'Branch', accessor: (r) => r.branch },
  { key: 'region', header: 'Region', accessor: (r) => r.region, optional: true },
  { key: 'manager', header: 'Manager', accessor: (r) => r.manager, optional: true },
  { key: 'advisor', header: 'Advisor', accessor: (r) => r.advisor },
  {
    key: 'submittedPremium',
    header: 'Submitted premium',
    accessor: (r) => r.submittedPremium,
    cell: (r) => <span className="num text-navy-600">{inr(r.submittedPremium)}</span>,
    align: 'right',
    optional: true,
  },
  {
    key: 'issuedPremium',
    header: 'Issued premium',
    accessor: (r) => r.issuedPremium,
    cell: (r) => <span className="num font-medium text-navy-900">{inr(r.issuedPremium)}</span>,
    align: 'right',
  },
  {
    key: 'sumAssured',
    header: 'Sum assured',
    accessor: (r) => r.sumAssured,
    cell: (r) => <span className="num text-navy-600">{inr(r.sumAssured)}</span>,
    align: 'right',
  },
  {
    key: 'commissionRate',
    header: 'Comm. rate',
    accessor: (r) => r.commissionRate,
    cell: (r) => <span className="num text-navy-600">{pct(r.commissionRate, 2)}</span>,
    align: 'right',
    optional: true,
  },
  {
    key: 'commissionAmount',
    header: 'Commission',
    accessor: (r) => r.commissionAmount,
    cell: (r) => <span className="num font-medium text-reef-700">{inr(r.commissionAmount)}</span>,
    align: 'right',
  },
  {
    key: 'submissionDate',
    header: 'Submitted on',
    accessor: (r) => r.submissionDate,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.submissionDate)}</span>,
    optional: true,
  },
  {
    key: 'turnaroundDays',
    header: 'Turnaround',
    accessor: (r) => r.turnaroundDays,
    cell: (r) => (
      <span
        className={cn(
          'num font-medium',
          r.turnaroundDays > 21 ? 'text-neg' : r.turnaroundDays > 14 ? 'text-warn' : 'text-pos',
        )}
      >
        {r.turnaroundDays} d
      </span>
    ),
    align: 'right',
  },
  { key: 'policyStatus', header: 'Policy status', accessor: (r) => r.policyStatus, cell: (r) => <StatusBadge value={r.policyStatus} /> },
]

export default function IssuanceReport() {
  const { data, loading } = useReportData(getIssuanceReport)
  const { reset } = useFilters()

  return (
    <>
      <PageHeader
        title="Issuance report"
        description="Policies issued in the period, with the turnaround from submission to issuance."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Reports' }, { label: 'Issuance' }]}
      />
      <ReportFilters statusGroup={{ key: 'statuses', title: 'Policy status', options: POLICY_STATUSES }} />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {loading || !data
            ? Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => <MetricCard key={k.key} kpi={k} />)}
        </section>

        {loading || !data ? (
          <ChartSkeleton height={200} />
        ) : (
          <ChartCard
            title="Turnaround time"
            description="Days between proposal submission and policy issuance."
            height={200}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tatBuckets} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#EAF2FB" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#DCE7F3' }} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <RTooltip
                  cursor={{ fill: '#EFF5FC' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox label={String(label)} rows={[{ name: 'Policies', value: count(Number(payload[0].value)) }]} />
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {data.tatBuckets.map((b, i) => (
                    <Cell key={b.name} fill={i >= 3 ? '#B45309' : '#1476E0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {!loading && data && (
          <AnalyticsCard
            title="Where the commission is earned"
            description="First-year commission on issued business. Term pays a far higher percentage than unit linked, so premium mix moves this more than volume does."
            bodyClassName="pb-5"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: 'By product', rows: data.commissionByProduct },
                { title: 'By channel', rows: data.commissionByChannel },
              ].map((block) => {
                const max = Math.max(...block.rows.map((r) => r.premium), 1)
                return (
                  <div key={block.title}>
                    <p className="mb-2 text-[12px] font-medium text-navy-500">{block.title}</p>
                    <ul className="space-y-2">
                      {block.rows.map((r) => (
                        <li key={r.name}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[12.5px] text-navy-700">{r.name}</span>
                            <span className="num text-[12px] text-navy-500">
                              {inrCompact(r.premium)} · {count(r.value)} policies
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-50">
                            <div className="h-full rounded-full bg-reef-500" style={{ width: `${(r.premium / max) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                      {block.rows.length === 0 && (
                        <li className="py-3 text-[12.5px] text-navy-400">No issued business in this period.</li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          </AnalyticsCard>
        )}

        {loading || !data ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable
            rows={data.rows}
            columns={columns}
            rowKey={(r) => r.id}
            exportName="issuance-report"
            initialSort={{ key: 'issueDate', dir: 'desc' }}
            emptyAction={{ label: 'Reset filters', onClick: reset }}
          />
        )}
      </div>
    </>
  )
}
