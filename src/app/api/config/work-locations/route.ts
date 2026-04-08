import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAllWorkLocations } from '@/lib/services/config-service'

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
    const data = await getAllWorkLocations(supabase)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] work-locations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work locations' },
      { status: 500 }
    )
  }
}
