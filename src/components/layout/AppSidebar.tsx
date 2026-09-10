import { NavLink } from 'react-router-dom'
import {
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react'
import { BrandLogo, BrandMark } from './BrandLogo'
import { cn } from '@/utils/cn'
import { Tooltip } from '@/components/ui/tooltip'
import { mockPending, mockWpi } from '@/data/mockInsuranceData'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/team', label: 'My team', icon: Users },
  { to: '/submission', label: 'Submission', icon: ClipboardList },
  { to: '/issuance', label: 'Issuance', icon: ShieldCheck },
  { to: '/pending', label: 'Pending', icon: Timer },
  { to: '/wpi-dump', label: 'WPI Dump', icon: FileStack },
]

const openPending = mockPending.filter((p) => p.ageDays > 15).length
const openWpi = mockWpi.filter((w) => w.status === 'Action Required').length

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-900 text-navy-100 transition-[width,transform] duration-200 lg:static lg:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-[248px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-white/10', collapsed ? 'justify-center px-2' : 'px-4')}>
          {collapsed ? <BrandMark className="h-7 w-7 shrink-0" /> : <BrandLogo />}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium text-navy-400">Reporting</p>
          )}
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const badge = to === '/pending' ? openPending : to === '/wpi-dump' ? openWpi : 0
            const link = (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-white/10 font-medium text-white'
                      : 'text-navy-200 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-reef-400 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="num rounded-md bg-reef-500/20 px-1.5 py-0.5 text-[11px] font-medium text-reef-200">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
            return collapsed ? (
              <Tooltip key={to} content={label} side="right" className="whitespace-nowrap">
                {link}
              </Tooltip>
            ) : (
              link
            )
          })}
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 rounded-xl bg-white/5 p-3">
            <p className="text-[12px] font-medium text-white">Batch refresh</p>
            <p className="mt-1 text-[11px] leading-relaxed text-navy-300">
              Submission, issuance and WPI feeds last synced today at 06:15 IST.
            </p>
          </div>
        )}

        <button
          onClick={onToggle}
          className={cn(
            'hidden h-11 items-center gap-3 border-t border-white/10 px-4 text-[13px] text-navy-300 transition-colors hover:bg-white/5 hover:text-white lg:flex',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  )
}
