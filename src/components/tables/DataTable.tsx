import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { downloadCsv, toCsv } from '@/utils/format'

export interface Column<T> {
  key: string
  header: string
  /** Value used for sorting, search and CSV export. */
  accessor: (row: T) => string | number
  /** Optional rich cell. Falls back to the accessor value. */
  cell?: (row: T) => ReactNode
  align?: 'left' | 'right'
  width?: string
  /** Hidden by default but available from the column menu. */
  optional?: boolean
  sortable?: boolean
  sticky?: boolean
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  exportName: string
  /** Extra controls rendered in the toolbar, e.g. a reason filter. */
  toolbar?: ReactNode
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyAction?: { label: string; onClick: () => void }
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  exportName,
  toolbar,
  initialSort,
  pageSize = 20,
  onRowClick,
  emptyAction,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(initialSort ?? { key: columns[0].key, dir: 'desc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(pageSize)
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((c) => c.optional).map((c) => c.key))

  const visible = columns.filter((c) => !hidden.includes(c.key))

  const searched = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((r) => columns.some((c) => String(c.accessor(r)).toLowerCase().includes(q)))
  }, [rows, query, columns])

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return searched
    return [...searched].sort((a, b) => {
      const av = col.accessor(a)
      const bv = col.accessor(b)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [searched, sort, columns])

  useEffect(() => setPage(1), [query, rows, size])

  const total = sorted.length
  const pages = Math.max(1, Math.ceil(total / size))
  const current = Math.min(page, pages)
  const start = (current - 1) * size
  const pageRows = sorted.slice(start, start + size)

  const exportCsv = () => {
    const headers = visible.map((c) => ({ key: c.key, label: c.header }))
    const data = sorted.map((r) => Object.fromEntries(visible.map((c) => [c.key, c.accessor(r)])))
    downloadCsv(`${exportName}.csv`, toCsv(data, headers))
  }

  const toggleSort = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this table"
            className="h-8 w-full rounded-lg border border-line bg-paper pl-8 pr-3 text-[13px] text-navy-900 placeholder:text-navy-300 transition-colors focus:border-reef-500 focus:bg-white"
          />
        </div>

        {toolbar}

        <div className="ml-auto flex items-center gap-2">
          <Popover
            trigger={({ toggle }) => (
              <Button variant="outline" size="sm" onClick={toggle}>
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            )}
            className="max-h-[300px] w-[240px] overflow-y-auto"
          >
            {() => (
              <div>
                {columns.map((c) => (
                  <Checkbox
                    key={c.key}
                    label={c.header}
                    checked={!hidden.includes(c.key)}
                    onChange={() =>
                      setHidden((h) => (h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]))
                    }
                  />
                ))}
              </div>
            )}
          </Popover>

          <Button variant="outline" size="sm" onClick={exportCsv} disabled={total === 0}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          actionLabel={emptyAction?.label}
          onAction={emptyAction?.onClick}
          message="Nothing matched this combination of period, filters and search."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-paper">
                  {visible.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      style={{ width: c.width }}
                      className={cn(
                        'sticky top-0 z-10 bg-paper px-3 py-2.5 text-[11px] font-semibold text-navy-500',
                        c.align === 'right' ? 'text-right' : 'text-left',
                        c.sticky && 'left-0 z-20',
                      )}
                    >
                      {c.sortable === false ? (
                        c.header
                      ) : (
                        <button
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            'inline-flex items-center gap-1 transition-colors hover:text-navy-900',
                            c.align === 'right' && 'flex-row-reverse',
                            sort.key === c.key && 'text-navy-900',
                          )}
                        >
                          {c.header}
                          {sort.key === c.key &&
                            (sort.dir === 'asc' ? (
                              <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                            ) : (
                              <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                            ))}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn('transition-colors hover:bg-reef-50/40', onRowClick && 'cursor-pointer')}
                  >
                    {visible.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'whitespace-nowrap px-3 py-2.5 text-navy-700',
                          c.align === 'right' && 'text-right',
                          c.sticky && 'sticky left-0 bg-white',
                        )}
                      >
                        {c.cell ? c.cell(row) : c.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2.5">
            <p className="num text-[12px] text-navy-500">
              Showing {start + 1}–{Math.min(start + size, total)} of {total} records
            </p>

            <label className="flex items-center gap-1.5 text-[12px] text-navy-400">
              Rows
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="num h-7 rounded-md border border-line bg-white px-1.5 text-[12px] text-navy-700"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="num px-2 text-[12px] text-navy-500">
                Page {current} of {pages}
              </span>
              <Button
                variant="outline"
                size="iconSm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={current === pages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
