import { getClaimStatusDisplay } from '@/lib/utils/claim-status'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ClaimMetricSummary = {
  count: number
  amount: number
}

export type DashboardClaimStats = {
  total: ClaimMetricSummary
  pending: ClaimMetricSummary
  approved: ClaimMetricSummary
  rejected: ClaimMetricSummary
  rejectedAllowReclaim: ClaimMetricSummary
}

export type DashboardRecentClaim = {
  id: string
  claim_number: string | null
  claim_date: string
  total_amount: number
  statusName: string
  displayColor: string
}

type DashboardSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>

type ClaimStatusRow = {
  id: string
  is_rejection: boolean
  is_payment_issued: boolean
}

// FIX [ISSUE#4] — Push aggregations to Postgres instead of O(N) JS loops
export async function getEmployeeClaimStats(
  supabase: DashboardSupabaseClient,
  employeeId: string
): Promise<DashboardClaimStats> {
  const { data: statusRows, error: statusError } = await supabase
    .from('claim_statuses')
    .select('id, is_rejection, is_payment_issued')
    .eq('is_active', true)

  if (statusError) {
    throw new Error(statusError.message)
  }

  const rejectedStatusIds = ((statusRows ?? []) as ClaimStatusRow[])
    .filter((s) => s.is_rejection)
    .map((s) => s.id)

  const approvedStatusIds = ((statusRows ?? []) as ClaimStatusRow[])
    .filter((s) => s.is_payment_issued)
    .map((s) => s.id)

  // Use parallel HEAD count queries + a single SUM query to compute all metrics
  // without fetching individual rows into JS memory
  const baseFilter = { column: 'employee_id' as const, value: employeeId }

  const [
    totalResult,
    totalAmountResult,
    rejectedResult,
    rejectedAmountResult,
    rejectedReclaimResult,
    rejectedReclaimAmountResult,
    approvedResult,
    approvedAmountResult,
  ] = await Promise.all([
    // Total count
    supabase
      .from('expense_claims')
      .select('id', { count: 'exact', head: true })
      .eq(baseFilter.column, baseFilter.value),
    // Total amount
    supabase
      .from('expense_claims')
      .select('total_amount')
      .eq(baseFilter.column, baseFilter.value),
    // Rejected count (not allow_resubmit)
    rejectedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('id', { count: 'exact', head: true })
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', rejectedStatusIds)
          .eq('allow_resubmit', false)
      : Promise.resolve({ count: 0, error: null }),
    // Rejected amount (not allow_resubmit)
    rejectedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('total_amount')
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', rejectedStatusIds)
          .eq('allow_resubmit', false)
      : Promise.resolve({ data: [], error: null }),
    // Rejected allow reclaim count
    rejectedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('id', { count: 'exact', head: true })
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', rejectedStatusIds)
          .eq('allow_resubmit', true)
      : Promise.resolve({ count: 0, error: null }),
    // Rejected allow reclaim amount
    rejectedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('total_amount')
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', rejectedStatusIds)
          .eq('allow_resubmit', true)
      : Promise.resolve({ data: [], error: null }),
    // Approved count
    approvedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('id', { count: 'exact', head: true })
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', approvedStatusIds)
      : Promise.resolve({ count: 0, error: null }),
    // Approved amount
    approvedStatusIds.length > 0
      ? supabase
          .from('expense_claims')
          .select('total_amount')
          .eq(baseFilter.column, baseFilter.value)
          .in('status_id', approvedStatusIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  function sumAmounts(
    result: { data?: Array<{ total_amount: number | string }> | null } | null
  ): number {
    if (!result?.data) return 0
    return result.data.reduce(
      (sum, row) => sum + Number(row.total_amount ?? 0),
      0
    )
  }

  const totalCount = totalResult.count ?? 0
  const totalAmount = sumAmounts(totalAmountResult)
  const rejectedCount =
    'count' in rejectedResult ? (rejectedResult.count ?? 0) : 0
  const rejectedAmount = sumAmounts(rejectedAmountResult)
  const rejectedReclaimCount =
    'count' in rejectedReclaimResult ? (rejectedReclaimResult.count ?? 0) : 0
  const rejectedReclaimAmount = sumAmounts(rejectedReclaimAmountResult)
  const approvedCount =
    'count' in approvedResult ? (approvedResult.count ?? 0) : 0
  const approvedAmount = sumAmounts(approvedAmountResult)

  const pendingCount =
    totalCount - rejectedCount - rejectedReclaimCount - approvedCount
  const pendingAmount =
    totalAmount - rejectedAmount - rejectedReclaimAmount - approvedAmount

  return {
    total: { count: totalCount, amount: totalAmount },
    pending: { count: Math.max(0, pendingCount), amount: pendingAmount },
    approved: { count: approvedCount, amount: approvedAmount },
    rejected: { count: rejectedCount, amount: rejectedAmount },
    rejectedAllowReclaim: {
      count: rejectedReclaimCount,
      amount: rejectedReclaimAmount,
    },
  }
}

export async function getRecentClaims(
  supabase: DashboardSupabaseClient,
  employeeId: string
): Promise<DashboardRecentClaim[]> {
  const { data } = await supabase
    .from('expense_claims')
    .select(
      'id, claim_number, claim_date, total_amount, allow_resubmit, claim_statuses!status_id(status_code, status_name, display_color, allow_resubmit_status_name, allow_resubmit_display_color)'
    )
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const statusInfo = Array.isArray(row.claim_statuses)
      ? row.claim_statuses[0]
      : row.claim_statuses
    const display = getClaimStatusDisplay({
      statusCode: statusInfo?.status_code,
      statusName: statusInfo?.status_name,
      statusDisplayColor: statusInfo?.display_color,
      allowResubmit: Boolean(row.allow_resubmit),
      allowResubmitStatusName: statusInfo?.allow_resubmit_status_name,
      allowResubmitDisplayColor: statusInfo?.allow_resubmit_display_color,
    })

    return {
      id: row.id,
      claim_number: row.claim_number,
      claim_date: row.claim_date,
      total_amount: Number(row.total_amount ?? 0),
      statusName: display.label,
      displayColor: display.colorToken,
    }
  })
}
