import type { SupabaseClient } from '@supabase/supabase-js'

import type { EmployeeRow } from '@/lib/services/employee-service'
import { getEmployeeRoles } from '@/lib/services/employee-service'
import {
  getDashboardAccessFromRoles,
  canAccessEmployeeClaimsFromRoles,
  type DashboardAccess,
} from '@/features/employees/permissions/access-from-roles'

export async function getDashboardAccess(
  supabase: SupabaseClient,
  employee: EmployeeRow,
  hasApproverAccess: boolean
): Promise<DashboardAccess> {
  const roles = await getEmployeeRoles(supabase, employee.id)
  return getDashboardAccessFromRoles(roles, hasApproverAccess)
}

export async function canAccessEmployeeClaims(
  supabase: SupabaseClient,
  employee: EmployeeRow
): Promise<boolean> {
  const roles = await getEmployeeRoles(supabase, employee.id)
  return canAccessEmployeeClaimsFromRoles(roles)
}

export function canAccessApprovals(hasApproverAccess: boolean): boolean {
  return hasApproverAccess
}
