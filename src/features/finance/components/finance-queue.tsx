'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  bulkIssueClaimsAction,
  submitFinanceAction,
} from '@/features/finance/actions'
import { FinanceClaimRow } from '@/features/finance/components/finance-claim-row'
import { FinanceQueueToolbar } from '@/features/finance/components/finance-queue-toolbar'
import type { PaginatedFinanceQueue } from '@/features/finance/types'

type FinanceQueueProps = {
  queue: PaginatedFinanceQueue
}

export function FinanceQueue({ queue }: FinanceQueueProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleClaim(claimId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return [...current, claimId]
      }
      return current.filter((id) => id !== claimId)
    })
  }

  async function handleBulkIssue() {
    if (selectedIds.length === 0) return
    setIsSubmitting(true)
    setProcessingClaimId(null)
    setError(null)

    try {
      const result = await bulkIssueClaimsAction({
        claimIds: selectedIds,
        action: 'issued',
      })

      if (!result.ok) {
        setError(result.error)
        toast.error(result.error ?? 'Unable to issue selected claims.')
        return
      }

      toast.success('Selected claims issued.')
      setSelectedIds([])
      router.refresh()
    } catch {
      const message = 'Unexpected error while issuing selected claims.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSingleAction(
    claimId: string,
    action: 'issued' | 'finance_rejected'
  ) {
    setIsSubmitting(true)
    setProcessingClaimId(claimId)
    setError(null)

    try {
      const result = await submitFinanceAction({ claimId, action })

      if (!result.ok) {
        setError(result.error)
        toast.error(result.error ?? 'Unable to complete finance action.')
        return
      }

      toast.success(
        action === 'issued'
          ? 'Claim issued successfully.'
          : 'Claim rejected by finance.'
      )
      router.refresh()
    } catch {
      const message = 'Unexpected error while processing finance action.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setProcessingClaimId(null)
    }
  }

  if (queue.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Finance Queue</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No claims are waiting for finance action.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Finance Queue</h2>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <FinanceQueueToolbar
          selectedCount={selectedIds.length}
          onBulkIssue={handleBulkIssue}
          disabled={isSubmitting}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/70">
                <th className="px-3 py-2 font-medium">Select</th>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.data.map((item) => (
                <FinanceClaimRow
                  key={item.claim.id}
                  item={item}
                  checked={selectedSet.has(item.claim.id)}
                  disabled={isSubmitting}
                  isProcessingRow={processingClaimId === item.claim.id}
                  onToggle={toggleClaim}
                  onIssue={(claimId) => handleSingleAction(claimId, 'issued')}
                  onReject={(claimId) =>
                    handleSingleAction(claimId, 'finance_rejected')
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end">
          {queue.nextCursor ? (
            <Link
              href={`/finance?cursor=${encodeURIComponent(queue.nextCursor)}`}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
            >
              Next Page
            </Link>
          ) : (
            <span className="text-xs text-foreground/60">No more records</span>
          )}
        </div>
      </div>
    </section>
  )
}
