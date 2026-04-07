import type { SupabaseClient } from '@supabase/supabase-js'

export type MyClaimsMetricSummary = {
  count: number
  amount: number
}

export type MyClaimsStats = {
  total: MyClaimsMetricSummary
  pending: MyClaimsMetricSummary
  rejected: MyClaimsMetricSummary
  rejectedAllowReclaim: MyClaimsMetricSummary
}

type ClaimStatusSummaryRow = {
  id: string
  is_rejection: boolean
  is_payment_issued: boolean
}

type MyClaimStatsRow = {
  id: string
  created_at: string
  status_id: string
  total_amount: number | string
  allow_resubmit: boolean
}

function createMetricSummary(): MyClaimsMetricSummary {
  return { count: 0, amount: 0 }
}

function addToMetric(metric: MyClaimsMetricSummary, amount: number) {
  metric.count += 1
  metric.amount += amount
}

export async function getMyClaimsStats(
  supabase: SupabaseClient,
  employeeId: string
): Promise<MyClaimsStats> {
  const { data: statusCatalog, error: statusError } = await supabase
    .from('claim_statuses')
    .select('id, is_rejection, is_payment_issued')
    .eq('is_active', true)

  if (statusError) {
    throw new Error(statusError.message)
  }

  const statusRowById = new Map(
    ((statusCatalog ?? []) as ClaimStatusSummaryRow[]).map((row) => [
      row.id,
      row,
    ])
  )

  const { data: claims, error: claimsError } = await supabase
    .from('expense_claims')
    .select('id, created_at, status_id, total_amount, allow_resubmit')
    .eq('employee_id', employeeId)

  if (claimsError) {
    throw new Error(claimsError.message)
  }

  const stats: MyClaimsStats = {
    total: createMetricSummary(),
    pending: createMetricSummary(),
    rejected: createMetricSummary(),
    rejectedAllowReclaim: createMetricSummary(),
  }

  for (const claim of (claims ?? []) as MyClaimStatsRow[]) {
    const statusInfo = statusRowById.get(claim.status_id)
    const amount = Number(claim.total_amount ?? 0)

    addToMetric(stats.total, amount)

    if (statusInfo?.is_rejection) {
      addToMetric(stats.rejected, amount)

      if (claim.allow_resubmit) {
        addToMetric(stats.rejectedAllowReclaim, amount)
      }
    } else if (!statusInfo?.is_payment_issued) {
      addToMetric(stats.pending, amount)
    }
  }

  return stats
}
