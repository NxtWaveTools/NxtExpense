import type { ApprovalHistoryFilters } from '@/features/approvals/types'

const IST_START_TIME = 'T00:00:00+05:30'
const IST_END_TIME = 'T23:59:59.999+05:30'

type BuildApprovalHistoryRpcArgsOptions = {
  cursorCreatedAt?: string | null
  cursorId?: string | null
  limit?: number
  allowResubmitFilter: boolean | null
  includeActorFilters?: boolean
  statusId: string | null
}

function toIstDayStart(date: string | null): string | null {
  return date ? `${date}${IST_START_TIME}` : null
}

function toIstDayEnd(date: string | null): string | null {
  return date ? `${date}${IST_END_TIME}` : null
}

export function buildApprovalHistoryRpcArgs(
  filters: ApprovalHistoryFilters,
  options: BuildApprovalHistoryRpcArgsOptions
): Record<string, unknown> {
  const args: Record<string, unknown> = {
    p_name_search: filters.employeeName,
    p_claim_status_id: options.statusId,
    p_claim_allow_resubmit: options.allowResubmitFilter,
    p_amount_operator: filters.amountOperator,
    p_amount_value: filters.amountValue,
    p_location_type: filters.locationType,
    p_hod_approved_from: toIstDayStart(filters.hodApprovedFrom),
    p_hod_approved_to: toIstDayEnd(filters.hodApprovedTo),
    p_finance_approved_from: toIstDayStart(filters.financeApprovedFrom),
    p_finance_approved_to: toIstDayEnd(filters.financeApprovedTo),
    p_claim_date_from: filters.claimDateFrom,
    p_claim_date_to: filters.claimDateTo,
  }

  if (options.includeActorFilters) {
    args.p_actor_filters = null
  }

  if ('limit' in options) {
    args.p_limit = options.limit
  }

  if ('cursorCreatedAt' in options) {
    args.p_cursor_acted_at = options.cursorCreatedAt ?? null
  }

  if ('cursorId' in options) {
    args.p_cursor_action_id = options.cursorId ?? null
  }

  return args
}