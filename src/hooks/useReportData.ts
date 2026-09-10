import { useEffect, useState } from 'react'
import type { FilterState } from '@/types'
import { useFilters } from '@/context/FilterContext'

/**
 * Runs a service call whenever the filter state changes and exposes the
 * loading flag the pages use to swap in skeletons.
 */
export function useReportData<T>(loader: (f: FilterState) => Promise<T>, depKey: string | number = '') {
  const { filters } = useFilters()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loader(filters)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load this report.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), depKey])

  return { data, loading, error, filters }
}
