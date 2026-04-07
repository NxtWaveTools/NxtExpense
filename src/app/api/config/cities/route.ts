import { type NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCitiesByState } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stateId = request.nextUrl.searchParams.get('state_id')
    if (!stateId) {
      return NextResponse.json(
        { error: 'state_id query parameter is required' },
        { status: 400 }
      )
    }

    const data = await getCitiesByState(supabase, stateId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] cities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    )
  }
}
