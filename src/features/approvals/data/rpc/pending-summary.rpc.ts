import type { SupabaseClient } from '@supabase/supabase-js'

type PendingApprovalScopeSummaryRow = {
  claim_count: number | string | null
  total_amount: number | string | null
}

export async function getPendingApprovalScopeSummaryRpc(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<PendingApprovalScopeSummaryRow | null> {
  const { data, error } = await supabase.rpc(
    'get_pending_approval_scope_summary',
    args
  )

  if (error) {
    throw new Error(error.message)
  }

  return (
    Array.isArray(data) ? data[0] : data
  ) as PendingApprovalScopeSummaryRow | null
}
