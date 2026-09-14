/**
 * Mock service layer.
 *
 * Every page talks to this module rather than to the mock data directly, so the
 * whole portal can move onto real REST endpoints by rewriting these functions
 * (return the same shapes, await fetch instead of the in-memory arrays).
 */

import {
  INCEPTION,
  TODAY,
  mockIssuances,
  mockPending,
  mockSubmissions,
  mockWpi,
} from '@/data/mockInsuranceData'
import type {
  ChannelPerformance,
  DateRange,
  FilterState,
  IssuanceRecord,
  KpiValue,
  PendingRecord,
  PeriodKey,
  RegionRanking,
  SliceDatum,
  SubmissionRecord,
  TopPerformer,
  TrendPoint,
  WpiRecord,
} from '@/types'
import { directReports, getEmployee, subtreeIds, teamSize, type Employee } from '@/data/orgData'
import { count, inrCompact, isoDate, pct } from '@/utils/format'

/** Subtree lookups are hot on every filter pass, so cache them per employee. */
const scopeCache = new Map<string, Set<string>>()

function scopeFor(employeeId: string | null): Set<string> | null {
  if (!employeeId) return null
  let cached = scopeCache.get(employeeId)
  if (!cached) {
    cached = subtreeIds(employeeId)
    scopeCache.set(employeeId, cached)
  }
  return cached
}

const DAY = 86_400_000
const LATENCY = 260 // ms — enough to show the loading skeletons

export function rangeForPeriod(period: PeriodKey, custom?: DateRange): DateRange {
  const end = isoDate(TODAY)
  switch (period) {
    case 'FTD':
      return { start: end, end }
    case 'MTD':
      return { start: isoDate(new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1))), end }
    case 'YTD': {
      // Indian financial year: 1 April to 31 March.
      const y = TODAY.getUTCMonth() >= 3 ? TODAY.getUTCFullYear() : TODAY.getUTCFullYear() - 1
      return { start: isoDate(new Date(Date.UTC(y, 3, 1))), end }
    }
    case 'ITD':
      return { start: isoDate(INCEPTION), end }
    case 'CUSTOM':
      return custom ?? { start: end, end }
  }
}

export function periodLabel(period: PeriodKey): string {
  return {
    FTD: 'For the day',
    MTD: 'Month to date',
    YTD: 'Financial year to date',
    ITD: 'Inception to date',
    CUSTOM: 'Custom range',
  }[period]
}

/** The equivalent window immediately before the current one. */
function previousRange(range: DateRange): DateRange {
  const start = new Date(range.start).getTime()
  const end = new Date(range.end).getTime()
  const span = Math.max(DAY, end - start + DAY)
  return { start: isoDate(new Date(start - span)), end: isoDate(new Date(start - DAY)) }
}

const inRange = (iso: string, r: DateRange) => iso >= r.start && iso <= r.end

const matchesList = (value: string, list: string[]) => list.length === 0 || list.includes(value)

const textHit = (needle: string, haystack: string[]) =>
  !needle || haystack.some((h) => h.toLowerCase().includes(needle.toLowerCase()))

/* ------------------------------- filtering -------------------------------- */

function commonFilter(
  r: {
    employeeId: string
    product: string
    channel: string
    region: string
    branch: string
    manager: string
    advisor: string
    annualPremium?: number
  },
  f: FilterState,
): boolean {
  const scope = scopeFor(f.scopeEmployeeId)
  if (scope && !scope.has(r.employeeId)) return false
  if (!matchesList(r.product, f.products)) return false
  if (!matchesList(r.channel, f.channels)) return false
  if (!matchesList(r.region, f.regions)) return false
  if (!matchesList(r.branch, f.branches)) return false
  if (!matchesList(r.manager, f.managers)) return false
  const p = r.annualPremium ?? 0
  if (f.minPremium != null && p < f.minPremium) return false
  if (f.maxPremium != null && p > f.maxPremium) return false
  return true
}

export function filterSubmissions(f: FilterState, range = f.range): SubmissionRecord[] {
  return mockSubmissions.filter(
    (s) =>
      inRange(s.submissionDate, range) &&
      commonFilter({ ...s, manager: s.salesManager }, f) &&
      matchesList(s.status, f.statuses) &&
      textHit(f.search, [s.proposalNo, s.customer, s.advisor, s.salesManager, s.branch]),
  )
}

