import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  AdminAnalyticsFilters,
  AdminDashboardAnalytics,
} from '@/features/admin/types/analytics'

const ADMIN_ANALYTICS_SIGNATURE_DRIFT_PATTERN =
  /p_claim_id|function .* does not exist/i

function buildAdminDashboardAnalyticsRpcArgs(
  filters: AdminAnalyticsFilters,
  topClaimsLimit: number
) {
  return {
    p_date_filter_field: filters.dateFilterField,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_claim_id: filters.claimId ?? null,
    p_designation_id: filters.designationId ?? null,
    p_work_location_id: filters.workLocationId ?? null,
    p_state_id: filters.stateId ?? null,
    p_employee_id: filters.employeeId ?? null,
    p_employee_name: filters.employeeName ?? null,
    p_vehicle_code: filters.vehicleCode ?? null,
    p_claim_status_id: filters.claimStatusId ?? null,
    p_pending_only: filters.pendingOnly,
    p_top_claims_limit: topClaimsLimit,
  }
}

function buildFallbackRpcArgs(
  filters: AdminAnalyticsFilters,
  topClaimsLimit: number
) {
  return {
    p_date_filter_field: filters.dateFilterField,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_designation_id: filters.designationId ?? null,
    p_work_location_id: filters.workLocationId ?? null,
    p_state_id: filters.stateId ?? null,
    p_employee_id: filters.employeeId ?? null,
    p_employee_name: filters.employeeName ?? null,
    p_vehicle_code: filters.vehicleCode ?? null,
    p_claim_status_id: filters.claimStatusId ?? null,
    p_pending_only: filters.pendingOnly,
    p_top_claims_limit: topClaimsLimit,
  }
}

export async function getAdminDashboardAnalyticsRpc(
  supabase: SupabaseClient,
  filters: AdminAnalyticsFilters,
  topClaimsLimit = 10
): Promise<AdminDashboardAnalytics> {
  const { data, error } = await supabase.rpc(
    'get_admin_dashboard_analytics',
    buildAdminDashboardAnalyticsRpcArgs(filters, topClaimsLimit)
  )

  if (error && ADMIN_ANALYTICS_SIGNATURE_DRIFT_PATTERN.test(error.message)) {
    const fallback = await supabase.rpc(
      'get_admin_dashboard_analytics',
      buildFallbackRpcArgs(filters, topClaimsLimit)
    )

    if (fallback.error) {
      throw new Error(fallback.error.message)
    }

    return fallback.data as AdminDashboardAnalytics
  }

  if (error) {
    throw new Error(error.message)
  }

  return data as AdminDashboardAnalytics
}
