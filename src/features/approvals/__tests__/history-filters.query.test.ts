import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resolveClaimAllowResubmitFilterValue: vi.fn(),
}))

vi.mock('@/features/claims/data/queries', () => ({
  resolveClaimAllowResubmitFilterValue:
    mocks.resolveClaimAllowResubmitFilterValue,
}))

import { getFilteredApprovalHistoryCount } from '@/features/approvals/data/queries/history-filters.query'

function createSupabaseMock(result: {
  data?: unknown
  error?: { message?: string } | null
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  })

  return {
    rpc,
  }
}

const defaultFilters = {
  employeeName: null,
  claimStatus: null,
  claimDateFrom: null,
  claimDateTo: null,
  amountOperator: 'lte' as const,
  amountValue: null,
  locationType: null,
  claimDateSort: 'desc' as const,
  hodApprovedFrom: null,
  hodApprovedTo: null,
  financeApprovedFrom: null,
  financeApprovedTo: null,
}

describe('getFilteredApprovalHistoryCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveClaimAllowResubmitFilterValue.mockResolvedValue(null)
  })

  it('omits pagination parameters from the count RPC payload', async () => {
    const supabase = createSupabaseMock({ data: 0 })

    await getFilteredApprovalHistoryCount(supabase as never, defaultFilters)

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_filtered_approval_history_count',
      {
        p_name_search: null,
        p_actor_filters: null,
        p_claim_status_id: null,
        p_claim_allow_resubmit: null,
        p_amount_operator: 'lte',
        p_amount_value: null,
        p_location_type: null,
        p_hod_approved_from: null,
        p_hod_approved_to: null,
        p_finance_approved_from: null,
        p_finance_approved_to: null,
        p_claim_date_from: null,
        p_claim_date_to: null,
      }
    )

    const payload = supabase.rpc.mock.calls[0]?.[1] as Record<string, unknown>

    expect(payload).not.toHaveProperty('p_limit')
    expect(payload).not.toHaveProperty('p_cursor_acted_at')
    expect(payload).not.toHaveProperty('p_cursor_action_id')
  })
})
