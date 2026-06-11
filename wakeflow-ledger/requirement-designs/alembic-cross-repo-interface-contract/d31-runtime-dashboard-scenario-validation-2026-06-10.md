# Runtime Dashboard Scenario Validation Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d31-runtime-dashboard-scenario-validation-2026-06-10`
Sequence Order: 32
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Validate the cleaned interfaces through real runtime and Dashboard scenarios so
the optimization is proven by behavior, not only schema checks.

## Completion Definition

- Runtime scenarios cover daemon health, selected/current project, project
  switch/open-dashboard where safe, project-scope read, jobs/events, search or
  knowledge read, guard read/check, decision-register read/create where safe,
  diagnostics, MCP tool listing, and representative MCP calls.
- Dashboard scenario evidence shows the UI still renders important states after
  adapter cleanup.
- Failures are classified as product defect, environment/runtime blocker,
  missing fixture, missing capability, or out-of-scope new behavior.
- Test window is used only if real UI/runtime observation cannot be safely
  reproduced by controller/product windows.
- No final acceptance occurs until raw evidence is reviewed.

## Work Items

- Prepare a scenario matrix from D20-D30 outputs.
- Run product-window and controller-safe smoke checks.
- Dispatch Test only for real scenario observation that needs it.
- Attach logs, screenshots, runtime JSON, and command outputs where relevant.

## Real Code Evidence Requirements

- Runtime scenarios must include at least one success, partial/degraded,
  unavailable, conflict/failure, and diagnostic branch from the P01-P15 problem
  map.
- MCP validation must include `tools/list` schema inspection and representative
  `callTool` outputs for status, intent/prime/work, Guard, and decision
  surfaces where available.
- Dashboard validation must prove real UI/view-model behavior after adapter
  cleanup, not only TypeScript build success.
- Evidence must include raw command output, runtime JSON/log summaries, and
  screenshots or UI traces when Test or Browser observation is used.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d31-runtime-dashboard-scenario-validation-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d31-runtime-dashboard-scenario-validation-t1` |
| Target summary | Validate optimized interfaces with real runtime, Dashboard, and MCP scenarios. |

## Boundaries

- Do not use Test for defects already visible in product-window validation.
- Do not accept imported target results without raw evidence review.
- Do not broaden into unrelated product features.
