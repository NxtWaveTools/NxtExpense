import { type DesignationApprovalFlow } from '@/lib/services/config-service'
import { type EmployeeRole } from '@/lib/services/employee-service'

// ────────────────────────────────────────────────────────────
// Get next approval level from the chain
// ────────────────────────────────────────────────────────────

/**
 * Given the current approval level (or null for first submission),
 * determine the next required level from the designation's flow.
 */
export function getNextApprovalLevel(
  flow: DesignationApprovalFlow,
  currentLevel: number | null
): number | null {
  const levels = flow.required_approval_levels
  if (!levels.length) return null

  if (currentLevel === null) return levels[0] ?? null

  const currentIdx = levels.indexOf(currentLevel)
  if (currentIdx === -1 || currentIdx >= levels.length - 1) return null

  return levels[currentIdx + 1] ?? null
}

// ────────────────────────────────────────────────────────────
// Dashboard access (ID-based — replaces hardcoded checks)
// ────────────────────────────────────────────────────────────

type DashboardAccess = {
  canCreateClaims: boolean
  canViewClaims: boolean
  canViewApprovals: boolean
  canViewFinanceQueue: boolean
  canViewAdmin: boolean
}

/**
 * Determine dashboard access from employee roles.
 * Finance roles see finance queue; all others see claims.
 * Approver roles see the approvals section.
 */
export function getDashboardAccessFromRoles(
  roles: EmployeeRole[],
  hasApproverAssignments: boolean
): DashboardAccess {
  const isFinance = roles.some((r) => r.is_finance_role)
  const isAdmin = roles.some((r) => r.is_admin_role)

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

/**
 * Check if employee can access their own claims section
 * (Finance and Admin roles cannot submit claims).
 */
export function canAccessEmployeeClaimsFromRoles(
  roles: EmployeeRole[]
): boolean {
  return (
    !roles.some((r) => r.is_finance_role) && !roles.some((r) => r.is_admin_role)
  )
}

/**
 * Check if user has any finance role (reviewer or processor).
 */
export function hasFinanceRole(roles: EmployeeRole[]): boolean {
  return roles.some((r) => r.is_finance_role)
}
