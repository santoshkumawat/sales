import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { MetricCardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useReportData } from '@/hooks/useReportData'
import { getSubmissionReport } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { SUBMISSION_STATUSES } from '@/data/mockInsuranceData'
import type { SubmissionRecord } from '@/types'
import { inr, shortDate } from '@/utils/format'

const columns: Column<SubmissionRecord>[] = [
  {
    key: 'submissionDate',
    header: 'Submitted',
    accessor: (r) => r.submissionDate,
    cell: (r) => <span className="num text-navy-600">{shortDate(r.submissionDate)}</span>,
    width: '110px',
  },
  {
    key: 'proposalNo',
    header: 'Proposal no',
    accessor: (r) => r.proposalNo,
    cell: (r) => <span className="num font-medium text-navy-900">{r.proposalNo}</span>,
    width: '150px',
  },
  { key: 'customer', header: 'Customer', accessor: (r) => r.customer, cell: (r) => <span className="font-medium text-navy-900">{r.customer}</span> },
  { key: 'product', header: 'Product', accessor: (r) => r.product },
  { key: 'channel', header: 'Channel', accessor: (r) => r.channel },
  { key: 'branch', header: 'Branch', accessor: (r) => r.branch },
  { key: 'region', header: 'Region', accessor: (r) => r.region, optional: true },
  { key: 'salesManager', header: 'Sales manager', accessor: (r) => r.salesManager, optional: true },
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
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    cell: (r) => <StatusBadge value={r.status} />,
  },
  { key: 'currentStage', header: 'Current stage', accessor: (r) => r.currentStage },
]

export default function SubmissionReport() {
  const { data, loading } = useReportData(getSubmissionReport)
  const { reset } = useFilters()

  return (
    <>
      <PageHeader
        title="Submission report"
        description="Every proposal logged in the selected period, with the stage each one currently sits at."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Reports' }, { label: 'Submission' }]}
      />
      <ReportFilters statusGroup={{ key: 'statuses', title: 'Submission status', options: SUBMISSION_STATUSES }} />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {loading || !data
            ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => <MetricCard key={k.key} kpi={k} />)}
        </section>

        {loading || !data ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable
            rows={data.rows}
            columns={columns}
            rowKey={(r) => r.id}
            exportName="submission-report"
            initialSort={{ key: 'submissionDate', dir: 'desc' }}
            emptyAction={{ label: 'Reset filters', onClick: reset }}
          />
        )}
      </div>
    </>
  )
}
