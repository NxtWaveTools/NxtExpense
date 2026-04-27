import type { SupabaseClient } from '@supabase/supabase-js'

import type { BulkApprovalActionResult } from '@/features/approvals/types'
import { getClaimWithOwner } from '@/features/approvals/data/queries'
import { submitApprovalActionAtomic } from '@/features/approvals/data/rpc/approval-actions.rpc'
import {
  getRequiredNotesError,
  REQUIRED_NOTES_ERROR_MESSAGE,
} from '@/features/approvals/domain/approval-notes'
import {
  getClaimAvailableActions,
  getClaimAvailableActionsByClaimIds,
} from '@/features/claims/data/queries'
import { getEmployeeByEmail } from '@/lib/services/employee-service'
import {
  getMaxNotesLength,
  getMaxTextLengthValidationError,
} from '@/lib/services/system-settings-service'

export type ApprovalActionResult = {
  ok: boolean
  error: string | null
}

async function requireApproverProfile(
  supabase: SupabaseClient,
  approverEmail: string | undefined
) {
  if (!approverEmail) {
    return { error: 'Unauthorized request.' }
  }

  const approver = await getEmployeeByEmail(supabase, approverEmail)
  if (!approver) {
    return { error: 'Approver employee profile not found.' }
  }

  return { approver }
}

async function validateNotesLength(
  supabase: SupabaseClient,
  notes: string | undefined
): Promise<string | null> {
  const maxNotesLength = await getMaxNotesLength(supabase)
  return getMaxTextLengthValidationError(notes, maxNotesLength, 'Notes')
}

export async function submitApprovalWorkflow(
  supabase: SupabaseClient,
  approverEmail: string | undefined,
  payload: {
    claimId: string
    action: string
    notes?: string
    allowResubmit?: boolean
  }
): Promise<ApprovalActionResult> {
  const approverState = await requireApproverProfile(supabase, approverEmail)
  if ('error' in approverState) {
    return { ok: false, error: approverState.error }
  }

  const notesValidationError = await validateNotesLength(
    supabase,
    payload.notes
  )
  if (notesValidationError) {
    return { ok: false, error: notesValidationError }
  }

  const claimWithOwner = await getClaimWithOwner(supabase, payload.claimId)
  if (!claimWithOwner) {
    return { ok: false, error: 'Claim not found.' }
  }

  const availableActions = await getClaimAvailableActions(
    supabase,
    claimWithOwner.claim.id
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

  const notesRequiredError = getRequiredNotesError(
    selectedAction,
    payload.notes
  )
  if (notesRequiredError) {
    return { ok: false, error: notesRequiredError }
  }

  try {
    await submitApprovalActionAtomic(supabase, {
      claimId: claimWithOwner.claim.id,
      action: payload.action,
      notes: payload.notes,
      allowResubmit: payload.allowResubmit,
    })
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error.',
    }
  }

  return { ok: true, error: null }
}

export async function submitBulkApprovalWorkflow(
  supabase: SupabaseClient,
  approverEmail: string | undefined,
  payload: {
    claimIds: string[]
    action: string
    notes?: string
    allowResubmit?: boolean
  }
): Promise<BulkApprovalActionResult> {
  const approverState = await requireApproverProfile(supabase, approverEmail)
  if ('error' in approverState) {
    return {
      ok: false,
      error: approverState.error,
      succeeded: 0,
      failed: payload.claimIds.length,
      errors: payload.claimIds.map((claimId) => ({
        claimId,
        message: approverState.error,
      })),
    }
  }

  const notesValidationError = await validateNotesLength(
    supabase,
    payload.notes
  )
  if (notesValidationError) {
    return {
      ok: false,
      error: notesValidationError,
      succeeded: 0,
      failed: payload.claimIds.length,
      errors: payload.claimIds.map((claimId) => ({
        claimId,
        message: notesValidationError,
      })),
    }
  }

  const result: BulkApprovalActionResult = {
    ok: true,
    error: null,
    succeeded: 0,
    failed: 0,
    errors: [],
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
      result.ok = false
      result.failed += 1
      result.errors.push({
        claimId,
        message: 'This workflow action is not available for the claim state.',
      })
      continue
    }

    const notesRequiredError = getRequiredNotesError(
      selectedAction,
      payload.notes
    )
    if (notesRequiredError) {
      result.ok = false
      result.failed += 1
      result.errors.push({
        claimId,
        message: notesRequiredError,
      })
      continue
    }

    try {
      await submitApprovalActionAtomic(supabase, {
        claimId,
        action: payload.action,
        notes: payload.notes,
        allowResubmit: payload.allowResubmit,
      })
      result.succeeded += 1
    } catch (error) {
      result.ok = false
      result.failed += 1
      result.errors.push({
        claimId,
        message: error instanceof Error ? error.message : 'Unexpected error.',
      })
    }
  }

  if (result.failed > 0 && result.errors.length > 0) {
    const uniqueMessages = [
      ...new Set(
        result.errors
          .map((entry) => entry.message?.trim())
          .filter((message): message is string => Boolean(message))
      ),
    ]

    if (
      uniqueMessages.length === 1 &&
      uniqueMessages[0] === REQUIRED_NOTES_ERROR_MESSAGE
    ) {
      result.error = REQUIRED_NOTES_ERROR_MESSAGE
    } else {
      result.error = `${result.failed} claim(s) failed to update.`
    }
  }

  return result
}
