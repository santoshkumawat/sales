/**
 * Deterministic mock dataset for the Canara HSBC Life Insurance sales reporting portal.
 * Everything here is fictional. No real customer, advisor or policy data.
 *
 * The generator is seeded so the numbers stay identical between reloads,
 * which makes period comparisons and drill-downs behave like a real backend.
 */

import type {
  IssuanceRecord,
  PendingReason,
  PendingRecord,
  PolicyStatus,
  SubmissionRecord,
  SubmissionStage,
  SubmissionStatus,
  WpiReason,
  WpiRecord,
  WpiStatus,
} from '@/types'
import type { RfiItem, RfiStatus } from '@/types'
import { daysBetween, isoDate } from '@/utils/format'
import {
  BRANCHES,
  BRANCH_LIST,
  CHANNELS,
  FIRST_NAMES,
  INCEPTION,
  LAST_NAMES,
  PRODUCTS,
  REGIONS,
  TODAY,
  mulberry32,
} from './reference'
import { ADVISOR_NAMES, MANAGER_NAMES, advisorsByBranch, ismByBranch } from './orgData'

export { BRANCHES, BRANCH_LIST, CHANNELS, INCEPTION, PRODUCTS, REGIONS, TODAY }
export const MANAGERS = MANAGER_NAMES
export const ADVISORS = ADVISOR_NAMES

/* ---------------------------------- seed --------------------------------- */

const rng = mulberry32(20260214)

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const weighted = <T,>(arr: readonly { v: T; w: number }[]): T => {
  const total = arr.reduce((s, x) => s + x.w, 0)
  let r = rng() * total
  for (const item of arr) {
    r -= item.w
    if (r <= 0) return item.v
  }
  return arr[arr.length - 1].v
}
const between = (min: number, max: number) => min + rng() * (max - min)
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1))

/* ------------------------------- reference ------------------------------- */

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'Submitted',
  'Under Review',
  'Pending',
  'Issued',
  'Declined',
  'Withdrawn',
]

export const STAGES: SubmissionStage[] = [
  'Data Entry',
  'Scrutiny',
  'Medical',
  'Underwriting',
  'Payment Realisation',
  'Policy Issuance',
  'Closed',
]

export const PENDING_REASONS: PendingReason[] = [
  'Medical',
  'Documentation',
  'Underwriting',
  'Payment',
  'Customer',
  'Advisor',
  'Verification',
]

export const PENDING_SUB_REASONS: Record<PendingReason, string[]> = {
  Medical: ['TMT report awaited', 'Medical slot not booked', 'Lab report under review'],
  Documentation: ['Address proof mismatch', 'Nominee proof pending', 'Illustration unsigned'],
  Underwriting: ['Financial underwriting referral', 'Occupation loading review', 'Reinsurer referral'],
  Payment: ['Cheque dishonoured', 'NACH mandate pending', 'Part premium received'],
  Customer: ['Customer unreachable', 'Awaiting customer confirmation', 'Revised plan requested'],
  Advisor: ['Advisor declaration pending', 'Sourcing code inactive', 'Requirement not uploaded'],
  Verification: ['Tele-verification failed', 'Video KYC re-attempt', 'PAN not seeded'],
}

export const WPI_REASONS: WpiReason[] = [
  'Requirement Pending',
  'Payment Not Realised',
  'Medical Report Awaited',
  'KYC Mismatch',
  'Income Proof Awaited',
  'Signature Mismatch',
  'Bank Mandate Pending',
]

export const WPI_STATUSES: WpiStatus[] = ['New', 'In Progress', 'Action Required', 'Resolved']

export const POLICY_STATUSES: PolicyStatus[] = ['In Force', 'Free Look', 'Lapsed', 'Surrendered']

const name = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

/* -------------------------------- calendar ------------------------------- */

const DAY = 86_400_000

/** More business lands recently and on weekdays — makes trends look plausible. */
function volumeFor(date: Date): number {
  const dow = date.getUTCDay()
  const dom = date.getUTCDate()
  const monthsAgo = (TODAY.getTime() - date.getTime()) / (DAY * 30.4)
  let base = 13.5
  if (dow === 0) base *= 0.25
  if (dow === 6) base *= 0.55
  if (dom >= 26) base *= 1.85 // month-end push
  const month = date.getUTCMonth()
  if (month === 2) base *= 1.6 // March tax season
  base *= 1 - Math.min(0.42, monthsAgo * 0.014) // gentle growth toward today
  return Math.max(0, Math.round(base * between(0.55, 1.5)))
}

