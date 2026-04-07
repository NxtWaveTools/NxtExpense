import { getEmployeeByEmail } from '@/lib/services/employee-service'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import { getFinanceHistoryPaginated } from '@/features/finance/queries'
import {
  buildFinanceHistoryCsv,
  normalizeFinanceFilters,
  FINANCE_HISTORY_CSV_HEADERS,
  mapFinanceHistoryToCsvRow,
} from '@/features/finance/utils/filters'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeCursorPageSize } from '@/lib/utils/pagination'
// FIX [ISSUE#2] — Streaming chunked export to eliminate unbounded in-memory arrays
import { createStreamingCsvResponse } from '@/lib/utils/streaming-export'

type ExportMode = 'page' | 'all'

function getExportMode(value: string | null): ExportMode {
  return value === 'all' ? 'all' : 'page'
}

async function handleExportRequest(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const mode = getExportMode(searchParams.get('mode'))
    const historyCursor = searchParams.get('historyCursor')
    const pageSize = normalizeCursorPageSize(searchParams.get('pageSize'))

    const filters = normalizeFinanceFilters({
      employeeName: searchParams.get('employeeName') ?? undefined,
      claimNumber: searchParams.get('claimNumber') ?? undefined,
      ownerDesignation: searchParams.get('ownerDesignation') ?? undefined,
      hodApproverEmployeeId:
        searchParams.get('hodApproverEmployeeId') ?? undefined,
      workLocation: searchParams.get('workLocation') ?? undefined,
      actionFilter: searchParams.get('actionFilter') ?? undefined,
      dateFilterField: searchParams.get('dateFilterField') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    })

    const effectiveFilters = {
      ...filters,
      claimStatus: null,
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return new Response('Unauthorized request.', { status: 401 })
    }

    const employee = await getEmployeeByEmail(supabase, user.email)
    if (!employee || !(await isFinanceTeamMember(supabase, employee))) {
      return new Response('Finance access is required.', { status: 403 })
    }

    const dateStamp = new Date().toISOString().slice(0, 10)
    const filename = `approved-history-${mode}-${dateStamp}.csv`

    // FIX [ISSUE#2] — Stream export-all instead of holding full dataset in memory
    if (mode === 'all') {
      return createStreamingCsvResponse({
        fetcher: (cursor, limit) =>
          getFinanceHistoryPaginated(supabase, cursor, limit, effectiveFilters),
        headers: FINANCE_HISTORY_CSV_HEADERS,
        mapRow: mapFinanceHistoryToCsvRow,
        filename,
      })
    }

    const paginated = await getFinanceHistoryPaginated(
      supabase,
      historyCursor,
      pageSize,
      effectiveFilters
    )
    const csv = buildFinanceHistoryCsv(paginated.data)

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : 'Failed to export CSV.',
      { status: 400 }
    )
  }
}

export async function GET(request: Request) {
  return handleExportRequest(request)
}

export async function POST(request: Request) {
  return handleExportRequest(request)
}
