'use client'

type FinanceQueueToolbarProps = {
  selectedCount: number
  onBulkIssue: () => void
  disabled: boolean
}

export function FinanceQueueToolbar({
  selectedCount,
  onBulkIssue,
  disabled,
}: FinanceQueueToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-xs text-foreground/70">
        {selectedCount} claim(s) selected
      </p>
      <button
        type="button"
        onClick={onBulkIssue}
        disabled={disabled}
        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
      >
        {disabled ? 'Issuing...' : 'Issue Selected'}
      </button>
    </div>
  )
}
