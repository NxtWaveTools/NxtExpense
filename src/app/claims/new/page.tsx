import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireCurrentUser } from '@/features/auth/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import { ClaimSubmissionForm } from '@/features/claims/components/claim-submission-form'
import { getEmployeeByEmail } from '@/features/employees/queries'
import {
  canAccessEmployeeClaims,
  getAllowedVehicleTypes,
} from '@/features/employees/permissions'

export default async function NewClaimPage() {
  const user = await requireCurrentUser('/login')
  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email ?? '')

  if (!employee || !canAccessEmployeeClaims(employee)) {
    redirect('/dashboard')
  }

  const allowedVehicleTypes = getAllowedVehicleTypes(employee.designation)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4">
          <Link
            href="/claims"
            className="inline-flex rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium"
          >
            Back to My Claims
          </Link>
        </div>
        <ClaimSubmissionForm allowedVehicleTypes={allowedVehicleTypes} />
      </div>
    </main>
  )
}
