# ADMIN SYSTEM ARCHITECTURE

## 1. Current System Analysis

### 1.1 Runtime Stack

- Frontend and server actions are implemented with Next.js App Router and TypeScript.
- Data layer is Supabase Postgres with RPC-heavy workflow transitions and RLS-protected tables.
- Authentication is Supabase Auth with corporate domain gating in middleware.
- Core workflow execution paths are `submit_approval_action_atomic`, `submit_finance_action_atomic`, `admin_rollback_claim_atomic`, `admin_reassign_employee_approvers_atomic`, and `bulk_finance_actions_atomic`.

### 1.2 Current Module Boundaries

- Claims module handles submission, item calculation, and history read.
- Approvals module handles pending queue and L1/L2 actions.
- Finance module handles payout/reject stage and finance history.
- Admin module currently handles rollback, approver reassignment, and selected lookup maintenance.
- Shared services provide employee lookup, role lookup, config lookup, and rate lookup.

### 1.3 Current Workflow Model

- `expense_claims.status_id` + `current_approval_level` define runtime state.
- Transition definitions live in `claim_status_transitions` with `action_code`, `requires_role_id`, and comment requirements.
- Designation workflow starts are controlled by `designation_approval_flow.required_approval_levels`.
- Approver routing is controlled by `approval_routing` plus per-employee approver columns on `employees`.

### 1.4 Current Configuration Footprint

- DB-driven: status catalog, transitions, routing table, role table, vehicle rates, expense rates, validation rules, system settings, email domains.
- Still hardcoded in code/RPCs: action enums, actor-filter enums, status mapping assumptions, static labels, currency strings, date boundaries, and selected approval-level interpretations.

### 1.5 Current Data Integrity Controls

- Partial unique index enforces one non-superseded claim per employee/date.
- Transactional row-lock logic exists in core transition RPCs.
- Approval and finance actions append history rows.
- RLS is present on core business tables.

## 2. Problems In Current Architecture

### 2.1 Workflow Logic Is Partially Hardcoded

- Claim initialization still maps first level to status via hardcoded map in application code.
- RPC functions still encode role-code and status-code branching logic.
- `get_claim_available_actions` includes manual action label mapping and actor derivation.

### 2.2 Approval Level Semantics Are Inconsistent

- Runtime currently uses level-3 approver slot for level-2 HOD behavior in multiple places.
- `approval_employee_id_level_2` exists but is not the single source of truth for active routing.
- This creates ambiguity for admin operations, filters, and future multi-step expansion.

### 2.3 Admin Control Center Is Incomplete

- Admin can rollback/reassign and toggle/update selected lookup data.
- Admin cannot manage full workflow definitions, transitions, actor rules, validation pipelines, feature flags, or role-permission matrix from UI.
- Admin reassignment currently accepts emails, not strict ID-only selection.

### 2.4 Policy Drift Risks Exist

- RLS policies still reference legacy status codes no longer active in current catalog.
- Date/time and currency formatting behavior is partly hardcoded in UI/utilities.
- Validation rule services and rule-code naming have drift between old and current conventions.

### 2.5 Bulk Operation Atomicity Is Limited

- Bulk finance action loops through claim IDs and processes each individually.
- Partial success is possible; no explicit admin-visible compensation batch exists.

### 2.6 Test Model Is Not Fully Config-Driven

- Workflow test fixtures encode static email-based routing assumptions.
- Concurrency and race conflict coverage is limited relative to financial workflow risk profile.

## 3. Identified Edge Cases

- Approval loop introduced by misconfigured transitions.
- Missing approver for required level at claim submit or at transition time.
- Deleted/deactivated role still referenced by transition/routing rows.
- Invalid transition attempt from stale UI state.
- Claim stuck in pending state due to orphaned actor mapping.
- Concurrent approval actions on same claim from multiple sessions.
- Concurrent finance actions on same claim.
- Approver reassignment during in-flight claim decision window.
- Superseded/resubmitted claim duplicate handling race.
- Partial bulk processing leaving mixed claim outcomes.
- Filter behavior drift when using old status labels/codes.
- Legacy policy references causing read/write visibility mismatch.
- Date boundary mismatch between IST boundaries and DB date columns.
- Invalid reference insertion from admin edits (transition points to inactive status/role).

