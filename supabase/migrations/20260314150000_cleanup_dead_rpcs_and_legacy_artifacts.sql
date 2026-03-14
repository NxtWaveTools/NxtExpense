BEGIN;

-- Step 2: Remove dead RPC helpers first.
DROP FUNCTION IF EXISTS public.get_role_id(character varying);
DROP FUNCTION IF EXISTS public.get_state_id(character varying);
DROP FUNCTION IF EXISTS public.get_vehicle_type_id(character varying);
DROP FUNCTION IF EXISTS public.resolve_next_approval_level(public.employees, integer, text);

-- Step 3: Drop empty legacy tables with safety guards.
DO $$
DECLARE
  v_count bigint;
BEGIN
  IF to_regclass('public.claim_approvals') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.claim_approvals' INTO v_count;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'Cannot drop public.claim_approvals: expected 0 rows, found %.', v_count;
    END IF;
    EXECUTE 'DROP TABLE public.claim_approvals';
  END IF;

  IF to_regclass('public.employee_designation_history') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.employee_designation_history' INTO v_count;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'Cannot drop public.employee_designation_history: expected 0 rows, found %.', v_count;
    END IF;
    EXECUTE 'DROP TABLE public.employee_designation_history';
  END IF;

  IF to_regclass('public.employee_state_history') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.employee_state_history' INTO v_count;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'Cannot drop public.employee_state_history: expected 0 rows, found %.', v_count;
    END IF;
    EXECUTE 'DROP TABLE public.employee_state_history';
  END IF;

  IF to_regclass('public.approval_delegations') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.approval_delegations' INTO v_count;
    IF v_count <> 0 THEN
      RAISE EXCEPTION 'Cannot drop public.approval_delegations: expected 0 rows, found %.', v_count;
    END IF;
    EXECUTE 'DROP TABLE public.approval_delegations';
  END IF;
END
$$;

-- Step 4: Archive legacy tables before dropping in a later migration.
CREATE TABLE IF NOT EXISTS public.archive_claim_status_audit
(LIKE public.claim_status_audit INCLUDING ALL);

INSERT INTO public.archive_claim_status_audit
SELECT src.*
FROM public.claim_status_audit src
WHERE NOT EXISTS (
  SELECT 1
  FROM public.archive_claim_status_audit dst
  WHERE dst.id = src.id
);

CREATE TABLE IF NOT EXISTS public.archive_claim_expenses
(LIKE public.claim_expenses INCLUDING ALL);

INSERT INTO public.archive_claim_expenses
SELECT src.*
FROM public.claim_expenses src
WHERE NOT EXISTS (
  SELECT 1
  FROM public.archive_claim_expenses dst
  WHERE dst.id = src.id
);

-- Step 5: Remove unused indexes.
DROP INDEX IF EXISTS public.idx_ad_active_dates;
DROP INDEX IF EXISTS public.idx_ad_delegate;
DROP INDEX IF EXISTS public.idx_ad_delegator;
DROP INDEX IF EXISTS public.idx_ca_action;
DROP INDEX IF EXISTS public.idx_ca_approved_at;
DROP INDEX IF EXISTS public.idx_ca_approver;
DROP INDEX IF EXISTS public.idx_ca_claim;
DROP INDEX IF EXISTS public.idx_ca_level;
DROP INDEX IF EXISTS public.idx_claim_expenses_claim;
DROP INDEX IF EXISTS public.idx_edh_changed_at;
DROP INDEX IF EXISTS public.idx_edh_employee;
DROP INDEX IF EXISTS public.idx_esh_employee;
DROP INDEX IF EXISTS public.idx_esh_transfer_date;

COMMIT;