export function filterIssuances(f: FilterState, range = f.range): IssuanceRecord[] {
  return mockIssuances.filter(
    (i) =>
      inRange(i.issueDate, range) &&
      commonFilter({ ...i, annualPremium: i.issuedPremium }, f) &&
      matchesList(i.policyStatus, f.statuses) &&
      textHit(f.search, [i.proposalNo, i.policyNo, i.customer, i.advisor, i.manager, i.branch]),
  )
}

export function filterPending(f: FilterState, range = f.range): PendingRecord[] {
  return mockPending.filter(
    (p) =>
      inRange(p.pendingSince, range) &&
      commonFilter(p, f) &&
      matchesList(p.reason, f.statuses) &&
      textHit(f.search, [p.proposalNo, p.customer, p.advisor, p.manager, p.branch, p.reason]),
  )
}

export function filterWpi(f: FilterState, range = f.range): WpiRecord[] {
  return mockWpi.filter(
    (w) =>
      inRange(w.wpiDate, range) &&
      commonFilter(w, f) &&
      matchesList(w.status, f.statuses) &&
      textHit(f.search, [w.proposalNo, w.customer, w.advisor, w.manager, w.branch, w.reason]),
  )
}

/* --------------------------------- helpers -------------------------------- */

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const change = (curr: number, prev: number) => (prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / prev) * 100)

/** Splits a range into ~8 buckets and counts a value in each — used for sparklines. */
function sparkline(range: DateRange, valueAt: (r: DateRange) => number): number[] {
  const start = new Date(range.start).getTime()
  const end = new Date(range.end).getTime()
  const buckets = 8
  const span = Math.max(DAY, (end - start) / buckets)
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = start + i * span
    const bEnd = i === buckets - 1 ? end : bStart + span - DAY
    return valueAt({ start: isoDate(new Date(bStart)), end: isoDate(new Date(bEnd)) })
  })
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))
}

/* ------------------------------- dashboard -------------------------------- */

export interface DashboardData {
  kpis: KpiValue[]
  trend: TrendPoint[]
  byProduct: SliceDatum[]
  byChannel: SliceDatum[]
  byRegion: SliceDatum[]
  byPolicyType: SliceDatum[]
  channelPerformance: ChannelPerformance[]
  regionRankings: RegionRanking[]
  topPerformers: TopPerformer[]
  granularity: 'day' | 'week' | 'month'
}

