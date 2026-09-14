import { AlertTriangle, CalendarClock, FileText, MessageSquare, Phone } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PendingRecord, RfiItem } from '@/types'
import { inr, shortDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const RFI_TONE: Record<RfiItem['status'], 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'accent'> = {
  Open: 'warn',
  Responded: 'info',
  'Under Review': 'accent',
  Waived: 'neutral',
  Closed: 'good',
}

function RfiCard({ rfi }: { rfi: RfiItem }) {
  return (
    <li
      className={cn(
        'rounded-xl border p-3.5',
        rfi.overdue ? 'border-red-200 bg-red-50/40' : 'border-line bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-navy-900">{rfi.requirement}</p>
          <p className="num mt-0.5 text-[11px] text-navy-400">{rfi.id}</p>
        </div>
        <StatusBadge value={rfi.status} tone={RFI_TONE[rfi.status]} />
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-navy-600">{rfi.detail}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 sm:grid-cols-4">
        {[
          { label: 'Raised on', value: shortDate(rfi.raisedOn) },
          { label: 'Due by', value: shortDate(rfi.dueBy) },
          { label: 'Age', value: `${rfi.ageDays} days` },
          { label: 'With', value: rfi.responsibility },
        ].map((d) => (
          <div key={d.label}>
            <dt className="text-[10px] text-navy-400">{d.label}</dt>
            <dd className="num text-[12px] font-medium text-navy-800">{d.value}</dd>
          </div>
        ))}
      </dl>

      {rfi.overdue && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Past the {shortDate(rfi.dueBy)} service commitment
        </p>
      )}

      {rfi.followUps.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-navy-500">
            <MessageSquare className="h-3 w-3" />
            Follow-ups
          </p>
          <ol className="space-y-2">
            {rfi.followUps.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1 flex flex-col items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-reef-400" />
                  {i < rfi.followUps.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-line" />}
                </span>
                <span className="pb-1">
                  <span className="num block text-[11px] text-navy-400">
                    {shortDate(f.on)} · {f.channel} · {f.by}
                  </span>
                  <span className="block text-[12px] text-navy-700">{f.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </li>
  )
}

export function RfiDetailDrawer({
  record,
  onClose,
}: {
  record: PendingRecord | null
  onClose: () => void
}) {
  if (!record) return null

  const open = record.rfis.filter((r) => r.status !== 'Closed' && r.status !== 'Waived')
  const settled = record.rfis.filter((r) => r.status === 'Closed' || r.status === 'Waived')

  return (
    <Drawer
      open
      onClose={onClose}
      title={record.proposalNo}
      description={
        <span className="inline-flex items-center gap-3">
          <span>
            {record.customer} · {record.product}
          </span>
          <a
            href={`tel:${record.customerPhone.replace(/\s+/g, '')}`}
            className="num inline-flex items-center gap-1 text-reef-600 hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {record.customerPhone}
          </a>
        </span>
      }
      footer={
        <div className="flex items-center gap-2">
          <Button variant="accent" className="flex-1">
            Record a follow-up
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-line bg-paper p-3.5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: 'Annual premium', value: inr(record.annualPremium) },
              { label: 'Sum assured', value: inr(record.sumAssured) },
              { label: 'Submitted', value: shortDate(record.submissionDate) },
              { label: 'Pending since', value: `${shortDate(record.pendingSince)} (${record.ageDays} d)` },
              { label: 'Branch', value: record.branch },
              { label: 'Advisor', value: record.advisor },
              { label: 'Sales manager', value: record.manager },
              { label: 'Current stage', value: record.currentStage },
            ].map((d) => (
              <div key={d.label}>
                <dt className="text-[10px] text-navy-400">{d.label}</dt>
                <dd className="num text-[12.5px] font-medium text-navy-800">{d.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <StatusBadge value={record.priority} />
            <span className="text-[12px] text-navy-500">
              {record.reason} — {record.subReason}
            </span>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-900">
              <FileText className="h-3.5 w-3.5 text-navy-400" />
              Open requirements
            </h3>
            <span className="num text-[12px] text-navy-400">{open.length}</span>
          </div>
          {open.length === 0 ? (
            <p className="rounded-lg border border-line bg-paper px-3 py-4 text-center text-[12.5px] text-navy-500">
              Nothing outstanding. The case is waiting on an internal action rather than a requirement.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {open.map((rfi) => (
                <RfiCard key={rfi.id} rfi={rfi} />
              ))}
            </ul>
          )}
        </section>

        {settled.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-900">
                <CalendarClock className="h-3.5 w-3.5 text-navy-400" />
                Settled requirements
              </h3>
              <span className="num text-[12px] text-navy-400">{settled.length}</span>
            </div>
            <ul className="space-y-2.5">
              {settled.map((rfi) => (
                <RfiCard key={rfi.id} rfi={rfi} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </Drawer>
  )
}
