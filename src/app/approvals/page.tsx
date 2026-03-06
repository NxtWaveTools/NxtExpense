import { requireCurrentUser } from '@/features/auth/queries'

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
  await requireCurrentUser('/login')
  const resolvedSearch = await searchParams
  const cursor = resolvedSearch?.cursor ?? null

  const approvals = await getPendingApprovalsAction(cursor)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <ApprovalList approvals={approvals} />
      </div>
    </main>
  )
}
