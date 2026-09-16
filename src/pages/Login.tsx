import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { DEMO_ACCOUNTS, getEmployee } from '@/data/orgData'
import { BrandMark } from '@/components/layout/BrandLogo'

export default function Login() {
  const { signIn, signInAs } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#EAF2FB] px-4 py-10">
      {/* soft corporate sky */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #BFD9F5 0%, #DCEAFA 42%, #EAF2FB 70%, #F3F7FC 100%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-[50%] bg-white/70 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-[440px]">
        <div className="rounded-[28px] border border-white/70 bg-white/55 p-8 shadow-[0_24px_60px_-20px_rgba(0,76,151,0.35)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="h-11 w-11" />
            <h1 className="mt-6 text-[22px] font-bold tracking-tight text-[#0F1F3D]">
              Sign in with email
            </h1>
            <p className="mt-2 max-w-[19rem] text-[13.5px] leading-relaxed text-[#5B6B85]">
              Access your Bharat Sentinel Life sales book — submissions, issuance and pending, live.
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <label className="relative block">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99B5]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Email"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-white/80 bg-white/70 pl-10 pr-3 text-sm text-[#0F1F3D] shadow-sm outline-none transition placeholder:text-[#8A99B5] focus:border-[#004C97] focus:bg-white focus:ring-2 focus:ring-[#004C97]/25"
              />
            </label>

            <label className="relative block">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99B5]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Password"
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-white/80 bg-white/70 pl-10 pr-11 text-sm text-[#0F1F3D] shadow-sm outline-none transition placeholder:text-[#8A99B5] focus:border-[#004C97] focus:bg-white focus:ring-2 focus:ring-[#004C97]/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8A99B5] transition-colors hover:text-[#004C97]"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-[#DB0011]/25 bg-[#DB0011]/[0.07] px-3 py-2 text-[12.5px] text-[#B00010]"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={busy || !email}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F1F3D] text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(15,31,61,0.7)] transition-colors hover:bg-[#004C97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Signing in' : 'Get Started'}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[11.5px] font-medium uppercase tracking-wide text-[#8A99B5]">
            <span className="h-px flex-1 bg-[#004C97]/15" />
            Or
            <span className="h-px flex-1 bg-[#004C97]/15" />
          </div>

          <button
            type="button"
            onClick={() => setError('Single sign-on will be wired to the corporate identity provider.')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#004C97]/30 bg-white/70 text-sm font-semibold text-[#004C97] shadow-sm transition-colors hover:border-[#004C97] hover:bg-white"
          >
            <KeyRound className="h-4 w-4" />
            Sign in with SSO
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/70 bg-white/40 px-4 py-3 backdrop-blur">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#5B6B85]">
            Demo accounts
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const employee = getEmployee(account.employeeId)
              return (
                <button
                  key={account.employeeId}
                  type="button"
                  onClick={() => {
                    signInAs(account.employeeId)
                    navigate('/', { replace: true })
                  }}
                  className="rounded-lg border border-[#004C97]/20 bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#0F1F3D] transition-colors hover:border-[#004C97] hover:bg-[#EAF2FB]"
                  title={employee ? `${employee.name} · ${employee.roleLabel}` : undefined}
                >
                  {account.label}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#5B6B85]">
          Demonstration build. Credentials are not verified and all names, policies and premium
          figures are generated.
        </p>
      </div>
    </div>
  )
}
