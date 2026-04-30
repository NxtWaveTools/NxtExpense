import type { SupabaseClient } from '@supabase/supabase-js'

import { getScopedEmployeeNameSuggestions } from '@/features/employees/data/queries/employee-name-suggestions.query'

export async function getAdminAnalyticsEmployeeNameSuggestionsQuery(
  supabase: SupabaseClient,
  employeeNameSearch: string | null
): Promise<string[]> {
  return getScopedEmployeeNameSuggestions(supabase, employeeNameSearch, 8)
}