function granularityFor(range: DateRange): 'day' | 'week' | 'month' {
  const days = (new Date(range.end).getTime() - new Date(range.start).getTime()) / DAY
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

function bucketKey(iso: string, g: 'day' | 'week' | 'month'): string {
  const d = new Date(iso)
  if (g === 'month') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  if (g === 'week') {
    const monday = new Date(d)
    const shift = (d.getUTCDay() + 6) % 7
    monday.setUTCDate(d.getUTCDate() - shift)
    return monday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export async function getDashboard(f: FilterState): Promise<DashboardData> {
  const prev = previousRange(f.range)

  const subs = filterSubmissions(f)
  const iss = filterIssuances(f)
  const pen = filterPending(f)
  const wpi = filterWpi(f)

  const pSubs = filterSubmissions(f, prev)
  const pIss = filterIssuances(f, prev)

  const submittedPremium = sum(subs.map((s) => s.annualPremium))
  const issuedPremium = sum(iss.map((i) => i.issuedPremium))
  const prevSubmittedPremium = sum(pSubs.map((s) => s.annualPremium))
  const prevIssuedPremium = sum(pIss.map((i) => i.issuedPremium))
  const placement = subs.length ? (iss.length / subs.length) * 100 : 0
  const prevPlacement = pSubs.length ? (pIss.length / pSubs.length) * 100 : 0
  const avgPremium = iss.length ? issuedPremium / iss.length : 0
  const prevAvgPremium = pIss.length ? prevIssuedPremium / pIss.length : 0
  const pendingPremium = sum(pen.map((p) => p.annualPremium))
  const wpiPremium = sum(wpi.map((w) => w.annualPremium))
  const commission = sum(iss.map((i) => i.commissionAmount))
  const prevCommission = sum(pIss.map((i) => i.commissionAmount))
  const rfi = summariseRfis(pen)

  const kpis: KpiValue[] = [
    {
      key: 'submissions',
      label: 'Total submissions',
      value: subs.length,
      display: count(subs.length),
      changePct: change(subs.length, pSubs.length),
      previousDisplay: count(pSubs.length),
      spark: sparkline(f.range, (r) => filterSubmissions(f, r).length),
      hint: 'Proposals logged in the selected period',
    },
    {
      key: 'submittedPremium',
      label: 'Submitted premium',
      value: submittedPremium,
      display: inrCompact(submittedPremium),
      changePct: change(submittedPremium, prevSubmittedPremium),
      previousDisplay: inrCompact(prevSubmittedPremium),
      spark: sparkline(f.range, (r) => sum(filterSubmissions(f, r).map((s) => s.annualPremium))),
      hint: 'Annualised premium on submitted proposals',
    },
    {
      key: 'issuedPolicies',
      label: 'Issued policies',
      value: iss.length,
      display: count(iss.length),
      changePct: change(iss.length, pIss.length),
      previousDisplay: count(pIss.length),
      spark: sparkline(f.range, (r) => filterIssuances(f, r).length),
    },
    {
      key: 'issuedPremium',
      label: 'Issued premium',
      value: issuedPremium,
      display: inrCompact(issuedPremium),
      changePct: change(issuedPremium, prevIssuedPremium),
      previousDisplay: inrCompact(prevIssuedPremium),
      spark: sparkline(f.range, (r) => sum(filterIssuances(f, r).map((i) => i.issuedPremium))),
    },
    {
      key: 'pending',
      label: 'Pending cases',
      value: pen.length,
      display: count(pen.length),
      changePct: change(pen.length, Math.round(pen.length * 1.07)),
      previousDisplay: count(Math.round(pen.length * 1.07)),
      spark: sparkline(f.range, (r) => filterPending(f, r).length),
      hint: `${inrCompact(pendingPremium)} premium locked in the pipeline`,
    },
    {
      key: 'wpi',
      label: 'WPI cases',
      value: wpi.length,
      display: count(wpi.length),
      changePct: change(wpi.length, Math.round(wpi.length * 1.12)),
      previousDisplay: count(Math.round(wpi.length * 1.12)),
      spark: sparkline(f.range, (r) => filterWpi(f, r).length),
      hint: `${inrCompact(wpiPremium)} premium awaiting requirements`,
    },
    {
      key: 'commission',
      label: 'Commission payable',
      value: commission,
      display: inrCompact(commission),
      changePct: change(commission, prevCommission),
      previousDisplay: inrCompact(prevCommission),
      spark: sparkline(f.range, (r) => sum(filterIssuances(f, r).map((i) => i.commissionAmount))),
      hint: `First-year commission on issued business — ${pct(issuedPremium ? (commission / issuedPremium) * 100 : 0)} of issued premium`,
    },
    {
      key: 'rfi',
      label: 'Open RFIs',
      value: rfi.open,
      display: count(rfi.open),
      changePct: change(rfi.open, Math.round(rfi.open * 1.08)),
      previousDisplay: count(Math.round(rfi.open * 1.08)),
      spark: sparkline(f.range, (r) => summariseRfis(filterPending(f, r)).open),
      hint: `${count(rfi.overdue)} past their service commitment`,
    },
    {
      key: 'placement',
      label: 'Placement rate',
      value: placement,
      display: pct(placement),
      changePct: change(placement, prevPlacement),
      previousDisplay: pct(prevPlacement),
      spark: sparkline(f.range, (r) => {
        const s = filterSubmissions(f, r).length
        return s ? (filterIssuances(f, r).length / s) * 100 : 0
      }),
      hint: 'Issued policies as a share of submissions',
    },
    {
      key: 'avgPremium',
      label: 'Average premium',
      value: avgPremium,
      display: inrCompact(avgPremium),
      changePct: change(avgPremium, prevAvgPremium),
      previousDisplay: inrCompact(prevAvgPremium),
      spark: sparkline(f.range, (r) => {
        const list = filterIssuances(f, r)
        return list.length ? sum(list.map((i) => i.issuedPremium)) / list.length : 0
      }),
    },
  ]

  const g = granularityFor(f.range)
  const buckets = new Map<string, TrendPoint>()
  const touch = (key: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, { label: key, submissions: 0, issuance: 0, submittedPremium: 0, issuedPremium: 0 })
    }
    return buckets.get(key)!
  }
  for (const s of subs) {
    const b = touch(bucketKey(s.submissionDate, g))
    b.submissions += 1
    b.submittedPremium += s.annualPremium
  }
  for (const i of iss) {
    const b = touch(bucketKey(i.issueDate, g))
    b.issuance += 1
    b.issuedPremium += i.issuedPremium
  }
  const trend = [...buckets.values()]

  const slice = (keyOf: (i: IssuanceRecord) => string): SliceDatum[] => {
    const m = new Map<string, SliceDatum>()
    for (const i of iss) {
      const k = keyOf(i)
      const cur = m.get(k) ?? { name: k, value: 0, premium: 0 }
      cur.value += 1
      cur.premium += i.issuedPremium
      m.set(k, cur)
    }
    return [...m.values()].sort((a, b) => b.value - a.value)
  }

  const policyTypeOf = (product: string) =>
    product === 'SecureLife Term Plus'
      ? 'Protection'
      : product === 'WealthBuilder ULIP'
        ? 'Unit linked'
        : product === 'Retirement Advantage'
          ? 'Annuity'
          : 'Savings'

  const channelPerformance: ChannelPerformance[] = [...new Set(subs.map((s) => s.channel))]
    .map((channel) => {
      const s = subs.filter((x) => x.channel === channel)
      const i = iss.filter((x) => x.channel === channel)
      return {
        channel,
        submissions: s.length,
        issued: i.length,
        premium: sum(i.map((x) => x.issuedPremium)),
        placementRate: s.length ? (i.length / s.length) * 100 : 0,
      }
    })
    .sort((a, b) => b.premium - a.premium)

  const regionRankings: RegionRanking[] = [...new Set(subs.map((s) => s.region))]
    .map((region) => {
      const s = subs.filter((x) => x.region === region)
      const i = iss.filter((x) => x.region === region)
      const pi = pIss.filter((x) => x.region === region)
      const premium = sum(i.map((x) => x.issuedPremium))
      return {
        rank: 0,
        region,
        submissions: s.length,
        issued: i.length,
        premium,
        placementRate: s.length ? (i.length / s.length) * 100 : 0,
        changePct: change(premium, sum(pi.map((x) => x.issuedPremium))),
      }
    })
    .sort((a, b) => b.premium - a.premium)
    .map((r, idx) => ({ ...r, rank: idx + 1 }))

  const perfMap = new Map<string, TopPerformer>()
  for (const i of iss) {
    const key = `${i.advisor}|${i.branch}`
    const cur =
      perfMap.get(key) ??
      ({
        rank: 0,
        advisor: i.advisor,
        branch: i.branch,
        region: i.region,
        channel: i.channel,
        policies: 0,
        premium: 0,
        commission: 0,
        placementRate: 0,
      } as TopPerformer)
    cur.policies += 1
    cur.premium += i.issuedPremium
    cur.commission += i.commissionAmount
    perfMap.set(key, cur)
  }
  const topPerformers = [...perfMap.values()]
    .map((p) => {
      const subsFor = subs.filter((s) => s.advisor === p.advisor && s.branch === p.branch).length
      return { ...p, placementRate: subsFor ? (p.policies / subsFor) * 100 : 100 }
    })
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 10)
    .map((p, idx) => ({ ...p, rank: idx + 1 }))

  return delay({
    kpis,
    trend,
    byProduct: slice((i) => i.product),
    byChannel: slice((i) => i.channel),
    byRegion: slice((i) => i.region),
    byPolicyType: slice((i) => policyTypeOf(i.product)),
    channelPerformance,
    regionRankings,
    topPerformers,
    granularity: g,
  })
}

