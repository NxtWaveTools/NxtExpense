import { describe, expect, it, vi } from 'vitest'

describe('claimDateSchema', () => {
  it('parses valid past date into display/parsed/iso object', async () => {
    const { claimDateSchema } = await import('@/lib/validations/claim')

    const result = claimDateSchema.safeParse('06/03/2026')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.display).toBe('06/03/2026')
      expect(result.data.iso).toBe('2026-03-06')
      expect(result.data.parsed).toBeInstanceOf(Date)
    }
  })

  it('rejects future dates with financial validation message', async () => {
    const { claimDateSchema } = await import('@/lib/validations/claim')

    const result = claimDateSchema.safeParse('06/03/2099')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Future dates are not allowed.'
      )
    }
  })

  it('uses fallback message when date parser throws non-Error values', async () => {
    vi.resetModules()

    vi.doMock('@/lib/utils/date', () => ({
      isValidClaimDate: vi.fn(() => true),
      parseDateDDMMYYYY: vi.fn(() => {
        throw 'non-error-throw'
      }),
      toISODate: vi.fn(() => '2026-03-06'),
    }))

    const { claimDateSchema } = await import('@/lib/validations/claim')
    const result = claimDateSchema.safeParse('06/03/2026')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Date must be in DD/MM/YYYY format.'
      )
    }

    vi.resetModules()
    vi.doUnmock('@/lib/utils/date')
  })
})
