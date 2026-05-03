import type { EmployeeRole } from '@/lib/services/employee-service'

export type DashboardAccess = {
  canCreateClaims: boolean
  canViewClaims: boolean
  canViewApprovals: boolean
  canViewFinanceQueue: boolean
  canViewAdmin: boolean
}

export function getDashboardAccessFromRoles(
  roles: EmployeeRole[],
  hasApproverAssignments: boolean
): DashboardAccess {
  const isFinance = roles.some((role) => role.is_finance_role)
  const isAdmin = roles.some((role) => role.is_admin_role)

  const canViewFinanceQueue = isFinance
  const canViewClaims = !isFinance && !isAdmin

  return {
    canCreateClaims: canViewClaims,
    canViewClaims,
    canViewApprovals: hasApproverAssignments,
    canViewFinanceQueue,
    canViewAdmin: isAdmin,
  }
}

export function canAccessEmployeeClaimsFromRoles(
  roles: EmployeeRole[]
): boolean {
  return (
    !roles.some((role) => role.is_finance_role) &&
    !roles.some((role) => role.is_admin_role)
  )
}

export function hasFinanceRole(roles: EmployeeRole[]): boolean {
  return roles.some((role) => role.is_finance_role)
}
