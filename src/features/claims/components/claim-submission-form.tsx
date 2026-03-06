'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Calendar, Loader2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { submitClaimAction } from '@/features/claims/actions'
import { BaseLocationFields } from '@/features/claims/components/base-location-fields'
import { OutstationFields } from '@/features/claims/components/outstation-fields'
import { ClaimSummaryCard } from '@/features/claims/components/claim-summary-card'
import { formatDate } from '@/lib/utils/date'
import type {
  ClaimFormValues,
  TransportType,
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
  const [claimDate, setClaimDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    allowedVehicleTypes[0]
  )
  const [ownVehicleUsed, setOwnVehicleUsed] = useState(true)
  const [transportType, setTransportType] =
    useState<TransportType>('Rental Vehicle')
  const [outstationLocation, setOutstationLocation] = useState('')
  const [fromCity, setFromCity] = useState('')
  const [toCity, setToCity] = useState('')
  const [kmTravelled, setKmTravelled] = useState('')
  const [taxiAmount, setTaxiAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const todayIso = dayjs().format('YYYY-MM-DD')

  const summary = useMemo(() => {
    const kmValue = Number.parseFloat(kmTravelled)
    const taxiValue = Number.parseFloat(taxiAmount)
    const parsedKm = Number.isFinite(kmValue) ? kmValue : 0
    const parsedTaxiAmount = Number.isFinite(taxiValue) ? taxiValue : 0

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
            { label: `${transportType} bills`, amount: parsedTaxiAmount },
          ],
          total: 350 + parsedTaxiAmount,
        }
      }

      const rate = vehicleType === 'Two Wheeler' ? 5 : 8
      return {
        items: [
          { label: 'Food allowance', amount: 350 },
          { label: 'Intercity travel', amount: parsedKm * rate },
        ],
        total: 350 + parsedKm * rate,
      }
    }

    return {
      items: [],
      total: 0,
    }
  }, [
    workLocation,
    ownVehicleUsed,
    vehicleType,
    kmTravelled,
    taxiAmount,
    transportType,
  ])

  function handleOwnVehicleUsedChange(value: boolean) {
    setOwnVehicleUsed(value)

    if (value) {
      setTaxiAmount('')
      return
    }

    setFromCity('')
    setToCity('')
    setKmTravelled('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!claimDate) {
      const message = 'Claim date is required.'
      setError(message)
      toast.error(message)
      return
    }

    setIsSubmitting(true)
    setError(null)

    const kmTravelledValue = Number.parseFloat(kmTravelled)
    const taxiAmountValue = Number.parseFloat(taxiAmount)

    const payload: ClaimFormValues = {
      claimDate: formatDate(claimDate),
      workLocation,
      vehicleType,
      ownVehicleUsed,
      transportType:
        workLocation === 'Field - Outstation' && !ownVehicleUsed
          ? transportType
          : undefined,
      outstationLocation,
      fromCity,
      toCity,
      kmTravelled: Number.isFinite(kmTravelledValue) ? kmTravelledValue : 0,
      taxiAmount: Number.isFinite(taxiAmountValue) ? taxiAmountValue : 0,
    }

    try {
      const result = await submitClaimAction(payload)

      if (!result.ok) {
        setError(result.error)
        toast.error(result.error ?? 'Unable to submit claim.')
        return
      }

      toast.success(
        result.claimNumber
          ? `Claim submitted successfully (${result.claimNumber}).`
          : 'Claim submitted successfully.'
      )
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
          <span className="inline-flex items-center gap-2">
            <Calendar className="size-4" aria-hidden="true" />
            Claim Date
          </span>
          <input
            name="claimDate"
            type="date"
            value={claimDate}
            onChange={(event) => setClaimDate(event.target.value)}
            max={todayIso}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground/80">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" />
            Work Location
          </span>
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
            transportType={transportType}
            outstationLocation={outstationLocation}
            fromCity={fromCity}
            toCity={toCity}
            kmTravelled={kmTravelled}
            taxiAmount={taxiAmount}
            allowedVehicleTypes={allowedVehicleTypes}
            onOwnVehicleUsedChange={handleOwnVehicleUsedChange}
            onVehicleTypeChange={setVehicleType}
            onTransportTypeChange={setTransportType}
            onOutstationLocationChange={setOutstationLocation}
            onFromCityChange={setFromCity}
            onToCityChange={setToCity}
            onKmTravelledChange={setKmTravelled}
            onTaxiAmountChange={setTaxiAmount}
          />
        ) : null}

        <div className="border-t border-border pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit Claim'
            )}
          </button>
        </div>
      </section>

      <ClaimSummaryCard totalAmount={summary.total} lineItems={summary.items} />
    </form>
  )
}
