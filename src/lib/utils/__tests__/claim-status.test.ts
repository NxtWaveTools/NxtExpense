import { describe, expect, it } from 'vitest'

import {
  getClaimStatusDisplayLabel,
  VISIBLE_CLAIM_STATUS_CODES,
} from '@/lib/utils/claim-status'

describe('claim status helpers', () => {
  it('uses finance-approved label when status code is APPROVED', () => {
    expect(getClaimStatusDisplayLabel('APPROVED', 'Approved')).toBe(
      'Finance Approved'
    )
  })

  it('uses finance-approved label when status name is Approved', () => {
    expect(
      getClaimStatusDisplayLabel('L3_PENDING_FINANCE_REVIEW', 'Approved')
    ).toBe('Finance Approved')
  })

  it('returns status name when non-empty', () => {
    expect(getClaimStatusDisplayLabel('L1_PENDING', 'L1 Pending')).toBe(
      'L1 Pending'
    )
  })

  it('falls back to status code when status name is blank', () => {
    expect(getClaimStatusDisplayLabel('REJECTED', '   ')).toBe('REJECTED')
  })

  it('returns empty string when both status code and name are missing', () => {
    expect(getClaimStatusDisplayLabel(null, undefined)).toBe('')
  })

  it('exposes the status codes visible in claim tables', () => {
    expect(VISIBLE_CLAIM_STATUS_CODES).toContain('L1_PENDING')
    expect(VISIBLE_CLAIM_STATUS_CODES).toContain('APPROVED')
    expect(VISIBLE_CLAIM_STATUS_CODES).toHaveLength(5)
  })
})
