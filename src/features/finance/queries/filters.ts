import type { SupabaseClient } from '@supabase/supabase-js'

import type { FinanceFilters } from '@/features/finance/types'
import {
  hasFinanceClaimFilters,
  toIstDayEnd,
  toIstDayStart,
} from '@/features/finance/utils/filters'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'
import { resolveClaimAllowResubmitFilterValue } from '@/lib/services/claim-status-filter-service'
import {
  isFinanceActionDateFilterField,
  getDateFilterTargetStatusIds,
  getFinanceActionCodesForDateFilter,
} from './filter-date-resolvers'

// Re-export submodules for consumers that import from this path
export {
  isFinanceActionDateFilterField,
  getFinanceActionCodesForDateFilter,
  type FinanceActionDateFilterField,
} from './filter-date-resolvers'
export { getFinanceFilterOptions } from './filter-options'

type ClaimFilterScope = {
  /** Pre-fetched UUID of the status that results must be constrained to. */
  requiredStatusId?: string
}

function toLikePattern(value: string): string {
  const escaped = value.replaceAll('%', '\\%').replaceAll('_', '\\_')
  return `%${escaped}%`
}

export async function getFilteredClaimIdsForFinance(
  supabase: SupabaseClient,
  filters: FinanceFilters,
  scope: ClaimFilterScope = {}
): Promise<string[] | null> {
  if (!hasFinanceClaimFilters(filters)) {
    return null
  }

  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )
  const allowResubmitOnlyStatusFilter = allowResubmitFilter === true

  if (scope.requiredStatusId && filters.claimStatus) {
    if (
      !parsedStatusFilter ||
      allowResubmitOnlyStatusFilter ||
      parsedStatusFilter.statusId !== scope.requiredStatusId
    ) {
      return []
    }
  }

  const statusId =
    scope.requiredStatusId ?? parsedStatusFilter?.statusId ?? null

  let query = supabase
    .from('expense_claims')
    .select('id, employees!employee_id!inner(employee_name, designation_id)')

  if (statusId) {
    query = query.eq('status_id', statusId)
  }

  if (allowResubmitFilter !== null) {
    query = query.eq('allow_resubmit', allowResubmitFilter)
  }

  if (filters.employeeName) {
    query = query.ilike(
      'employees.employee_name',
      toLikePattern(filters.employeeName)
    )
  }

  if (filters.claimNumber) {
    query = query.eq('claim_number', filters.claimNumber)
  }

  if (filters.ownerDesignation) {
    query = query.eq('employees.designation_id', filters.ownerDesignation)
  }

  if (filters.dateFilterField === 'claim_date') {
    if (filters.dateFrom) {
      query = query.gte('claim_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('claim_date', filters.dateTo)
    }
  }

  if (filters.dateFilterField === 'submitted_at') {
    const submittedDateFrom = toIstDayStart(filters.dateFrom)
    const submittedDateTo = toIstDayEnd(filters.dateTo)

    if (submittedDateFrom) {
      query = query.gte('submitted_at', submittedDateFrom)
    }

    if (submittedDateTo) {
      query = query.lte('submitted_at', submittedDateTo)
    }
  }

  if (
    isFinanceActionDateFilterField(filters.dateFilterField) &&
    (filters.dateFrom || filters.dateTo)
  ) {
    const dateFilterField = filters.dateFilterField

    const dateFilterStatusIds = await getDateFilterTargetStatusIds(
      supabase,
      dateFilterField
    )

    if (dateFilterStatusIds.size === 0) {
      return []
    }

    query = query.in('status_id', [...dateFilterStatusIds])

    const dateFilterActions = await getFinanceActionCodesForDateFilter(
      supabase,
      dateFilterField,
      dateFilterStatusIds
    )

    if (dateFilterActions.length === 0) {
      return []
    }

    let financeDateQuery = supabase
      .from('finance_actions')
      .select('claim_id')
      .in('action', dateFilterActions)
      .limit(2000)

    const dateFrom = toIstDayStart(filters.dateFrom)
    const dateTo = toIstDayEnd(filters.dateTo)

    if (dateFrom) {
      financeDateQuery = financeDateQuery.gte('acted_at', dateFrom)
    }

    if (dateTo) {
      financeDateQuery = financeDateQuery.lte('acted_at', dateTo)
    }

    const { data: financeDateRows, error: financeDateError } =
      await financeDateQuery

    if (financeDateError) {
      throw new Error(financeDateError.message)
    }

    const financeDateClaimIds = [
      ...new Set((financeDateRows ?? []).map((row) => row.claim_id)),
    ]

    if (financeDateClaimIds.length === 0) {
      return []
    }

    query = query.in('id', financeDateClaimIds)
  }

  if (filters.workLocation) {
    query = query.eq('work_location_id', filters.workLocation)
  }

  if (filters.hodApproverEmployeeId) {
    const { data: financeReviewStatus } = await supabase
      .from('claim_statuses')
      .select('id')
      .eq('approval_level', 3)
      .eq('is_approval', false)
      .eq('is_rejection', false)
      .eq('is_terminal', false)
      .maybeSingle()

    if (!financeReviewStatus) {
      return []
    }

    const { data: hodRows, error: hodError } = await supabase
      .from('approval_history')
      .select('claim_id')
      .eq('approver_employee_id', filters.hodApproverEmployeeId)
      .eq('new_status_id', financeReviewStatus.id)
      .limit(2000)

    if (hodError) {
      throw new Error(hodError.message)
    }

    const hodClaimIds = [...new Set((hodRows ?? []).map((row) => row.claim_id))]

    if (hodClaimIds.length === 0) {
      return []
    }

    query = query.in('id', hodClaimIds)
  }

  const { data, error } = await query.limit(2000)

  if (error) {
    throw new Error(error.message)
  }

  return [...new Set((data ?? []).map((row) => row.id))]
}
