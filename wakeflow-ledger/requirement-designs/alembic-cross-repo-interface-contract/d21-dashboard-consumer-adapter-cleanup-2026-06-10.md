# Dashboard Consumer Adapter Cleanup Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d21-dashboard-consumer-adapter-cleanup-2026-06-10`
Sequence Order: 22
Maintainer: AlembicWorkspace
Primary Window: AlembicDashboard
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Refactor Dashboard API adapters so they consume the new provider contracts
cleanly, keep only necessary scenario-driven compatibility, and stop guessing
from broad raw payloads where D20 supplies typed shapes.

## Completion Definition

- Dashboard adapter functions are grouped by provider surface: runtime/project,
  project-scope, jobs/events, knowledge/search, guard, decision register,
  diagnostics, AI/host-managed unavailable, and artifacts.
- Each remaining fallback has a named current consumer, provider branch,
  cleanup trigger, and test/fixture evidence.
- Obsolete aliases and broad `firstString`/`firstRecord` guessing are removed
  where D20 fixtures prove no current need.
- Dynamic SSE/tool payloads remain dynamic only at the event boundary and are
  projected into typed view models before UI use.
- Runtime status, project switching, job events, search/knowledge, guard,
  decision register, diagnostics, and host-managed unavailable UI states still
  render correctly.

## Work Items

- Split the large API client into coherent adapter modules if that reduces
  real coupling without breaking imports.
- Replace raw provider data extraction with typed provider result readers.
- Add fixture replay tests for accepted provider samples.
- Preserve UI behavior for partial/degraded/unavailable states.

## Real Code Evidence Requirements

- Anchor to `AlembicDashboard/src/api.ts`,
  `AlembicDashboard/src/types.ts`, and existing Dashboard contract tests.
- Reconcile the file header claim of "no field mapping" with the real mapper
  functions; either update the contract wording or move adapters into explicit
  provider-surface modules.
- Classify `firstString`, `firstRecord`, `providerDataRecord`, runtime alias
  fallbacks, host-managed unavailable parsing, and `extraFields` as necessary
  adapter, diagnostic extension, compatibility shim, or deletion candidate.
- Keep SSE event payloads dynamic only at ingestion; require typed projection
  before UI components consume them.
- Fixture replay must prove runtime status, project switching, jobs/events,
  knowledge/search, guard, decision register, diagnostics, and host-managed
  unavailable states still render.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d21-dashboard-consumer-adapter-cleanup-p1` |
| Target window | `AlembicDashboard` |
| Target task | `alembic-interface-contract-d21-dashboard-consumer-adapter-cleanup-t1` |
| Target summary | Refactor Dashboard adapters against normalized provider fixtures while preserving UI scenarios. |

## Boundaries

- Do not remove UI state handling only because provider output is cleaner.
- Do not replace real Dashboard workflows with static mocks.
- Do not treat all `Record<string, unknown>` usage as wrong; classify dynamic
  events and metadata first.
