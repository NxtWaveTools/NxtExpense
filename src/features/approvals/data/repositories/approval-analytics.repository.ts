import type { SupabaseClient } from '@supabase/supabase-js'

import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'
import { resolveClaimAllowResubmitFilterValue } from '@/features/claims/data/queries'

import type { PendingApprovalsFilters } from '@/features/approvals/types'

export type ApprovalActionRow = {
  claim_id: string
  action: string
  acted_at: string
}

export type ClaimAmountRow = {
  id: string
  total_amount: number | string
  status_id: string
  allow_resubmit: boolean
}

type ClaimStatusRow = {
  id: string
  is_payment_issued: boolean
}

export async function getPaymentIssuedStatusIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id, is_payment_issued')
    .eq('is_active', true)

  if (error) {
    throw new Error(error.message)
  }

  return new Set(
    ((data ?? []) as ClaimStatusRow[])
      .filter((status) => status.is_payment_issued)
      .map((status) => status.id)
  )
}

export async function getLatestApprovalActionsByClaim(
  supabase: SupabaseClient,
  actorEmployeeId: string
): Promise<Map<string, 'approved' | 'rejected'>> {
  const { data, error } = await supabase
    .from('approval_history')
    .select('claim_id, action, acted_at')
    .eq('approver_employee_id', actorEmployeeId)
    .in('action', ['approved', 'rejected'])
    .order('acted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const latestActionByClaim = new Map<string, 'approved' | 'rejected'>()

  for (const row of (data ?? []) as ApprovalActionRow[]) {
    if (!latestActionByClaim.has(row.claim_id)) {
      if (row.action === 'approved' || row.action === 'rejected') {
        latestActionByClaim.set(row.claim_id, row.action)
      }
    }
  }

  return latestActionByClaim
}

export async function getFilteredClaimsByIds(
  supabase: SupabaseClient,
  claimIds: string[],
  filters: PendingApprovalsFilters,
  scopedLocationIds: string[] | null
): Promise<ClaimAmountRow[]> {
  if (claimIds.length === 0) {
    return []
  }

  let query = supabase
    .from('expense_claims')
    .select(
      'id, total_amount, status_id, allow_resubmit, employees!employee_id!inner(employee_name)'
    )
    .in('id', claimIds)

  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  if (parsedStatusFilter) {
    query = query.eq('status_id', parsedStatusFilter.statusId)
  }

  if (allowResubmitFilter !== null) {
    query = query.eq('allow_resubmit', allowResubmitFilter)
  }

  if (filters.claimDateFrom) {
    query = query.gte('claim_date', filters.claimDateFrom)
  }

  if (filters.claimDateTo) {
    query = query.lte('claim_date', filters.claimDateTo)
  }

  if (filters.amountValue !== null) {
    if (filters.amountOperator === 'gte') {
      query = query.gte('total_amount', filters.amountValue)
    } else if (filters.amountOperator === 'eq') {
      query = query.eq('total_amount', filters.amountValue)
    } else {
      query = query.lte('total_amount', filters.amountValue)
    }
  }

  const normalizedName = filters.employeeName?.trim() ?? ''
  if (normalizedName) {
    const escapedName = normalizedName
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_')
    query = query.ilike('employees.employee_name', `%${escapedName}%`)
  }

  if (scopedLocationIds) {
    if (scopedLocationIds.length === 0) {
      return []
    }

    query = query.in('work_location_id', scopedLocationIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ClaimAmountRow[]
}
