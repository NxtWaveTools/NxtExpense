import Link from 'next/link'

import { formatDate } from '@/lib/utils/date'

import type { ClaimAvailableAction } from '@/features/claims/types'
import type { FinanceActionType } from '@/features/finance/types'
import type { FinanceQueueItem } from '@/features/finance/types'

type FinanceClaimRowProps = {
  item: FinanceQueueItem
  checked: boolean
  disabled: boolean
  selectable: boolean
  isProcessingRow: boolean
  onToggle: (claimId: string, checked: boolean) => void
  onRunAction: (claimId: string, action: ClaimAvailableAction) => void
}

export function FinanceClaimRow({
  item,
  checked,
  disabled,
  isProcessingRow,
  selectable,
  onToggle,
  onRunAction,
}: FinanceClaimRowProps) {
  return (
    <tr className="border-b border-border/70">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled || !selectable}
          onChange={(event) => onToggle(item.claim.id, event.target.checked)}
        />
      </td>
      <td className="px-3 py-3 font-medium">
        <Link
          href={`/claims/${item.claim.id}?from=finance`}
          className="whitespace-nowrap text-foreground underline-offset-2 hover:underline"
        >
          {item.claim.claim_number}
        </Link>
      </td>
      <td className="px-3 py-3">{item.owner.employee_name}</td>
      <td className="px-3 py-3">{formatDate(item.claim.claim_date)}</td>
      <td className="px-3 py-3">{item.claim.work_location}</td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="whitespace-nowrap">
            Rs. {Number(item.claim.total_amount).toFixed(2)}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {item.availableActions
              .filter(
                (
                  action
                ): action is ClaimAvailableAction & {
                  action: FinanceActionType
                } =>
                  action.action === 'issued' ||
                  action.action === 'finance_rejected'
              )
              .map((action) => (
                <button
                  key={`${item.claim.id}-${action.action}-${action.display_label}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onRunAction(item.claim.id, action)}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
                >
                  {isProcessingRow ? 'Processing...' : action.display_label}
                </button>
              ))}
          </div>
        </div>
      </td>
    </tr>
  )
}
