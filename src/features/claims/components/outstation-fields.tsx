import type { VehicleType } from '@/features/claims/types'

type OutstationFieldsProps = {
  ownVehicleUsed: boolean
  vehicleType: VehicleType
  outstationLocation: string
  fromCity: string
  toCity: string
  kmTravelled: number
  taxiAmount: number
  allowedVehicleTypes: readonly VehicleType[]
  onOwnVehicleUsedChange: (value: boolean) => void
  onVehicleTypeChange: (value: VehicleType) => void
  onOutstationLocationChange: (value: string) => void
  onFromCityChange: (value: string) => void
  onToCityChange: (value: string) => void
  onKmTravelledChange: (value: number) => void
  onTaxiAmountChange: (value: number) => void
}

export function OutstationFields(props: OutstationFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="outstationLocation"
          className="text-sm font-medium text-foreground/80"
        >
          Outstation Location
        </label>
        <input
          id="outstationLocation"
          name="outstationLocation"
          value={props.outstationLocation}
          onChange={(event) =>
            props.onOutstationLocationChange(event.target.value)
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Enter city worked in"
        />
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
              Vehicle Type
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
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-foreground/80">
              <span>From City</span>
              <input
                name="fromCity"
                value={props.fromCity}
                onChange={(event) => props.onFromCityChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground/80">
              <span>To City</span>
              <input
                name="toCity"
                value={props.toCity}
                onChange={(event) => props.onToCityChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-foreground/80">
            <span>KM Travelled</span>
            <input
              name="kmTravelled"
              type="number"
              min={0}
              step="0.1"
              value={props.kmTravelled}
              onChange={(event) =>
                props.onKmTravelledChange(Number(event.target.value || 0))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </>
      ) : (
        <label className="space-y-2 text-sm font-medium text-foreground/80">
          <span>Taxi Bill Amount</span>
          <input
            name="taxiAmount"
            type="number"
            min={0}
            step="0.01"
            value={props.taxiAmount}
            onChange={(event) =>
              props.onTaxiAmountChange(Number(event.target.value || 0))
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      )}
    </div>
  )
}
