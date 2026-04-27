import type { DesignationApprovalFlow } from '@/lib/services/config-service'

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
