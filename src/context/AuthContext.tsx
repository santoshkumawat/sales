import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getEmployee, employees, type Employee } from '@/data/orgData'

const STORAGE_KEY = 'lifepulse.session'

/**
 * Demo authentication.
 *
 * There is no password check and no token — the sign-in form resolves an email
 * to an employee in the mock org chart and stores the id in localStorage. It
 * exists so the hierarchy scoping has someone to scope to.
 *
 * To make this real, replace `signIn` with a call to your auth endpoint, keep
 * the returned employee in state, and hold the token in an httpOnly cookie
 * rather than localStorage. Nothing else in the app needs to change.
 */
interface AuthContextValue {
  user: Employee | null
  signIn: (email: string) => Promise<Employee>
  signInAs: (employeeId: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Employee | null {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY)
    return id ? (getEmployee(id) ?? null) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(readSession)

  const persist = useCallback((employee: Employee | null) => {
    try {
      if (employee) window.localStorage.setItem(STORAGE_KEY, employee.id)
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — the session just won't survive a reload */
    }
    setUser(employee)
  }, [])

  const signIn = useCallback(
    async (email: string) => {
      const normalised = email.trim().toLowerCase()
      const match =
        employees.find((e) => e.email.toLowerCase() === normalised) ??
        employees.find((e) => e.code.toLowerCase() === normalised) ??
        employees.find((e) => e.name.toLowerCase() === normalised)

      await new Promise((r) => setTimeout(r, 500))
      if (!match) throw new Error('That email is not on the sales roster. Try a demo account below.')
      persist(match)
      return match
    },
    [persist],
  )

  const signInAs = useCallback(
    (employeeId: string) => {
      const employee = getEmployee(employeeId)
      if (employee) persist(employee)
    },
    [persist],
  )

  const signOut = useCallback(() => persist(null), [persist])

  const value = useMemo(() => ({ user, signIn, signInAs, signOut }), [user, signIn, signInAs, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
