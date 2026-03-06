import type { SupabaseClient } from '@supabase/supabase-js'

import type { FinanceActionType } from '@/features/finance/types'

async function writeFinanceAction(
  supabase: SupabaseClient,
  payload: {
    claimId: string
    actorEmail: string
    action: FinanceActionType
    notes?: string
  }
) {
  const { error } = await supabase.from('finance_actions').insert({
    claim_id: payload.claimId,
    actor_email: payload.actorEmail,
    action: payload.action,
    notes: payload.notes ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function updateClaimFinanceStatus(
  supabase: SupabaseClient,
  claimId: string,
  status: 'issued' | 'finance_rejected'
) {
  const { error } = await supabase
    .from('expense_claims')
    .update({ status, current_approval_level: null })
    .eq('id', claimId)
    .eq('status', 'finance_review')

  if (error) {
    throw new Error(error.message)
  }
}

export async function recordFinanceAction(
  supabase: SupabaseClient,
  payload: {
    claimId: string
    actorEmail: string
    action: FinanceActionType
    notes?: string
  }
) {
  await writeFinanceAction(supabase, payload)
  await updateClaimFinanceStatus(supabase, payload.claimId, payload.action)
}

export async function bulkRecordFinanceActions(
  supabase: SupabaseClient,
  payload: {
    claimIds: string[]
    actorEmail: string
    action: Extract<FinanceActionType, 'issued'>
    notes?: string
  }
) {
  if (payload.claimIds.length === 0) return

  const { error: insertError } = await supabase.from('finance_actions').insert(
    payload.claimIds.map((claimId) => ({
      claim_id: claimId,
      actor_email: payload.actorEmail,
      action: payload.action,
      notes: payload.notes ?? null,
    }))
  )

  if (insertError) {
    throw new Error(insertError.message)
  }

  const { error: updateError } = await supabase
    .from('expense_claims')
    .update({ status: 'issued', current_approval_level: null })
    .in('id', payload.claimIds)
    .eq('status', 'finance_review')

  if (updateError) {
    throw new Error(updateError.message)
  }
}
