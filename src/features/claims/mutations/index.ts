import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ClaimStatus,
  ExpenseItemType,
  VehicleType,
  WorkLocation,
} from '@/features/claims/types'

type InsertClaimInput = {
  employeeId: string
  claimDateIso: string
  workLocation: WorkLocation
  ownVehicleUsed: boolean | null
  vehicleType: VehicleType | null
  outstationLocation: string | null
  fromCity: string | null
  toCity: string | null
  kmTravelled: number | null
  totalAmount: number
  status: ClaimStatus
  currentApprovalLevel: number | null
  submittedAt: string | null
}

type InsertClaimItemInput = {
  claimId: string
  itemType: ExpenseItemType
  description: string | null
  amount: number
}

export async function insertClaim(
  supabase: SupabaseClient,
  input: InsertClaimInput
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('expense_claims')
    .insert({
      employee_id: input.employeeId,
      claim_date: input.claimDateIso,
      work_location: input.workLocation,
      own_vehicle_used: input.ownVehicleUsed,
      vehicle_type: input.vehicleType,
      outstation_location: input.outstationLocation,
      from_city: input.fromCity,
      to_city: input.toCity,
      km_travelled: input.kmTravelled,
      total_amount: input.totalAmount,
      status: input.status,
      current_approval_level: input.currentApprovalLevel,
      submitted_at: input.submittedAt,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as { id: string }
}

export async function insertClaimItems(
  supabase: SupabaseClient,
  items: InsertClaimItemInput[]
): Promise<void> {
  if (items.length === 0) return

  const { error } = await supabase.from('expense_claim_items').insert(
    items.map((item) => ({
      claim_id: item.claimId,
      item_type: item.itemType,
      description: item.description,
      amount: item.amount,
    }))
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateClaimStatus(
  supabase: SupabaseClient,
  claimId: string,
  status: ClaimStatus,
  currentApprovalLevel: number | null
): Promise<void> {
  const { error } = await supabase
    .from('expense_claims')
    .update({
      status,
      current_approval_level: currentApprovalLevel,
      submitted_at:
        status === 'pending_approval' ? new Date().toISOString() : null,
    })
    .eq('id', claimId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function claimExistsForDate(
  supabase: SupabaseClient,
  employeeId: string,
  claimDateIso: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('expense_claims')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('claim_date', claimDateIso)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }

  return Boolean(data)
}

export async function getRateAmount(
  supabase: SupabaseClient,
  designation: string,
  rateType: string,
  vehicleType: VehicleType | null = null
): Promise<number> {
  let query = supabase
    .from('expense_reimbursement_rates')
    .select('amount')
    .eq('designation', designation)
    .eq('rate_type', rateType)

  query = vehicleType
    ? query.eq('vehicle_type', vehicleType)
    : query.is('vehicle_type', null)

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error(
      `Missing reimbursement rate for ${designation} / ${rateType}.`
    )
  }

  return Number(data.amount)
}
