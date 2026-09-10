import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { FilterProvider } from '@/context/FilterContext'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import MyTeam from '@/pages/MyTeam'
import SubmissionReport from '@/pages/SubmissionReport'
import IssuanceReport from '@/pages/IssuanceReport'
import PendingReport from '@/pages/PendingReport'
import RfiReport from '@/pages/RfiReport'
import WpiDumpReport from '@/pages/WpiDumpReport'

/**
 * Filters are keyed on the signed-in user so switching accounts starts a clean
 * filter state scoped to that person's book rather than inheriting the last one.
 */
function ScopedApp() {
  const { user } = useAuth()

  return (
    <FilterProvider key={user?.id ?? 'anonymous'} rootEmployeeId={user?.id ?? null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="team" element={<MyTeam />} />
          <Route path="submission" element={<SubmissionReport />} />
          <Route path="issuance" element={<IssuanceReport />} />
          <Route path="pending" element={<PendingReport />} />
          <Route path="rfi" element={<RfiReport />} />
          <Route path="wpi-dump" element={<WpiDumpReport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FilterProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ScopedApp />
    </AuthProvider>
  )
}
