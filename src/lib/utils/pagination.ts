export type CursorPayload = {
  created_at: string
  id: string
}

export type PaginatedResult<T> = {
  data: T[]
  nextCursor: string | null
  hasNextPage: boolean
  limit: number
}

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload)
  return Buffer.from(json, 'utf-8').toString('base64')
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded) as CursorPayload

    if (!parsed?.created_at || !parsed?.id) {
      throw new Error('Invalid cursor payload.')
    }

    return parsed
  } catch {
    throw new Error('Invalid cursor.')
  }
}
