import type { Claim, ClaimItem } from '@/features/claims/types'
import type { Employee } from '@/features/employees/types'
import type { PaginatedResult } from '@/lib/utils/pagination'

export type ApprovalAction = {
  id: string
  claim_id: string
  approver_email: string
  approval_level: number
  action: 'approved' | 'rejected'
  notes: string | null
  acted_at: string
}

export type PendingApproval = {
  claim: Claim
  owner: Employee
  items: ClaimItem[]
}

export type PaginatedPendingApprovals = PaginatedResult<PendingApproval>

export type ApprovalHistoryItem = {
  claim: Claim
  owner: Employee
  action: ApprovalAction
}

export type PaginatedApprovalHistory = PaginatedResult<ApprovalHistoryItem>
