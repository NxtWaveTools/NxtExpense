import type { SupabaseClient } from '@supabase/supabase-js'

import { getScopedEmployeeNameSuggestions } from '@/features/employees/data/queries/employee-name-suggestions.query'

export async function getApprovalEmployeeNameSuggestions(
  supabase: SupabaseClient,
  employeeNameSearch: string | null,
  limit = 100
): Promise<string[]> {
  return getScopedEmployeeNameSuggestions(supabase, employeeNameSearch, limit)
}
