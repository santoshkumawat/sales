/**
 * The sales org chart.
 *
 * Reporting line, top down:
 *   NSM    National Sales Manager
 *   SRZSM  Senior Zonal Sales Manager
 *   ZSM    Zonal Sales Manager        (one per region)
 *   TM     Territory Manager
 *   ISM    Insurance Sales Manager    (branch level)
 *   ISO    Insurance Sales Officer
 *   Advisor
 *
 * A user sees their own book plus everything under them, which is what drives
 * the scoping on every report. Replace `buildOrg()` with an API call to your
 * hierarchy service and the rest of the portal keeps working.
 */

import { BRANCHES, FIRST_NAMES, LAST_NAMES, REGIONS, ZONES, mulberry32 } from './reference'

export type OrgRole = 'NSM' | 'SRZSM' | 'ZSM' | 'TM' | 'ISM' | 'ISO' | 'Advisor'

export interface Employee {
  id: string
  code: string
  name: string
  role: OrgRole
  roleLabel: string
  managerId: string | null
  region: string | null
  zone: string | null
  branch: string | null
  email: string
  joinedOn: string
}

export const ROLE_LABEL: Record<OrgRole, string> = {
  NSM: 'National Sales Manager',
  SRZSM: 'Senior Zonal Sales Manager',
  ZSM: 'Zonal Sales Manager',
  TM: 'Territory Manager',
  ISM: 'Insurance Sales Manager',
  ISO: 'Insurance Sales Officer',
  Advisor: 'Advisor',
}

const rng = mulberry32(90210)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

function slugEmail(name: string, code: string) {
  return `${name.toLowerCase().replace(/[^a-z]/g, '.')}.${code.slice(-4)}@canarahsbclife.example`
}

function buildOrg() {
  const employees: Employee[] = []
  let seq = 100

  const add = (
    name: string,
    role: OrgRole,
    managerId: string | null,
    scope: { region?: string | null; zone?: string | null; branch?: string | null },
  ): Employee => {
    seq += 1
    const code = `${role}-${String(seq).padStart(4, '0')}`
    const emp: Employee = {
      id: code,
      code,
      name,
      role,
      roleLabel: ROLE_LABEL[role],
      managerId,
      region: scope.region ?? null,
      zone: scope.zone ?? null,
      branch: scope.branch ?? null,
      email: slugEmail(name, code),
      joinedOn: `20${18 + Math.floor(rng() * 7)}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-01`,
    }
    employees.push(emp)
    return emp
  }

  const nsm = add('Rukmini Balakrishnan', 'NSM', null, {})

  /** branch -> advisor names, so records can be attributed back to a person. */
  const advisorsByBranch: Record<string, Employee[]> = {}
  /** branch -> its ISM, used as the "sales manager" on every record. */
  const ismByBranch: Record<string, Employee> = {}

  for (const [zone, regions] of Object.entries(ZONES)) {
    const srzsm = add(fullName(), 'SRZSM', nsm.id, { zone })

    for (const region of regions) {
      // Santosh runs West so the default demo login lands on a populated book.
      const zsm = add(region === 'West' ? 'Santosh Kumar' : fullName(), 'ZSM', srzsm.id, { zone, region })

      const branches = BRANCHES[region]
      const territories = Math.max(1, Math.round(branches.length / 2))
      const tms = Array.from({ length: territories }, () => add(fullName(), 'TM', zsm.id, { zone, region }))

      branches.forEach((branch, i) => {
        const tm = tms[i % tms.length]
        const ism = add(fullName(), 'ISM', tm.id, { zone, region, branch })
        ismByBranch[branch] = ism

        const isos = Array.from({ length: 3 }, () => add(fullName(), 'ISO', ism.id, { zone, region, branch }))
        advisorsByBranch[branch] = isos.flatMap((iso) =>
          Array.from({ length: 4 }, () => add(fullName(), 'Advisor', iso.id, { zone, region, branch })),
        )
      })
    }
  }

  return { employees, advisorsByBranch, ismByBranch }
}

const ORG = buildOrg()

export const employees: Employee[] = ORG.employees
export const advisorsByBranch = ORG.advisorsByBranch
export const ismByBranch = ORG.ismByBranch

const byId = new Map(employees.map((e) => [e.id, e]))
const childrenByManager = new Map<string, Employee[]>()
for (const e of employees) {
  if (!e.managerId) continue
  const list = childrenByManager.get(e.managerId) ?? []
  list.push(e)
  childrenByManager.set(e.managerId, list)
}

export function getEmployee(id: string | null | undefined): Employee | undefined {
  return id ? byId.get(id) : undefined
}

/** Immediate reports only — the list shown on the My team page. */
export function directReports(id: string): Employee[] {
  return [...(childrenByManager.get(id) ?? [])].sort((a, b) => a.name.localeCompare(b.name))
}

/** The employee plus everyone beneath them. Used to scope every report. */
export function subtreeIds(id: string): Set<string> {
  const out = new Set<string>()
  const stack = [id]
  while (stack.length) {
    const current = stack.pop()!
    if (out.has(current)) continue
    out.add(current)
    for (const child of childrenByManager.get(current) ?? []) stack.push(child.id)
  }
  return out
}

/** Head count under an employee, excluding themselves. */
export function teamSize(id: string): number {
  return subtreeIds(id).size - 1
}

/** Manager chain from the top down to the given employee, for breadcrumbs. */
export function chainTo(id: string): Employee[] {
  const chain: Employee[] = []
  let current = byId.get(id)
  while (current) {
    chain.unshift(current)
    current = current.managerId ? byId.get(current.managerId) : undefined
  }
  return chain
}

export const MANAGER_NAMES = employees
  .filter((e) => e.role === 'ISM' || e.role === 'TM')
  .map((e) => e.name)
  .sort()

export const ADVISOR_NAMES = employees
  .filter((e) => e.role === 'Advisor')
  .map((e) => e.name)
  .sort()

/**
 * Demo sign-ins. A real deployment would delete this and authenticate against
 * the identity provider — see AuthContext for the single swap point.
 */
export const DEMO_ACCOUNTS: { employeeId: string; label: string }[] = [
  { employeeId: employees.find((e) => e.role === 'NSM')!.id, label: 'National view' },
  { employeeId: employees.find((e) => e.name === 'Santosh Kumar')!.id, label: 'Zonal view — West' },
  { employeeId: employees.find((e) => e.role === 'ISM')!.id, label: 'Branch view' },
]
