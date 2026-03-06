'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import { getEmployeeByEmail } from '@/features/employees/queries'
import { approvalActionSchema } from '@/features/approvals/validations'
import {
  getClaimWithOwner,
  getMyApprovalHistoryPaginated,
  getPendingApprovalsPaginated,
} from '@/features/approvals/queries'
import { canApproveAtLevel } from '@/features/approvals/permissions'

type ApprovalActionResult = {
  ok: boolean
  error: string | null
}

export async function submitApprovalAction(payload: {
  claimId: string
  action: 'approved' | 'rejected'
  notes?: string
}): Promise<ApprovalActionResult> {
  const parsed = approvalActionSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid approval input.',
    }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { ok: false, error: 'Unauthorized request.' }
  }

  const approver = await getEmployeeByEmail(supabase, user.email)
  if (!approver) {
    return { ok: false, error: 'Approver employee profile not found.' }
  }

  const claimWithOwner = await getClaimWithOwner(supabase, parsed.data.claimId)
  if (!claimWithOwner) {
    return { ok: false, error: 'Claim not found.' }
  }

  const { claim, owner } = claimWithOwner

  if (!canApproveAtLevel(user.email, claim, owner)) {
    return {
      ok: false,
      error:
        'You are not authorized to act on this claim at the current level.',
    }
  }

  const { error: approvalError } = await supabase.rpc(
    'submit_approval_action_atomic',
    {
      p_claim_id: claim.id,
      p_action: parsed.data.action,
      p_notes: parsed.data.notes ?? null,
    }
  )

  if (approvalError) {
    return { ok: false, error: approvalError.message }
  }

  return { ok: true, error: null }
}

export async function getPendingApprovalsAction(
  cursor: string | null,
  limit = 10
) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized request.')
  }

  return getPendingApprovalsPaginated(supabase, user.email, cursor, limit)
}

export async function getApprovalHistoryAction(
  cursor: string | null,
  limit = 10
) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized request.')
  }

  return getMyApprovalHistoryPaginated(supabase, user.email, cursor, limit)
}
