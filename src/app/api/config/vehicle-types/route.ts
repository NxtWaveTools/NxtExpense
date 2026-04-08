import { type NextRequest, NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  getAllVehicleTypes,
  getVehicleTypesByDesignation,
} from '@/lib/services/config-service'

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
    const designationId = request.nextUrl.searchParams.get('designation_id')

    const data = designationId
      ? await getVehicleTypesByDesignation(supabase, designationId)
      : await getAllVehicleTypes(supabase)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] vehicle-types error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle types' },
      { status: 500 }
    )
  }
}