function premiumFor(product: string): number {
  switch (product) {
    case 'SecureLife Term Plus':
      return Math.round(between(18_000, 92_000) / 500) * 500
    case 'WealthBuilder ULIP':
      return Math.round(between(90_000, 6_50_000) / 1000) * 1000
    case 'Guaranteed Income Plan':
      return Math.round(between(60_000, 3_20_000) / 1000) * 1000
    case 'Retirement Advantage':
      return Math.round(between(1_00_000, 8_00_000) / 1000) * 1000
    case 'Child Future Secure':
      return Math.round(between(45_000, 2_40_000) / 1000) * 1000
    default:
      return Math.round(between(30_000, 1_80_000) / 500) * 500
  }
}

function sumAssuredFor(product: string, premium: number): number {
  const multiple =
    product === 'SecureLife Term Plus' ? between(28, 60) : between(7, 14)
  return Math.round((premium * multiple) / 10_000) * 10_000
}

/* ----------------------------------- RFI ---------------------------------- */

const RFI_LIBRARY: Record<PendingReason, { requirement: string; detail: string; owner: RfiItem['responsibility'] }[]> = {
  Medical: [
    { requirement: 'TMT report', detail: 'Treadmill test at a panel diagnostic centre, report signed by the cardiologist.', owner: 'Customer' },
    { requirement: 'Fasting blood sugar', detail: 'FBS and HbA1c from a panel lab, drawn after a 10-hour fast.', owner: 'Customer' },
    { requirement: 'Attending physician statement', detail: 'Treating doctor to confirm diagnosis, duration and current medication.', owner: 'Customer' },
    { requirement: 'Medical slot confirmation', detail: 'Appointment to be booked with the empanelled centre nearest the customer.', owner: 'Branch ops' },
  ],
  Documentation: [
    { requirement: 'Address proof', detail: 'Current address proof matching the proposal form; the submitted copy is over six months old.', owner: 'Customer' },
    { requirement: 'Nominee identity proof', detail: 'Government photo ID for the nominee named in section 4.', owner: 'Customer' },
    { requirement: 'Signed benefit illustration', detail: 'Illustration to be signed on every page by the proposer and the advisor.', owner: 'Advisor' },
    { requirement: 'Revised proposal page', detail: 'Page 3 to be re-submitted; the correction is not countersigned.', owner: 'Advisor' },
  ],
  Underwriting: [
    { requirement: 'Financial questionnaire', detail: 'Form UW-14 to support the sum assured against declared income.', owner: 'Customer' },
    { requirement: 'Occupation declaration', detail: 'Written confirmation of duties and workplace hazard category.', owner: 'Customer' },
    { requirement: 'Reinsurer decision', detail: 'Case referred to the reinsurer; awaiting their acceptance terms.', owner: 'Underwriting' },
  ],
  Payment: [
    { requirement: 'Fresh premium instrument', detail: 'Earlier cheque returned unpaid; a fresh instrument or online payment is required.', owner: 'Customer' },
    { requirement: 'NACH mandate', detail: 'Signed mandate with the bank seal for the renewal standing instruction.', owner: 'Customer' },
    { requirement: 'Payment reconciliation', detail: 'Part premium credited; the balance is to be traced and tagged to the proposal.', owner: 'Branch ops' },
  ],
  Customer: [
    { requirement: 'Customer confirmation call', detail: 'Customer to be reached on the registered number to confirm plan terms.', owner: 'Advisor' },
    { requirement: 'Consent for revised terms', detail: 'Written acceptance of the counter-offer issued by underwriting.', owner: 'Customer' },
  ],
  Advisor: [
    { requirement: 'Advisor declaration', detail: 'Form A-9 confirming the advisor met the proposer in person.', owner: 'Advisor' },
    { requirement: 'Sourcing code correction', detail: 'Code on the proposal is inactive; the correct code is to be confirmed by the branch.', owner: 'Branch ops' },
  ],
  Verification: [
    { requirement: 'Video KYC re-attempt', detail: 'First attempt failed the liveness check; a fresh session link is to be issued.', owner: 'Customer' },
    { requirement: 'PAN seeding', detail: 'PAN to be validated against the income tax database before issuance.', owner: 'Branch ops' },
    { requirement: 'Tele-verification', detail: 'Verification call to be re-attempted; the customer was unreachable twice.', owner: 'Branch ops' },
  ],
}