/* --------------------------------- reports -------------------------------- */

export async function getSubmissionReport(f: FilterState) {
  const rows = filterSubmissions(f)
  const prev = filterSubmissions(f, previousRange(f.range))
  const premium = sum(rows.map((r) => r.annualPremium))
  const kpis: KpiValue[] = [
    kpi('subCount', 'Submissions', rows.length, count(rows.length), prev.length, count(prev.length)),
    kpi('subPrem', 'Submitted premium', premium, inrCompact(premium), sum(prev.map((r) => r.annualPremium)), inrCompact(sum(prev.map((r) => r.annualPremium)))),
    kpi(
      'subAvg',
      'Average ticket size',
      rows.length ? premium / rows.length : 0,
      inrCompact(rows.length ? premium / rows.length : 0),
      prev.length ? sum(prev.map((r) => r.annualPremium)) / prev.length : 0,
      inrCompact(prev.length ? sum(prev.map((r) => r.annualPremium)) / prev.length : 0),
    ),
    kpi(
      'subActive',
      'In underwriting',
      rows.filter((r) => r.status === 'Under Review' || r.status === 'Pending').length,
      count(rows.filter((r) => r.status === 'Under Review' || r.status === 'Pending').length),
      prev.filter((r) => r.status === 'Under Review' || r.status === 'Pending').length,
      count(prev.filter((r) => r.status === 'Under Review' || r.status === 'Pending').length),
    ),
  ]
  return delay({ rows, kpis })
}

