'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { submitApprovalAction } from '@/features/approvals/actions'

type ApprovalActionsProps = {
  claimId: string
}

export function ApprovalActions({ claimId }: ApprovalActionsProps) {
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    'approved' | 'rejected' | null
  >(null)

  async function handleAction(action: 'approved' | 'rejected') {
    setIsSubmitting(true)
    setPendingAction(action)
    setError(null)

    try {
      const result = await submitApprovalAction({ claimId, action, notes })
      if (!result.ok) {
        setError(result.error)
        toast.error(result.error ?? 'Unable to submit approval action.')
        return
      }

      toast.success(
        action === 'approved' ? 'Claim approved.' : 'Claim rejected.'
      )
      router.replace('/approvals')
    } catch {
      const message = 'Unexpected error while submitting approval action.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setPendingAction(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-base font-semibold">Take Action</h3>
      <label className="mt-3 block space-y-2 text-sm">
        <span className="text-foreground/80">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAction('approved')}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting && pendingAction === 'approved'
            ? 'Approving...'
            : 'Approve'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAction('rejected')}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting && pendingAction === 'rejected'
            ? 'Rejecting...'
            : 'Reject'}
        </button>
      </div>
    </section>
  )
}
