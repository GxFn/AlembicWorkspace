# AFAPI-FULL-STAGE3A-ALEMBIC-RUNTIME-CONTROL-P6A Report

## Scope

- Window: Alembic
- Repository: `<workspace>/Alembic`
- Task: AFAPI-FULL-12 / AFAPI-FULL-15 Alembic runtime-control producer side
- Boundaries: Alembic-only changes; no Core / Agent / Dashboard / Plugin / Test repository edits

## Implementation

- Added ProjectRuntimeControl diagnostics for:
  - `selected-active-mismatch`
  - `active-runtime-state-stale`
  - `daemon-state-missing`
  - `selected-project-missing`
- Added Alembic-owned stale active state cleanup:
  - Missing / stopped / stale / failed active daemon state is cleared from runtime-control persistence.
  - Ready selected/active mismatch is reported but not cleared, so explicit stop/switch can still see the real daemon.
- Extended `ProjectRuntimeSourceOfTruth` with additive producer contract fields:
  - top-level `diagnostics`
  - `failure.diagnostics`
  - `runtimeControl.diagnostics`
  - `runtimeControl.stateCleanup`
  - reason codes `daemon-missing`, `runtime-control-active-stale`, `runtime-control-selected-mismatch`
- Extended `alembic projects current --json` with `diagnostics`, `sourceOfTruth`, and `stateCleanup`.
- Extended `scripts/smoke-multi-project-control.mjs` evidence with ready source-of-truth and stopped failure-envelope checks.

## Producer Contract For Plugin Consumption

- Plugin should continue treating runtime-control as read-only diagnostics.
- Plugin must not use selected/active fallback as effective identity.
- Plugin can consume:
  - `projectRuntimeSourceOfTruth.readiness`
  - `projectRuntimeSourceOfTruth.failure`
  - `projectRuntimeSourceOfTruth.runtimeControl.diagnostics`
  - `projectRuntimeSourceOfTruth.runtimeControl.stateCleanup.activeState`
- `runtime-control-selected-mismatch` is non-retryable until an explicit switch/start/select correction happens.
- `daemon-missing` and `runtime-control-active-stale` require explicit runtime action after Alembic reports/cleans stale state.

## Verification

- `npx tsc --noEmit --pretty false` - passed
- `npx vitest run --config vitest.unit.config.ts test/unit/ProjectRuntimeControl.test.ts test/unit/ProjectsRoute.test.ts test/unit/DaemonHealthRoute.test.ts test/unit/DaemonCapabilities.test.ts` - passed, 20 tests
- `npx biome check bin/cli.ts lib/daemon/ProjectRuntimeControl.ts lib/daemon/ProjectRuntimeSourceOfTruth.ts scripts/smoke-multi-project-control.mjs test/unit/ProjectRuntimeControl.test.ts test/unit/ProjectsRoute.test.ts test/unit/DaemonHealthRoute.test.ts test/unit/DaemonCapabilities.test.ts` - passed
- `npm run build:check` - passed
- `npm run lint` - passed with pre-existing warnings outside this task
- `git diff --check` - passed
- `npm run build` - passed
- `npm run smoke:multi-project-control` - passed
- `npm run lint:repo-boundary` - passed

## Notes

- `npm run lint` still reports pre-existing warnings in `lib/daemon/JobDisplaySnapshotStore.ts` and `lib/workflows/ai-execution/AgentRunProjections.ts`; those files were not part of this task.
- The current control plan status text lagged behind this dispatch, but local dispatch packet and delivery envelope were valid for this Alembic task.
