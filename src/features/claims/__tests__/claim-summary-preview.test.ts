import { describe, expect, it } from 'vitest'

import {
  getClaimSummaryPreview,
  type ClaimRateSnapshot,
} from '@/features/claims/components/claim-summary-preview'

const RATE_SNAPSHOT: ClaimRateSnapshot = {
  foodBaseDaily: 120,
  foodOutstationDaily: 350,
  fuelBaseDailyByVehicle: {
    'veh-2w': 180,
  },
  intercityPerKmByVehicle: {
    'veh-2w': 5,
  },
  foodWithPrincipalsMax: 500,
}

describe('getClaimSummaryPreview', () => {
  it('shows only food allowance for no-own-vehicle outstation flow without taxi amount', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      ownVehicleUsed: false,
      transportType: '',
      transportTypeName: 'Taxi',
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      taxiAmount: '',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([{ label: 'Food allowance', amount: 350 }])
    expect(result.total).toBe(350)
  })

  it('includes transport amount when a taxi bill amount is present', () => {
    const result = getClaimSummaryPreview({
      workLocation: 'wl-outstation',
      requiresVehicleSelection: false,
      requiresOutstationDetails: true,
      ownVehicleUsed: false,
      transportType: 'transport-taxi',
      transportTypeName: 'Taxi',
      vehicleType: 'veh-2w',
      vehicleTypeName: 'Two Wheeler',
      kmTravelled: '',
      taxiAmount: '500',
      foodWithPrincipalsAmount: '',
      claimRateSnapshot: RATE_SNAPSHOT,
    })

    expect(result.items).toEqual([
      { label: 'Food allowance', amount: 350 },
      { label: 'Taxi bills', amount: 500 },
    ])
    expect(result.total).toBe(850)
  })
})
