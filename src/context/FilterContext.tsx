import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DateRange, FilterState, PeriodKey } from '@/types'
import { rangeForPeriod } from '@/services/reportService'

const DEFAULT_PERIOD: PeriodKey = 'MTD'

const emptyFilters = (scopeEmployeeId: string | null): FilterState => ({
  period: DEFAULT_PERIOD,
  range: rangeForPeriod(DEFAULT_PERIOD),
  products: [],
  channels: [],
  regions: [],
  branches: [],
  statuses: [],
  managers: [],
  minPremium: undefined,
  maxPremium: undefined,
  search: '',
  scopeEmployeeId,
})

interface FilterContextValue {
  filters: FilterState
  setPeriod: (period: PeriodKey, custom?: DateRange) => void
  setSearch: (value: string) => void
  toggleValue: (key: MultiKey, value: string) => void
  setValues: (key: MultiKey, values: string[]) => void
  setPremiumBand: (min?: number, max?: number) => void
  removeChip: (key: MultiKey, value: string) => void
  /** Narrow every report to one employee's book (self + downline). */
  setScope: (employeeId: string | null) => void
  rootEmployeeId: string | null
  reset: () => void
  clearDimensions: () => void
}

export type MultiKey = 'products' | 'channels' | 'regions' | 'branches' | 'statuses' | 'managers'

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({
  children,
  rootEmployeeId,
}: {
  children: ReactNode
  /** The signed-in user — the widest book they are allowed to see. */
  rootEmployeeId: string | null
}) {
  const [filters, setFilters] = useState<FilterState>(() => emptyFilters(rootEmployeeId))

  const setPeriod = useCallback((period: PeriodKey, custom?: DateRange) => {
    setFilters((f) => ({ ...f, period, range: rangeForPeriod(period, custom ?? f.range) }))
  }, [])

  const setSearch = useCallback((search: string) => setFilters((f) => ({ ...f, search })), [])

  const toggleValue = useCallback((key: MultiKey, value: string) => {
    setFilters((f) => {
      const list = f[key]
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
    })
  }, [])

  const setValues = useCallback((key: MultiKey, values: string[]) => {
    setFilters((f) => ({ ...f, [key]: values }))
  }, [])

  const setPremiumBand = useCallback((minPremium?: number, maxPremium?: number) => {
    setFilters((f) => ({ ...f, minPremium, maxPremium }))
  }, [])

  const removeChip = useCallback((key: MultiKey, value: string) => {
    setFilters((f) => ({ ...f, [key]: f[key].filter((v) => v !== value) }))
  }, [])

  const setScope = useCallback(
    (employeeId: string | null) => setFilters((f) => ({ ...f, scopeEmployeeId: employeeId ?? rootEmployeeId })),
    [rootEmployeeId],
  )

  const reset = useCallback(() => setFilters(emptyFilters(rootEmployeeId)), [rootEmployeeId])

  const clearDimensions = useCallback(() => {
    setFilters((f) => ({
      ...f,
      products: [],
      channels: [],
      regions: [],
      branches: [],
      statuses: [],
      managers: [],
      minPremium: undefined,
      maxPremium: undefined,
      search: '',
    }))
  }, [])

  const value = useMemo(
    () => ({
      filters,
      setPeriod,
      setSearch,
      toggleValue,
      setValues,
      setPremiumBand,
      removeChip,
      setScope,
      rootEmployeeId,
      reset,
      clearDimensions,
    }),
    [filters, setPeriod, setSearch, toggleValue, setValues, setPremiumBand, removeChip, setScope, rootEmployeeId, reset, clearDimensions],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside <FilterProvider>')
  return ctx
}

export function activeFilterCount(f: FilterState): number {
  return (
    f.products.length +
    f.channels.length +
    f.regions.length +
    f.branches.length +
    f.statuses.length +
    f.managers.length +
    (f.minPremium != null || f.maxPremium != null ? 1 : 0)
  )
}
