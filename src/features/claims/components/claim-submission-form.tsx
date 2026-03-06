'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { submitClaimAction } from '@/features/claims/actions'
import { BaseLocationFields } from '@/features/claims/components/base-location-fields'
import { OutstationFields } from '@/features/claims/components/outstation-fields'
import { ClaimSummaryCard } from '@/features/claims/components/claim-summary-card'
import type {
  ClaimFormValues,
  VehicleType,
  WorkLocation,
} from '@/features/claims/types'

type ClaimSubmissionFormProps = {
  allowedVehicleTypes: readonly VehicleType[]
}

export function ClaimSubmissionForm({
  allowedVehicleTypes,
}: ClaimSubmissionFormProps) {
  const router = useRouter()
  const [workLocation, setWorkLocation] = useState<WorkLocation>('Office / WFH')
  const [claimDate, setClaimDate] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    allowedVehicleTypes[0]
  )
  const [ownVehicleUsed, setOwnVehicleUsed] = useState(true)
  const [outstationLocation, setOutstationLocation] = useState('')
  const [fromCity, setFromCity] = useState('')
  const [toCity, setToCity] = useState('')
  const [kmTravelled, setKmTravelled] = useState(0)
  const [taxiAmount, setTaxiAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const summary = useMemo(() => {
    if (workLocation === 'Field - Base Location') {
      const fuel = vehicleType === 'Two Wheeler' ? 180 : 300
      return {
        items: [
          { label: 'Food allowance', amount: 120 },
          { label: 'Fuel allowance', amount: fuel },
        ],
        total: 120 + fuel,
      }
    }

    if (workLocation === 'Field - Outstation') {
      if (!ownVehicleUsed) {
        return {
          items: [
            { label: 'Food allowance', amount: 350 },
            { label: 'Taxi bills', amount: taxiAmount },
          ],
          total: 350 + taxiAmount,
        }
      }

      const rate = vehicleType === 'Two Wheeler' ? 5 : 8
      return {
        items: [
          { label: 'Food allowance', amount: 350 },
          { label: 'Intercity travel', amount: kmTravelled * rate },
        ],
        total: 350 + kmTravelled * rate,
      }
    }

    return {
      items: [],
      total: 0,
    }
  }, [workLocation, ownVehicleUsed, vehicleType, kmTravelled, taxiAmount])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: ClaimFormValues = {
      claimDate,
      workLocation,
      vehicleType,
      ownVehicleUsed,
      outstationLocation,
      fromCity,
      toCity,
      kmTravelled,
      taxiAmount,
    }

    try {
      const result = await submitClaimAction(payload)

      if (!result.ok) {
        setError(result.error)
        toast.error(result.error ?? 'Unable to submit claim.')
        return
      }

      toast.success('Claim submitted successfully.')
      router.push('/claims')
      router.refresh()
    } catch {
      const message = 'Unexpected error while submitting claim.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">Submit Daily Expense Claim</h1>
          <p className="text-sm text-foreground/70">
            One claim must be submitted per calendar date.
          </p>
        </header>

        {error ? (
          <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <label className="space-y-2 text-sm font-medium text-foreground/80">
          <span>Claim Date (DD/MM/YYYY)</span>
          <input
            name="claimDate"
            value={claimDate}
            onChange={(event) => setClaimDate(event.target.value)}
            placeholder="DD/MM/YYYY"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground/80">
          <span>Work Location</span>
          <select
            name="workLocation"
            value={workLocation}
            onChange={(event) =>
              setWorkLocation(event.target.value as WorkLocation)
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="Office / WFH">Office / WFH</option>
            <option value="Field - Base Location">Field - Base Location</option>
            <option value="Field - Outstation">Field - Outstation</option>
            <option value="Leave">Leave</option>
            <option value="Week-off">Week-off</option>
          </select>
        </label>

        {workLocation === 'Field - Base Location' ? (
          <BaseLocationFields
            vehicleType={vehicleType}
            allowedVehicleTypes={allowedVehicleTypes}
            onVehicleTypeChange={setVehicleType}
          />
        ) : null}

        {workLocation === 'Field - Outstation' ? (
          <OutstationFields
            ownVehicleUsed={ownVehicleUsed}
            vehicleType={vehicleType}
            outstationLocation={outstationLocation}
            fromCity={fromCity}
            toCity={toCity}
            kmTravelled={kmTravelled}
            taxiAmount={taxiAmount}
            allowedVehicleTypes={allowedVehicleTypes}
            onOwnVehicleUsedChange={setOwnVehicleUsed}
            onVehicleTypeChange={setVehicleType}
            onOutstationLocationChange={setOutstationLocation}
            onFromCityChange={setFromCity}
            onToCityChange={setToCity}
            onKmTravelledChange={setKmTravelled}
            onTaxiAmountChange={setTaxiAmount}
          />
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Claim'}
        </button>
      </section>

      <ClaimSummaryCard totalAmount={summary.total} lineItems={summary.items} />
    </form>
  )
}
