const APPROVAL_HISTORY_AMOUNT_DESIGNATIONS = new Set([
  'state business head',
  'zonal business head',
  'program manager',
  'head of department',
])

function normalizeDesignationName(
  designationName: string | null | undefined
): string {
  return designationName?.trim().toLowerCase() ?? ''
}

export function canViewApprovalHistoryAmount(
  designationName: string | null | undefined
): boolean {
  return APPROVAL_HISTORY_AMOUNT_DESIGNATIONS.has(
    normalizeDesignationName(designationName)
  )
}
