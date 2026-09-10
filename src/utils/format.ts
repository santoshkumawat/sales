/** Indian-numbering + currency helpers used across the reporting portal. */

export function inrCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`
  return `₹${value.toFixed(0)}`
}

export function inr(value: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value))}`
}

export function count(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(value))
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function signedPct(value: number, digits = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

export function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export function toCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = headers.map((h) => esc(h.label)).join(',')
  const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(',')).join('\n')
  return `${head}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
