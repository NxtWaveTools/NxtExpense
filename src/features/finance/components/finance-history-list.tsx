import Link from 'next/link'

import { formatDate, formatDatetime } from '@/lib/utils/date'

import { getFinanceHistoryAction } from '@/features/finance/actions'
import { ClaimStatusBadge } from '@/features/claims/components/claim-status-badge'

type FinanceHistoryPayload = Awaited<ReturnType<typeof getFinanceHistoryAction>>

type FinanceHistoryListProps = {
  history: FinanceHistoryPayload
}

export function FinanceHistoryList({ history }: FinanceHistoryListProps) {
  if (history.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Finance History</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No past finance actions found.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Finance History</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="px-3 py-2 font-medium">Claim ID</th>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Claim Date</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Action Date</th>
              <th className="px-3 py-2 font-medium">Current Status</th>
            </tr>
          </thead>
          <tbody>
            {history.data.map((row) => (
              <tr key={row.action.id} className="border-b border-border/70">
                <td className="px-3 py-3 font-medium">
                  {row.claim.claim_number}
                </td>
                <td className="px-3 py-3">{row.owner.employee_name}</td>
                <td className="px-3 py-3">
                  {formatDate(row.claim.claim_date)}
                </td>
                <td className="px-3 py-3">{row.claim.work_location}</td>
                <td className="px-3 py-3">
                  Rs. {Number(row.claim.total_amount).toFixed(2)}
                </td>
                <td className="px-3 py-3 capitalize">
                  {row.action.action.replace('_', ' ')}
                </td>
                <td className="px-3 py-3">
                  {formatDatetime(row.action.acted_at)}
                </td>
                <td className="px-3 py-3">
                  <ClaimStatusBadge status={row.claim.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end">
        {history.nextCursor ? (
          <Link
            href={`/finance?historyCursor=${encodeURIComponent(history.nextCursor)}`}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
          >
            Next Page
          </Link>
        ) : (
          <span className="text-xs text-foreground/60">No more records</span>
        )}
      </div>
    </section>
  )
}
