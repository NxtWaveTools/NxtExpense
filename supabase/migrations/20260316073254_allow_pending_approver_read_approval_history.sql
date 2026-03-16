-- Allow an approver who is currently assigned to act on a claim
-- to read prior approval history entries for that same claim.
-- This keeps the detail page synchronized: prior approvals are visible
-- while pending approver context still points to the next level.

create policy "approver reads pending-routed claim history"
on public.approval_history
for select
using (
  exists (
    select 1
    from public.get_claim_available_actions(public.approval_history.claim_id) as actions
    where actions.actor_scope = 'approver'
  )
);
