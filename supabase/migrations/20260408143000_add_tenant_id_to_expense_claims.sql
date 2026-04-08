-- only run in Test because it was missing 
ALTER TABLE expense_claims
ADD COLUMN tenant_id text NOT NULL DEFAULT 'default';