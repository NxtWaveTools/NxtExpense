import { redirect } from 'next/navigation'

import { requireCurrentUser } from '@/features/auth/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import { getEmployeeByEmail } from '@/features/employees/queries'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import { getFinanceQueueAction } from '@/features/finance/actions'
import { FinanceQueue } from '@/features/finance/components/finance-queue'

type FinancePageProps = {
  searchParams?: Promise<{
    cursor?: string
  }>
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const user = await requireCurrentUser('/login')
  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email ?? '')

  if (!employee || !isFinanceTeamMember(employee)) {
    redirect('/dashboard')
  }

  const resolvedSearch = await searchParams
  const cursor = resolvedSearch?.cursor ?? null
  const queue = await getFinanceQueueAction(cursor)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <FinanceQueue queue={queue} />
      </div>
    </main>
  )
}
