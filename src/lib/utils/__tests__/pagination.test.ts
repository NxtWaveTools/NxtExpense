import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor } from '@/lib/utils/pagination'

describe('pagination cursor utils', () => {
  it('encodes and decodes cursor payload', () => {
    const cursor = encodeCursor({
      created_at: '2026-03-06T08:00:00.000Z',
      id: 'abc-123',
    })

    expect(decodeCursor(cursor)).toEqual({
      created_at: '2026-03-06T08:00:00.000Z',
      id: 'abc-123',
    })
  })

  it('throws on invalid cursor', () => {
    expect(() => decodeCursor('invalid-cursor')).toThrowError('Invalid cursor.')
  })
})
