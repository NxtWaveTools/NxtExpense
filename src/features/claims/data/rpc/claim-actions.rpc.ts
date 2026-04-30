import type { SupabaseClient } from '@supabase/supabase-js'

import type { ClaimAvailableAction } from '@/features/claims/types'

const CLAIM_AVAILABLE_ACTIONS_MAX_RETRIES = 2
const CLAIM_AVAILABLE_ACTIONS_RETRY_DELAY_MS = 250

function isTransientNetworkErrorMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('fetch failed') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('connect') ||
    normalized.includes('terminated')
  )
}

async function waitForRetry(attempt: number): Promise<void> {
  await new Promise((resolve) =>
    setTimeout(resolve, CLAIM_AVAILABLE_ACTIONS_RETRY_DELAY_MS * attempt)
  )
}

export async function getClaimAvailableActions(
  supabase: SupabaseClient,
  claimId: string
): Promise<ClaimAvailableAction[]> {
  for (
    let attempt = 0;
    attempt <= CLAIM_AVAILABLE_ACTIONS_MAX_RETRIES;
    attempt += 1
  ) {
    const { data, error } = await supabase.rpc('get_claim_available_actions', {
      p_claim_id: claimId,
    })

    if (!error) {
      return (data ?? []) as ClaimAvailableAction[]
    }

    const shouldRetry =
      attempt < CLAIM_AVAILABLE_ACTIONS_MAX_RETRIES &&
      isTransientNetworkErrorMessage(error.message)

    if (shouldRetry) {
      await waitForRetry(attempt + 1)
      continue
    }

    throw new Error(error.message)
  }

  throw new Error('Failed to fetch claim actions after retries.')
}

type BulkClaimAvailableActionRow = ClaimAvailableAction & {
  claim_id: string
}

function isMissingBulkActionsRpcError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? ''

  return (
    message.includes('get_claim_available_actions_bulk') &&
    (message.includes('schema cache') || message.includes('does not exist'))
  )
}

export async function getClaimAvailableActionsByClaimIds(
  supabase: SupabaseClient,
  claimIds: string[]
): Promise<Map<string, ClaimAvailableAction[]>> {
  const uniqueClaimIds = [...new Set(claimIds)]

  if (uniqueClaimIds.length === 0) {
    return new Map()
  }

  const actionsByClaimId = new Map<string, ClaimAvailableAction[]>(
    uniqueClaimIds.map((claimId) => [claimId, []])
  )

  const { data, error } = await supabase.rpc(
    'get_claim_available_actions_bulk',
    {
      p_claim_ids: uniqueClaimIds,
    }
  )

  if (error) {
    if (!isMissingBulkActionsRpcError(error)) {
      throw new Error(error.message)
    }

    const fallbackResults = await Promise.all(
      uniqueClaimIds.map(async (claimId) => {
        const actions = await getClaimAvailableActions(supabase, claimId)
        return { claimId, actions }
      })
    )

    for (const fallbackResult of fallbackResults) {
      actionsByClaimId.set(fallbackResult.claimId, fallbackResult.actions)
    }

    return actionsByClaimId
  }

  for (const row of (data ?? []) as BulkClaimAvailableActionRow[]) {
    const existing = actionsByClaimId.get(row.claim_id)

    if (!existing) {
      actionsByClaimId.set(row.claim_id, [row])
      continue
    }

    existing.push({
      action: row.action,
      display_label: row.display_label,
      require_notes: row.require_notes,
      supports_allow_resubmit: row.supports_allow_resubmit,
      actor_scope: row.actor_scope,
    })
  }

  return actionsByClaimId
}
