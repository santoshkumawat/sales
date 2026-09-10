import { X } from 'lucide-react'
import { useFilters, type MultiKey } from '@/context/FilterContext'
import { inrCompact } from '@/utils/format'

const LABELS: Record<MultiKey, string> = {
  products: 'Product',
  channels: 'Channel',
  regions: 'Region',
  branches: 'Branch',
  statuses: 'Status',
  managers: 'Manager',
}

export function AppliedFilterChips() {
  const { filters, removeChip, setPremiumBand, setSearch, clearDimensions } = useFilters()

  const chips: { key: string; label: string; onRemove: () => void }[] = []

  ;(Object.keys(LABELS) as MultiKey[]).forEach((key) => {
    filters[key].forEach((value) => {
      chips.push({
        key: `${key}-${value}`,
        label: `${LABELS[key]}: ${value}`,
        onRemove: () => removeChip(key, value),
      })
    })
  })

  if (filters.minPremium != null || filters.maxPremium != null) {
    const from = filters.minPremium != null ? inrCompact(filters.minPremium) : 'any'
    const to = filters.maxPremium != null ? inrCompact(filters.maxPremium) : 'any'
    chips.push({
      key: 'premium-band',
      label: `Premium: ${from} – ${to}`,
      onRemove: () => setPremiumBand(undefined, undefined),
    })
  }

  if (filters.search) {
    chips.push({ key: 'search', label: `Search: ${filters.search}`, onRemove: () => setSearch('') })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-md border border-reef-100 bg-reef-50 py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-reef-800"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="rounded p-0.5 text-reef-500 transition-colors hover:bg-reef-100 hover:text-reef-800"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <button onClick={clearDimensions} className="text-[12px] font-medium text-navy-400 underline-offset-2 hover:text-navy-700 hover:underline">
        Clear all
      </button>
    </div>
  )
}
