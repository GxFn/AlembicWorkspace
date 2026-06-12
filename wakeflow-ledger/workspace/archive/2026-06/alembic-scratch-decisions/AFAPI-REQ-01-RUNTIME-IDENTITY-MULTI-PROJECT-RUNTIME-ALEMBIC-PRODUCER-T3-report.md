# AFAPI REQ-01 Alembic Producer Evidence

Task: AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-ALEMBIC-PRODUCER-T3
Window: Alembic
Repository: <workspace>/Alembic
Commit: b84af4375ae6ba7dc911a846162da89ec8c99d50
Status: completed

## Verdict

Alembic producer-side runtime identity is implemented and verified for the REQ-01 boundary. No product code change was needed in this turn: the current repository already publishes Alembic-owned source-of-truth envelopes for both runtime-control reads and daemon-health reads, keeps projects/current read-only for diagnostics, explicitly blocks Plugin selected-root fallback and implicit runtime-control writes on failure, clears stale active runtime state when daemon state is missing, and reports selected/active mismatch without silently clearing a ready daemon.

## Code Evidence

- `lib/daemon/ProjectRuntimeControl.ts:184` builds snapshots from runtime-control state, registered projects and prepared cleanup diagnostics, then attaches `sourceOfTruth`.
- `lib/daemon/ProjectRuntimeControl.ts:613` keeps Alembic as runtime-control persistence owner; stale/missing active state is cleaned, while ready selected/active mismatch is diagnostics-only.
- `lib/daemon/ProjectRuntimeControl.ts:494` builds project summaries from registry/project-scope facts, daemon status, jobs, file monitor and api AI.
- `lib/daemon/ProjectRuntimeSourceOfTruth.ts:12` defines contract version 1 and the Alembic-owned source-of-truth shape.
- `lib/daemon/ProjectRuntimeSourceOfTruth.ts:227` and `lib/daemon/ProjectRuntimeSourceOfTruth.ts:236` make source-of-truth reads explicitly diagnostics-read/read-only and deny active state, daemon lifecycle, JobStore, ProjectScopeRegistry and selected-state writes.
- `lib/daemon/ProjectRuntimeSourceOfTruth.ts:286` builds the `project-runtime-control` source-of-truth envelope for `/projects/current`.
- `lib/daemon/ProjectRuntimeSourceOfTruth.ts:247` builds the `daemon-health` source-of-truth envelope for resident daemon reads.
- `lib/daemon/ProjectRuntimeSourceOfTruth.ts:468` creates failure envelopes that block `plugin-selected-root-fallback` and `implicit-runtime-control-write`, with observed source `alembic-source-of-truth`.
- `lib/http/routes/projects.ts:25` exposes `/api/v1/projects/current` as `{ activeRuntimeProject, selectedProject, sourceOfTruth, state }`.
- `lib/http/routes/projects.ts:39` onward keeps runtime mutations behind explicit select/start/stop/switch/open-dashboard actions.

## Test Evidence

- `test/unit/ProjectRuntimeControl.test.ts:326` verifies runtime-control source-of-truth is read-only diagnostics and does not mutate selected-only state.
- `test/unit/ProjectRuntimeControl.test.ts:387` verifies selected/active mismatch reports `runtime-control-selected-mismatch`, returns stale readiness, and does not clear a ready daemon active state.
- `test/unit/ProjectRuntimeControl.test.ts:461` verifies missing persisted daemon state clears stale active state while preserving selected state and emits `daemon-missing`.
- `test/unit/ProjectsRoute.test.ts:29` verifies `GET /api/v1/projects/current` exposes read-only source-of-truth without mutating runtime-control state.
- `test/unit/DaemonHealthRoute.test.ts:105` verifies `/api/v1/daemon/health` publishes canonical resident service identity and read-only `projectRuntimeSourceOfTruth`.

## Verification Commands

- `npm run test:unit -- test/unit/ProjectRuntimeControl.test.ts test/unit/ProjectsRoute.test.ts test/unit/DaemonHealthRoute.test.ts test/unit/ProjectScopeRegistry.test.ts test/unit/DaemonSupervisor.test.ts`
  - Result: passed, 5 files, 23 tests.
- `npm run build:check`
  - Result: passed.
- `npm run build`
  - Result: passed.
- `npm run smoke:multi-project-control`
  - Result: passed with `success: true`.
- `npm run lint:repo-boundary`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `git status --short`
  - Result before report: clean.

## Smoke Summary

`npm run smoke:multi-project-control` used an isolated ALEMBIC_HOME with two ghost projects.

- Project A start: current selected and active project A, source-of-truth `ready`, no state cleanup.
- Project list from A/B: both projects visible, selected project follows active runtime.
- Same-project open-dashboard: reused dashboard URL.
- Invalid switch: returned 404 and kept active project A.
- Switch A -> B: target B became ready, dashboard origin changed, project A stop was deferred and old API became unreachable after response.
- Stop B: active runtime became null, selected project B remained, self API stopped after response.
- Post-stop current/failure path: source-of-truth failure reason `daemon-not-running`; blocked fallbacks were `plugin-selected-root-fallback` and `implicit-runtime-control-write`; active state cleanup remained false.
- Cleanup: both smoke daemons stopped and smoke root removed.

## Producer Gaps

No Alembic producer implementation gap was found for this task boundary.

Remaining cross-window validation is outside Alembic T3: Plugin must consume these envelopes in its own assigned task, and any live multi-host/session UI observation belongs to the relevant Plugin/Test/controller task if assigned.
