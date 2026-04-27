import type { SupabaseClient } from '@supabase/supabase-js'

import { getClaimStatusDisplay } from '@/lib/utils/claim-status'

type ClaimStatusDisplayRow = {
  id: string
  allow_resubmit: boolean
  employees:
    | {
        employee_id: string
        employee_email: string
      }
    | Array<{
        employee_id: string
        employee_email: string
      }>
    | null
  claim_statuses:
    | {
        status_code: string
        status_name: string
        display_color: string
        allow_resubmit_status_name: string | null
        allow_resubmit_display_color: string | null
      }
    | Array<{
        status_code: string
        status_name: string
        display_color: string
        allow_resubmit_status_name: string | null
        allow_resubmit_display_color: string | null
      }>
    | null
}

type StatusDisplayOverride = {
  label: string
  colorToken: string
}

export type ApprovalHistoryClaimEnrichment = {
  statusDisplay: StatusDisplayOverride
  ownerEmployeeId: string | null
  ownerEmail: string | null
}

export async function getApprovalHistoryClaimEnrichmentByClaimId(
  supabase: SupabaseClient,
  claimIds: string[]
): Promise<Map<string, ApprovalHistoryClaimEnrichment>> {
  if (claimIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('expense_claims')
    .select(
      'id, allow_resubmit, employees!employee_id(employee_id, employee_email), claim_statuses!status_id(status_code, status_name, display_color, allow_resubmit_status_name, allow_resubmit_display_color)'
    )
    .in('id', claimIds)

  if (error) {
    throw new Error(error.message)
  }

  const enrichmentByClaimId = new Map<string, ApprovalHistoryClaimEnrichment>()

  for (const row of (data ?? []) as ClaimStatusDisplayRow[]) {
    const statusInfo = Array.isArray(row.claim_statuses)
      ? row.claim_statuses[0]
      : row.claim_statuses
    const owner = Array.isArray(row.employees)
      ? row.employees[0]
      : row.employees

    const display = getClaimStatusDisplay({
      statusCode: statusInfo?.status_code,
      statusName: statusInfo?.status_name,
      statusDisplayColor: statusInfo?.display_color,
      allowResubmit: row.allow_resubmit,
      allowResubmitStatusName: statusInfo?.allow_resubmit_status_name,
      allowResubmitDisplayColor: statusInfo?.allow_resubmit_display_color,
    })

    enrichmentByClaimId.set(row.id, {
      statusDisplay: display,
      ownerEmployeeId: owner?.employee_id ?? null,
      ownerEmail: owner?.employee_email ?? null,
    })
  }

  return enrichmentByClaimId
}
