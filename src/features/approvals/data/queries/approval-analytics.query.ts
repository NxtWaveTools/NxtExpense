import type { SupabaseClient } from '@supabase/supabase-js'

import {
  getFilteredClaimsByIds,
  getLatestApprovalActionsByClaim,
  getPaymentIssuedStatusIds,
} from '@/features/approvals/data/repositories/approval-analytics.repository'
import { getApproverActorByEmail } from '@/features/approvals/data/repositories/approvals.repository'
import { getLocationIdsByApprovalLocationType } from '@/features/approvals/data/queries/location-type.query'
import { getPendingApprovalsSummary } from '@/features/approvals/data/queries/pending-summary.query'
import type { PendingApprovalsFilters } from '@/features/approvals/types'

type ClaimMetricSummary = {
  count: number
  amount: number
}

type ApprovalAnalytics = {
  total: ClaimMetricSummary
  pendingApprovals: ClaimMetricSummary
  approvedClaims: ClaimMetricSummary
  paymentIssuedClaims: ClaimMetricSummary
  rejectedClaims: ClaimMetricSummary
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

function createMetricSummary(): ClaimMetricSummary {
  return { count: 0, amount: 0 }
}

function createEmptyAnalytics(): ApprovalAnalytics {
  return {
    total: createMetricSummary(),
    pendingApprovals: createMetricSummary(),
    approvedClaims: createMetricSummary(),
    paymentIssuedClaims: createMetricSummary(),
    rejectedClaims: createMetricSummary(),
  }
}

function sumMetric(metric: ClaimMetricSummary): number {
  return metric.amount
}

export async function getApprovalStageAnalytics(
  supabase: SupabaseClient,
  approverEmail: string,
  filters: PendingApprovalsFilters = DEFAULT_PENDING_FILTERS
): Promise<ApprovalAnalytics> {
  const analytics = createEmptyAnalytics()

  analytics.pendingApprovals = await getPendingApprovalsSummary(
    supabase,
    approverEmail,
    filters
  )

  const actorRow = await getApproverActorByEmail(supabase, approverEmail)

  if (!actorRow) {
    analytics.total.count = analytics.pendingApprovals.count
    analytics.total.amount = analytics.pendingApprovals.amount
    return analytics
  }

  const [paymentIssuedStatusIds, latestActionByClaim] = await Promise.all([
    getPaymentIssuedStatusIds(supabase),
    getLatestApprovalActionsByClaim(supabase, actorRow.id),
  ])

  if (latestActionByClaim.size === 0) {
    analytics.total.count = analytics.pendingApprovals.count
    analytics.total.amount = analytics.pendingApprovals.amount
    return analytics
  }

  const scopedLocationIds = await getLocationIdsByApprovalLocationType(
    supabase,
    filters.locationType
  )

  if (scopedLocationIds && scopedLocationIds.length === 0) {
    analytics.total.count = analytics.pendingApprovals.count
    analytics.total.amount = analytics.pendingApprovals.amount
    return analytics
  }

  const filteredClaims = await getFilteredClaimsByIds(
    supabase,
    [...latestActionByClaim.keys()],
    filters,
    scopedLocationIds
  )

  for (const claim of filteredClaims) {
    const action = latestActionByClaim.get(claim.id)
    const amount = Number(claim.total_amount ?? 0)

    if (action === 'approved') {
      analytics.approvedClaims.count += 1
      analytics.approvedClaims.amount += amount

      if (paymentIssuedStatusIds.has(claim.status_id)) {
        analytics.paymentIssuedClaims.count += 1
        analytics.paymentIssuedClaims.amount += amount
      }

      continue
    }

    if (action === 'rejected') {
      analytics.rejectedClaims.count += 1
      analytics.rejectedClaims.amount += amount
    }
  }

  analytics.total.count =
    analytics.pendingApprovals.count +
    analytics.approvedClaims.count +
    analytics.rejectedClaims.count
  analytics.total.amount =
    sumMetric(analytics.pendingApprovals) +
    sumMetric(analytics.approvedClaims) +
    sumMetric(analytics.rejectedClaims)

  return analytics
}
