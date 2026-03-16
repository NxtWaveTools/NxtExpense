import type { ClaimWithItems } from '@/features/claims/types'

type SubmittedField = {
  label: string
  value: string
}

function getSubmittedFields(claim: ClaimWithItems['claim']): SubmittedField[] {
  const fields: Array<SubmittedField | null> = [
    claim.outstation_city_name
      ? {
          label: 'Outstation Location',
          value: claim.outstation_city_name,
        }
      : null,
    claim.own_vehicle_used === null
      ? null
      : {
          label: 'Own vehicle used?',
          value: claim.own_vehicle_used ? 'Yes' : 'No',
        },
    claim.vehicle_type
      ? {
          label: 'Vehicle Type',
          value: claim.vehicle_type,
        }
      : null,
    claim.from_city_name
      ? {
          label: 'From City',
          value: claim.from_city_name,
        }
      : null,
    claim.to_city_name
      ? {
          label: 'To City',
          value: claim.to_city_name,
        }
      : null,
    claim.km_travelled === null
      ? null
      : {
          label: 'KM Travelled',
          value: `${Number(claim.km_travelled).toFixed(2)} KM`,
        },
    claim.accommodation_nights && claim.accommodation_nights > 0
      ? {
          label: 'Accommodation Nights',
          value: String(claim.accommodation_nights),
        }
      : null,
    claim.food_with_principals_amount && claim.food_with_principals_amount > 0
      ? {
          label: 'Food with Principals',
          value: `Rs. ${Number(claim.food_with_principals_amount).toFixed(2)}`,
        }
      : null,
  ]

  return fields.filter((field): field is SubmittedField => field !== null)
}

type SubmittedClaimDetailsProps = {
  claim: ClaimWithItems['claim']
}

export function SubmittedClaimDetails({ claim }: SubmittedClaimDetailsProps) {
  const submittedFields = getSubmittedFields(claim)

  if (submittedFields.length === 0) {
    return null
  }

  return (
    <>
      <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/70">
        Submitted Details
      </h3>
      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        {submittedFields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-border bg-background p-3"
          >
            <dt className="text-foreground/60">{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
