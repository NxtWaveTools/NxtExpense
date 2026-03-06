import { requireCurrentUser } from '@/features/auth/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessApprovals } from '@/features/employees/permissions'
import {
  getEmployeeByEmail,
  hasApproverAssignments,
} from '@/features/employees/queries'

import { getPendingApprovalsAction } from '@/features/approvals/actions'
import { ApprovalList } from '@/features/approvals/components/approval-list'

type ApprovalsPageProps = {
  searchParams?: Promise<{
    cursor?: string
  }>
}

export default async function ApprovalsPage({
  searchParams,
}: ApprovalsPageProps) {
  const user = await requireCurrentUser('/login')
  const supabase = await createSupabaseServerClient()
  const employee = await getEmployeeByEmail(supabase, user.email ?? '')

  if (!employee) {
    redirect('/dashboard')
  }

  const approverAccess = await hasApproverAssignments(
    supabase,
    employee.employee_email
  )
  if (!canAccessApprovals(approverAccess)) {
    redirect('/dashboard')
  }

  const resolvedSearch = await searchParams
  const cursor = resolvedSearch?.cursor ?? null

  const approvals = await getPendingApprovalsAction(cursor)

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
        <ApprovalList approvals={approvals} />
      </div>
    </main>
  )
}
