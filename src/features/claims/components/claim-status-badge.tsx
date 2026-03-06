import type { ClaimStatus } from '@/features/claims/types'

const STATUS_STYLE: Record<ClaimStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  submitted: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  pending_approval: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-300',
  finance_review: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  issued: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  finance_rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLE[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