export async function getIssuanceReport(f: FilterState) {
  const rows = filterIssuances(f)
  const prev = filterIssuances(f, previousRange(f.range))
  const subs = filterSubmissions(f)
  const prevSubs = filterSubmissions(f, previousRange(f.range))
  const premium = sum(rows.map((r) => r.issuedPremium))
  const prevPremium = sum(prev.map((r) => r.issuedPremium))
  const placement = subs.length ? (rows.length / subs.length) * 100 : 0
  const prevPlacement = prevSubs.length ? (prev.length / prevSubs.length) * 100 : 0
  const commission = sum(rows.map((r) => r.commissionAmount))
  const prevCommission = sum(prev.map((r) => r.commissionAmount))
  const effectiveRate = premium ? (commission / premium) * 100 : 0
  const prevEffectiveRate = prevPremium ? (prevCommission / prevPremium) * 100 : 0
  const kpis: KpiValue[] = [
    kpi('issCount', 'Issued policies', rows.length, count(rows.length), prev.length, count(prev.length)),
    kpi('issPrem', 'Issued premium', premium, inrCompact(premium), prevPremium, inrCompact(prevPremium)),
    kpi(
      'issAvg',
      'Average premium',
      rows.length ? premium / rows.length : 0,
      inrCompact(rows.length ? premium / rows.length : 0),
      prev.length ? prevPremium / prev.length : 0,
      inrCompact(prev.length ? prevPremium / prev.length : 0),
    ),
    kpi('issPlace', 'Placement rate', placement, pct(placement), prevPlacement, pct(prevPlacement)),
    kpi('issComm', 'Commission payable', commission, inrCompact(commission), prevCommission, inrCompact(prevCommission)),
    kpi(
      'issCommRate',
      'Effective commission rate',
      effectiveRate,
      pct(effectiveRate, 2),
      prevEffectiveRate,
      pct(prevEffectiveRate, 2),
    ),
  ]
  const tatBuckets = [
    { label: '0–7 days', min: 0, max: 7 },
    { label: '8–14 days', min: 8, max: 14 },
    { label: '15–21 days', min: 15, max: 21 },
    { label: '22–30 days', min: 22, max: 30 },
    { label: '30+ days', min: 31, max: 999 },
  ].map((b) => ({ name: b.label, value: rows.filter((r) => r.turnaroundDays >= b.min && r.turnaroundDays <= b.max).length, premium: 0 }))
  const commissionByProduct = groupSlice(rows, (r) => r.product, (r) => r.commissionAmount)
  const commissionByChannel = groupSlice(rows, (r) => r.channel, (r) => r.commissionAmount)
  return delay({ rows, kpis, tatBuckets, commissionByProduct, commissionByChannel })
}

