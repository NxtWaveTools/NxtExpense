-- Fix: employee_roles RLS policies
-- 1. The "employee_roles_read_for_approvers" policy queried employee_roles
--    from within a policy on employee_roles, causing infinite recursion.
--    Fix: use a SECURITY DEFINER function to bypass RLS for the role check.
-- 2. Both policies referenced auth.users which the authenticated role cannot
--    access. Fix: use auth.jwt() ->> 'email' instead.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_has_elevated_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_roles er
    JOIN public.employees e ON e.id = er.employee_id
    JOIN public.roles r ON r.id = er.role_id
    WHERE e.employee_email = (auth.jwt() ->> 'email')
    AND r.role_code IN ('APPROVER_L1', 'APPROVER_L2', 'FINANCE_REVIEWER', 'FINANCE_PROCESSOR', 'ADMIN')
    AND er.is_active = true
  );
$$;

DROP POLICY IF EXISTS "employee_roles_read_for_approvers" ON public.employee_roles;

CREATE POLICY "employee_roles_read_for_approvers"
    ON public.employee_roles
    FOR SELECT
    TO authenticated
    USING (public.auth_user_has_elevated_role());

DROP POLICY IF EXISTS "employee_roles_read_own" ON public.employee_roles;

CREATE POLICY "employee_roles_read_own"
    ON public.employee_roles
    FOR SELECT
    TO authenticated
    USING (
        employee_id IN (
            SELECT id FROM public.employees
            WHERE employee_email = (auth.jwt() ->> 'email')
        )
    );

COMMIT;
