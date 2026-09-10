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
import { count, inr, shortDate } from '@/utils/format'
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
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {loading || !data
            ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
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
                <CartesianGrid stroke="#EEF2F8" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <RTooltip
                  cursor={{ fill: '#F5F7FA' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltipBox label={String(label)} rows={[{ name: 'Policies', value: count(Number(payload[0].value)) }]} />
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {data.tatBuckets.map((b, i) => (
                    <Cell key={b.name} fill={i >= 3 ? '#B45309' : '#118E85'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
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
