-- Restore read access for authenticated role on employee_roles. PROD ONLY. This is needed to restore read access for the employee_roles table for the authenticated role, which was dropped in a previous migration (20260406140000) under the assumption that read_all policy existed. This migration will re-enable row level security and create a new policy to allow read access for all authenticated users.
BEGIN;

-- Restore authenticated role read access on employee_roles.
-- 20260406140000 dropped read_own/read_for_approvers assuming read_all existed.
ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employee_roles_read_own ON public.employee_roles;
DROP POLICY IF EXISTS employee_roles_read_for_approvers ON public.employee_roles;
DROP POLICY IF EXISTS employee_roles_read_all ON public.employee_roles;

CREATE POLICY employee_roles_read_all
  ON public.employee_roles
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
