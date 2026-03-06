import { redirect } from 'next/navigation'

import { requireCurrentUser } from '@/features/auth/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import { ClaimSubmissionForm } from '@/features/claims/components/claim-submission-form'
import { getEmployeeByEmail } from '@/features/employees/queries'
import { getAllowedVehicleTypes } from '@/features/employees/permissions'

export default async function NewClaimPage() {
  const user = await requireCurrentUser('/login')
  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email ?? '')

  if (!employee) {
    redirect('/dashboard')
  }

  const allowedVehicleTypes = getAllowedVehicleTypes(employee.designation)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <ClaimSubmissionForm allowedVehicleTypes={allowedVehicleTypes} />
      </div>
    </main>
  )
}
