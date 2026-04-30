import type { SupabaseClient } from '@supabase/supabase-js'

export type ApprovalHistoryAnalyticsRpcRow = {
  approved_count: number | string | null
  approved_amount: number | string | null
  payment_issued_count: number | string | null
  payment_issued_amount: number | string | null
  rejected_count: number | string | null
  rejected_amount: number | string | null
}

export async function getApprovalHistoryAnalyticsRpc(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<ApprovalHistoryAnalyticsRpcRow | null> {
  const { data, error } = await supabase.rpc(
    'get_approval_history_analytics',
    args
  )

  if (error) {
    throw new Error(error.message)
  }

  return (
    Array.isArray(data) ? data[0] : data
  ) as ApprovalHistoryAnalyticsRpcRow | null
}