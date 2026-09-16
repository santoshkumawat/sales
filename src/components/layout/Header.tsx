import { Bell, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { NOTIFICATIONS } from '@/data/mockInsuranceData'
import { useAuth } from '@/context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useFilters } from '@/context/FilterContext'
import { initials } from '@/utils/format'
import { cn } from '@/utils/cn'

export function Header({ onOpenNav }: { onOpenNav: () => void }) {
  const { filters, setSearch } = useFilters()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.name ?? 'Signed out'
  const displayRole = user ? `${user.roleLabel}${user.region ? ` · ${user.region}` : ''}` : ''

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-4 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenNav} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 items-baseline gap-2 md:flex">
        <span className="text-[15px] font-semibold text-navy-900">Canara HSBC Life Insurance</span>
        <span className="text-[13px] text-navy-300">Sales analytics</span>
      </div>

      <div className="relative ml-auto w-full max-w-sm md:ml-6 md:mr-auto">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search proposal, policy, customer or advisor"
          className="h-9 w-full rounded-lg border border-line bg-paper pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 transition-colors hover:border-navy-200 focus:border-reef-500 focus:bg-white"
        />
      </div>

      <Popover
        trigger={({ toggle }) => (
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Notifications" className="relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-reef-600 px-1 text-[10px] font-semibold text-white">
              {NOTIFICATIONS.length}
            </span>
          </Button>
        )}
        className="w-[320px] p-0"
      >
        {() => (
          <div>
            <p className="border-b border-line px-4 py-2.5 text-[13px] font-semibold text-navy-800">Notifications</p>
            <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-paper">
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      n.tone === 'warn' && 'bg-amber-500',
                      n.tone === 'good' && 'bg-emerald-500',
                      n.tone === 'info' && 'bg-sky-500',
                    )}
                  />
                  <span>
                    <span className="block text-[13px] leading-snug text-navy-800">{n.title}</span>
                    <span className="mt-0.5 block text-[11px] text-navy-400">{n.meta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Popover>

      <Popover
        trigger={({ toggle }) => (
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-navy-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 text-[12px] font-semibold text-white">
              {initials(displayName)}
            </span>
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-[13px] font-medium text-navy-900">{displayName}</span>
              <span className="block text-[11px] text-navy-400">{displayRole}</span>
            </span>
          </button>
        )}
        className="w-[240px]"
      >
        {() => (
          <div className="py-1">
            <div className="px-3 py-2">
              <p className="text-[13px] font-medium text-navy-900">{displayName}</p>
              <p className="num text-[11px] text-navy-400">{user?.code}</p>
              <p className="truncate text-[11px] text-navy-400">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <Link
              to="/team"
              className="block rounded-lg px-3 py-2 text-[13px] text-navy-700 hover:bg-navy-50"
            >
              My team
            </Link>
            {['Saved views', 'Download history'].map((item) => (
              <button
                key={item}
                className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-navy-700 hover:bg-navy-50"
              >
                {item}
              </button>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              onClick={() => {
                signOut()
                navigate('/login', { replace: true })
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-navy-700 hover:bg-navy-50"
            >
              Sign out
            </button>
          </div>
        )}
      </Popover>
    </header>
  )
}
