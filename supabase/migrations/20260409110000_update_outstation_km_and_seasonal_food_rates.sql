BEGIN;

-- 1) Increase Two Wheeler inter-city round-trip cap from 150 to 200 KM.
UPDATE public.vehicle_types
SET
  max_km_round_trip = 200,
  updated_at = now()
WHERE vehicle_code = 'TWO_WHEELER'
  AND coalesce(max_km_round_trip, 0) <> 200;

-- 2) DB-driven toggle: when false, inter-city own-vehicle travel should not
-- auto-add intra-city allowance as a separate line item.
INSERT INTO public.validation_rules (
  rule_code,
  rule_name,
  rule_value,
  rule_description,
  is_active
)
SELECT
  'INTERCITY_AUTO_INTRACITY_ALLOWANCE_ENABLED',
  'Auto-add intra-city allowance for inter-city own-vehicle travel',
  '{"value": false}'::jsonb,
  'When false, inter-city own-vehicle claims should include only food + inter-city KM reimbursement.',
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.validation_rules vr
  WHERE vr.rule_code = 'INTERCITY_AUTO_INTRACITY_ALLOWANCE_ENABLED'
);

UPDATE public.validation_rules
SET
  rule_name = 'Auto-add intra-city allowance for inter-city own-vehicle travel',
  rule_value = '{"value": false}'::jsonb,
  rule_description = 'When false, inter-city own-vehicle claims should include only food + inter-city KM reimbursement.',
  is_active = true,
  updated_at = now()
WHERE rule_code = 'INTERCITY_AUTO_INTRACITY_ALLOWANCE_ENABLED';

-- 3) Summer food uplift for Apr 9-May 31, 2026 only.
-- Existing open-ended rows are closed at 2026-04-08, then seasonal rows are
-- added for 2026-04-09..2026-05-31, followed by post-summer fallback rows.
WITH active_baseline_food_rows AS (
  SELECT er.id
  FROM public.expense_rates er
  JOIN public.work_locations wl
    ON wl.id = er.location_id
  WHERE er.designation_id IS NULL
    AND er.expense_type IN ('FOOD_BASE', 'FOOD_OUTSTATION')
    AND wl.location_code IN ('FIELD_BASE', 'FIELD_OUTSTATION')
    AND er.is_active = true
    AND er.effective_to IS NULL
    AND er.effective_from < DATE '2026-04-09'
)
UPDATE public.expense_rates er
SET
  effective_to = DATE '2026-04-08',
  updated_at = now()
FROM active_baseline_food_rows b
WHERE er.id = b.id;

-- Normalize DBs where an earlier migration variant inserted Apr 1-May 31 rows.
-- This keeps the timeline deterministic when this script is re-run manually.
WITH legacy_apr1_rows AS (
  SELECT er.id
  FROM public.expense_rates er
  JOIN public.work_locations wl
    ON wl.id = er.location_id
  WHERE er.designation_id IS NULL
    AND er.expense_type IN ('FOOD_BASE', 'FOOD_OUTSTATION')
    AND wl.location_code IN ('FIELD_BASE', 'FIELD_OUTSTATION')
    AND er.is_active = true
    AND er.effective_from = DATE '2026-04-01'
    AND er.effective_to = DATE '2026-05-31'
)
UPDATE public.expense_rates er
SET
  effective_to = DATE '2026-04-08',
  updated_at = now()
FROM legacy_apr1_rows l
WHERE er.id = l.id;

WITH target_rates AS (
  SELECT
    wl.id AS location_id,
    'FOOD_BASE'::varchar(50) AS expense_type,
    170.00::numeric(10,2) AS rate_amount
  FROM public.work_locations wl
  WHERE wl.location_code = 'FIELD_BASE'

  UNION ALL

  SELECT
    wl.id AS location_id,
    'FOOD_OUTSTATION'::varchar(50) AS expense_type,
    400.00::numeric(10,2) AS rate_amount
  FROM public.work_locations wl
  WHERE wl.location_code = 'FIELD_OUTSTATION'
)
INSERT INTO public.expense_rates (
  designation_id,
  location_id,
  expense_type,
  rate_amount,
  effective_from,
  effective_to,
  is_active
)
SELECT
  NULL,
  tr.location_id,
  tr.expense_type,
  tr.rate_amount,
  DATE '2026-04-09',
  DATE '2026-05-31',
  true
FROM target_rates tr
WHERE NOT EXISTS (
  SELECT 1
  FROM public.expense_rates er
  WHERE er.designation_id IS NULL
    AND er.location_id = tr.location_id
    AND er.expense_type = tr.expense_type
    AND er.effective_from = DATE '2026-04-09'
    AND er.effective_to = DATE '2026-05-31'
);

WITH post_summer_rates AS (
  SELECT
    wl.id AS location_id,
    'FOOD_BASE'::varchar(50) AS expense_type,
    120.00::numeric(10,2) AS rate_amount
  FROM public.work_locations wl
  WHERE wl.location_code = 'FIELD_BASE'

  UNION ALL

  SELECT
    wl.id AS location_id,
    'FOOD_OUTSTATION'::varchar(50) AS expense_type,
    350.00::numeric(10,2) AS rate_amount
  FROM public.work_locations wl
  WHERE wl.location_code = 'FIELD_OUTSTATION'
)
INSERT INTO public.expense_rates (
  designation_id,
  location_id,
  expense_type,
  rate_amount,
  effective_from,
  effective_to,
  is_active
)
SELECT
  NULL,
  ps.location_id,
  ps.expense_type,
  ps.rate_amount,
  DATE '2026-06-01',
  NULL,
  true
FROM post_summer_rates ps
WHERE NOT EXISTS (
  SELECT 1
  FROM public.expense_rates er
  WHERE er.designation_id IS NULL
    AND er.location_id = ps.location_id
    AND er.expense_type = ps.expense_type
    AND er.effective_from = DATE '2026-06-01'
    AND er.effective_to IS NULL
);

COMMIT;
