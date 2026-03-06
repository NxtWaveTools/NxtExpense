'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

import {
  getEmployeeApprovalChain,
  getEmployeeByEmail,
} from '@/features/employees/queries'
import {
  canAccessEmployeeClaims,
  canSubmitFourWheelerClaim,
  getNextApprovalLevel,
} from '@/features/employees/permissions'

import type { ClaimFormValues, ExpenseItemType } from '@/features/claims/types'
import { claimSubmissionSchema } from '@/features/claims/validations'
import {
  claimExistsForDate,
  getRateAmount,
  insertClaim,
  insertClaimItems,
  updateClaimStatus,
} from '@/features/claims/mutations'
import { getMyClaimsPaginated } from '@/features/claims/queries'

type ClaimActionResult = {
  ok: boolean
  error: string | null
  claimId?: string
  claimNumber?: string
}

type ClaimItemDraft = {
  itemType: ExpenseItemType
  amount: number
  description: string | null
}

function buildClaimItemsAndTotal(
  input: ReturnType<typeof claimSubmissionSchema.parse>,
  rates: {
    foodBase?: number
    foodOutstation?: number
    fuelBase?: number
    intercityRate?: number
  }
): { items: ClaimItemDraft[]; total: number } {
  const items: ClaimItemDraft[] = []

  if (input.workLocation === 'Field - Base Location') {
    items.push({
      itemType: 'food',
      amount: rates.foodBase ?? 0,
      description: 'Base location food allowance',
    })
    items.push({
      itemType: 'fuel',
      amount: rates.fuelBase ?? 0,
      description: `${input.vehicleType} base location fuel allowance`,
    })
  }

  if (input.workLocation === 'Field - Outstation') {
    items.push({
      itemType: 'food',
      amount: rates.foodOutstation ?? 0,
      description: 'Outstation food allowance',
    })

    if (input.ownVehicleUsed) {
      const intercityAmount = (rates.intercityRate ?? 0) * input.kmTravelled
      items.push({
        itemType: 'intercity_travel',
        amount: intercityAmount,
        description: `${input.kmTravelled} KM @ ${rates.intercityRate}/KM`,
      })
    } else {
      if (typeof input.taxiAmount === 'number' && input.taxiAmount > 0) {
        items.push({
          itemType: 'taxi_bill',
          amount: input.taxiAmount,
          description: `${input.transportType} bill submitted for outstation travel`,
        })
      }
    }
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  return { items, total }
}

export async function submitClaimAction(
  rawInput: ClaimFormValues
): Promise<ClaimActionResult> {
  const parsed = claimSubmissionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid claim input.',
    }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { ok: false, error: 'Unauthorized request.' }
  }

  const employee = await getEmployeeByEmail(supabase, user.email)
  if (!employee) {
    return { ok: false, error: 'Employee profile not found.' }
  }

  if (!canAccessEmployeeClaims(employee)) {
    return { ok: false, error: 'Your role cannot submit employee claims.' }
  }

  const input = parsed.data

  if (
    input.workLocation === 'Field - Base Location' &&
    input.vehicleType === 'Four Wheeler' &&
    !canSubmitFourWheelerClaim(employee.designation)
  ) {
    return {
      ok: false,
      error:
        'Four wheeler reimbursements are not allowed for your designation.',
    }
  }

  if (
    input.workLocation === 'Field - Outstation' &&
    input.ownVehicleUsed &&
    input.vehicleType === 'Four Wheeler' &&
    !canSubmitFourWheelerClaim(employee.designation)
  ) {
    return {
      ok: false,
      error:
        'Four wheeler reimbursements are not allowed for your designation.',
    }
  }

  const duplicateExists = await claimExistsForDate(
    supabase,
    employee.id,
    input.claimDate.iso
  )

  if (duplicateExists) {
    return {
      ok: false,
      error: 'You already submitted a claim for this date.',
    }
  }

  const approvalChain = getEmployeeApprovalChain(employee)
  const firstApprovalLevel = getNextApprovalLevel(approvalChain, null)

  const rates: {
    foodBase?: number
    foodOutstation?: number
    fuelBase?: number
    intercityRate?: number
  } = {}

  if (input.workLocation === 'Field - Base Location') {
    rates.foodBase = await getRateAmount(
      supabase,
      employee.designation,
      'food_base_daily'
    )
    rates.fuelBase = await getRateAmount(
      supabase,
      employee.designation,
      'fuel_base_daily',
      input.vehicleType
    )
  }

  if (input.workLocation === 'Field - Outstation') {
    rates.foodOutstation = await getRateAmount(
      supabase,
      employee.designation,
      'food_outstation_daily'
    )

    if (input.ownVehicleUsed) {
      rates.intercityRate = await getRateAmount(
        supabase,
        employee.designation,
        'intercity_per_km',
        input.vehicleType
      )
    }
  }

  const draft = buildClaimItemsAndTotal(input, rates)

  const claim = await insertClaim(supabase, {
    employeeId: employee.id,
    claimDateIso: input.claimDate.iso,
    workLocation: input.workLocation,
    ownVehicleUsed:
      input.workLocation === 'Field - Outstation' ? input.ownVehicleUsed : null,
    vehicleType:
      input.workLocation === 'Field - Base Location' ||
      (input.workLocation === 'Field - Outstation' && input.ownVehicleUsed)
        ? input.vehicleType
        : null,
    outstationLocation:
      input.workLocation === 'Field - Outstation'
        ? input.outstationLocation
        : null,
    fromCity:
      input.workLocation === 'Field - Outstation' && input.ownVehicleUsed
        ? input.fromCity
        : null,
    toCity:
      input.workLocation === 'Field - Outstation' && input.ownVehicleUsed
        ? input.toCity
        : null,
    kmTravelled:
      input.workLocation === 'Field - Outstation' && input.ownVehicleUsed
        ? input.kmTravelled
        : null,
    totalAmount: draft.total,
    status: firstApprovalLevel ? 'pending_approval' : 'finance_review',
    currentApprovalLevel: firstApprovalLevel,
    submittedAt: new Date().toISOString(),
  })

  await insertClaimItems(
    supabase,
    draft.items.map((item) => ({
      claimId: claim.id,
      itemType: item.itemType,
      amount: item.amount,
      description: item.description,
    }))
  )

  if (!firstApprovalLevel) {
    await updateClaimStatus(supabase, claim.id, 'finance_review', null)
  }

  return {
    ok: true,
    error: null,
    claimId: claim.id,
    claimNumber: claim.claim_number,
  }
}

export async function getMyClaimsAction(cursor: string | null, limit = 10) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized request.')
  }

  const employee = await getEmployeeByEmail(supabase, user.email)
  if (!employee || !canAccessEmployeeClaims(employee)) {
    return {
      data: [],
      hasNextPage: false,
      nextCursor: null,
      limit,
    }
  }

  return getMyClaimsPaginated(supabase, employee.id, cursor, limit)
}
