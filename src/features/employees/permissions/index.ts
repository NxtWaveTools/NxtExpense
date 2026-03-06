import type { ApprovalChain, Employee } from '@/features/employees/types'

const FOUR_WHEELER_ALLOWED_DESIGNATIONS = new Set([
  'State Business Head',
  'Zonal Business Head',
  'Program Manager',
] as const)

export function canSubmitFourWheelerClaim(
  designation: Employee['designation']
) {
  return FOUR_WHEELER_ALLOWED_DESIGNATIONS.has(
    designation as
      | 'State Business Head'
      | 'Zonal Business Head'
      | 'Program Manager'
  )
}

export function getAllowedVehicleTypes(designation: Employee['designation']) {
  if (canSubmitFourWheelerClaim(designation)) {
    return ['Two Wheeler', 'Four Wheeler'] as const
  }

  return ['Two Wheeler'] as const
}

export function getNextApprovalLevel(
  chain: ApprovalChain,
  currentLevel: 1 | 2 | 3 | null
): 1 | 2 | 3 | null {
  if (currentLevel === null) {
    if (chain.level1) return 1
    if (chain.level2) return 2
    if (chain.level3) return 3
    return null
  }

  if (currentLevel === 1) {
    if (chain.level2) return 2
    if (chain.level3) return 3
    return null
  }

  if (currentLevel === 2) {
    if (chain.level3) return 3
    return null
  }

  return null
}
