import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAdminContext: vi.fn(),
  getAdminDashboardAnalyticsQuery: vi.fn(),
  getAdminAnalyticsClaimsPaginated: vi.fn(),
  getAdminAnalyticsFilterOptionsQuery: vi.fn(),
  getAdminAnalyticsEmployeeNameSuggestionsQuery: vi.fn(),
}))

vi.mock('@/features/admin/actions/context', () => ({
  getAdminContext: mocks.getAdminContext,
}))

vi.mock('@/features/admin/data/queries', () => ({
  getAdminDashboardAnalyticsQuery: mocks.getAdminDashboardAnalyticsQuery,
  getAdminAnalyticsClaimsPaginated: mocks.getAdminAnalyticsClaimsPaginated,
  getAdminAnalyticsFilterOptionsQuery:
    mocks.getAdminAnalyticsFilterOptionsQuery,
  getAdminAnalyticsEmployeeNameSuggestionsQuery:
    mocks.getAdminAnalyticsEmployeeNameSuggestionsQuery,
}))

import {
  getAdminAnalyticsClaimsPageAction,
  getAdminAnalyticsEmployeeNameSuggestionsAction,
  getAdminAnalyticsFilterOptionsAction,
  getAdminDashboardAnalyticsAction,
} from '@/features/admin/server/actions/analytics.actions'

describe('admin analytics server actions', () => {
  const supabase = { rpc: vi.fn(), from: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAdminContext.mockResolvedValue({ supabase })
  })

  it('short-circuits invalid dashboard filters before admin context lookup', async () => {
    const result = await getAdminDashboardAnalyticsAction({
      dateFrom: '07-04-2026',
    })

    expect(result).toEqual({
      ok: false,
      error: 'Invalid analytics filter parameters.',
    })
    expect(mocks.getAdminContext).not.toHaveBeenCalled()
    expect(mocks.getAdminDashboardAnalyticsQuery).not.toHaveBeenCalled()
  })

  it('delegates normalized analytics filters to the dashboard query', async () => {
    const analytics = {
      kpi: {
        total_count: 5,
        total_amount: 1000,
        avg_amount: 200,
        pending_count: 2,
        pending_amount: 250,
        payment_released_count: 1,
        payment_released_amount: 300,
        rejected_count: 1,
        rejected_amount: 100,
      },
      by_status: [],
      by_designation: [],
      by_work_location: [],
      by_state: [],
      by_vehicle_type: [],
      top_claims: [],
    }

    mocks.getAdminDashboardAnalyticsQuery.mockResolvedValue(analytics)

    const result = await getAdminDashboardAnalyticsAction({
      dateFilterField: 'submission_date',
      dateFrom: '07/04/2026',
      employeeName: '  Ada  ',
      pendingOnly: true,
    })

    expect(result).toEqual({ ok: true, data: analytics })
    expect(mocks.getAdminDashboardAnalyticsQuery).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        dateFilterField: 'submission_date',
        dateFrom: '2026-04-07',
        dateTo: null,
        employeeName: 'Ada',
        pendingOnly: true,
      })
    )
  })

  it('delegates claims pagination with normalized null defaults', async () => {
    const claimsPage = {
      data: [],
      nextCursor: null,
      hasNextPage: false,
      limit: 25,
    }
    mocks.getAdminAnalyticsClaimsPaginated.mockResolvedValue(claimsPage)

    const result = await getAdminAnalyticsClaimsPageAction({
      cursor: 'cursor-1',
      limit: 25,
      filters: {
        claimId: 'CLAIM-001',
      },
    })

    expect(result).toEqual({ ok: true, data: claimsPage })
    expect(mocks.getAdminAnalyticsClaimsPaginated).toHaveBeenCalledWith(
      supabase,
      'cursor-1',
      25,
      {
        dateFilterField: 'travel_date',
        dateFrom: null,
        dateTo: null,
        claimId: 'CLAIM-001',
        designationId: null,
        workLocationId: null,
        stateId: null,
        employeeId: null,
        employeeName: null,
        vehicleCode: null,
        claimStatusId: null,
        pendingOnly: false,
      }
    )
  })

  it('propagates query errors from filter options and suggestions', async () => {
    mocks.getAdminAnalyticsFilterOptionsQuery.mockRejectedValue(
      new Error('claim statuses offline')
    )
    mocks.getAdminAnalyticsEmployeeNameSuggestionsQuery.mockRejectedValue(
      new Error('suggestions offline')
    )

    await expect(getAdminAnalyticsFilterOptionsAction()).resolves.toEqual({
      ok: false,
      error: 'claim statuses offline',
    })

    await expect(
      getAdminAnalyticsEmployeeNameSuggestionsAction('ad')
    ).resolves.toEqual({
      ok: false,
      error: 'suggestions offline',
    })
  })
})
