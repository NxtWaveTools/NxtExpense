import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAllTransportTypes } from '@/lib/services/config-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const data = await getAllTransportTypes(supabase)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] transport-types error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transport types' },
      { status: 500 }
    )
  }
}
