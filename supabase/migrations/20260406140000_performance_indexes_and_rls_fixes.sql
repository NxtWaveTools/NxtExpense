-- FIX 5: DB Advisor — unindexed FKs, RLS initplan fix, permissive policy consolidation
-- Source: Supabase Performance & Security advisors

BEGIN;

------------------------------------------------------------
-- Part A: Add missing indexes on unindexed foreign keys
------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_approval_history_new_status_id
  ON public.approval_history (new_status_id);

CREATE INDEX IF NOT EXISTS idx_approval_history_old_status_id
  ON public.approval_history (old_status_id);

CREATE INDEX IF NOT EXISTS idx_approval_routing_approver_designation_id
  ON public.approval_routing (approver_designation_id);

CREATE INDEX IF NOT EXISTS idx_approval_routing_approver_state_id
  ON public.approval_routing (approver_state_id);

CREATE INDEX IF NOT EXISTS idx_approver_selection_rules_designation_id
  ON public.approver_selection_rules (designation_id);

CREATE INDEX IF NOT EXISTS idx_config_versions_created_by
  ON public.config_versions (created_by);

CREATE INDEX IF NOT EXISTS idx_config_versions_source_admin_log_id
  ON public.config_versions (source_admin_log_id);

CREATE INDEX IF NOT EXISTS idx_employee_replacements_replaced_by_admin_id
  ON public.employee_replacements (replaced_by_admin_id);

CREATE INDEX IF NOT EXISTS idx_employee_roles_assigned_by
  ON public.employee_roles (assigned_by);

CREATE INDEX IF NOT EXISTS idx_expense_claims_from_city_id
  ON public.expense_claims (from_city_id);

CREATE INDEX IF NOT EXISTS idx_expense_claims_last_rejected_by_employee_id
  ON public.expense_claims (last_rejected_by_employee_id);

CREATE INDEX IF NOT EXISTS idx_expense_claims_to_city_id
  ON public.expense_claims (to_city_id);

------------------------------------------------------------
-- Part B: Fix auth_rls_initplan on employee_roles
-- The read_own policy uses auth.jwt() inline which causes
-- per-row re-evaluation. Since employee_roles_read_all
-- already uses USING(true), both read_own and
-- read_for_approvers are redundant — drop them.
------------------------------------------------------------

DROP POLICY IF EXISTS employee_roles_read_own ON public.employee_roles;
DROP POLICY IF EXISTS employee_roles_read_for_approvers ON public.employee_roles;

COMMIT;
