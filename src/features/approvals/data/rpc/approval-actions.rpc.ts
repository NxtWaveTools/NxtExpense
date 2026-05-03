import type { SupabaseClient } from '@supabase/supabase-js'

export async function submitApprovalActionAtomic(
  supabase: SupabaseClient,
  input: {
    claimId: string
    action: string
    notes?: string
    allowResubmit?: boolean
  }
) {
  const { error } = await supabase.rpc('submit_approval_action_atomic', {
    p_claim_id: input.claimId,
    p_action: input.action,
    p_notes: input.notes ?? null,
    p_allow_resubmit: Boolean(input.allowResubmit),
  })

  if (error) {
    throw new Error(error.message)
  }
}
