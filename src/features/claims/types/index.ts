import type { PaginatedResult } from '@/lib/utils/pagination'

export const WORK_LOCATION_OPTIONS = [
  'Office / WFH',
  'Field - Base Location',
  'Field - Outstation',
  'Leave',
  'Week-off',
] as const

export const VEHICLE_TYPE_OPTIONS = ['Two Wheeler', 'Four Wheeler'] as const

export const TRANSPORT_TYPE_OPTIONS = [
  'Rental Vehicle',
  'Rapido/Uber/Ola',
] as const

export const CLAIM_STATUS_OPTIONS = [
  'draft',
  'submitted',
  'pending_approval',
  'approved',
  'rejected',
  'finance_review',
  'issued',
  'finance_rejected',
] as const

export const EXPENSE_ITEM_TYPE_OPTIONS = [
  'food',
  'fuel',
  'taxi_bill',
  'intercity_travel',
  'accommodation',
  'travel_bus_train',
] as const

export type WorkLocation = (typeof WORK_LOCATION_OPTIONS)[number]
export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number]
export type TransportType = (typeof TRANSPORT_TYPE_OPTIONS)[number]
export type ClaimStatus = (typeof CLAIM_STATUS_OPTIONS)[number]
export type ExpenseItemType = (typeof EXPENSE_ITEM_TYPE_OPTIONS)[number]

export type Claim = {
  id: string
  claim_number: string
  employee_id: string
  claim_date: string
  work_location: WorkLocation
  own_vehicle_used: boolean | null
  vehicle_type: VehicleType | null
  outstation_location: string | null
  from_city: string | null
  to_city: string | null
  km_travelled: number | null
  total_amount: number
  status: ClaimStatus
  current_approval_level: number | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type ClaimItem = {
  id: string
  claim_id: string
  item_type: ExpenseItemType
  description: string | null
  amount: number
  created_at: string
}

export type ClaimWithItems = {
  claim: Claim
  items: ClaimItem[]
}

export type ClaimFormValues = {
  claimDate: string
  workLocation: WorkLocation
  ownVehicleUsed?: boolean
  vehicleType?: VehicleType
  transportType?: TransportType
  outstationLocation?: string
  fromCity?: string
  toCity?: string
  kmTravelled?: number
  taxiAmount?: number
}

export type PaginatedClaims = PaginatedResult<Claim>
