import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAllClaimStatuses } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const data = await getAllClaimStatuses(supabase)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] claim-statuses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim statuses' },
      { status: 500 }
    )
  }
}
