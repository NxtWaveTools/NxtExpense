import type { Claim } from '@/features/claims/types'
import type { Employee } from '@/features/employees/types'
import type { PaginatedResult } from '@/lib/utils/pagination'

export type FinanceActionType = 'issued' | 'finance_rejected'

export type FinanceAction = {
  id: string
  claim_id: string
  actor_email: string
  action: FinanceActionType
  notes: string | null
  acted_at: string
}

export type FinanceQueueItem = {
  claim: Claim
  owner: Employee
}

export type PaginatedFinanceQueue = PaginatedResult<FinanceQueueItem>
