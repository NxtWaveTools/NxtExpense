import Link from 'next/link'

import { formatDate, formatDatetime } from '@/lib/utils/date'

import { getApprovalHistoryAction } from '@/features/approvals/actions'
import { ClaimStatusBadge } from '@/features/claims/components/claim-status-badge'

type ApprovalHistoryPayload = Awaited<
  ReturnType<typeof getApprovalHistoryAction>
>

type ApprovalHistoryListProps = {
  history: ApprovalHistoryPayload
}

export function ApprovalHistoryList({ history }: ApprovalHistoryListProps) {
  if (history.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Approval History</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No past approval actions found for your role.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Approval History</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="px-3 py-2 font-medium">Claim ID</th>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Claim Date</th>
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
                <td className="px-3 py-3 capitalize">{row.action.action}</td>
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
            href={`/approvals?historyCursor=${encodeURIComponent(history.nextCursor)}`}
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
