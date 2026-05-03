'use server'

import type { ClaimFormValues } from '@/features/claims/types'
import { claimSubmissionSchema } from '@/features/claims/validations'
import {
  type ClaimActionResult,
  submitClaimOrchestrator,
} from '@/features/claims/server/services/submit-claim.orchestrator'

export async function submitClaimAction(
  rawInput: ClaimFormValues
): Promise<ClaimActionResult> {
  const parsed = claimSubmissionSchema.safeParse(rawInput)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid claim input.',
    }
  }

  return submitClaimOrchestrator(parsed.data)
}
