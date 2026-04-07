import type { SupabaseClient } from '@supabase/supabase-js'

import type { PendingApprovalsFilters } from '@/features/approvals/types'
import { getLocationIdsByApprovalLocationType } from '@/features/approvals/queries/location-type'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'
import { resolveClaimAllowResubmitFilterValue } from '@/lib/services/claim-status-filter-service'

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

function toInList(ids: string[]) {
  return ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(',')
}

export async function getPendingApprovalsSummary(
  supabase: SupabaseClient,
  approverEmail: string,
  filters: PendingApprovalsFilters = DEFAULT_PENDING_FILTERS
): Promise<PendingApprovalsSummary> {
  const lowerEmail = approverEmail.toLowerCase()

  const [actorResult, pendingStatusesResult] = await Promise.all([
    supabase
      .from('employees')
      .select('id')
      .eq('employee_email', lowerEmail)
      .maybeSingle(),
    supabase
      .from('claim_statuses')
      .select('id')
      .not('approval_level', 'is', null)
      .eq('is_rejection', false)
      .eq('is_terminal', false)
      .eq('is_active', true)
      .in('approval_level', [1, 2]),
  ])

  if (actorResult.error) {
    throw new Error(actorResult.error.message)
  }

  if (pendingStatusesResult.error) {
    throw new Error(pendingStatusesResult.error.message)
  }

  if (!actorResult.data) {
    return { count: 0, amount: 0 }
  }

  const pendingStatuses = pendingStatusesResult.data ?? []
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

  const actorEmployeeId = actorResult.data.id

  const [level1Employees, level2Employees] = await Promise.all([
    supabase
      .from('employees')
      .select('id')
      .eq('approval_employee_id_level_1', actorEmployeeId),
    supabase
      .from('employees')
      .select('id')
      .eq('approval_employee_id_level_3', actorEmployeeId),
  ])

  if (level1Employees.error) {
    throw new Error(level1Employees.error.message)
  }

  if (level2Employees.error) {
    throw new Error(level2Employees.error.message)
  }

  const level1Ids = (level1Employees.data ?? []).map((row) => row.id)
  const level2Ids = (level2Employees.data ?? []).map((row) => row.id)

  const approvalFilters: string[] = []

  if (level1Ids.length > 0) {
    approvalFilters.push(
      `and(current_approval_level.eq.1,employee_id.in.(${toInList(level1Ids)}))`
    )
  }

  if (level2Ids.length > 0) {
    approvalFilters.push(
      `and(current_approval_level.eq.2,employee_id.in.(${toInList(level2Ids)}))`
    )
  }

  if (approvalFilters.length === 0) {
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

  // FIX [ISSUE#4] — Use COUNT + SUM queries instead of O(N) cursor loop
  let countQuery = supabase
    .from('expense_claims')
    .select('id', { count: 'exact', head: true })
    .in('status_id', pendingStatusIds)
    .or(approvalFilters.join(','))

  let sumQuery = supabase
    .from('expense_claims')
    .select('total_amount')
    .in('status_id', pendingStatusIds)
    .or(approvalFilters.join(','))

  if (allowResubmitFilter !== null) {
    countQuery = countQuery.eq('allow_resubmit', allowResubmitFilter)
    sumQuery = sumQuery.eq('allow_resubmit', allowResubmitFilter)
  }

  if (normalizedName) {
    const escapedName = normalizedName
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_')
    // Need inner join with employees for name filter — switch to non-head query
    countQuery = supabase
      .from('expense_claims')
      .select('id, employees!employee_id!inner(employee_name)', {
        count: 'exact',
        head: true,
      })
      .in('status_id', pendingStatusIds)
      .or(approvalFilters.join(','))
      .ilike(
        'employees.employee_name',
        `%${escapedName}%`
      ) as unknown as typeof countQuery
    sumQuery = supabase
      .from('expense_claims')
      .select('total_amount, employees!employee_id!inner(employee_name)')
      .in('status_id', pendingStatusIds)
      .or(approvalFilters.join(','))
      .ilike(
        'employees.employee_name',
        `%${escapedName}%`
      ) as unknown as typeof sumQuery

    if (allowResubmitFilter !== null) {
      countQuery = countQuery.eq('allow_resubmit', allowResubmitFilter)
      sumQuery = sumQuery.eq('allow_resubmit', allowResubmitFilter)
    }
  }

  if (filters.claimDateFrom) {
    countQuery = countQuery.gte('claim_date', filters.claimDateFrom)
    sumQuery = sumQuery.gte('claim_date', filters.claimDateFrom)
  }

  if (filters.claimDateTo) {
    countQuery = countQuery.lte('claim_date', filters.claimDateTo)
    sumQuery = sumQuery.lte('claim_date', filters.claimDateTo)
  }

  if (filters.amountValue !== null) {
    if (filters.amountOperator === 'gte') {
      countQuery = countQuery.gte('total_amount', filters.amountValue)
      sumQuery = sumQuery.gte('total_amount', filters.amountValue)
    } else if (filters.amountOperator === 'eq') {
      countQuery = countQuery.eq('total_amount', filters.amountValue)
      sumQuery = sumQuery.eq('total_amount', filters.amountValue)
    } else {
      countQuery = countQuery.lte('total_amount', filters.amountValue)
      sumQuery = sumQuery.lte('total_amount', filters.amountValue)
    }
  }

  if (scopedLocationIds) {
    countQuery = countQuery.in('work_location_id', scopedLocationIds)
    sumQuery = sumQuery.in('work_location_id', scopedLocationIds)
  }

  const [countResult, sumResult] = await Promise.all([countQuery, sumQuery])

  if (countResult.error) {
    throw new Error(countResult.error.message)
  }

  if (sumResult.error) {
    throw new Error(sumResult.error.message)
  }

  const totalCount = countResult.count ?? 0
  const totalAmount = (
    (sumResult.data ?? []) as Array<{ total_amount: number | string }>
  ).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0)

  return {
    count: totalCount,
    amount: totalAmount,
  }
}
