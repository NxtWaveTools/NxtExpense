'use server'

import {
  getAdminAnalyticsClaimsPaginated,
  getAdminAnalyticsEmployeeNameSuggestionsQuery,
  getAdminAnalyticsFilterOptionsQuery,
  getAdminDashboardAnalyticsQuery,
} from '@/features/admin/data/queries'
import { getAdminContext } from '@/features/admin/actions/context'
import {
  adminAnalyticsFilterSchema,
  type AdminAnalyticsFilterInput,
} from '@/features/admin/validations/analytics'
import type {
  AdminAnalyticsClaimsPage,
  AdminAnalyticsFilterOptions,
  AdminDashboardAnalytics,
} from '@/features/admin/types/analytics'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

function toNullableString(value: string | undefined): string | null {
  return value ?? null
}

function normalizeAdminAnalyticsFilters(input: AdminAnalyticsFilterInput) {
  const parsed = adminAnalyticsFilterSchema.safeParse(input)

  if (!parsed.success) {
    return null
  }

  return {
    dateFilterField: parsed.data.dateFilterField,
    dateFrom: toNullableString(parsed.data.dateFrom),
    dateTo: toNullableString(parsed.data.dateTo),
    claimId: toNullableString(parsed.data.claimId),
    designationId: toNullableString(parsed.data.designationId),
    workLocationId: toNullableString(parsed.data.workLocationId),
    stateId: toNullableString(parsed.data.stateId),
    employeeId: toNullableString(parsed.data.employeeId),
    employeeName: toNullableString(parsed.data.employeeName),
    vehicleCode: toNullableString(parsed.data.vehicleCode),
    claimStatusId: toNullableString(parsed.data.claimStatusId),
    pendingOnly: parsed.data.pendingOnly,
  }
}

export async function getAdminDashboardAnalyticsAction(
  rawFilters: AdminAnalyticsFilterInput
): Promise<ActionResult<AdminDashboardAnalytics>> {
  const filters = normalizeAdminAnalyticsFilters(rawFilters)

  if (!filters) {
    return { ok: false, error: 'Invalid analytics filter parameters.' }
  }

  try {
    const { supabase } = await getAdminContext()
    const data = await getAdminDashboardAnalyticsQuery(supabase, filters)
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return { ok: false, error: message }
  }
}

export async function getAdminAnalyticsClaimsPageAction(payload: {
  filters: AdminAnalyticsFilterInput
  cursor?: string | null
  limit?: number
}): Promise<ActionResult<AdminAnalyticsClaimsPage>> {
  const filters = normalizeAdminAnalyticsFilters(payload.filters)

  if (!filters) {
    return { ok: false, error: 'Invalid analytics filter parameters.' }
  }

  try {
    const { supabase } = await getAdminContext()
    const data = await getAdminAnalyticsClaimsPaginated(
      supabase,
      payload.cursor ?? null,
      payload.limit ?? 10,
      filters
    )

    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return { ok: false, error: message }
  }
}

export async function getAdminAnalyticsFilterOptionsAction(): Promise<
  ActionResult<AdminAnalyticsFilterOptions>
> {
  try {
    const { supabase } = await getAdminContext()
    const data = await getAdminAnalyticsFilterOptionsQuery(supabase)
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return { ok: false, error: message }
  }
}

export async function getAdminAnalyticsEmployeeNameSuggestionsAction(
  employeeNameSearch: string | null
): Promise<ActionResult<string[]>> {
  try {
    const { supabase } = await getAdminContext()
    const data = await getAdminAnalyticsEmployeeNameSuggestionsQuery(
      supabase,
      employeeNameSearch
    )

    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.'
    return { ok: false, error: message }
  }
}
