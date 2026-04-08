import type { SupabaseClient } from '@supabase/supabase-js'

function escapeIlikeValue(input: string): string {
  return input.replace(/[%_]/g, '').replace(/,/g, ' ').trim()
}

export type AdminEmployeeRow = {
  id: string
  employee_id: string
  employee_name: string
  employee_email: string
  designation_id: string | null
  role_id: string | null
  state_id: string | null
  employee_status_code: string | null
  employee_status_name: string | null
  designation: string
  state: string
  approval_employee_id_level_1: string | null
  approval_employee_id_level_2: string | null
  approval_employee_id_level_3: string | null
  current_approval_email_level_1: string | null
  current_approval_email_level_2: string | null
  current_approval_email_level_3: string | null
}

export async function searchEmployeesForAdmin(
  supabase: SupabaseClient,
  query: string,
  limit = 20
): Promise<AdminEmployeeRow[]> {
  const sanitized = escapeIlikeValue(query)
  if (!sanitized) return []

  const { data, error } = await supabase
    .from('employees')
    .select(
      `
      id, employee_id, employee_name, employee_email, designation_id,
      approval_employee_id_level_1, approval_employee_id_level_2, approval_employee_id_level_3,
      employee_statuses!employee_status_id(status_code, status_name),
      employee_roles!employee_id(role_id, is_active, assigned_at),
      designations!designation_id(designation_name),
      employee_states!employee_id(is_primary, state_id, states!state_id(state_name))
    `
    )
    .or(
      `employee_name.ilike.%${sanitized}%,employee_email.ilike.%${sanitized}%,employee_id.ilike.%${sanitized}%`
    )
    .order('employee_name')
    .limit(limit)

  if (error) throw new Error(error.message)

  const mappedRows = (data ?? []).map((row) => {
    const designationRelation = row.designations as
      | { designation_name: string }
      | Array<{ designation_name: string }>
      | null
      | undefined
    const designation = Array.isArray(designationRelation)
      ? designationRelation[0]
      : designationRelation

    const employeeStates =
      (row.employee_states as unknown as Array<{
        is_primary: boolean
        state_id: string
        states: { state_name: string } | Array<{ state_name: string }> | null
      }>) ?? []

    const primaryState =
      employeeStates.find((state) => state.is_primary) ?? employeeStates[0]
    const stateRelation = primaryState?.states
    const stateValue = Array.isArray(stateRelation)
      ? stateRelation[0]
      : stateRelation

    const statusRelation = row.employee_statuses as
      | { status_code: string; status_name: string }
      | Array<{ status_code: string; status_name: string }>
      | null
      | undefined
    const status = Array.isArray(statusRelation)
      ? statusRelation[0]
      : statusRelation

    const roleRelations =
      (row.employee_roles as unknown as Array<{
        role_id: string
        is_active: boolean
        assigned_at: string | null
      }>) ?? []

    const activeRoles = roleRelations.filter((role) => role.is_active)
    const latestRole =
      activeRoles.sort((a, b) =>
        (b.assigned_at ?? '').localeCompare(a.assigned_at ?? '')
      )[0] ?? null

    const primaryStateId = primaryState?.state_id ?? null

    return {
      id: row.id,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      employee_email: row.employee_email,
      designation_id: row.designation_id,
      role_id: latestRole?.role_id ?? null,
      state_id: primaryStateId,
      employee_status_code: status?.status_code ?? null,
      employee_status_name: status?.status_name ?? null,
      designation: designation?.designation_name ?? '',
      state: stateValue?.state_name ?? '',
      approval_employee_id_level_1: row.approval_employee_id_level_1,
      approval_employee_id_level_2: row.approval_employee_id_level_2,
      approval_employee_id_level_3: row.approval_employee_id_level_3,
      current_approval_email_level_1: null,
      current_approval_email_level_2: null,
      current_approval_email_level_3: null,
    }
  })

  const approverIds = Array.from(
    new Set(
      mappedRows
        .flatMap((row) => [
          row.approval_employee_id_level_1,
          row.approval_employee_id_level_2,
          row.approval_employee_id_level_3,
        ])
        .filter((value): value is string => Boolean(value))
    )
  )

  if (approverIds.length === 0) {
    return mappedRows
  }

  const { data: approverRows, error: approverError } = await supabase
    .from('employees')
    .select('id, employee_email')
    .in('id', approverIds)

  if (approverError) {
    throw new Error(approverError.message)
  }

  const approverEmailById = new Map(
    (approverRows ?? []).map((row) => [row.id, row.employee_email])
  )

  return mappedRows.map((row) => ({
    ...row,
    current_approval_email_level_1: row.approval_employee_id_level_1
      ? (approverEmailById.get(row.approval_employee_id_level_1) ?? null)
      : null,
    current_approval_email_level_2: row.approval_employee_id_level_2
      ? (approverEmailById.get(row.approval_employee_id_level_2) ?? null)
      : null,
    current_approval_email_level_3: row.approval_employee_id_level_3
      ? (approverEmailById.get(row.approval_employee_id_level_3) ?? null)
      : null,
  }))
}
