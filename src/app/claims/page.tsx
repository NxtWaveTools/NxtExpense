import { ClaimList } from '@/features/claims/components/claim-list'
import { getMyClaimsAction } from '@/features/claims/actions'
import { requireCurrentUser } from '@/features/auth/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessEmployeeClaims } from '@/features/employees/permissions'
import { getEmployeeByEmail } from '@/features/employees/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type ClaimsPageProps = {
  searchParams?: Promise<{
    cursor?: string
  }>
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  const user = await requireCurrentUser('/login')
  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email ?? '')

  if (!employee || !canAccessEmployeeClaims(employee)) {
    redirect('/dashboard')
  }

  const resolvedSearch = await searchParams
  const cursor = resolvedSearch?.cursor ?? null

  const claims = await getMyClaimsAction(cursor)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
        <ClaimList claims={claims} />
      </div>
    </main>
  )
}
