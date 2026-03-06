import { ClaimList } from '@/features/claims/components/claim-list'
import { getMyClaimsAction } from '@/features/claims/actions'
import { requireCurrentUser } from '@/features/auth/queries'

type ClaimsPageProps = {
  searchParams?: Promise<{
    cursor?: string
  }>
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  await requireCurrentUser('/login')
  const resolvedSearch = await searchParams
  const cursor = resolvedSearch?.cursor ?? null

  const claims = await getMyClaimsAction(cursor)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <ClaimList claims={claims} />
      </div>
    </main>
  )
}
