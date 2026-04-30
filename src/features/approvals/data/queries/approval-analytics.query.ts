import type { SupabaseClient } from '@supabase/supabase-js'

import {
  getApprovalHistoryAnalyticsRpc,
  type ApprovalHistoryAnalyticsRpcRow,
} from '@/features/approvals/data/rpc/approval-analytics.rpc'
import { buildApprovalHistoryRpcArgs } from '@/features/approvals/data/rpc/approval-history-args'
import { getPendingApprovalsSummary } from '@/features/approvals/data/queries/pending-summary.query'
import type { ApprovalHistoryFilters } from '@/features/approvals/types'
import { resolveClaimAllowResubmitFilterValue } from '@/features/claims/data/queries'
import { parseClaimStatusFilterValue } from '@/lib/utils/claim-status-filter'

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

const DEFAULT_APPROVAL_FILTERS: ApprovalHistoryFilters = {
  employeeName: null,
  claimStatus: null,
  claimDateFrom: null,
  claimDateTo: null,
  amountOperator: 'lte',
  amountValue: null,
  locationType: null,
  claimDateSort: 'desc',
  hodApprovedFrom: null,
  hodApprovedTo: null,
  financeApprovedFrom: null,
  financeApprovedTo: null,
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

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0)
}

function toMetricSummary(
  count:
    | ApprovalHistoryAnalyticsRpcRow[keyof ApprovalHistoryAnalyticsRpcRow]
    | undefined,
  amount:
    | ApprovalHistoryAnalyticsRpcRow[keyof ApprovalHistoryAnalyticsRpcRow]
    | undefined
): ClaimMetricSummary {
  return {
    count: toNumber(count),
    amount: toNumber(amount),
  }
}

export async function getApprovalStageAnalytics(
  supabase: SupabaseClient,
  approverEmail: string,
  filters: ApprovalHistoryFilters = DEFAULT_APPROVAL_FILTERS
): Promise<ApprovalAnalytics> {
  const pendingApprovals = await getPendingApprovalsSummary(
    supabase,
    approverEmail,
    filters
  )

  const parsedStatusFilter = parseClaimStatusFilterValue(filters.claimStatus)
  const allowResubmitFilter = await resolveClaimAllowResubmitFilterValue(
    supabase,
    parsedStatusFilter
  )

  const historyAnalytics = await getApprovalHistoryAnalyticsRpc(
    supabase,
    buildApprovalHistoryRpcArgs(filters, {
      allowResubmitFilter,
      statusId: parsedStatusFilter?.statusId ?? null,
    })
  )

  const analytics = createEmptyAnalytics()

  analytics.pendingApprovals = pendingApprovals
  analytics.approvedClaims = toMetricSummary(
    historyAnalytics?.approved_count,
    historyAnalytics?.approved_amount
  )
  analytics.paymentIssuedClaims = toMetricSummary(
    historyAnalytics?.payment_issued_count,
    historyAnalytics?.payment_issued_amount
  )
  analytics.rejectedClaims = toMetricSummary(
    historyAnalytics?.rejected_count,
    historyAnalytics?.rejected_amount
  )

  analytics.total.count =
    pendingApprovals.count + analytics.approvedClaims.count + analytics.rejectedClaims.count
  analytics.total.amount =
    sumMetric(pendingApprovals) +
    sumMetric(analytics.approvedClaims) +
    sumMetric(analytics.rejectedClaims)

  return analytics
}
