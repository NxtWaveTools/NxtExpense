import type { SupabaseClient } from '@supabase/supabase-js'

function escapeIlikeValue(input: string): string {
  return input.replace(/[%_]/g, '').replace(/,/g, ' ').trim()
}

// ────────────────────────────────────────────────────────────
// Admin summary stats
// ────────────────────────────────────────────────────────────

type AdminSummary = {
  totalEmployees: number
  totalClaims: number
  pendingClaims: number
  designationCount: number
  workLocationCount: number
  vehicleTypeCount: number
}

type AdminSummaryRow = {
  total_employees: number
  total_claims: number
  pending_claims: number
  designation_count: number
  work_location_count: number
  vehicle_type_count: number
}

export async function getAdminSummary(
  supabase: SupabaseClient
): Promise<AdminSummary> {
  const { data, error } = await supabase.rpc('get_admin_summary_counts')

  if (error) throw new Error(`Admin summary RPC failed: ${error.message}`)

  const row = (data as AdminSummaryRow[])?.[0]
  if (!row) throw new Error('Admin summary RPC returned no data')

  return {
    totalEmployees: row.total_employees,
    totalClaims: row.total_claims,
    pendingClaims: row.pending_claims,
    designationCount: row.designation_count,
    workLocationCount: row.work_location_count,
    vehicleTypeCount: row.vehicle_type_count,
  }
}

// ────────────────────────────────────────────────────────────
// Claim search for admin rollback
// ────────────────────────────────────────────────────────────

export type AdminClaimRow = {
  id: string
  claim_number: string
  claim_date: string
  total_amount: number
  status: string
  employee_name: string
  employee_email: string
  designation: string
  work_location: string
  submitted_at: string | null
}

export type AdminClaimStatusOption = {
  id: string
  status_code: string
  status_name: string
  approval_level: number | null
}

export async function getAdminClaimStatusOptions(
  supabase: SupabaseClient
): Promise<AdminClaimStatusOption[]> {
  const { data, error } = await supabase
    .from('claim_statuses')
    .select('id, status_code, status_name, approval_level, display_order')
    .eq('is_active', true)
    .eq('is_terminal', false)
    .eq('is_rejection', false)
    .eq('is_approval', false)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    status_code: row.status_code,
    status_name: row.status_name,
    approval_level: row.approval_level,
  }))
}

export async function searchClaimsForAdmin(
  supabase: SupabaseClient,
  query: string,
  limit = 20
): Promise<AdminClaimRow[]> {
  const sanitized = escapeIlikeValue(query)
  if (!sanitized) return []

  const pattern = `%${sanitized}%`

  const { data: matchedEmployees, error: employeeLookupError } = await supabase
    .from('employees')
    .select('id')
    .or(`employee_name.ilike.${pattern},employee_email.ilike.${pattern}`)
    .limit(100)

  if (employeeLookupError) {
    throw new Error(employeeLookupError.message)
  }

  const employeeIds = (matchedEmployees ?? []).map((row) => row.id)

  let claimsQuery = supabase.from('expense_claims').select(
    `
      id, claim_number, claim_date, total_amount, status_id, submitted_at,
      claim_statuses!status_id ( status_code ),
      employees!employee_id (
        employee_name,
        employee_email,
        designations!designation_id ( designation_name )
      ),
      work_locations!work_location_id ( location_name )
    `
  )

  if (employeeIds.length > 0) {
    claimsQuery = claimsQuery.or(
      `claim_number.ilike.${pattern},employee_id.in.(${employeeIds.join(',')})`
    )
  } else {
    claimsQuery = claimsQuery.ilike('claim_number', pattern)
  }

  const { data, error } = await claimsQuery
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const emp = row.employees as unknown as {
      employee_name: string
      employee_email: string
      designations?: {
        designation_name: string
      } | null
    } | null
    const wl = row.work_locations as unknown as {
      location_name: string
    } | null
    const cs = row.claim_statuses as unknown as {
      status_code: string
    } | null

    return {
      id: row.id,
      claim_number: row.claim_number,
      claim_date: row.claim_date,
      total_amount: Number(row.total_amount),
      status: cs?.status_code ?? '',
      employee_name: emp?.employee_name ?? '',
      employee_email: emp?.employee_email ?? '',
      designation: emp?.designations?.designation_name ?? '',
      work_location: wl?.location_name ?? '',
      submitted_at: row.submitted_at,
    }
  })
}

// ────────────────────────────────────────────────────────────
// Employee search for reassignment
// ────────────────────────────────────────────────────────────

export {
  searchEmployeesForAdmin,
  type AdminEmployeeRow,
} from './employee-search'
