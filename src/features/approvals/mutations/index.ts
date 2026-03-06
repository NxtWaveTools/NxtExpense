import type { SupabaseClient } from '@supabase/supabase-js'

export async function recordApprovalAction(
  supabase: SupabaseClient,
  input: {
    claimId: string
    approverEmail: string
    approvalLevel: number
    action: 'approved' | 'rejected'
    notes?: string
  }
) {
  const { error } = await supabase.from('approval_history').insert({
    claim_id: input.claimId,
    approver_email: input.approverEmail,
    approval_level: input.approvalLevel,
    action: input.action,
    notes: input.notes ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function advanceClaimStatus(
  supabase: SupabaseClient,
  claimId: string,
  nextLevel: number | null
) {
  const { error } = await supabase
    .from('expense_claims')
    .update({
      status: nextLevel ? 'pending_approval' : 'finance_review',
      current_approval_level: nextLevel,
    })
    .eq('id', claimId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function rejectClaim(
  supabase: SupabaseClient,
  claimId: string
): Promise<void> {
  const { error } = await supabase
    .from('expense_claims')
    .update({
      status: 'rejected',
      current_approval_level: null,
    })
    .eq('id', claimId)

  if (error) {
    throw new Error(error.message)
  }
}
