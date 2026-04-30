import type { SupabaseClient } from '@supabase/supabase-js'

import type { FinanceDashboardData } from '@/features/dashboard/types/finance-dashboard'
import type { FinanceDashboardFilterInput } from '@/features/dashboard/validations/finance-dashboard'

const FINANCE_RPC_SIGNATURE_DRIFT_PATTERN =
  /p_claim_id|p_date_filter_field|function .* does not exist|best candidate function/i

export async function getFinancePendingDashboardAnalyticsRpc(
  supabase: SupabaseClient,
  filters: FinanceDashboardFilterInput
): Promise<FinanceDashboardData> {
  const baseArgs = {
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_designation_id: filters.designationId ?? null,
    p_work_location_id: filters.workLocationId ?? null,
    p_state_id: filters.stateId ?? null,
    p_employee_id: filters.employeeId ?? null,
    p_employee_name: filters.employeeName ?? null,
    p_vehicle_code: filters.vehicleCode ?? null,
  }

  const newestArgs = {
    ...baseArgs,
    p_claim_id: null,
    p_date_filter_field: filters.dateFilterField,
  }

  const midArgs = {
    ...baseArgs,
    p_date_filter_field: filters.dateFilterField,
  }

  let { data, error } = await supabase.rpc(
    'get_finance_pending_dashboard_analytics',
    newestArgs
  )

  if (error && FINANCE_RPC_SIGNATURE_DRIFT_PATTERN.test(error.message)) {
    const fallback = await supabase.rpc(
      'get_finance_pending_dashboard_analytics',
      midArgs
    )
    data = fallback.data
    error = fallback.error
  }

  if (error && FINANCE_RPC_SIGNATURE_DRIFT_PATTERN.test(error.message)) {
    const fallback = await supabase.rpc(
      'get_finance_pending_dashboard_analytics',
      baseArgs
    )
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    throw new Error(error.message)
  }

  return data as FinanceDashboardData
}
