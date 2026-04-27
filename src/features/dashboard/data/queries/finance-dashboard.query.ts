import type { SupabaseClient } from '@supabase/supabase-js'

import { getFinanceEmployeeNameSuggestions } from '@/features/finance/data/queries'
import type {
  FinanceDashboardData,
  FinanceDashboardFilterOptions,
} from '@/features/dashboard/types/finance-dashboard'
import type { FinanceDashboardFilterInput } from '@/features/dashboard/validations/finance-dashboard'
import {
  getAllDesignations,
  getAllStates,
  getAllVehicleTypes,
  getAllWorkLocations,
} from '@/lib/services/config-service'

import { getFinancePendingDashboardAnalyticsRpc } from '@/features/dashboard/data/rpc/finance-dashboard.rpc'

export async function getFinanceDashboardAnalyticsQuery(
  supabase: SupabaseClient,
  filters: FinanceDashboardFilterInput
): Promise<FinanceDashboardData> {
  return getFinancePendingDashboardAnalyticsRpc(supabase, filters)
}

export async function getFinanceDashboardFilterOptionsQuery(
  supabase: SupabaseClient
): Promise<FinanceDashboardFilterOptions> {
  const [designations, vehicleTypes, workLocations, states] = await Promise.all(
    [
      getAllDesignations(supabase),
      getAllVehicleTypes(supabase),
      getAllWorkLocations(supabase),
      getAllStates(supabase),
    ]
  )

  return {
    designations: designations.map((d) => ({
      value: d.id,
      label: d.designation_name,
    })),
    vehicleTypes: vehicleTypes.map((v) => ({
      value: v.vehicle_code,
      label: v.vehicle_name,
    })),
    workLocations: workLocations.map((w) => ({
      value: w.id,
      label: w.location_name,
    })),
    states: states.map((s) => ({
      value: s.id,
      label: s.state_name,
    })),
  }
}

export async function getFinanceDashboardEmployeeNameSuggestionsQuery(
  supabase: SupabaseClient,
  employeeNameSearch: string | null
): Promise<string[]> {
  return getFinanceEmployeeNameSuggestions(supabase, employeeNameSearch, 8)
}
