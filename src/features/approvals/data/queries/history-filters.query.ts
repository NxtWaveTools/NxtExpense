import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ApprovalHistoryFilters,
  ApprovalHistoryRecord,
  PaginatedApprovalHistoryRecords,
} from '@/features/approvals/types'
import { getApprovalHistoryClaimEnrichmentByClaimId } from '@/features/approvals/data/repositories/approval-history.repository'
import {
  getFilteredApprovalHistoryCountRpc,
  getFilteredApprovalHistoryRpc,
  type FilteredApprovalHistoryRpcRow,
} from '@/features/approvals/data/rpc/approval-history.rpc'
import { resolveClaimAllowResubmitFilterValue } from '@/features/claims/data/queries'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'
import { decodeCursor, encodeCursor } from '@/lib/utils/pagination'

const IST_START_TIME = 'T00:00:00+05:30'
const IST_END_TIME = 'T23:59:59.999+05:30'

function toIstDayStart(date: string | null): string | null {
  return date ? `${date}${IST_START_TIME}` : null
}

function toIstDayEnd(date: string | null): string | null {
  return date ? `${date}${IST_END_TIME}` : null
}

function mapHistoryRecord(
  row: FilteredApprovalHistoryRpcRow,
  enrichment?: {
    statusDisplay: { label: string; colorToken: string }
    ownerEmployeeId: string | null
    ownerEmail: string | null
  }
): ApprovalHistoryRecord {
  return {
    actionId: row.action_id,
    claimId: row.claim_id,
    claimNumber: row.claim_number,
    claimDate: row.claim_date,
    workLocation: row.work_location,
    totalAmount: Number(row.total_amount),
    claimStatusName: enrichment?.statusDisplay.label ?? row.claim_status_name,
    claimStatusDisplayColor:
      enrichment?.statusDisplay.colorToken ?? row.claim_status_display_color,
    ownerEmployeeId: enrichment?.ownerEmployeeId ?? null,
    ownerName: row.owner_name,
    ownerEmail: enrichment?.ownerEmail ?? null,
    ownerDesignation: row.owner_designation,
    actorEmail: row.actor_email,
    actorDesignation: row.actor_designation,
    action: row.action,
    approvalLevel: row.approval_level,
    notes: row.notes,
    actedAt: row.acted_at,
    hodApprovedAt: row.hod_approved_at,
    financeApprovedAt: row.finance_approved_at,
  }
}

function toNumericCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed))
    }
  }

  return 0
}

function buildHistoryRpcArgs(
  filters: ApprovalHistoryFilters,
  options: {
    cursorCreatedAt?: string | null
    cursorId?: string | null
    limit?: number
    allowResubmitFilter: boolean | null
    statusId: string | null
  }
): Record<string, unknown> {
  const args: Record<string, unknown> = {
    p_name_search: filters.employeeName,
    p_actor_filters: null,
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

export async function getFilteredApprovalHistoryPaginated(
  supabase: SupabaseClient,
  cursor: string | null,
  limit: number,
  filters: ApprovalHistoryFilters
): Promise<PaginatedApprovalHistoryRecords> {
  const normalizedLimit = Math.max(1, Math.min(limit, 100))
  const decodedCursor = cursor ? decodeCursor(cursor) : null
  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  const rows = await getFilteredApprovalHistoryRpc(
    supabase,
    buildHistoryRpcArgs(filters, {
      limit: normalizedLimit,
      cursorCreatedAt: decodedCursor?.created_at ?? null,
      cursorId: decodedCursor?.id ?? null,
      allowResubmitFilter,
      statusId: parsedStatusFilter?.statusId ?? null,
    })
  )

  const hasNextPage = rows.length > normalizedLimit
  const pageRows = hasNextPage ? rows.slice(0, normalizedLimit) : rows
  const claimIds = [...new Set(pageRows.map((row) => row.claim_id))]
  const claimEnrichmentById = await getApprovalHistoryClaimEnrichmentByClaimId(
    supabase,
    claimIds
  )

  const mappedRows = pageRows.map((row) =>
    mapHistoryRecord(row, claimEnrichmentById.get(row.claim_id))
  )

  const lastRecord = pageRows.at(-1)
  const nextCursor =
    hasNextPage && lastRecord
      ? encodeCursor({
          created_at: lastRecord.acted_at,
          id: lastRecord.action_id,
        })
      : null

  return {
    data: mappedRows,
    hasNextPage,
    nextCursor,
    limit: normalizedLimit,
  }
}

export async function getFilteredApprovalHistoryCount(
  supabase: SupabaseClient,
  filters: ApprovalHistoryFilters
): Promise<number> {
  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  const data = await getFilteredApprovalHistoryCountRpc(
    supabase,
    buildHistoryRpcArgs(filters, {
      allowResubmitFilter,
      statusId: parsedStatusFilter?.statusId ?? null,
    })
  )

  if (Array.isArray(data)) {
    const firstRow = data[0] as Record<string, unknown> | undefined

    return toNumericCount(
      firstRow?.count ?? firstRow?.get_filtered_approval_history_count
    )
  }

  return toNumericCount(data)
}
