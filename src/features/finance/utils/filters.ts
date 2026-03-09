import { formatDate, formatDatetime } from '@/lib/utils/date'
import type {
  FinanceFilters,
  FinanceHistoryItem,
} from '@/features/finance/types'
import { financeFiltersSchema } from '@/features/finance/validations'

type FinanceFilterInput = Partial<
  Record<keyof FinanceFilters, string | undefined>
>

const IST_DAY_START = 'T00:00:00+05:30'
const IST_DAY_END = 'T23:59:59.999+05:30'

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim() ?? ''
  return normalized ? normalized : null
}

export function normalizeFinanceFilters(
  rawFilters: FinanceFilterInput
): FinanceFilters {
  const parsed = financeFiltersSchema.safeParse(rawFilters)

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'Invalid finance filters.'
    )
  }

  const value = parsed.data

  return {
    employeeName: normalizeText(value.employeeName),
    claimNumber: normalizeText(value.claimNumber),
    ownerDesignation: normalizeText(value.ownerDesignation),
    hodApproverEmail: normalizeText(value.hodApproverEmail),
    claimStatus: normalizeText(value.claimStatus),
    workLocation: normalizeText(value.workLocation),
    resubmittedOnly: Boolean(value.resubmittedOnly),
    actionFilter: value.actionFilter,
    claimDateFrom: normalizeText(value.claimDateFrom),
    claimDateTo: normalizeText(value.claimDateTo),
    actionDateFrom: normalizeText(value.actionDateFrom),
    actionDateTo: normalizeText(value.actionDateTo),
  }
}

export function hasFinanceClaimFilters(filters: FinanceFilters): boolean {
  return Boolean(
    filters.employeeName ||
    filters.claimNumber ||
    filters.ownerDesignation ||
    filters.hodApproverEmail ||
    filters.claimStatus ||
    filters.workLocation ||
    filters.resubmittedOnly ||
    filters.claimDateFrom ||
    filters.claimDateTo
  )
}

export function addFinanceFiltersToParams(
  params: URLSearchParams,
  filters: FinanceFilters
): URLSearchParams {
  if (filters.employeeName) {
    params.set('employeeName', filters.employeeName)
  }

  if (filters.claimNumber) {
    params.set('claimNumber', filters.claimNumber)
  }

  if (filters.ownerDesignation) {
    params.set('ownerDesignation', filters.ownerDesignation)
  }

  if (filters.hodApproverEmail) {
    params.set('hodApproverEmail', filters.hodApproverEmail)
  }

  if (filters.claimStatus) {
    params.set('claimStatus', filters.claimStatus)
  }

  if (filters.workLocation) {
    params.set('workLocation', filters.workLocation)
  }

  if (filters.resubmittedOnly) {
    params.set('resubmittedOnly', 'true')
  }

  if (filters.actionFilter !== 'all') {
    params.set('actionFilter', filters.actionFilter)
  }

  if (filters.claimDateFrom) {
    params.set('claimDateFrom', filters.claimDateFrom)
  }

  if (filters.claimDateTo) {
    params.set('claimDateTo', filters.claimDateTo)
  }

  if (filters.actionDateFrom) {
    params.set('actionDateFrom', filters.actionDateFrom)
  }

  if (filters.actionDateTo) {
    params.set('actionDateTo', filters.actionDateTo)
  }

  return params
}

export function toIstDayStart(date: string | null): string | null {
  return date ? `${date}${IST_DAY_START}` : null
}

export function toIstDayEnd(date: string | null): string | null {
  return date ? `${date}${IST_DAY_END}` : null
}

function normalizeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""')
  return `"${escaped}"`
}

function toFriendlyAction(value: string): string {
  return value.replaceAll('_', ' ')
}

export function buildFinanceHistoryCsv(rows: FinanceHistoryItem[]): string {
  const headers = [
    'Claim ID',
    'Employee',
    'Employee Designation',
    'Claim Date',
    'Work Location',
    'Total Amount',
    'Action',
    'Action By',
    'Action Date',
    'Current Status',
  ]

  const bodyRows = rows.map((row) => [
    row.claim.claim_number,
    row.owner.employee_name,
    row.owner.designation,
    formatDate(row.claim.claim_date),
    row.claim.work_location,
    `Rs. ${row.claim.total_amount.toFixed(2)}`,
    toFriendlyAction(row.action.action),
    row.action.actor_email,
    formatDatetime(row.action.acted_at),
    toFriendlyAction(row.claim.status),
  ])

  return [headers, ...bodyRows]
    .map((cells) =>
      cells.map((cell) => normalizeCsvCell(String(cell))).join(',')
    )
    .join('\n')
}
