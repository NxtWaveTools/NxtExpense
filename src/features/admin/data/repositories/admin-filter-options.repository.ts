import type { SupabaseClient } from '@supabase/supabase-js'

type ClaimStatusOptionRow = {
  id: string
  status_name: string
}

export async function getActiveAdminClaimStatusOptions(
  supabase: SupabaseClient
): Promise<ClaimStatusOptionRow[]> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id, status_name')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ClaimStatusOptionRow[]
}
