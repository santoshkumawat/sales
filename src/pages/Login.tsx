import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { DEMO_ACCOUNTS, getEmployee } from '@/data/orgData'
import { mockIssuances, mockSubmissions } from '@/data/mockInsuranceData'
import { BRANCH_LIST } from '@/data/reference'
import { count, inrCompact } from '@/utils/format'

/** Twelve monthly premium totals, used to draw the ridge on the brand panel. */
function usePremiumRidge() {
  return useMemo(() => {
    const buckets = new Map<string, { submitted: number; issued: number }>()
    const key = (iso: string) => iso.slice(0, 7)
    for (const s of mockSubmissions) {
      const b = buckets.get(key(s.submissionDate)) ?? { submitted: 0, issued: 0 }
      b.submitted += s.annualPremium
      buckets.set(key(s.submissionDate), b)
    }
    for (const i of mockIssuances) {
      const b = buckets.get(key(i.issueDate)) ?? { submitted: 0, issued: 0 }
      b.issued += i.issuedPremium
      buckets.set(key(i.issueDate), b)
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14)
  }, [])
}

function ridgePath(values: number[], max: number, width: number, height: number, close: boolean) {
  if (values.length === 0) return ''
  const step = width / (values.length - 1)
  const points = values.map((v, i) => [i * step, height - (v / max) * height] as const)
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i += 1) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    const cx = (px + x) / 2
    d += ` C ${cx} ${py} ${cx} ${y} ${x} ${y}`
  }
  if (close) d += ` L ${width} ${height} L 0 ${height} Z`
  return d
}

function BrandPanel() {
  const ridge = usePremiumRidge()
  const submitted = ridge.map(([, v]) => v.submitted)
  const issued = ridge.map(([, v]) => v.issued)
  const max = Math.max(...submitted, 1)

  const totalIssued = mockIssuances.reduce((s, i) => s + i.issuedPremium, 0)

  const W = 560
  const H = 220

  return (
    <div className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between">
      {/* faint grid, sized to the ridge below so the panel reads as one chart */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden>
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#5C7CA9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative px-12 pt-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-reef-500 text-white">
            <BarChart3 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block text-[16px] font-semibold text-white">LifePulse</span>
            <span className="block text-[12px] text-navy-300">Bharat Sentinel Life</span>
          </span>
        </div>

        <h2 className="mt-16 max-w-md text-[32px] font-semibold leading-[1.2] tracking-tight text-white">
          Your submission, issuance and pending books, live instead of downloaded.
        </h2>
        <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-navy-300">
          The batch files land at six every morning and are stale by ten. This is the same data, filtered
          the way you actually work: by period, by branch, and by the people who report to you.
        </p>

        <dl className="mt-10 flex gap-10">
          {[
            { label: 'Issued premium, inception to date', value: inrCompact(totalIssued) },
            { label: 'Policies issued', value: count(mockIssuances.length) },
            { label: 'Branches reporting', value: count(BRANCH_LIST.length) },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="num text-[22px] font-semibold text-white">{stat.value}</dd>
              <dt className="mt-1 max-w-[120px] text-[11px] leading-snug text-navy-400">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="submittedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C7CA9" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#5C7CA9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#118E85" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#118E85" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path d={ridgePath(submitted, max, W, H, true)} fill="url(#submittedFill)" />
        <path d={ridgePath(issued, max, W, H, true)} fill="url(#issuedFill)" />
        <path
          d={ridgePath(submitted, max, W, H, false)}
          fill="none"
          stroke="#8AA3C6"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="ridge-line"
        />
        <path
          d={ridgePath(issued, max, W, H, false)}
          fill="none"
          stroke="#66C6BC"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="ridge-line ridge-line-delayed"
        />
      </svg>

      <p className="relative px-12 pb-8 text-[11px] text-navy-400">
        Submitted against issued premium, last 14 months. Demonstration data only.
      </p>
    </div>
  )
}

export default function Login() {
  const { signIn, signInAs } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn(email)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white">
              <BarChart3 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold text-navy-900">LifePulse</span>
              <span className="block text-[12px] text-navy-400">Bharat Sentinel Life</span>
            </span>
          </div>

          <h1 className="text-[24px] font-semibold tracking-tight text-navy-900">Sign in</h1>
          <p className="mt-1.5 text-[13px] text-navy-400">
            Use the email on your sales roster. Reports open scoped to your own book.
          </p>

          <div className="mt-7 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-navy-700">Work email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="name.surname.1234@bharatsentinel.example"
                  className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 transition-colors hover:border-navy-200 focus:border-reef-500"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-navy-700">Password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="Any value — this demo does not check it"
                  className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 transition-colors hover:border-navy-200 focus:border-reef-500"
                />
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            )}

            <Button variant="primary" size="lg" className="w-full" onClick={submit} disabled={busy || !email}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Signing in' : 'Sign in'}
            </Button>
          </div>

          <div className="mt-8">
            <p className="text-[12px] font-medium text-navy-500">Or open a demo account</p>
            <div className="mt-2 space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => {
                const employee = getEmployee(account.employeeId)!
                return (
                  <button
                    key={account.employeeId}
                    onClick={() => {
                      signInAs(account.employeeId)
                      navigate('/', { replace: true })
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-reef-300 hover:bg-reef-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-navy-900">{account.label}</span>
                      <span className="block truncate text-[11px] text-navy-400">
                        {employee.name} · {employee.roleLabel}
                        {employee.region ? ` · ${employee.region}` : ''}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-navy-200 transition-colors group-hover:text-reef-600" />
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-8 text-[11px] leading-relaxed text-navy-400">
            Demonstration build. Credentials are not verified and all names, policies and premium figures
            are generated.
          </p>
        </div>
      </div>
    </div>
  )
}
