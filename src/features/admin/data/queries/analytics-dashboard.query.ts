import type { SupabaseClient } from '@supabase/supabase-js'

import { getAdminDashboardAnalyticsRpc } from '@/features/admin/data/rpc/admin-dashboard.rpc'
import type {
  AdminAnalyticsFilters,
  AdminDashboardAnalytics,
} from '@/features/admin/types/analytics'

export async function getAdminDashboardAnalyticsQuery(
  supabase: SupabaseClient,
  filters: AdminAnalyticsFilters
): Promise<AdminDashboardAnalytics> {
  return getAdminDashboardAnalyticsRpc(supabase, filters, 10)
}
