import Link from 'next/link'

import type { PaginatedClaims } from '@/features/claims/types'
import { ClaimStatusBadge } from '@/features/claims/components/claim-status-badge'
import { formatDate } from '@/lib/utils/date'

type ClaimListProps = {
  claims: PaginatedClaims
}

export function ClaimList({ claims }: ClaimListProps) {
  if (claims.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">My Claims</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No claims yet. Create your first claim to begin the workflow.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Claims</h2>
        <Link
          href="/claims/new"
          className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          New Claim
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="px-3 py-2 font-medium">Claim ID</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {claims.data.map((claim) => (
              <tr key={claim.id} className="border-b border-border/70">
                <td className="px-3 py-3 font-medium">{claim.claim_number}</td>
                <td className="px-3 py-3">{formatDate(claim.claim_date)}</td>
                <td className="px-3 py-3">{claim.work_location}</td>
                <td className="px-3 py-3">
                  Rs. {Number(claim.total_amount).toFixed(2)}
                </td>
                <td className="px-3 py-3">
                  <ClaimStatusBadge status={claim.status} />
                </td>
                <td className="px-3 py-3">
                  {claim.submitted_at ? formatDate(claim.submitted_at) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end">
        {claims.nextCursor ? (
          <Link
            href={`/claims?cursor=${encodeURIComponent(claims.nextCursor)}`}
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
