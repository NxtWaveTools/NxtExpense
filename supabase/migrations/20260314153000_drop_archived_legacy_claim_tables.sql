BEGIN;

DO $$
DECLARE
  v_source_count bigint;
  v_archive_count bigint;
BEGIN
  IF to_regclass('public.claim_status_audit') IS NOT NULL THEN
    IF to_regclass('public.archive_claim_status_audit') IS NULL THEN
      RAISE EXCEPTION 'Cannot drop public.claim_status_audit: archive table public.archive_claim_status_audit is missing.';
    END IF;

    EXECUTE 'SELECT COUNT(*) FROM public.claim_status_audit' INTO v_source_count;
    EXECUTE 'SELECT COUNT(*) FROM public.archive_claim_status_audit' INTO v_archive_count;

    IF v_archive_count < v_source_count THEN
      RAISE EXCEPTION 'Cannot drop public.claim_status_audit: archive has % rows, source has % rows.', v_archive_count, v_source_count;
    END IF;

    EXECUTE 'DROP TABLE public.claim_status_audit';
  END IF;

  IF to_regclass('public.claim_expenses') IS NOT NULL THEN
    IF to_regclass('public.archive_claim_expenses') IS NULL THEN
      RAISE EXCEPTION 'Cannot drop public.claim_expenses: archive table public.archive_claim_expenses is missing.';
    END IF;

    EXECUTE 'SELECT COUNT(*) FROM public.claim_expenses' INTO v_source_count;
    EXECUTE 'SELECT COUNT(*) FROM public.archive_claim_expenses' INTO v_archive_count;

    IF v_archive_count < v_source_count THEN
      RAISE EXCEPTION 'Cannot drop public.claim_expenses: archive has % rows, source has % rows.', v_archive_count, v_source_count;
    END IF;

    EXECUTE 'DROP TABLE public.claim_expenses';
  END IF;
END
$$;

COMMIT;
