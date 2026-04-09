import { describe, expect, it } from 'vitest'

import {
  getClaimSummaryPreview,
  type ClaimRateSnapshot,
} from '@/features/claims/components/claim-summary-preview'

const RATE_SNAPSHOT: ClaimRateSnapshot = {
  foodBaseDaily: 170,
  foodOutstationDaily: 400,
  fuelBaseDailyByVehicle: {
    'veh-2w': 180,
  },
  baseDayTypeIncludeFoodByCode: {
    FULL_DAY: true,
    HALF_DAY: false,
  },
  baseDayTypeLabelByCode: {
    FULL_DAY: 'Full Day',
    HALF_DAY: 'Half Day (Fuel Only)',
  },
  defaultBaseDayTypeCode: 'FULL_DAY',
  intercityPerKmByVehicle: {
    'veh-2w': 5,
  },
  intracityDailyByVehicle: {
    'veh-2w': 180,
  },
  maxKmRoundTripByVehicle: {
    'veh-2w': 200,
  },
  foodWithPrincipalsMax: 500,
  intercityAutoIntracityAllowanceEnabled: false,
}

describe('getClaimSummaryPreview', () => {
  it('shows food + fuel for base location full day', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-base',
      requiresVehicleSelection: true,
      requiresOutstationDetails: false,
      baseLocationDayTypeCode: 'FULL_DAY',
      hasIntercityTravel: false,
      hasIntracityTravel: false,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      { label: 'Food allowance', amount: 170 },
      { label: 'Two Wheeler fuel allowance', amount: 180 },
    ])
    expect(result.total).toBe(350)
  })

  it('shows fuel-only for base location half day', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-base',
      requiresVehicleSelection: true,
      requiresOutstationDetails: false,
      baseLocationDayTypeCode: 'HALF_DAY',
      hasIntercityTravel: false,
      hasIntracityTravel: false,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      {
        label: 'Two Wheeler fuel allowance (Half Day (Fuel Only))',
        amount: 180,
      },
    ])
    expect(result.total).toBe(180)
  })

  it('shows only food allowance when neither outstation own-vehicle branch is selected', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      baseLocationDayTypeCode: undefined,
      hasIntercityTravel: false,
      hasIntracityTravel: false,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([{ label: 'Food allowance', amount: 400 }])
    expect(result.total).toBe(400)
  })

  it('includes intra-city allowance when intra-city own vehicle is selected', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      baseLocationDayTypeCode: undefined,
      hasIntercityTravel: false,
      hasIntracityTravel: true,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: true,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      { label: 'Food allowance', amount: 400 },
      { label: 'Two Wheeler fixed intra-city fuel allowance', amount: 180 },
    ])
    expect(result.total).toBe(580)
  })

  it('includes fixed fuel allowance when intra-city rented vehicle is selected', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      baseLocationDayTypeCode: undefined,
      hasIntercityTravel: false,
      hasIntracityTravel: true,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      { label: 'Food allowance', amount: 400 },
      {
        label:
          'Two Wheeler fixed intra-city fuel allowance (rented vehicle travel)',
        amount: 180,
      },
    ])
    expect(result.total).toBe(580)
  })

  it('includes inter-city KM only when inter-city own vehicle is selected', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      baseLocationDayTypeCode: undefined,
      hasIntercityTravel: true,
      hasIntracityTravel: true,
      intercityOwnVehicleUsed: true,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '100',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      { label: 'Food allowance', amount: 400 },
      { label: 'Intercity travel (100.00 KM @ 5.00/KM)', amount: 500 },
    ])
    expect(result.total).toBe(900)
  })

  it('shows food allowance only when outstation own vehicle is not used', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      baseLocationDayTypeCode: undefined,
      hasIntercityTravel: false,
      hasIntracityTravel: false,
      intercityOwnVehicleUsed: false,
      intracityOwnVehicleUsed: false,
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([{ label: 'Food allowance', amount: 400 }])
    expect(result.total).toBe(400)
  })
})
