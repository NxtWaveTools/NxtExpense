import { describe, expect, it, vi } from 'vitest'

import {
  formatDate,
  formatDatetime,
  isValidClaimDate,
  parseDateDDMMYYYY,
  toISODate,
} from '@/lib/utils/date'

describe('date utils', () => {
  it('parses DD/MM/YYYY date correctly', () => {
    const parsed = parseDateDDMMYYYY('06/03/2026')
    expect(toISODate(parsed)).toBe('2026-03-06')
  })

  it('formats date and datetime correctly', () => {
    expect(formatDate('2026-03-06')).toBe('06/03/2026')
    expect(formatDatetime('2026-03-06T14:30:00.000Z')).toBe(
      '06/03/2026 08:00 PM'
    )
  })

  it('rejects invalid calendar dates', () => {
    expect(() => parseDateDDMMYYYY('31/02/2026')).toThrowError(
      'Invalid calendar date.'
    )
  })

  it('rejects malformed DD/MM/YYYY input', () => {
    expect(() => parseDateDDMMYYYY('2026-03-06')).toThrowError(
      'Date must be in DD/MM/YYYY format.'
    )
  })

  it('throws when formatting an invalid date value', () => {
    expect(() => formatDate('not-a-date')).toThrowError('Invalid date value.')
    expect(() => formatDatetime('not-a-date')).toThrowError(
      'Invalid date value.'
    )
  })

  it('throws when converting invalid Date to ISO', () => {
    expect(() => toISODate(new Date('invalid-date'))).toThrowError(
      'Invalid date value.'
    )
  })

  it('throws when Intl formatter parts are malformed', () => {
    const formatterSpy = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
      .mockReturnValue([] as Intl.DateTimeFormatPart[])

    expect(() => formatDate(new Date('2026-03-06T00:00:00.000Z'))).toThrowError(
      'Invalid date value.'
    )

    formatterSpy.mockRestore()
  })

  it('accepts current IST date as a valid claim date', () => {
    const todayIstDate = parseDateDDMMYYYY(formatDate(new Date()))
    expect(isValidClaimDate(todayIstDate)).toBe(true)
  })

  it('rejects future claim dates', () => {
    // Build from IST-formatted "today" so the assertion is stable across UTC/IST boundaries.
    const todayIst = parseDateDDMMYYYY(formatDate(new Date()))
    const futureIstDate = new Date(todayIst)
    futureIstDate.setUTCDate(futureIstDate.getUTCDate() + 2)

    expect(isValidClaimDate(futureIstDate)).toBe(false)
  })
})
