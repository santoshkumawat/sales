import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportFilters } from '@/components/filters/ReportFilters'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard'
import { AXIS_STYLE, CHART_COLORS, ChartCard, ChartTooltipBox } from '@/components/charts/ChartCard'
import { MetricCardSkeleton, ChartSkeleton } from '@/components/ui/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useReportData } from '@/hooks/useReportData'
import { getDashboard } from '@/services/reportService'
import { useFilters } from '@/context/FilterContext'
import type { SliceDatum } from '@/types'
import { count, inrCompact, pct, signedPct } from '@/utils/format'
import { cn } from '@/utils/cn'

type SliceKey = 'byProduct' | 'byChannel' | 'byRegion' | 'byPolicyType'

const SLICE_TABS: { key: SliceKey; label: string; filterKey?: 'products' | 'channels' | 'regions' }[] = [
  { key: 'byProduct', label: 'Product', filterKey: 'products' },
  { key: 'byChannel', label: 'Channel', filterKey: 'channels' },
  { key: 'byRegion', label: 'Region', filterKey: 'regions' },
  { key: 'byPolicyType', label: 'Policy type' },
]

export default function Dashboard() {
  const { data, loading } = useReportData(getDashboard)
  const { filters, toggleValue, reset } = useFilters()
  const [slice, setSlice] = useState<SliceKey>('byProduct')
  const navigate = useNavigate()

  const tab = SLICE_TABS.find((t) => t.key === slice)!
  const sliceData: SliceDatum[] = data?.[slice] ?? []
  const sliceTotal = sliceData.reduce((s, d) => s + d.value, 0)

  return (
    <>
      <PageHeader
        title="Sales performance"
        description="One view of what was submitted, what got issued, and what is stuck — replacing the daily batch files."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]}
        actions={
          <Button variant="outline" size="md">
            <Download className="h-4 w-4" />
            Export board pack
          </Button>
        }
      />
      <ReportFilters />

      <div className="space-y-4 p-4 md:p-6">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {loading || !data
            ? Array.from({ length: 10 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : data.kpis.map((k) => (
                <MetricCard
                  key={k.key}
                  kpi={k}
                  invertChange={k.key === 'pending' || k.key === 'wpi' || k.key === 'rfi'}
                  onClick={
                    k.key === 'pending' || k.key === 'rfi'
                      ? () => navigate('/pending')
                      : k.key === 'wpi'
                        ? () => navigate('/wpi-dump')
                        : k.key === 'issuedPolicies' || k.key === 'issuedPremium' || k.key === 'commission'
                          ? () => navigate('/issuance')
                          : k.key === 'submissions' || k.key === 'submittedPremium'
                            ? () => navigate('/submission')
                            : undefined
                  }
                />
              ))}
        </section>

        {loading || !data ? (
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ChartSkeleton height={300} />
            </div>
            <ChartSkeleton height={300} />
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ChartCard
                  title="Issuance against submission"
                  description={`Policies issued per ${data.granularity}, against the submissions they came from. The gap is the pipeline still in underwriting.`}
                  height={300}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid stroke="#EAF2FB" vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#DCE7F3' }} minTickGap={16} />
                      <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                      <RTooltip
                        cursor={{ fill: '#EFF5FC' }}
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <ChartTooltipBox
                              label={String(label)}
                              rows={[
                                { name: 'Issued', value: count(Number(payload[0]?.payload.issuance)), color: '#1476E0' },
                                { name: 'Submitted', value: count(Number(payload[0]?.payload.submissions)), color: '#A6C8ED' },
                                { name: 'Issued premium', value: inrCompact(Number(payload[0]?.payload.issuedPremium)) },
                                {
                                  name: 'Placement',
                                  value: pct(
                                    Number(payload[0]?.payload.submissions)
                                      ? (Number(payload[0]?.payload.issuance) / Number(payload[0]?.payload.submissions)) * 100
                                      : 0,
                                  ),
                                },
                              ]}
                            />
                          ) : null
                        }
                      />
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: 12, color: '#4D8CD0', paddingTop: 8 }}
                      />
                      <Bar dataKey="issuance" name="Issued" fill="#1476E0" radius={[3, 3, 0, 0]} maxBarSize={26} />
                      <Line
                        type="monotone"
                        dataKey="submissions"
                        name="Submitted"
                        stroke="#79ABE1"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <ChartCard
                title="Premium performance"
                description="Issued against submitted premium for the same buckets."
                height={300}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="#EAF2FB" vertical={false} />
                    <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: '#DCE7F3' }} minTickGap={20} />
                    <YAxis
                      tick={AXIS_STYLE}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => inrCompact(Number(v)).replace('₹', '')}
                    />
                    <RTooltip
                      cursor={{ fill: '#EFF5FC' }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <ChartTooltipBox
                            label={String(label)}
                            rows={payload.map((p) => ({
                              name: String(p.name),
                              value: inrCompact(Number(p.value)),
                              color: String(p.color),
                            }))}
                          />
                        ) : null
                      }
                    />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: '#4D8CD0', paddingTop: 8 }} />
                    <Bar dataKey="issuedPremium" name="Issued" fill="#1476E0" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="submittedPremium" name="Submitted" fill="#A6C8ED" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <ChartCard
                title="Issued mix"
                description="Click a segment to filter the whole portal by it."
                height={244}
                action={
                  <div className="flex flex-wrap gap-1">
                    {SLICE_TABS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setSlice(t.key)}
                        className={cn(
                          'rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
                          slice === t.key ? 'bg-navy-800 text-white' : 'text-navy-500 hover:bg-navy-50',
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                }
                footer={
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {sliceData.slice(0, 6).map((d, i) => (
                      <li key={d.name} className="flex items-center gap-2 text-[12px]">
                        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate text-navy-600">{d.name}</span>
                        <span className="num ml-auto text-navy-900">{pct(sliceTotal ? (d.value / sliceTotal) * 100 : 0, 0)}</span>
                      </li>
                    ))}
                  </ul>
                }
              >
                {sliceData.length === 0 ? (
                  <EmptyState title="No issued policies in this period" message="Try a wider period such as YTD." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sliceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="86%"
                        paddingAngle={1.5}
                        onClick={(entry: { name?: string }) => {
                          if (tab.filterKey && entry?.name) toggleValue(tab.filterKey, entry.name)
                        }}
                      >
                        {sliceData.map((d, i) => (
                          <Cell
                            key={d.name}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                            stroke="#fff"
                            strokeWidth={2}
                            cursor={tab.filterKey ? 'pointer' : 'default'}
                          />
                        ))}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <ChartTooltipBox
                              label={String(payload[0].name)}
                              rows={[
                                { name: 'Policies', value: count(Number(payload[0].value)) },
                                { name: 'Premium', value: inrCompact(Number(payload[0].payload.premium)) },
                                { name: 'Share', value: pct(sliceTotal ? (Number(payload[0].value) / sliceTotal) * 100 : 0) },
                              ]}
                            />
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <AnalyticsCard
                title="Channel performance"
                description="Ranked by issued premium in the selected period."
                bodyClassName="px-0 pb-2"
              >
                <div className="space-y-3 px-5">
                  {data.channelPerformance.map((c) => {
                    const max = Math.max(...data.channelPerformance.map((x) => x.premium), 1)
                    return (
                      <button
                        key={c.channel}
                        onClick={() => toggleValue('channels', c.channel)}
                        className="w-full text-left"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              'text-[13px] font-medium',
                              filters.channels.includes(c.channel) ? 'text-reef-700' : 'text-navy-800',
                            )}
                          >
                            {c.channel}
                          </span>
                          <span className="num text-[12px] text-navy-500">{inrCompact(c.premium)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-50">
                          <div
                            className="h-full rounded-full bg-reef-500 transition-[width] duration-500"
                            style={{ width: `${(c.premium / max) * 100}%` }}
                          />
                        </div>
                        <p className="num mt-1 text-[11px] text-navy-400">
                          {count(c.issued)} issued of {count(c.submissions)} · {pct(c.placementRate)} placement
                        </p>
                      </button>
                    )
                  })}
                  {data.channelPerformance.length === 0 && (
                    <p className="py-8 text-center text-[13px] text-navy-400">No channel activity in this period.</p>
                  )}
                </div>
              </AnalyticsCard>

              <AnalyticsCard
                title="Regional rankings"
                description="Click a region to drill the portal into it."
                bodyClassName="px-0 pb-2"
              >
                <ul className="divide-y divide-line">
                  {data.regionRankings.map((r) => (
                    <li key={r.region}>
                      <button
                        onClick={() => toggleValue('regions', r.region)}
                        className={cn(
                          'flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-reef-50/50',
                          filters.regions.includes(r.region) && 'bg-reef-50',
                        )}
                      >
                        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-navy-50 text-[12px] font-semibold text-navy-600">
                          {r.rank}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-navy-900">{r.region}</span>
                          <span className="num block text-[11px] text-navy-400">
                            {count(r.issued)} policies · {pct(r.placementRate)} placement
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="num block text-[13px] font-medium text-navy-900">{inrCompact(r.premium)}</span>
                          <span
                            className={cn(
                              'num block text-[11px]',
                              r.changePct >= 0 ? 'text-pos' : 'text-neg',
                            )}
                          >
                            {signedPct(r.changePct)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {data.regionRankings.length === 0 && (
                  <p className="py-8 text-center text-[13px] text-navy-400">No regional activity in this period.</p>
                )}
              </AnalyticsCard>
            </section>

            <AnalyticsCard
              title="Top performers"
              description="Advisors ranked by issued premium, with the first-year commission that earns them."
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/issuance')}>
                  Open issuance report
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              }
              bodyClassName="px-0 pb-0"
            >
              {data.topPerformers.length === 0 ? (
                <EmptyState
                  title="No advisor issued business in this period"
                  message="Widen the period or clear the filters to see the leaderboard."
                  actionLabel="Reset filters"
                  onAction={reset}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-[13px]">
                    <thead>
                      <tr className="border-y border-line bg-paper text-[11px] font-semibold text-navy-500">
                        <th className="px-5 py-2 text-left">Rank</th>
                        <th className="px-3 py-2 text-left">Advisor</th>
                        <th className="px-3 py-2 text-left">Branch</th>
                        <th className="px-3 py-2 text-left">Channel</th>
                        <th className="px-3 py-2 text-right">Policies</th>
                        <th className="px-3 py-2 text-right">Issued premium</th>
                        <th className="px-3 py-2 text-right">Commission</th>
                        <th className="px-5 py-2 text-right">Placement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.topPerformers.map((p) => (
                        <tr key={`${p.advisor}-${p.branch}`} className="transition-colors hover:bg-reef-50/40">
                          <td className="num px-5 py-2.5 text-navy-400">{p.rank}</td>
                          <td className="px-3 py-2.5 font-medium text-navy-900">{p.advisor}</td>
                          <td className="px-3 py-2.5 text-navy-600">{p.branch}</td>
                          <td className="px-3 py-2.5 text-navy-600">{p.channel}</td>
                          <td className="num px-3 py-2.5 text-right text-navy-800">{count(p.policies)}</td>
                          <td className="num px-3 py-2.5 text-right font-medium text-navy-900">{inrCompact(p.premium)}</td>
                          <td className="num px-3 py-2.5 text-right text-reef-700">{inrCompact(p.commission)}</td>
                          <td className="num px-5 py-2.5 text-right text-navy-600">{pct(p.placementRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AnalyticsCard>
          </>
        )}
      </div>
    </>
  )
}