const RFI_NOTES = [
  'Reminder sent, no response yet.',
  'Customer asked for time until the weekend.',
  'Advisor confirmed the document is being collected.',
  'Escalated to the branch operations desk.',
  'Left a voicemail on the registered number.',
  'Document received but not legible; re-upload requested.',
]

let rfiSeq = 0

function buildRfis(reason: PendingReason, pendingSince: string, raisedBy: string) {
  const library = RFI_LIBRARY[reason]
  const howMany = weighted([
    { v: 1, w: 58 },
    { v: 2, w: 30 },
    { v: 3, w: 12 },
  ])
  const chosen = [...library].sort(() => rng() - 0.5).slice(0, Math.min(howMany, library.length))

  const rfis: RfiItem[] = chosen.map((item, idx) => {
    const raisedOn = isoDate(
      new Date(Math.min(TODAY.getTime(), new Date(pendingSince).getTime() + idx * intBetween(0, 4) * DAY)),
    )
    const slaDays = reason === 'Medical' ? 10 : reason === 'Underwriting' ? 7 : 5
    const dueBy = isoDate(new Date(new Date(raisedOn).getTime() + slaDays * DAY))
    const ageDays = daysBetween(raisedOn, isoDate(TODAY))
    const status: RfiStatus =
      ageDays > 25
        ? weighted([
            { v: 'Closed' as const, w: 34 },
            { v: 'Under Review' as const, w: 26 },
            { v: 'Open' as const, w: 26 },
            { v: 'Waived' as const, w: 14 },
          ])
        : weighted([
            { v: 'Open' as const, w: 46 },
            { v: 'Responded' as const, w: 26 },
            { v: 'Under Review' as const, w: 20 },
            { v: 'Closed' as const, w: 8 },
          ])

    const followUpCount = Math.min(4, Math.floor(ageDays / 6))
    const followUps = Array.from({ length: followUpCount }, (_, i) => {
      const on = isoDate(new Date(Math.min(TODAY.getTime(), new Date(raisedOn).getTime() + (i + 1) * 6 * DAY)))
      return {
        on,
        channel: pick(['Email', 'Call', 'Branch visit', 'Portal upload', 'Courier'] as const),
        by: raisedBy,
        note: pick(RFI_NOTES),
      }
    })

    rfiSeq += 1
    return {
      id: `RFI-${String(rfiSeq).padStart(6, '0')}`,
      requirement: item.requirement,
      category: reason,
      detail: item.detail,
      raisedOn,
      dueBy,
      status,
      raisedBy,
      responsibility: item.owner,
      ageDays,
      overdue: (status === 'Open' || status === 'Responded') && isoDate(TODAY) > dueBy,
      followUps,
    }
  })

  const open = rfis.filter((r) => r.status !== 'Closed' && r.status !== 'Waived')
  return {
    rfis,
    openRfis: open.length,
    oldestRfiDays: open.length ? Math.max(...open.map((r) => r.ageDays)) : 0,
  }
}

/* ------------------------------- generation ------------------------------ */

const submissions: SubmissionRecord[] = []
const issuances: IssuanceRecord[] = []
const pendings: PendingRecord[] = []
const wpis: WpiRecord[] = []

let proposalSeq = 1000
let policySeq = 8000

