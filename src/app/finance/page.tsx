import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireCurrentUser } from '@/features/auth/queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'

import { getEmployeeByEmail } from '@/features/employees/queries'
import { isFinanceTeamMember } from '@/features/finance/permissions'
import {
  getFinanceHistoryAction,
  getFinanceQueueAction,
} from '@/features/finance/actions'
import { FinanceQueue } from '@/features/finance/components/finance-queue'
import { FinanceHistoryList } from '@/features/finance/components/finance-history-list'

type FinancePageProps = {
  searchParams?: Promise<{
    queueCursor?: string
    historyCursor?: string
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
  const queueCursor = resolvedSearch?.queueCursor ?? null
  const historyCursor = resolvedSearch?.historyCursor ?? null
  const [queue, history] = await Promise.all([
    getFinanceQueueAction(queueCursor),
    getFinanceHistoryAction(historyCursor),
  ])

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
        <div className="space-y-6">
          <FinanceQueue queue={queue} />
          <FinanceHistoryList history={history} />
        </div>
      </div>
    </main>
  )
}