## 4. Hardcoded Logic Found

- `src/features/claims/actions/index.ts`: `INITIAL_WORKFLOW_STATUS_BY_LEVEL` hardcoded map.
- `src/features/claims/components/claim-submission-form.tsx`: fixed `KM_UI_LIMIT = 150`.
- `src/features/claims/queries/index.ts`: `VISIBLE_CLAIM_STATUS_CODES` dependency for catalogs.
- `src/lib/utils/claim-status.ts`: hardcoded visible statuses and display label overrides.
- `src/features/approvals/validations/index.ts`: hardcoded actor filter enum values.
- `src/features/finance/validations/index.ts`: hardcoded finance action and date-filter enums.
- `src/features/approvals/utils/history-filters.ts`: role/hierarchy defaults and `Rs.` CSV currency prefix.
- `src/features/finance/utils/filters.ts`: hardcoded IST boundary strings and `Rs.` CSV currency prefix.
- `src/features/claims/utils/filters.ts`: hardcoded `Rs.` CSV currency prefix.
- `src/features/claims/components/claim-detail.tsx`: hardcoded next-approver labels and level mapping assumptions.
- `src/lib/utils/date.ts`: datetime display currently 12-hour with AM/PM, while finance standard needs 24-hour display.
- `public.submit_approval_action_atomic`: role-code checks and next-level mapping encoded in PL/pgSQL.
- `public.submit_finance_action_atomic`: action remapping and finance role-code checks encoded in PL/pgSQL.
- `public.admin_rollback_claim_atomic`: rollback target-level mapping encoded with status-code `CASE` logic.
- `public.admin_reassign_employee_approvers_atomic`: email-based approver lookup and hardcoded pending-status list.
- `public.get_claim_available_actions`: actor derivation and label mapping hardcoded in RPC.

## 5. Proposed Config Driven Architecture

### 5.1 Design Principles

- All workflow behavior must be data-driven and versioned.
- All references must be UUID ID-based; no email-based relation writes.
- Admin UI must be the only operational path for policy/workflow changes.
- Every runtime action must be explainable by configuration snapshot + audit events.

### 5.2 Target Runtime Flow

- UI reads config projections from read-model APIs.
- Server actions call a single workflow engine RPC boundary.
- Workflow engine resolves allowed action from active workflow version and actor role assignments.
- Engine writes claim state, history event, and audit event in one transaction.

### 5.3 Config Domains

- Workflow definitions and versions.
- Step definitions and actor-resolution rules.
- Transition rules and guard rules.
- Validation rule packs by location/designation/role.
- Role-permission matrix and feature flags.
- Formatting and locale/system behavior.

## 6. Database Schema Design

### 6.1 Keep And Reuse Existing Tables

- `claim_statuses`, `claim_status_transitions`, `approval_routing`, `designation_approval_flow`, `roles`, `employee_roles`, `validation_rules`, `system_settings`.
- `expense_claims`, `approval_history`, `finance_actions` remain transactional sources.

### 6.2 New Tables (System B+)