for (let t = INCEPTION.getTime(); t <= TODAY.getTime(); t += DAY) {
  const date = new Date(t)
  const iso = isoDate(date)
  const n = volumeFor(date)

  for (let i = 0; i < n; i += 1) {
    proposalSeq += 1
    const region = weighted([
      { v: 'West' as const, w: 30 },
      { v: 'South' as const, w: 26 },
      { v: 'North' as const, w: 22 },
      { v: 'East' as const, w: 12 },
      { v: 'Central' as const, w: 10 },
    ])
    const branch = pick(BRANCHES[region])
    const channel = weighted([
      { v: 'Agency' as const, w: 38 },
      { v: 'Bancassurance' as const, w: 27 },
      { v: 'Broker' as const, w: 14 },
      { v: 'Direct' as const, w: 11 },
      { v: 'Digital' as const, w: 10 },
    ])
    const product = weighted([
      { v: 'SecureLife Term Plus' as const, w: 26 },
      { v: 'WealthBuilder ULIP' as const, w: 22 },
      { v: 'Guaranteed Income Plan' as const, w: 19 },
      { v: 'Smart Savings Plus' as const, w: 15 },
      { v: 'Retirement Advantage' as const, w: 11 },
      { v: 'Child Future Secure' as const, w: 7 },
    ])
    const advisorEmp = pick(advisorsByBranch[branch])
    const advisor = advisorEmp.name
    const employeeId = advisorEmp.id
    const manager = ismByBranch[branch].name
    const annualPremium = premiumFor(product)
    const sumAssured = sumAssuredFor(product, annualPremium)
    const proposalNo = `LIP-${date.getUTCFullYear()}-${String(proposalSeq).padStart(6, '0')}`
    const ageDays = daysBetween(iso, isoDate(TODAY))

    // Older cases have mostly settled; recent ones are still moving.
    const outcome = weighted([
      { v: 'issued' as const, w: ageDays > 45 ? 74 : 26 },
      { v: 'pending' as const, w: ageDays > 45 ? 6 : 40 },
      { v: 'wpi' as const, w: ageDays > 45 ? 5 : 18 },
      { v: 'inflight' as const, w: ageDays > 45 ? 3 : 12 },
      { v: 'declined' as const, w: 8 },
      { v: 'withdrawn' as const, w: 4 },
    ])

    let status: SubmissionStatus = 'Submitted'
    let currentStage: SubmissionStage = 'Scrutiny'

    if (outcome === 'issued') {
      status = 'Issued'
      currentStage = 'Policy Issuance'
      const tat = Math.max(2, Math.round(between(3, 34)))
      const issueDate = new Date(t + tat * DAY)
      if (issueDate.getTime() <= TODAY.getTime()) {
        policySeq += 1
        const shortfall = rng() < 0.18 ? between(0.82, 0.97) : 1
        issuances.push({
          id: `iss-${proposalSeq}`,
        employeeId,
          issueDate: isoDate(issueDate),
          proposalNo,
          policyNo: `POL-${issueDate.getUTCFullYear()}-${String(policySeq).padStart(6, '0')}`,
          customer: name(),
          product,
          channel,
          branch,
          region,
          manager,
          advisor,
          submittedPremium: annualPremium,
          issuedPremium: Math.round((annualPremium * shortfall) / 100) * 100,
          sumAssured,
          submissionDate: iso,
          turnaroundDays: tat,
          policyStatus: weighted([
            { v: 'In Force' as const, w: 86 },
            { v: 'Free Look' as const, w: 6 },
            { v: 'Lapsed' as const, w: 6 },
            { v: 'Surrendered' as const, w: 2 },
          ]),
        })
      } else {
        status = 'Under Review'
        currentStage = 'Underwriting'
      }
    } else if (outcome === 'pending') {
      status = 'Pending'
      const reason = weighted([
        { v: 'Medical' as const, w: 24 },
        { v: 'Documentation' as const, w: 21 },
        { v: 'Underwriting' as const, w: 17 },
        { v: 'Payment' as const, w: 14 },
        { v: 'Customer' as const, w: 11 },
        { v: 'Verification' as const, w: 8 },
        { v: 'Advisor' as const, w: 5 },
      ])
      currentStage =
        reason === 'Medical'
          ? 'Medical'
          : reason === 'Payment'
            ? 'Payment Realisation'
            : reason === 'Underwriting'
              ? 'Underwriting'
              : 'Scrutiny'
      const pendingSince = new Date(t + intBetween(1, 6) * DAY)
      const since = pendingSince.getTime() > TODAY.getTime() ? iso : isoDate(pendingSince)
      const pendAge = daysBetween(since, isoDate(TODAY))
      pendings.push({
        id: `pen-${proposalSeq}`,
        employeeId,
        proposalNo,
        customer: name(),
        product,
        channel,
        branch,
        region,
        manager,
        advisor,
        annualPremium,
        sumAssured,
        submissionDate: iso,
        pendingSince: since,
        ageDays: pendAge,
        reason,
        subReason: pick(PENDING_SUB_REASONS[reason]),
        currentStage,
        priority: pendAge > 30 ? 'Critical' : pendAge > 15 ? 'High' : 'Normal',
        lastFollowUp: isoDate(new Date(Math.min(TODAY.getTime(), t + intBetween(2, 20) * DAY))),
        ...buildRfis(reason, since, manager),
      })
    } else if (outcome === 'wpi') {
      status = 'Pending'
      currentStage = 'Underwriting'
      const wpiDate = new Date(Math.min(TODAY.getTime(), t + intBetween(2, 9) * DAY))
      const wAge = daysBetween(isoDate(wpiDate), isoDate(TODAY))
      wpis.push({
        id: `wpi-${proposalSeq}`,
        employeeId,
        proposalNo,
        customer: name(),
        product,
        channel,
        branch,
        region,
        manager,
        advisor,
        annualPremium,
        sumAssured,
        wpiDate: isoDate(wpiDate),
        ageDays: wAge,
        reason: weighted([
          { v: 'Requirement Pending' as const, w: 24 },
          { v: 'Payment Not Realised' as const, w: 19 },
          { v: 'Medical Report Awaited' as const, w: 17 },
          { v: 'KYC Mismatch' as const, w: 13 },
          { v: 'Income Proof Awaited' as const, w: 11 },
          { v: 'Signature Mismatch' as const, w: 9 },
          { v: 'Bank Mandate Pending' as const, w: 7 },
        ]),
        status:
          wAge <= 2
            ? 'New'
            : weighted([
                { v: 'In Progress' as const, w: 34 },
                { v: 'Action Required' as const, w: 26 },
                { v: 'Resolved' as const, w: wAge > 20 ? 46 : 18 },
                { v: 'New' as const, w: 8 },
              ]),
        owner: manager,
        nextAction: pick([
          'Call customer for requirement',
          'Re-trigger payment link',
          'Schedule medical appointment',
          'Upload corrected KYC',
          'Escalate to branch ops',
          'Awaiting underwriter response',
        ]),
        lastUpdated: isoDate(new Date(Math.min(TODAY.getTime(), wpiDate.getTime() + intBetween(1, 12) * DAY))),
      })
    } else if (outcome === 'declined') {
      status = 'Declined'
      currentStage = 'Closed'
    } else if (outcome === 'withdrawn') {
      status = 'Withdrawn'
      currentStage = 'Closed'
    } else {
      status = 'Under Review'
      currentStage = pick(['Data Entry', 'Scrutiny', 'Underwriting'] as SubmissionStage[])
    }

    submissions.push({
      id: `sub-${proposalSeq}`,
        employeeId,
      submissionDate: iso,
      proposalNo,
      customer: name(),
      product,
      channel,
      branch,
      region,
      salesManager: manager,
      advisor,
      annualPremium,
      sumAssured,
      status,
      currentStage,
    })
  }
}

export const mockSubmissions: SubmissionRecord[] = submissions
export const mockIssuances: IssuanceRecord[] = issuances
export const mockPending: PendingRecord[] = pendings
export const mockWpi: WpiRecord[] = wpis

export const NOTIFICATIONS = [
  { id: 'n1', title: '42 cases crossed the 15-day pending mark', meta: 'Pending desk · 20 min ago', tone: 'warn' as const },
  { id: 'n2', title: 'WPI dump refreshed for 09 Sep 2026', meta: 'Batch LIP_WPI_D · 06:15 IST', tone: 'info' as const },
  { id: 'n3', title: 'West region crossed ₹8 Cr issued premium MTD', meta: 'Analytics · 2 hrs ago', tone: 'good' as const },
  { id: 'n4', title: 'Bancassurance placement rate down 3.1 pts week on week', meta: 'Channel watch · Yesterday', tone: 'warn' as const },
]
