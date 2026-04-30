import type { SupabaseClient } from '@supabase/supabase-js'

type FilteredApprovalHistoryRpcRow = {
  action_id: string
  claim_id: string
  claim_number: string
  claim_date: string
  work_location: string
  total_amount: number | string
  claim_status: string
  claim_status_name: string
  claim_status_display_color: string
  owner_name: string
  owner_designation: string
  actor_email: string
  actor_designation: string | null
  action: string
  approval_level: number | null
  notes: string | null
  acted_at: string
  hod_approved_at: string | null
  finance_approved_at: string | null
}

type ApprovalHistoryCountRpcValue =
  | number
  | string
  | Array<Record<string, unknown>>
  | null

export async function getFilteredApprovalHistoryRpc(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<FilteredApprovalHistoryRpcRow[]> {
  const { data, error } = await supabase.rpc(
    'get_filtered_approval_history',
    args
  )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as FilteredApprovalHistoryRpcRow[]
}

export async function getFilteredApprovalHistoryCountRpc(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<ApprovalHistoryCountRpcValue> {
  const { data, error } = await supabase.rpc(
    'get_filtered_approval_history_count',
    args
  )

  if (error) {
    const message = error.message?.toLowerCase() ?? ''

    if (
      message.includes('get_filtered_approval_history_count') &&
      (message.includes('schema cache') || message.includes('does not exist'))
    ) {
      throw new Error(
        'Approval history count RPC is unavailable. Full-row fallback counting is disabled for performance; apply the latest DB migrations and refresh the schema cache.'
      )
    }

    throw new Error(error.message)
  }

  return data as ApprovalHistoryCountRpcValue
}

export type { FilteredApprovalHistoryRpcRow }
