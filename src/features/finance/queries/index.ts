import type { SupabaseClient } from '@supabase/supabase-js'

import type { Claim } from '@/features/claims/types'
import type { Employee } from '@/features/employees/types'
import type {
  FinanceHistoryItem,
  PaginatedFinanceHistory,
  PaginatedFinanceQueue,
} from '@/features/finance/types'
import { decodeCursor, encodeCursor } from '@/lib/utils/pagination'

const CLAIM_COLUMNS =
  'id, claim_number, employee_id, claim_date, work_location, own_vehicle_used, vehicle_type, outstation_location, from_city, to_city, km_travelled, total_amount, status, current_approval_level, submitted_at, created_at, updated_at'

export async function getFinanceQueuePaginated(
  supabase: SupabaseClient,
  cursor: string | null,
  limit = 10
): Promise<PaginatedFinanceQueue> {
  let query = supabase
    .from('expense_claims')
    .select(`${CLAIM_COLUMNS}, employees!inner(*)`)
    .eq('status', 'finance_review')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const decoded = decodeCursor(cursor)
    query = query.or(
      `created_at.lt.${decoded.created_at},and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as Array<
    Claim & { employees: Employee | Employee[] }
  >
  const hasNextPage = rows.length > limit
  const pageData = hasNextPage ? rows.slice(0, limit) : rows

  const lastRecord = pageData.at(-1)
  const nextCursor =
    hasNextPage && lastRecord
      ? encodeCursor({
          created_at: lastRecord.created_at,
          id: lastRecord.id,
        })
      : null

  return {
    data: pageData.map((row) => {
      const owner = Array.isArray(row.employees)
        ? row.employees[0]
        : row.employees

      if (!owner) {
        throw new Error('Claim owner mapping not found.')
      }

      return {
        claim: row,
        owner,
      }
    }),
    hasNextPage,
    nextCursor,
    limit,
  }
}

export async function getFinanceHistoryPaginated(
  supabase: SupabaseClient,
  actorEmail: string,
  cursor: string | null,
  limit = 10
): Promise<PaginatedFinanceHistory> {
  const lowerEmail = actorEmail.toLowerCase()

  let query = supabase
    .from('finance_actions')
    .select('id, claim_id, actor_email, action, notes, acted_at')
    .eq('actor_email', lowerEmail)
    .order('acted_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    const decoded = decodeCursor(cursor)
    query = query.or(
      `acted_at.lt.${decoded.created_at},and(acted_at.eq.${decoded.created_at},id.lt.${decoded.id})`
    )
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const actionRows = (data ?? []) as Array<{
    id: string
    claim_id: string
    actor_email: string
    action: 'issued' | 'finance_rejected'
    notes: string | null
    acted_at: string
  }>

  const hasNextPage = actionRows.length > limit
  const pageData = hasNextPage ? actionRows.slice(0, limit) : actionRows

  if (pageData.length === 0) {
    return {
      data: [],
      hasNextPage: false,
      nextCursor: null,
      limit,
    }
  }

  const claimIds = [...new Set(pageData.map((row) => row.claim_id))]
  const { data: claimData, error: claimError } = await supabase
    .from('expense_claims')
    .select(`${CLAIM_COLUMNS}, employees!inner(*)`)
    .in('id', claimIds)

  if (claimError) {
    throw new Error(claimError.message)
  }

  const claimMap = new Map<string, { claim: Claim; owner: Employee }>()
  for (const row of (claimData ?? []) as Array<
    Claim & { employees: Employee | Employee[] }
  >) {
    const owner = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees
    if (!owner) {
      continue
    }

    const claimFields = { ...row } as Claim & {
      employees?: Employee | Employee[]
    }
    delete claimFields.employees

    claimMap.set(row.id, {
      claim: claimFields as Claim,
      owner,
    })
  }

  const history: FinanceHistoryItem[] = pageData
    .map((action) => {
      const claim = claimMap.get(action.claim_id)
      if (!claim) {
        return null
      }

      return {
        claim: claim.claim,
        owner: claim.owner,
        action,
      }
    })
    .filter((row): row is FinanceHistoryItem => row !== null)

  const lastRecord = pageData.at(-1)
  const nextCursor =
    hasNextPage && lastRecord
      ? encodeCursor({
          created_at: lastRecord.acted_at,
          id: lastRecord.id,
        })
      : null

  return {
    data: history,
    hasNextPage,
    nextCursor,
    limit,
  }
}
