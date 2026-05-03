import type { SupabaseClient } from '@supabase/supabase-js'

import type { PendingApprovalsFilters } from '@/features/approvals/types'
import {
  getApproverActorByEmail,
  getPendingApprovalStatuses,
} from '@/features/approvals/data/repositories/approvals.repository'
import { getPendingApprovalScopeByActor } from '@/features/approvals/data/repositories/pending-scope.repository'
import { getPendingApprovalScopeSummaryRpc } from '@/features/approvals/data/rpc/pending-summary.rpc'
import { resolveClaimAllowResubmitFilterValue } from '@/features/claims/data/queries'
import { getLocationIdsByApprovalLocationType } from '@/features/approvals/data/queries/location-type.query'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'

type PendingApprovalsSummary = {
  count: number
  amount: number
}

const DEFAULT_PENDING_FILTERS: PendingApprovalsFilters = {
  employeeName: null,
  claimStatus: null,
  claimDateFrom: null,
  claimDateTo: null,
  amountOperator: 'lte',
  amountValue: null,
  locationType: null,
  claimDateSort: 'desc',
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0)
}

export async function getPendingApprovalsSummary(
  supabase: SupabaseClient,
  approverEmail: string,
  filters: PendingApprovalsFilters = DEFAULT_PENDING_FILTERS
): Promise<PendingApprovalsSummary> {
  const [actorResult, pendingStatuses] = await Promise.all([
    getApproverActorByEmail(supabase, approverEmail),
    getPendingApprovalStatuses(supabase),
  ])

  if (!actorResult) {
    return { count: 0, amount: 0 }
  }

  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  const pendingStatusIds = (
    parsedStatusFilter
      ? pendingStatuses.filter(
          (status) => status.id === parsedStatusFilter.statusId
        )
      : pendingStatuses
  ).map((status) => status.id)

  if (pendingStatusIds.length === 0) {
    return { count: 0, amount: 0 }
  }

  const pendingScope = await getPendingApprovalScopeByActor(
    supabase,
    actorResult.id
  )

  const level1Ids = [
    ...new Set([
      ...pendingScope.level1ActionEmployeeIds,
      ...pendingScope.level1ViewOnlyEmployeeIds,
    ]),
  ]
  const level2Ids = pendingScope.level2ActionEmployeeIds

  if (level1Ids.length === 0 && level2Ids.length === 0) {
    return { count: 0, amount: 0 }
  }

  const normalizedName = filters.employeeName?.trim() ?? ''

  let scopedLocationIds: string[] | null = null
  if (filters.locationType) {
    scopedLocationIds = await getLocationIdsByApprovalLocationType(
      supabase,
      filters.locationType
    )

    if (!scopedLocationIds || scopedLocationIds.length === 0) {
      return { count: 0, amount: 0 }
    }
  }

  const summary = await getPendingApprovalScopeSummaryRpc(supabase, {
    p_level1_employee_ids: level1Ids.length > 0 ? level1Ids : null,
    p_level2_employee_ids: level2Ids.length > 0 ? level2Ids : null,
    p_pending_status_ids: pendingStatusIds,
    p_allow_resubmit: allowResubmitFilter,
    p_employee_name: normalizedName || null,
    p_claim_date_from: filters.claimDateFrom,
    p_claim_date_to: filters.claimDateTo,
    p_amount_operator:
      filters.amountValue !== null ? filters.amountOperator : null,
    p_amount_value: filters.amountValue,
    p_location_ids: scopedLocationIds,
  })

  return {
    count: toNumber(summary?.claim_count),
    amount: toNumber(summary?.total_amount),
  }
}