- `workflow_definitions`: `id`, `workflow_code`, `name`, `domain`, `is_active`.
- `workflow_versions`: `id`, `workflow_definition_id`, `version_number`, `is_published`, `effective_from`, `effective_to`, `checksum`.
- `workflow_steps`: `id`, `workflow_version_id`, `step_code`, `step_name`, `step_order`, `status_id`, `is_terminal`, `ui_group`.
- `workflow_step_actor_rules`: `id`, `workflow_step_id`, `resolution_type`, `role_id`, `designation_id`, `state_scope_id`, `resolver_config_json`.
- `workflow_transitions_v2`: `id`, `workflow_version_id`, `from_step_id`, `to_step_id`, `action_code`, `requires_comment`, `allow_resubmit_supported`, `is_active`.
- `workflow_transition_guards`: `id`, `transition_id`, `guard_code`, `guard_config_json`, `severity`, `is_active`.
- `workflow_runtime_claims`: `claim_id`, `workflow_version_id`, `current_step_id`, `runtime_version`, `last_transition_at`.
- `workflow_assignment_snapshots`: `id`, `claim_id`, `step_id`, `actor_employee_id`, `resolver_trace_json`, `resolved_at`.
- `feature_flags`: `id`, `flag_code`, `scope_type`, `scope_id`, `is_enabled`, `rollout_json`, `effective_from`, `effective_to`.
- `policy_change_batches`: `id`, `change_type`, `requested_by`, `approved_by`, `status`, `payload_json`, `applied_at`.
- `audit_events`: `id`, `event_type`, `entity_type`, `entity_id`, `actor_employee_id`, `request_id`, `before_json`, `after_json`, `metadata_json`, `created_at`.

### 6.3 Required Constraints And Indexes

- Unique `workflow_definitions.workflow_code`.
- Unique `(workflow_definition_id, version_number)` in `workflow_versions`.
- Unique `(workflow_version_id, step_code)` in `workflow_steps`.
- Unique `(workflow_version_id, from_step_id, action_code)` in transitions to prevent ambiguous actions.
- FK from runtime claim rows to workflow version and step.
- Partial unique one active assignment snapshot per `(claim_id, step_id)`.
- Indexes on `audit_events(entity_type, entity_id, created_at desc)` and `workflow_runtime_claims(current_step_id)`.

## 7. Admin Control Center Design

### 7.1 Modules

- Workflow Studio: create, clone, diff, validate, and publish workflow versions.
- Routing Manager: map designation/state to actor-resolution rules using employee IDs and role IDs.
- Transition Manager: define action codes, target steps, guard sets, and comment policy.
- Validation Rules Manager: maintain JSON rules with schema-validated forms.
- Role Matrix Manager: manage role capabilities and actor scopes.
- Feature Flag Console: environment/scope-level toggles with rollout windows.
- Data Integrity Console: detect orphan references, broken transitions, and stuck claims.
- Audit Explorer: filter by claim, employee, actor, module, request ID, and date range.

### 7.2 UX Rules

- No free-text emails for actor references; all selectors use UUID-backed entities.
- Any publish operation runs preflight validators and shows blocking errors.
- All writes are done through audited, transactional admin RPCs.
- Every config write supports preview and rollback through version history.

## 8. Workflow Engine Design

### 8.1 Execution Contract

- Input: `claim_id`, `action_code`, `actor_employee_id`, `notes`, `request_id`.
- Resolve runtime state from `workflow_runtime_claims` with `FOR UPDATE` lock.
- Resolve actor eligibility from `workflow_step_actor_rules` + `employee_roles` + assignment snapshot.
- Resolve transition by `(workflow_version_id, current_step_id, action_code)`.
- Execute guard evaluators from `workflow_transition_guards`.
- Commit state update + history + audit event atomically.

### 8.2 Conflict Control

- Use optimistic check on `runtime_version` plus row lock for deterministic winner.
- Reject stale action with explicit conflict code and required UI refresh.
- Enforce idempotency on `(claim_id, request_id)` to prevent duplicate transitions.

### 8.3 Bulk Actions

- Add `workflow_bulk_transition_atomic(batch_id, claim_ids, action_code, actor_id, mode)`.
- `mode = all_or_nothing` for strict finance batches.
- `mode = best_effort` for operational batches with per-claim result rows and compensation trail.

## 9. Validation Rules Engine

### 9.1 Rule Structure