export async function getPendingReport(f: FilterState) {
  const rows = filterPending(f)
  const premium = sum(rows.map((r) => r.annualPremium))
  const avgAge = rows.length ? sum(rows.map((r) => r.ageDays)) / rows.length : 0
  const over = (d: number) => rows.filter((r) => r.ageDays > d).length
  const kpis: KpiValue[] = [
    kpi('penCount', 'Total pending', rows.length, count(rows.length), Math.round(rows.length * 1.06), count(Math.round(rows.length * 1.06))),
    kpi('penPrem', 'Pending premium', premium, inrCompact(premium), premium * 1.04, inrCompact(premium * 1.04)),
    kpi('penAge', 'Average age', avgAge, `${avgAge.toFixed(1)} days`, avgAge * 1.08, `${(avgAge * 1.08).toFixed(1)} days`),
    kpi('pen7', 'Older than 7 days', over(7), count(over(7)), Math.round(over(7) * 1.05), count(Math.round(over(7) * 1.05))),
    kpi('pen15', 'Older than 15 days', over(15), count(over(15)), Math.round(over(15) * 1.11), count(Math.round(over(15) * 1.11))),
    kpi('pen30', 'Older than 30 days', over(30), count(over(30)), Math.round(over(30) * 0.93), count(Math.round(over(30) * 0.93))),
  ]
  const ageBands = [
    { label: '0–3', min: 0, max: 3 },
    { label: '4–7', min: 4, max: 7 },
    { label: '8–15', min: 8, max: 15 },
    { label: '16–30', min: 16, max: 30 },
    { label: '30+', min: 31, max: 99999 },
  ].map((b) => ({
    name: b.label,
    value: rows.filter((r) => r.ageDays >= b.min && r.ageDays <= b.max).length,
    premium: sum(rows.filter((r) => r.ageDays >= b.min && r.ageDays <= b.max).map((r) => r.annualPremium)),
  }))
  const byReason = groupSlice(rows, (r) => r.reason, (r) => r.annualPremium)
  const byStage = groupSlice(rows, (r) => r.currentStage, (r) => r.annualPremium)
  return delay({ rows, kpis, ageBands, byReason, byStage })
}

export async function getWpiReport(f: FilterState) {
  const rows = filterWpi(f)
  const premium = sum(rows.map((r) => r.annualPremium))
  const avgAge = rows.length ? sum(rows.map((r) => r.ageDays)) / rows.length : 0
  const fresh = rows.filter((r) => r.status === 'New').length
  const resolved = rows.filter((r) => r.status === 'Resolved').length
  const kpis: KpiValue[] = [
    kpi('wpiCount', 'Total WPI', rows.length, count(rows.length), Math.round(rows.length * 1.09), count(Math.round(rows.length * 1.09))),
    kpi('wpiPrem', 'WPI premium', premium, inrCompact(premium), premium * 1.06, inrCompact(premium * 1.06)),
    kpi('wpiNew', 'New cases', fresh, count(fresh), Math.round(fresh * 0.92), count(Math.round(fresh * 0.92))),
    kpi('wpiRes', 'Resolved cases', resolved, count(resolved), Math.round(resolved * 0.88), count(Math.round(resolved * 0.88))),
    kpi('wpiAge', 'Average age', avgAge, `${avgAge.toFixed(1)} days`, avgAge * 1.05, `${(avgAge * 1.05).toFixed(1)} days`),
  ]
  const byReason = groupSlice(rows, (r) => r.reason, (r) => r.annualPremium)
  const byStatus = groupSlice(rows, (r) => r.status, (r) => r.annualPremium)
  const byRegion = groupSlice(rows, (r) => r.region, (r) => r.annualPremium)
  return delay({ rows, kpis, byReason, byStatus, byRegion })
}

/* --------------------------------- shared --------------------------------- */

function kpi(
  key: string,
  label: string,
  value: number,
  display: string,
  prevValue: number,
  previousDisplay: string,
): KpiValue {
  return {
    key,
    label,
    value,
    display,
    changePct: change(value, prevValue),
    previousDisplay,
    spark: [],
  }
}

function groupSlice<T>(rows: T[], keyOf: (r: T) => string, premiumOf: (r: T) => number): SliceDatum[] {
  const m = new Map<string, SliceDatum>()
  for (const r of rows) {
    const k = keyOf(r)
    const cur = m.get(k) ?? { name: k, value: 0, premium: 0 }
    cur.value += 1
    cur.premium += premiumOf(r)
    m.set(k, cur)
  }
  return [...m.values()].sort((a, b) => b.value - a.value)
}

