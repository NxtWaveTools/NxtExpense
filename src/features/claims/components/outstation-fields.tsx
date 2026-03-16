import { Car, MapPin, Route } from 'lucide-react'

import type { SelectOption, VehicleType } from '@/features/claims/types'

type OutstationFieldsProps = {
  ownVehicleUsed: boolean
  vehicleType: VehicleType
  outstationCityId: string
  fromCityId: string
  toCityId: string
  kmTravelled: string
  kmLimit: number
  kmValidationMessage: string | null
  allowedVehicleTypes: readonly SelectOption[]
  cityOptions: readonly SelectOption[]
  onOwnVehicleUsedChange: (value: boolean) => void
  onVehicleTypeChange: (value: VehicleType) => void
  onOutstationCityIdChange: (value: string) => void
  onFromCityIdChange: (value: string) => void
  onToCityIdChange: (value: string) => void
  onKmTravelledChange: (value: string) => void
}

export function OutstationFields(props: OutstationFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="outstationCityId"
          className="text-sm font-medium text-foreground/80"
        >
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" />
            Outstation Location
          </span>
        </label>
        <select
          id="outstationCityId"
          name="outstationCityId"
          value={props.outstationCityId}
          onChange={(event) =>
            props.onOutstationCityIdChange(event.target.value)
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Select city...</option>
          {props.cityOptions.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground/80">
          Own vehicle used?
        </legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => props.onOwnVehicleUsedChange(true)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              props.ownVehicleUsed
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => props.onOwnVehicleUsedChange(false)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              !props.ownVehicleUsed
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background'
            }`}
          >
            No
          </button>
        </div>
      </fieldset>

      {props.ownVehicleUsed ? (
        <>
          <div className="space-y-2">
            <label
              htmlFor="vehicleTypeOutstation"
              className="text-sm font-medium text-foreground/80"
            >
              <span className="inline-flex items-center gap-2">
                <Car className="size-4" aria-hidden="true" />
                Vehicle Type
              </span>
            </label>
            <select
              id="vehicleTypeOutstation"
              name="vehicleType"
              value={props.vehicleType}
              onChange={(event) =>
                props.onVehicleTypeChange(event.target.value as VehicleType)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {props.allowedVehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-foreground/80">
              <span>From City</span>
              <select
                name="fromCityId"
                value={props.fromCityId}
                onChange={(event) =>
                  props.onFromCityIdChange(event.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select city...</option>
                {props.cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground/80">
              <span>To City</span>
              <select
                name="toCityId"
                value={props.toCityId}
                onChange={(event) => props.onToCityIdChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select city...</option>
                {props.cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-foreground/80">
            <span className="inline-flex items-center gap-2">
              <Route className="size-4" aria-hidden="true" />
              KM Travelled
            </span>
            <input
              name="kmTravelled"
              type="number"
              min={0}
              max={props.kmLimit}
              step="0.1"
              value={props.kmTravelled}
              onChange={(event) =>
                props.onKmTravelledChange(event.target.value)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            {props.kmValidationMessage ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {props.kmValidationMessage}
              </p>
            ) : null}
          </label>
        </>
      ) : null}
    </div>
  )
}
