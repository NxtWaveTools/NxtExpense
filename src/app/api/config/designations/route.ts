import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAllDesignations } from '@/lib/services/config-service'

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
    const data = await getAllDesignations(supabase)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] designations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designations' },
      { status: 500 }
    )
  }
}
