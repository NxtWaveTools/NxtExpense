import type { SupabaseClient } from '@supabase/supabase-js'

import type { Claim } from '@/features/claims/types'
import type { Employee } from '@/features/employees/types'
import type { PaginatedFinanceQueue } from '@/features/finance/types'
import { decodeCursor, encodeCursor } from '@/lib/utils/pagination'

const CLAIM_COLUMNS =
  'id, employee_id, claim_date, work_location, own_vehicle_used, vehicle_type, outstation_location, from_city, to_city, km_travelled, total_amount, status, current_approval_level, submitted_at, created_at, updated_at'

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
