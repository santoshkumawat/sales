import { useEffect, useState } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useFilters, type MultiKey } from '@/context/FilterContext'
import type { FilterState } from '@/types'
import { BRANCH_LIST, CHANNELS, MANAGERS, PRODUCTS, REGIONS } from '@/data/mockInsuranceData'

export interface FilterGroup {
  key: MultiKey
  title: string
  options: string[]
}

export const BASE_GROUPS: FilterGroup[] = [
  { key: 'products', title: 'Product', options: [...PRODUCTS] },
  { key: 'channels', title: 'Channel', options: [...CHANNELS] },
  { key: 'regions', title: 'Region', options: [...REGIONS] },
  { key: 'branches', title: 'Branch', options: BRANCH_LIST },
  { key: 'managers', title: 'Sales manager', options: MANAGERS.slice(0, 18) },
]

/**
 * Edits happen on a draft copy so nothing changes behind the user until they
 * choose Apply — the same way a real reporting console behaves.
 */
export function AdvancedFilterDrawer({
  open,
  onClose,
  statusGroup,
}: {
  open: boolean
  onClose: () => void
  statusGroup?: FilterGroup
}) {
  const { filters, setValues, setPremiumBand, clearDimensions } = useFilters()
  const [draft, setDraft] = useState<FilterState>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  const groups = statusGroup ? [statusGroup, ...BASE_GROUPS] : BASE_GROUPS

  const toggle = (key: MultiKey, value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }))

  const apply = () => {
    groups.forEach((g) => setValues(g.key, draft[g.key]))
    setPremiumBand(draft.minPremium, draft.maxPremium)
    onClose()
  }

  const clearDraft = () =>
    setDraft((d) => ({
      ...d,
      products: [],
      channels: [],
      regions: [],
      branches: [],
      statuses: [],
      managers: [],
      minPremium: undefined,
      maxPremium: undefined,
    }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Advanced filters"
      description="Narrow the report by book, geography and premium band."
      footer={
        <div className="flex items-center gap-2">
          <Button variant="accent" className="flex-1" onClick={apply}>
            Apply filters
          </Button>
          <Button variant="outline" onClick={clearDraft}>
            Clear
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearDimensions()
              onClose()
            }}
          >
            Reset
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-[13px] font-semibold text-navy-800">{group.title}</h3>
              {draft[group.key].length > 0 && (
                <button
                  className="text-[11px] text-navy-400 hover:text-navy-700"
                  onClick={() => setDraft((d) => ({ ...d, [group.key]: [] }))}
                >
                  Clear {group.title.toLowerCase()}
                </button>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-line p-1">
              {group.options.map((option) => (
                <Checkbox
                  key={option}
                  label={option}
                  checked={draft[group.key].includes(option)}
                  onChange={() => toggle(group.key, option)}
                />
              ))}
            </div>
          </section>
        ))}

        <section>
          <h3 className="mb-1.5 text-[13px] font-semibold text-navy-800">Annual premium band</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min ₹"
              value={draft.minPremium ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, minPremium: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
            <span className="text-navy-300">–</span>
            <Input
              type="number"
              placeholder="Max ₹"
              value={draft.maxPremium ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, maxPremium: e.target.value ? Number(e.target.value) : undefined }))
              }
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { label: 'Up to ₹50 K', min: undefined, max: 50_000 },
              { label: '₹50 K – ₹2 L', min: 50_000, max: 2_00_000 },
              { label: '₹2 L – ₹5 L', min: 2_00_000, max: 5_00_000 },
              { label: 'Above ₹5 L', min: 5_00_000, max: undefined },
            ].map((band) => (
              <button
                key={band.label}
                onClick={() => setDraft((d) => ({ ...d, minPremium: band.min, maxPremium: band.max }))}
                className="rounded-md border border-line px-2 py-1 text-[12px] text-navy-600 transition-colors hover:border-reef-300 hover:bg-reef-50 hover:text-reef-800"
              >
                {band.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Drawer>
  )
}
