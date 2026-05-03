import type { SupabaseClient } from '@supabase/supabase-js'

import { getRequiredFinanceNotesError } from '@/features/finance/domain/finance-notes'
import {
  bulkFinanceActionsAtomic,
  submitFinanceActionAtomic,
} from '@/features/finance/data/rpc/finance-actions.rpc'
import {
  getClaimAvailableActions,
  getClaimAvailableActionsByClaimIds,
} from '@/features/claims/data/queries'
import {
  getMaxNotesLength,
  getMaxTextLengthValidationError,
} from '@/lib/services/system-settings-service'

export type FinanceActionResult = {
  ok: boolean
  error: string | null
}

async function validateFinanceNotes(
  supabase: SupabaseClient,
  notes: string | undefined
): Promise<string | null> {
  const maxNotesLength = await getMaxNotesLength(supabase)
  return getMaxTextLengthValidationError(notes, maxNotesLength, 'Notes')
}

export async function submitFinanceWorkflow(
  supabase: SupabaseClient,
  payload: {
    claimId: string
    action: string
    notes?: string
    allowResubmit?: boolean
  }
): Promise<FinanceActionResult> {
  const notesValidationError = await validateFinanceNotes(
    supabase,
    payload.notes
  )
  if (notesValidationError) {
    return { ok: false, error: notesValidationError }
  }

  const availableActions = await getClaimAvailableActions(
    supabase,
    payload.claimId
  )
  const selectedAction = availableActions.find(
    (action) => action.action === payload.action
  )

  if (!selectedAction) {
    return {
      ok: false,
      error: 'This workflow action is not available for the claim state.',
    }
  }

  const notesRequiredError = getRequiredFinanceNotesError(
    selectedAction,
    payload.notes
  )

  if (notesRequiredError) {
    return { ok: false, error: notesRequiredError }
  }

  try {
    await submitFinanceActionAtomic(supabase, payload)
    return { ok: true, error: null }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to submit finance action.',
    }
  }
}

export async function submitBulkFinanceWorkflow(
  supabase: SupabaseClient,
  payload: {
    claimIds: string[]
    action: string
    notes?: string
    allowResubmit?: boolean
  }
): Promise<FinanceActionResult> {
  const notesValidationError = await validateFinanceNotes(
    supabase,
    payload.notes
  )
  if (notesValidationError) {
    return { ok: false, error: notesValidationError }
  }

  const actionsByClaimId = await getClaimAvailableActionsByClaimIds(
    supabase,
    payload.claimIds
  )

  for (const claimId of payload.claimIds) {
    const availableActions = actionsByClaimId.get(claimId) ?? []
    const selectedAction = availableActions.find(
      (action) => action.action === payload.action
    )

    if (!selectedAction) {
      return {
        ok: false,
        error: 'One or more selected claims do not allow this workflow action.',
      }
    }

    const notesRequiredError = getRequiredFinanceNotesError(
      selectedAction,
      payload.notes
    )

    if (notesRequiredError) {
      return {
        ok: false,
        error: notesRequiredError,
      }
    }
  }

  try {
    await bulkFinanceActionsAtomic(supabase, payload)
    return { ok: true, error: null }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to process selected finance claims.',
    }
  }
}
