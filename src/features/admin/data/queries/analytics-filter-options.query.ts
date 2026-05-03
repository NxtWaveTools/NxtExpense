import type { SupabaseClient } from '@supabase/supabase-js'

import {
  getAllDesignations,
  getAllStates,
  getAllVehicleTypes,
  getAllWorkLocations,
} from '@/lib/services/config-service'
import { getActiveAdminClaimStatusOptions } from '@/features/admin/data/repositories/admin-filter-options.repository'
import type { AdminAnalyticsFilterOptions } from '@/features/admin/types/analytics'

export async function getAdminAnalyticsFilterOptionsQuery(
  supabase: SupabaseClient
): Promise<AdminAnalyticsFilterOptions> {
  const [designations, workLocations, states, vehicleTypes, claimStatuses] =
    await Promise.all([
      getAllDesignations(supabase),
      getAllWorkLocations(supabase),
      getAllStates(supabase),
      getAllVehicleTypes(supabase),
      getActiveAdminClaimStatusOptions(supabase),
    ])

  return {
    designations: designations.map((item) => ({
      value: item.id,
      label: item.designation_name,
    })),
    workLocations: workLocations.map((item) => ({
      value: item.id,
      label: item.location_name,
    })),
    states: states.map((item) => ({
      value: item.id,
      label: item.state_name,
    })),
    vehicleTypes: vehicleTypes.map((item) => ({
      value: item.vehicle_code,
      label: item.vehicle_name,
    })),
    claimStatuses: claimStatuses.map((item) => ({
      value: item.id,
      label: item.status_name,
    })),
  }
}
