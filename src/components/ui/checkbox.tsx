import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-navy-50">
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked ? 'border-reef-600 bg-reef-600 text-white' : 'border-navy-200 bg-white',
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-navy-700">{label}</span>
      {hint && <span className="num text-[11px] text-navy-300">{hint}</span>}
    </label>
  )
}
