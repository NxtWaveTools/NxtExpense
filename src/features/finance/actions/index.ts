'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import { getEmployeeByEmail } from '@/features/employees/queries'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import {
  bulkFinanceActionSchema,
  financeActionSchema,
} from '@/features/finance/validations'
import {
  getFinanceHistoryPaginated,
  getFinanceQueuePaginated,
} from '@/features/finance/queries'

type FinanceActionResult = {
  ok: boolean
  error: string | null
}

async function getFinanceEmployeeContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized request.')
  }

  const employee = await getEmployeeByEmail(supabase, user.email)
  if (!employee || !isFinanceTeamMember(employee)) {
    throw new Error('Finance access is required.')
  }

  return { supabase, employee, user }
}

export async function submitFinanceAction(payload: {
  claimId: string
  action: 'issued' | 'finance_rejected'
  notes?: string
}): Promise<FinanceActionResult> {
  const parsed = financeActionSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid finance input.',
    }
  }

  try {
    const { supabase } = await getFinanceEmployeeContext()

    const { error } = await supabase.rpc('submit_finance_action_atomic', {
      p_claim_id: parsed.data.claimId,
      p_action: parsed.data.action,
      p_notes: parsed.data.notes ?? null,
    })

    if (error) {
      throw new Error(error.message)
    }

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

export async function bulkFinanceClaimsAction(payload: {
  claimIds: string[]
  action: 'issued' | 'finance_rejected'
  notes?: string
}): Promise<FinanceActionResult> {
  const parsed = bulkFinanceActionSchema.safeParse(payload)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid bulk finance input.',
    }
  }

  try {
    const { supabase } = await getFinanceEmployeeContext()

    const { error } = await supabase.rpc('bulk_finance_actions_atomic', {
      p_claim_ids: parsed.data.claimIds,
      p_action: parsed.data.action,
      p_notes: parsed.data.notes ?? null,
    })

    if (error) {
      throw new Error(error.message)
    }

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

export async function getFinanceQueueAction(cursor: string | null, limit = 10) {
  const { supabase } = await getFinanceEmployeeContext()
  return getFinanceQueuePaginated(supabase, cursor, limit)
}

export async function getFinanceHistoryAction(
  cursor: string | null,
  limit = 10
) {
  const { supabase, user } = await getFinanceEmployeeContext()
  return getFinanceHistoryPaginated(supabase, user.email ?? '', cursor, limit)
}
