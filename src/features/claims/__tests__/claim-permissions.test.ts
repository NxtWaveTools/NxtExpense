import { describe, expect, it } from 'vitest'

import { canEditClaim, canViewClaim } from '@/features/claims/permissions'

describe('claim permissions', () => {
  it('allows viewing own claim and blocks other employee claims', () => {
    expect(
      canViewClaim({ id: 'emp-1' } as never, { employee_id: 'emp-1' } as never)
    ).toBe(true)

    expect(
      canViewClaim({ id: 'emp-2' } as never, { employee_id: 'emp-1' } as never)
    ).toBe(false)
  })

  it('allows editing draft claims before first submission', () => {
    const canEdit = canEditClaim(
      { id: 'emp-1' } as never,
      {
        employee_id: 'emp-1',
        submitted_at: null,
        allow_resubmit: false,
      } as never
    )

    expect(canEdit).toBe(true)
  })

  it('allows editing rejected claim when resubmission is allowed', () => {
    const canEdit = canEditClaim(
      { id: 'emp-1' } as never,
      {
        employee_id: 'emp-1',
        submitted_at: '2026-03-10T10:00:00.000Z',
        allow_resubmit: true,
      } as never
    )

    expect(canEdit).toBe(true)
  })

  it('blocks editing submitted claims when resubmission is not allowed', () => {
    const canEdit = canEditClaim(
      { id: 'emp-1' } as never,
      {
        employee_id: 'emp-1',
        submitted_at: '2026-03-10T10:00:00.000Z',
        allow_resubmit: false,
      } as never
    )

    expect(canEdit).toBe(false)
  })

  it('blocks editing claims owned by another employee', () => {
    const canEdit = canEditClaim(
      { id: 'emp-2' } as never,
      {
        employee_id: 'emp-1',
        submitted_at: null,
        allow_resubmit: true,
      } as never
    )

    expect(canEdit).toBe(false)
  })
})