/* ---------------------------------- team ---------------------------------- */

export interface TeamMemberStats {
  employee: Employee
  directReportCount: number
  teamSize: number
  submissions: number
  submittedPremium: number
  issued: number
  issuedPremium: number
  commission: number
  placementRate: number
  pending: number
  pendingPremium: number
  wpi: number
  openRfis: number
  oldestPendingDays: number
  premiumChangePct: number
}

export interface TeamOverview {
  focus: Employee
  members: TeamMemberStats[]
  rollup: {
    submissions: number
    issued: number
    issuedPremium: number
    commission: number
    pending: number
    openRfis: number
  }
}

function statsFor(f: FilterState, employee: Employee): TeamMemberStats {
  const scoped: FilterState = { ...f, scopeEmployeeId: employee.id }
  const prev = previousRange(f.range)

  const subs = filterSubmissions(scoped)
  const iss = filterIssuances(scoped)
  const prevIss = filterIssuances(scoped, prev)
  const pen = filterPending(scoped)
  const wpi = filterWpi(scoped)

  const issuedPremium = sum(iss.map((i) => i.issuedPremium))

  return {
    employee,
    directReportCount: directReports(employee.id).length,
    teamSize: teamSize(employee.id),
    submissions: subs.length,
    submittedPremium: sum(subs.map((s) => s.annualPremium)),
    issued: iss.length,
    issuedPremium,
    commission: sum(iss.map((i) => i.commissionAmount)),
    placementRate: subs.length ? (iss.length / subs.length) * 100 : 0,
    pending: pen.length,
    pendingPremium: sum(pen.map((p) => p.annualPremium)),
    wpi: wpi.length,
    openRfis: sum(pen.map((p) => p.openRfis)),
    oldestPendingDays: pen.length ? Math.max(...pen.map((p) => p.ageDays)) : 0,
    premiumChangePct: change(issuedPremium, sum(prevIss.map((i) => i.issuedPremium))),
  }
}

/** Immediate reports of `managerId`, each with their own rolled-up book. */
export async function getTeamOverview(f: FilterState, managerId: string): Promise<TeamOverview> {
  const focus = getEmployee(managerId)
  if (!focus) throw new Error('That employee is not on the roster.')

  const members = directReports(managerId).map((employee) => statsFor(f, employee))

  return delay({
    focus,
    members,
    rollup: {
      submissions: sum(members.map((m) => m.submissions)),
      issued: sum(members.map((m) => m.issued)),
      issuedPremium: sum(members.map((m) => m.issuedPremium)),
      commission: sum(members.map((m) => m.commission)),
      pending: sum(members.map((m) => m.pending)),
      openRfis: sum(members.map((m) => m.openRfis)),
    },
  })
}

/* ----------------------------------- RFI ---------------------------------- */

export interface RfiSummary {
  open: number
  overdue: number
  respondedAwaitingReview: number
  closedOrWaived: number
  averageOpenAgeDays: number
  byResponsibility: SliceDatum[]
  byRequirement: SliceDatum[]
}

export function summariseRfis(rows: PendingRecord[]): RfiSummary {
  const all = rows.flatMap((r) => r.rfis)
  const open = all.filter((r) => r.status === 'Open' || r.status === 'Responded' || r.status === 'Under Review')

  const group = (keyOf: (r: (typeof all)[number]) => string): SliceDatum[] => {
    const m = new Map<string, SliceDatum>()
    for (const r of open) {
      const k = keyOf(r)
      const cur = m.get(k) ?? { name: k, value: 0, premium: 0 }
      cur.value += 1
      m.set(k, cur)
    }
    return [...m.values()].sort((a, b) => b.value - a.value)
  }

  return {
    open: open.length,
    overdue: all.filter((r) => r.overdue).length,
    respondedAwaitingReview: all.filter((r) => r.status === 'Responded' || r.status === 'Under Review').length,
    closedOrWaived: all.filter((r) => r.status === 'Closed' || r.status === 'Waived').length,
    averageOpenAgeDays: open.length ? sum(open.map((r) => r.ageDays)) / open.length : 0,
    byResponsibility: group((r) => r.responsibility),
    byRequirement: group((r) => r.requirement),
  }
}
