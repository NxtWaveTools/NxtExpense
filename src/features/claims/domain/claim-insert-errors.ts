export function mapClaimInsertErrorToUserMessage(
  error: unknown
): string | null {
  const message = error instanceof Error ? error.message : ''
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('expense_claims_one_active_per_employee_date') ||
    (normalizedMessage.includes(
      'duplicate key value violates unique constraint'
    ) &&
      normalizedMessage.includes('expense_claims'))
  ) {
    return 'Claim already submitted for this date. Please open My Claims to view the existing claim.'
  }

  return null
}
