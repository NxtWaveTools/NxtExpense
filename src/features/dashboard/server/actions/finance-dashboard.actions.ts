'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getEmployeeByEmail } from '@/lib/services/employee-service'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import { financeDashboardFilterSchema } from '@/features/dashboard/validations/finance-dashboard'
import type {
  FinanceDashboardData,
  FinanceDashboardFilterOptions,
} from '@/features/dashboard/types/finance-dashboard'
import type { FinanceDashboardFilterInput } from '@/features/dashboard/validations/finance-dashboard'
import {
  getFinanceDashboardAnalyticsQuery,
  getFinanceDashboardEmployeeNameSuggestionsQuery,
  getFinanceDashboardFilterOptionsQuery,
} from '@/features/dashboard/data/queries/finance-dashboard.query'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function requireFinanceContext() {
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

  return { supabase }
}

export async function getFinanceDashboardAnalytics(
  rawFilters: FinanceDashboardFilterInput
): Promise<ActionResult<FinanceDashboardData>> {
  const parsed = financeDashboardFilterSchema.safeParse(rawFilters)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid filter parameters.' }
  }

  try {
    const { supabase } = await requireFinanceContext()
    const data = await getFinanceDashboardAnalyticsQuery(supabase, parsed.data)
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error.',
    }
  }
}

export async function getFinanceDashboardFilterOptions(): Promise<
  ActionResult<FinanceDashboardFilterOptions>
> {
  try {
    const { supabase } = await requireFinanceContext()
    const data = await getFinanceDashboardFilterOptionsQuery(supabase)

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error.',
    }
  }
}

export async function getFinanceDashboardEmployeeNameSuggestions(
  employeeNameSearch: string | null
): Promise<ActionResult<string[]>> {
  try {
    const { supabase } = await requireFinanceContext()
    const data = await getFinanceDashboardEmployeeNameSuggestionsQuery(
      supabase,
      employeeNameSearch
    )

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error.',
    }
  }
}
