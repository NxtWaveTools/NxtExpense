import type { SupabaseClient } from '@supabase/supabase-js'

import type { ApprovalChain, Employee } from '@/features/employees/types'

const EMPLOYEE_COLUMNS =
  'id, employee_id, employee_name, employee_email, state, designation, approval_email_level_1, approval_email_level_2, approval_email_level_3, created_at'

export async function getEmployeeByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLUMNS)
    .eq('employee_email', email.toLowerCase())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Employee | null
}

export async function getEmployeeById(
  supabase: SupabaseClient,
  id: string
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Employee | null
}

export function getEmployeeApprovalChain(employee: Employee): ApprovalChain {
  return {
    level1: employee.approval_email_level_1,
    level2: employee.approval_email_level_2,
    level3: employee.approval_email_level_3,
  }
}
