'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import { getEmployeeByEmail } from '@/lib/services/employee-service'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import {
  getFinanceEmployeeNameSuggestions,
  getFinanceHistoryPaginated,
  getFinanceQueuePaginated,
} from '@/features/finance/data/queries'
import type { FinanceFilters } from '@/features/finance/types'
import {
  bulkFinanceActionSchema,
  financeActionSchema,
} from '@/features/finance/validations'
import { normalizeFinanceFilters } from '@/features/finance/utils/filters'
import {
  submitBulkFinanceWorkflow,
  submitFinanceWorkflow,
  type FinanceActionResult,
} from '@/features/finance/server/services/finance-workflow.orchestrator'

type RawFinanceFilters = Partial<Record<keyof FinanceFilters, string>>
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function getFinanceEmployeeContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized request.')
  }

  const employee = await getEmployeeByEmail(supabase, user.email)
  if (!employee || !(await isFinanceTeamMember(supabase, employee))) {
    throw new Error('Finance access is required.')
  }

  return { supabase, employee, user }
}

export async function submitFinanceAction(payload: {
  claimId: string
  action: string
  notes?: string
  allowResubmit?: boolean
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
    return submitFinanceWorkflow(supabase, parsed.data)
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
  action: string
  notes?: string
  allowResubmit?: boolean
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
    return submitBulkFinanceWorkflow(supabase, parsed.data)
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

export async function getFinanceQueueAction(
  cursor: string | null,
  limit = 10,
  rawFilters: RawFinanceFilters = {}
) {
  const normalizedFilters = normalizeFinanceFilters(rawFilters)
  const { supabase } = await getFinanceEmployeeContext()
  return getFinanceQueuePaginated(supabase, cursor, limit, normalizedFilters)
}

export async function getFinanceHistoryAction(
  cursor: string | null,
  limit = 10,
  rawFilters: RawFinanceFilters = {}
) {
  const normalizedFilters = normalizeFinanceFilters(rawFilters)
  const { supabase } = await getFinanceEmployeeContext()
  return getFinanceHistoryPaginated(supabase, cursor, limit, normalizedFilters)
}

export async function getFinanceEmployeeNameSuggestionsAction(
  employeeNameSearch: string | null
): Promise<ActionResult<string[]>> {
  try {
    const { supabase } = await getFinanceEmployeeContext()
    const names = await getFinanceEmployeeNameSuggestions(
      supabase,
      employeeNameSearch,
      8
    )

    return { ok: true, data: names }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return { ok: false, error: message }
  }
}