- Rule registry keyed by `rule_code` with typed payload schema.
- Rule scopes: global, designation, work location, vehicle type, role, workflow step.
- Rule precedence: specific scope first, global fallback last.

### 9.2 Runtime Validation Pipeline

- Input schema validation (Zod).
- Domain rule evaluation from DB rule set.
- Transition guard evaluation before status movement.
- Persist validation result trace in audit metadata.

### 9.3 Immediate Corrections Needed

- Replace hardcoded future-date and monthly limits with `validation_rules` lookups.
- Remove UI-level hardcoded KM limits and read per vehicle from config.
- Standardize datetime output to `DD/MM/YYYY HH:MM` 24-hour for all timestamps.

## 10. Edge Case Handling Strategy

- Approval loops: detect cycles at publish time via graph walk; block publish.
- Missing approver: block transition with actionable error and auto-create admin alert.
- Deleted/inactive role refs: FK + active-check guard + nightly integrity scanner.
- Invalid transition: deny by transition lookup miss and return supported actions list.
- Stuck claims: watchdog job identifies SLA breaches and suggests reassignment/reopen playbook.
- Concurrent decisions: row locks + runtime version + idempotency keys.
- Invalid references: strict FK + deferred check constraints in publish transaction.
- Partial updates: require single transactional RPC for claim state + history + audit.
- Mid-flight reassignment: store assignment snapshot per step to preserve accountability.

## 11. Data Integrity Protection

- Keep append-only `approval_history` and append-only `audit_events`.
- Prohibit direct status mutation outside workflow engine RPC.
- Require immutable claim-state transitions with before/after IDs stored.
- Add reconciliation jobs for claim state vs latest history and claim state vs runtime step.
- Add consistency checks for `current_approval_level` deprecation path once step-based runtime is active.
- Add automatic repair workflow for orphaned approvals with admin approval requirement.

## 12. Audit Logging System

### 12.1 Event Model

- Event categories: `WORKFLOW_TRANSITION`, `ADMIN_CONFIG_CHANGE`, `ADMIN_OVERRIDE`, `VALIDATION_FAILURE`, `ACCESS_DENIED`, `BULK_OPERATION`.
- Every event stores actor ID, request ID, claim/config entity ID, before/after snapshots, and reason/notes.

### 12.2 Traceability Guarantees

- One request ID links UI action -> server action -> RPC -> DB events.
- Admin overrides always capture reason, target scope, and signed actor identity.
- Audit records are immutable and queryable by finance compliance users.

### 12.3 Reporting

- Provide exportable audit report in DD/MM/YYYY date format.
- Add anomaly queries: repeated overrides, repeated rejects, unusually high reopen counts.

## 13. Future Scalability Design

- Versioned workflows allow safe policy rollout without interrupting in-flight claims.
- Step-based runtime model supports adding new approval stages without code changes.
- Feature-flagged modules allow gradual release of stricter validations and new routing models.
- Read-model materialization can support high-volume analytics without stressing OLTP tables.
- Add partition strategy for `approval_history` and `audit_events` by time window.
- Add event outbox for downstream integrations (BI, alerts, compliance archive).

## Recommended Implementation Phases

1. Stabilize current drift

- Remove hardcoded UI/rule/status assumptions and align RLS policies with active statuses.
- Introduce request IDs and idempotency keys in transition calls.

2. Introduce workflow versioning foundation

- Add workflow definition/version/step tables and runtime claim-step table.
- Build compatibility adapter from existing status model to step model.

3. Launch Admin Control Center v2

- Deliver workflow studio, transition manager, routing manager, and validation manager.
- Enforce publish-time graph and integrity validation.

4. Migrate execution path

- Switch approval/finance/admin actions to unified workflow engine RPC.
- Keep backward-compatible reporting views until cutover complete.

5. Harden and scale

- Add reconciliation jobs, anomaly alerts, partitioning, and BI/event outbox integration.
