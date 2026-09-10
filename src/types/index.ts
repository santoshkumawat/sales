export type PeriodKey = 'FTD' | 'MTD' | 'YTD' | 'ITD' | 'CUSTOM'

export interface DateRange {
  start: string // ISO yyyy-mm-dd
  end: string
}

export interface FilterState {
  period: PeriodKey
  range: DateRange
  products: string[]
  channels: string[]
  regions: string[]
  branches: string[]
  statuses: string[]
  managers: string[]
  minPremium?: number
  maxPremium?: number
  search: string
  /** Employee whose book (self + downline) the reports are scoped to. */
  scopeEmployeeId: string | null
}

export type SubmissionStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Pending'
  | 'Issued'
  | 'Declined'
  | 'Withdrawn'

export type SubmissionStage =
  | 'Data Entry'
  | 'Scrutiny'
  | 'Medical'
  | 'Underwriting'
  | 'Payment Realisation'
  | 'Policy Issuance'
  | 'Closed'

export interface SubmissionRecord {
  id: string
  /** Advisor who owns the case — links the record to the org chart. */
  employeeId: string
  submissionDate: string
  proposalNo: string
  customer: string
  product: string
  channel: string
  branch: string
  region: string
  salesManager: string
  advisor: string
  annualPremium: number
  sumAssured: number
  status: SubmissionStatus
  currentStage: SubmissionStage
}

export type PolicyStatus = 'In Force' | 'Free Look' | 'Lapsed' | 'Surrendered'

export interface IssuanceRecord {
  id: string
  employeeId: string
  issueDate: string
  proposalNo: string
  policyNo: string
  customer: string
  product: string
  channel: string
  branch: string
  region: string
  manager: string
  advisor: string
  submittedPremium: number
  issuedPremium: number
  sumAssured: number
  submissionDate: string
  turnaroundDays: number
  policyStatus: PolicyStatus
}

export type PendingReason =
  | 'Medical'
  | 'Documentation'
  | 'Underwriting'
  | 'Payment'
  | 'Customer'
  | 'Advisor'
  | 'Verification'

export type PendingPriority = 'Critical' | 'High' | 'Normal'

export type RfiStatus = 'Open' | 'Responded' | 'Under Review' | 'Waived' | 'Closed'

export type RfiChannel = 'Email' | 'Call' | 'Branch visit' | 'Portal upload' | 'Courier'

export interface RfiFollowUp {
  on: string
  channel: RfiChannel
  by: string
  note: string
}

/** Requirement for information raised by underwriting against a proposal. */
export interface RfiItem {
  id: string
  requirement: string
  category: PendingReason
  detail: string
  raisedOn: string
  dueBy: string
  status: RfiStatus
  raisedBy: string
  responsibility: 'Customer' | 'Advisor' | 'Branch ops' | 'Underwriting'
  ageDays: number
  overdue: boolean
  followUps: RfiFollowUp[]
}

export interface PendingRecord {
  id: string
  employeeId: string
  proposalNo: string
  customer: string
  product: string
  channel: string
  branch: string
  region: string
  manager: string
  advisor: string
  annualPremium: number
  sumAssured: number
  submissionDate: string
  pendingSince: string
  ageDays: number
  reason: PendingReason
  subReason: string
  currentStage: SubmissionStage
  priority: PendingPriority
  lastFollowUp: string
  rfis: RfiItem[]
  openRfis: number
  oldestRfiDays: number
}

export type WpiStatus = 'New' | 'In Progress' | 'Action Required' | 'Resolved'

export type WpiReason =
  | 'Requirement Pending'
  | 'Payment Not Realised'
  | 'Medical Report Awaited'
  | 'KYC Mismatch'
  | 'Income Proof Awaited'
  | 'Signature Mismatch'
  | 'Bank Mandate Pending'

export interface WpiRecord {
  id: string
  employeeId: string
  proposalNo: string
  customer: string
  product: string
  channel: string
  branch: string
  region: string
  manager: string
  advisor: string
  annualPremium: number
  sumAssured: number
  wpiDate: string
  ageDays: number
  reason: WpiReason
  status: WpiStatus
  owner: string
  nextAction: string
  lastUpdated: string
}

export interface KpiValue {
  key: string
  label: string
  value: number
  display: string
  changePct: number
  previousDisplay: string
  spark: number[]
  hint?: string
}

export interface TrendPoint {
  label: string
  submissions: number
  issuance: number
  submittedPremium: number
  issuedPremium: number
}

export interface SliceDatum {
  name: string
  value: number
  premium: number
}

export interface ChannelPerformance {
  channel: string
  submissions: number
  issued: number
  premium: number
  placementRate: number
}

export interface RegionRanking {
  rank: number
  region: string
  submissions: number
  issued: number
  premium: number
  placementRate: number
  changePct: number
}

export interface TopPerformer {
  rank: number
  advisor: string
  branch: string
  region: string
  channel: string
  policies: number
  premium: number
  placementRate: number
}
