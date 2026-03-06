import Link from 'next/link'

import { formatDate } from '@/lib/utils/date'

import { getPendingApprovalsAction } from '@/features/approvals/actions'

type PendingApprovalsPayload = Awaited<
  ReturnType<typeof getPendingApprovalsAction>
>

export function ApprovalList({
  approvals,
}: {
  approvals: PendingApprovalsPayload
}) {
  if (approvals.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Pending Approvals</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No pending approvals at your level.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Pending Approvals</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {approvals.data.map((row) => (
              <tr key={row.claim.id} className="border-b border-border/70">
                <td className="px-3 py-3">{row.owner.employee_name}</td>
                <td className="px-3 py-3">
                  {formatDate(row.claim.claim_date)}
                </td>
                <td className="px-3 py-3">{row.claim.work_location}</td>
                <td className="px-3 py-3">
                  Rs. {Number(row.claim.total_amount).toFixed(2)}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/approvals/${row.claim.id}`}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end">
        {approvals.nextCursor ? (
          <Link
            href={`/approvals?cursor=${encodeURIComponent(approvals.nextCursor)}`}
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
