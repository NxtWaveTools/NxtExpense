import { formatDate } from '@/lib/utils/date'

import type { FinanceQueueItem } from '@/features/finance/types'

type FinanceClaimRowProps = {
  item: FinanceQueueItem
  checked: boolean
  disabled: boolean
  isProcessingRow: boolean
  onToggle: (claimId: string, checked: boolean) => void
  onIssue: (claimId: string) => void
  onReject: (claimId: string) => void
}

export function FinanceClaimRow({
  item,
  checked,
  disabled,
  isProcessingRow,
  onToggle,
  onIssue,
  onReject,
}: FinanceClaimRowProps) {
  return (
    <tr className="border-b border-border/70">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle(item.claim.id, event.target.checked)}
        />
      </td>
      <td className="px-3 py-3">{item.owner.employee_name}</td>
      <td className="px-3 py-3">{formatDate(item.claim.claim_date)}</td>
      <td className="px-3 py-3">{item.claim.work_location}</td>
      <td className="px-3 py-3">
        Rs. {Number(item.claim.total_amount).toFixed(2)}
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onIssue(item.claim.id)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {isProcessingRow ? 'Processing...' : 'Issue'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject(item.claim.id)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {isProcessingRow ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </td>
    </tr>
  )
}
