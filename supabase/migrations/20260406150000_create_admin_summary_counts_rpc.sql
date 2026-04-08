-- FIX 9: Consolidate 6 separate COUNT queries into a single RPC
-- Replaces getAdminSummary() which fired 7 queries (1 status lookup + 6 counts)
CREATE OR REPLACE FUNCTION public.get_admin_summary_counts()
RETURNS TABLE (
  total_employees bigint,
  total_claims bigint,
  pending_claims bigint,
  designation_count bigint,
  work_location_count bigint,
  vehicle_type_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  WITH pending_status_ids AS (
    SELECT cs.id
    FROM claim_statuses cs
    WHERE cs.approval_level IS NOT NULL
      AND cs.is_terminal = false
      AND cs.is_rejection = false
      AND cs.is_approval = false
      AND cs.is_active = true
  )
  SELECT
    (SELECT count(*) FROM employees)::bigint AS total_employees,
    (SELECT count(*) FROM expense_claims)::bigint AS total_claims,
    (SELECT count(*) FROM expense_claims ec
     WHERE ec.status_id IN (SELECT psi.id FROM pending_status_ids psi))::bigint AS pending_claims,
    (SELECT count(*) FROM designations d WHERE d.is_active = true)::bigint AS designation_count,
    (SELECT count(*) FROM work_locations wl WHERE wl.is_active = true)::bigint AS work_location_count,
    (SELECT count(*) FROM vehicle_types vt WHERE vt.is_active = true)::bigint AS vehicle_type_count;
END;
$$;
