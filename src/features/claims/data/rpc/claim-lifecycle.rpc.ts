import type { SupabaseClient } from '@supabase/supabase-js'

export async function supersedeRejectedClaim(
  supabase: SupabaseClient,
  claimId: string
): Promise<void> {
  const { error } = await supabase.rpc('supersede_rejected_claim', {
    p_claim_id: claimId,
  })

  if (error) {
    throw new Error(error.message)
  }
}
