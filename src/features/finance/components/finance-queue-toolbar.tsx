'use client'

import { useEffect, useRef } from 'react'

type FinanceQueueToolbarProps = {
  selectedCount: number
  allSelected: boolean
  partiallySelected: boolean
  totalCount: number
  onToggleSelectAll: (checked: boolean) => void
  onBulkAction: (action: 'issued' | 'finance_rejected') => void
  disabled: boolean
}

export function FinanceQueueToolbar({
  selectedCount,
  allSelected,
  partiallySelected,
  totalCount,
  onToggleSelectAll,
  onBulkAction,
  disabled,
}: FinanceQueueToolbarProps) {
  const selectAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!selectAllRef.current) return
    selectAllRef.current.indeterminate = partiallySelected
  }, [partiallySelected])

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <label className="inline-flex items-center gap-2 text-xs text-foreground/70">
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={allSelected}
          disabled={disabled || totalCount === 0}
          onChange={(event) => onToggleSelectAll(event.target.checked)}
        />
        Select all ({selectedCount}/{totalCount})
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onBulkAction('issued')}
          disabled={disabled || selectedCount === 0}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {disabled ? 'Processing...' : 'Issue Selected'}
        </button>
        <button
          type="button"
          onClick={() => onBulkAction('finance_rejected')}
          disabled={disabled || selectedCount === 0}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {disabled ? 'Processing...' : 'Reject Selected'}
        </button>
      </div>
    </div>
  )
}
