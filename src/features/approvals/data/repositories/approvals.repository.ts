import type { SupabaseClient } from '@supabase/supabase-js'

import type { Claim, ClaimItem } from '@/features/claims/types'
import {
  CLAIM_COLUMNS,
  getClaimAvailableActionsByClaimIds,
  mapClaimRow,
  resolveClaimAllowResubmitFilterValue,
} from '@/features/claims/data/queries'
import type { EmployeeRow } from '@/lib/services/employee-service'
import { getEmployeeById } from '@/lib/services/employee-service'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'
import { decodeCursor, encodeCursor } from '@/lib/utils/pagination'

import type {
  ApprovalAction,
  PendingApproval,
  PendingApprovalsFilters,
} from '@/features/approvals/types'
import { getPendingApprovalScopeByActor } from '@/features/approvals/data/repositories/pending-scope.repository'
import { getLocationIdsByApprovalLocationType } from '@/features/approvals/data/queries/location-type.query'

function buildClaimDateCursorFilter(
  claimDate: string,
  claimId: string,
  ascending: boolean
): string {
  if (ascending) {
    return `claim_date.gt.${claimDate},and(claim_date.eq.${claimDate},id.gt.${claimId})`
  }

  return `claim_date.lt.${claimDate},and(claim_date.eq.${claimDate},id.lt.${claimId})`
}

export async function getApproverActorByEmail(
  supabase: SupabaseClient,
  approverEmail: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_email', approverEmail.toLowerCase())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getPendingApprovalStatuses(
  supabase: SupabaseClient
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id')
    .not('approval_level', 'is', null)
    .eq('is_rejection', false)
    .eq('is_terminal', false)
    .eq('is_active', true)
    .in('approval_level', [1, 2])

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getPendingApprovalsPaginated(
  supabase: SupabaseClient,
  approverEmail: string,
  cursor: string | null,
  limit = 10,
  filters: PendingApprovalsFilters = {
    employeeName: null,
    claimStatus: null,
    claimDateFrom: null,
    claimDateTo: null,
    amountOperator: 'lte',
    amountValue: null,
    locationType: null,
    claimDateSort: 'desc',
  }
) {
  const lowerEmail = approverEmail.toLowerCase()

  const [actorResult, pendingStatuses] = await Promise.all([
    getApproverActorByEmail(supabase, lowerEmail),
    getPendingApprovalStatuses(supabase),
  ])

  if (!actorResult) {
    return { data: [], hasNextPage: false, nextCursor: null, limit }
  }

  let pendingStatusIds = pendingStatuses.map((status) => status.id)
  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  if (parsedStatusFilter) {
    pendingStatusIds = pendingStatuses
      .filter((status) => status.id === parsedStatusFilter.statusId)
      .map((status) => status.id)
  }

  if (pendingStatusIds.length === 0) {
    return { data: [], hasNextPage: false, nextCursor: null, limit }
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

  const toInList = (ids: string[]) =>
    ids.map((id) => `"${id.replaceAll('"', '\\"')}"`).join(',')

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
    return { data: [], hasNextPage: false, nextCursor: null, limit }
  }

  let query = supabase
    .from('expense_claims')
    .select(`${CLAIM_COLUMNS}, employees!employee_id!inner(*)`)
    .in('status_id', pendingStatusIds)
    .or(approvalFilters.join(','))
    .limit(limit + 1)

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

  if (filters.locationType) {
    const scopedLocationIds = await getLocationIdsByApprovalLocationType(
      supabase,
      filters.locationType
    )

    if (!scopedLocationIds || scopedLocationIds.length === 0) {
      return { data: [], hasNextPage: false, nextCursor: null, limit }
    }

    query = query.in('work_location_id', scopedLocationIds)
  }

  const normalizedName = filters.employeeName?.trim() ?? ''
  if (normalizedName) {
    const escapedName = normalizedName
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_')

    query = query.ilike('employees.employee_name', `%${escapedName}%`)
  }

  const isClaimDateAscending = filters.claimDateSort === 'asc'

  query = query
    .order('claim_date', { ascending: isClaimDateAscending })
    .order('id', { ascending: isClaimDateAscending })

  if (cursor) {
    const decoded = decodeCursor(cursor)
    query = query.or(
      buildClaimDateCursorFilter(
        decoded.created_at,
        decoded.id,
        isClaimDateAscending
      )
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as Array<
    Record<string, unknown> & { employees: EmployeeRow | EmployeeRow[] }
  >
  const hasNextPage = rows.length > limit
  const pageData = hasNextPage ? rows.slice(0, limit) : rows
  const claimIds = pageData.map((row) => row.id as string)

  const [itemsResult, actionsByClaimId] = await Promise.all([
    claimIds.length > 0
      ? supabase
          .from('expense_claim_items')
          .select('id, claim_id, item_type, description, amount, created_at')
          .in('claim_id', claimIds)
      : Promise.resolve({ data: [], error: null }),
    getClaimAvailableActionsByClaimIds(supabase, claimIds),
  ])

  if (itemsResult.error) {
    throw new Error(itemsResult.error.message)
  }

  const itemsByClaimId = new Map<string, ClaimItem[]>()
  for (const item of (itemsResult.data ?? []) as (ClaimItem & {
    claim_id: string
  })[]) {
    const list = itemsByClaimId.get(item.claim_id)
    if (list) {
      list.push(item)
    } else {
      itemsByClaimId.set(item.claim_id, [item])
    }
  }

  const pending: PendingApproval[] = pageData.map((row) => {
    const owner = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees

    if (!owner) {
      throw new Error('Claim owner mapping not found.')
    }

    const claim = mapClaimRow(row as Record<string, unknown>)
    const claimId = row.id as string

    return {
      claim: claim as Claim,
      owner,
      items: itemsByClaimId.get(claimId) ?? [],
      availableActions: actionsByClaimId.get(claimId) ?? [],
    }
  })

  const lastRecord = pageData.at(-1)
  const nextCursor =
    hasNextPage && lastRecord
      ? encodeCursor({
          created_at: lastRecord.claim_date as string,
          id: lastRecord.id as string,
        })
      : null

  return {
    data: pending,
    hasNextPage,
    nextCursor,
    limit,
  }
}

export async function getClaimApprovalHistory(
  supabase: SupabaseClient,
  claimId: string
): Promise<ApprovalAction[]> {
  const { data, error } = await supabase
    .from('approval_history')
    .select(
      'id, claim_id, approver_employee_id, approval_level, action, notes, rejection_notes, allow_resubmit, bypass_reason, skipped_levels, reason, acted_at, approver:employees!approver_employee_id(employee_email)'
    )
    .eq('claim_id', claimId)
    .order('acted_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((r) => {
    const approverRaw = r.approver as unknown
    const approver = Array.isArray(approverRaw) ? approverRaw[0] : approverRaw
    return {
      ...r,
      approver_email:
        (approver as { employee_email: string } | null)?.employee_email ?? '',
    } as ApprovalAction
  })
}

export async function getClaimWithOwner(
  supabase: SupabaseClient,
  claimId: string
): Promise<{ claim: Claim; owner: EmployeeRow } | null> {
  const { data, error } = await supabase
    .from('expense_claims')
    .select(`${CLAIM_COLUMNS}`)
    .eq('id', claimId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const owner = await getEmployeeById(supabase, data.employee_id)
  if (!owner) {
    throw new Error('Claim owner record not found.')
  }

  return { claim: mapClaimRow(data as Record<string, unknown>) as Claim, owner }
}
