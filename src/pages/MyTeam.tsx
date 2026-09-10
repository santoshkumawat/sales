import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, CornerDownRight, LineChart, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard'
import { Skeleton, MetricCardSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { useReportData } from '@/hooks/useReportData'
import { getTeamOverview, type TeamMemberStats } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { chainTo, getEmployee } from '@/data/orgData'
import { count, inrCompact, initials, pct, signedPct } from '@/utils/format'
import { cn } from '@/utils/cn'

function MemberRow({
  member,
  onDrill,
  onView,
}: {
  member: TeamMemberStats
  onDrill: () => void
  onView: () => void
}) {
  const e = member.employee
  const hasTeam = member.directReportCount > 0

  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-reef-50/30 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[12px] font-semibold text-navy-700">
          {initials(e.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-navy-900">{e.name}</span>
          <span className="num block truncate text-[11px] text-navy-400">
            {e.roleLabel} · {e.code}
            {e.branch ? ` · ${e.branch}` : e.region ? ` · ${e.region}` : e.zone ? ` · ${e.zone}` : ''}
            {hasTeam ? ` · ${member.teamSize} in team` : ''}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5 lg:w-[560px] lg:shrink-0">
        {[
          { label: 'Submitted', value: count(member.submissions) },
          { label: 'Issued', value: count(member.issued) },
          { label: 'Issued premium', value: inrCompact(member.issuedPremium), delta: member.premiumChangePct },
          { label: 'Placement', value: pct(member.placementRate) },
          { label: 'Pending · RFI', value: `${count(member.pending)} · ${count(member.openRfis)}` },
        ].map((cell) => (
          <div key={cell.label}>
            <p className="num text-[13px] font-medium text-navy-900">{cell.value}</p>
            <p className="text-[10px] text-navy-400">{cell.label}</p>
            {cell.delta != null && (
              <p className={cn('num text-[10px]', cell.delta >= 0 ? 'text-pos' : 'text-neg')}>
                {signedPct(cell.delta)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <LineChart className="h-3.5 w-3.5" />
          View book
        </Button>
        {hasTeam && (
          <Button variant="ghost" size="sm" onClick={onDrill}>
            <CornerDownRight className="h-3.5 w-3.5" />
            Team
          </Button>
        )}
      </div>
    </div>
  )
}

export default function MyTeam() {
  const { user } = useAuth()
  const { setScope, rootEmployeeId } = useFilters()
  const navigate = useNavigate()
  const [focusId, setFocusId] = useState(user?.id ?? rootEmployeeId ?? '')

  const { data, loading } = useReportData((f) => getTeamOverview(f, focusId), focusId)

  const chain = focusId ? chainTo(focusId) : []
  const rootIndex = chain.findIndex((e) => e.id === (rootEmployeeId ?? user?.id))
  const visibleChain = rootIndex >= 0 ? chain.slice(rootIndex) : chain
  const focus = getEmployee(focusId)

  const viewBook = (employeeId: string) => {
    setScope(employeeId)
    navigate('/')
  }

  return (
    <>
      <PageHeader
        title="My team"
        description="Your immediate reports and their books for the selected period. Drill down the reporting line, or open anyone's book across every report."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My team' }]}
        actions={
          focus && focus.id !== rootEmployeeId ? (
            <Button variant="outline" size="md" onClick={() => setFocusId(rootEmployeeId ?? user!.id)}>
              Back to my reports
            </Button>
          ) : undefined
        }
      />
      <ReportFilters />

      <div className="space-y-4 p-4 md:p-6">
        {visibleChain.length > 1 && (
          <nav className="flex flex-wrap items-center gap-1 text-[12px]" aria-label="Reporting line">
            {visibleChain.map((e, i) => (
              <span key={e.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-navy-200" />}
                <button
                  onClick={() => setFocusId(e.id)}
                  className={cn(
                    'rounded px-1.5 py-0.5 transition-colors',
                    e.id === focusId ? 'bg-navy-800 font-medium text-white' : 'text-navy-500 hover:bg-navy-100',
                  )}
                >
                  {e.name}
                  <span className="num ml-1.5 opacity-70">{e.role}</span>
                </button>
              </span>
            ))}
          </nav>
        )}

        {loading || !data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
            <div className="surface divide-y divide-line">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="ml-auto h-3 w-64" />
                </div>
              ))}
            </div>
          </>
        ) : data.members.length === 0 ? (
          <div className="surface">
            <EmptyState
              icon={Users}
              title={`${data.focus.name} has no direct reports`}
              message="This is a leaf position on the sales hierarchy. Open the book instead to see their own cases."
              actionLabel="Open their book"
              onAction={() => viewBook(data.focus.id)}
            />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: 'Direct reports', value: count(data.members.length) },
                { label: 'Team submissions', value: count(data.rollup.submissions) },
                { label: 'Team issued', value: count(data.rollup.issued) },
                { label: 'Team issued premium', value: inrCompact(data.rollup.issuedPremium) },
                { label: 'Pending · open RFIs', value: `${count(data.rollup.pending)} · ${count(data.rollup.openRfis)}` },
              ].map((s) => (
                <div key={s.label} className="surface p-4">
                  <p className="text-[12px] font-medium text-navy-500">{s.label}</p>
                  <p className="num mt-2 text-[22px] font-semibold leading-none text-navy-900">{s.value}</p>
                </div>
              ))}
            </section>

            <AnalyticsCard
              title={`Reporting to ${data.focus.name}`}
              description={`${data.focus.roleLabel} · ${count(data.members.length)} direct reports. Pending and RFI counts are open cases as of today, not period totals.`}
              bodyClassName="px-0 pb-0"
              action={
                <Button variant="outline" size="sm" onClick={() => viewBook(data.focus.id)}>
                  View whole book
                </Button>
              }
            >
              <div className="divide-y divide-line border-t border-line">
                {data.members.map((m) => (
                  <MemberRow
                    key={m.employee.id}
                    member={m}
                    onDrill={() => setFocusId(m.employee.id)}
                    onView={() => viewBook(m.employee.id)}
                  />
                ))}
              </div>
            </AnalyticsCard>
          </>
        )}
      </div>
    </>
  )
}
