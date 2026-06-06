# AFAPI-FULL-STAGE3B Plugin Runtime Consumer Rework Result

## Scope

- Window: AlembicPlugin
- Task: AFAPI-FULL-STAGE3B-PLUGIN-RUNTIME-CONSUMER-REWORK-P6B
- Dispatch group: AFAPI-FULL-STAGE3B-RUNTIME-CONSUMER-REWORK-20260605
- Repository boundary: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Nested runtime boundary: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/plugins/alembic-codex`
- Not modified: Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, real projects

## Commits

- AlembicPlugin parent: `61e1aa7052c3cbfdb1142503ff2f35807be2908b` (`feat: consume runtime-control diagnostics`)
- Packaged runtime subrepo: `cc6316df849dc9d39530ed44d7e53f7cde2e6233` (`chore: refresh runtime-control consumer bundle`)

## Implementation

- Extended `lib/codex/runtime/ProjectRuntimeContext.ts` source-of-truth parsing to preserve:
  - top-level `diagnostics`
  - `runtimeControl.diagnostics`
  - `runtimeControl.stateCleanup`
  - `runtimeControl.activeProject`, `activeReadyProject`, `selectedProject`, `projects`, and `state`
- Mapped Alembic producer reason codes into compatible Plugin/Core failure envelopes without losing the producer reason:
  - `daemon-missing` -> `daemon-missing`
  - `runtime-control-active-stale` -> `daemon-stale`
  - `runtime-control-selected-mismatch` -> `daemon-stale`
- Kept Plugin identity policy unchanged:
  - `effectiveIdentitySource=codex-current-project`
  - `runtimeControlSource=read-only-diagnostics`
  - `selectedOrActiveCanOverrideEffectiveIdentity=false`
  - `runtime-control-selected-active-effective-identity` remains blocked.

## Evidence

- Source tests:
  - `test/unit/CodexRuntimeContext.test.ts` covers `runtime-control-selected-mismatch`, `daemon-missing`, and `stateCleanup.activeState.cleaned`.
  - `test/unit/CodexStatusService.test.ts` covers status/diagnostics readback of `runtimeControl.diagnostics` and `stateCleanup`.
  - `test/unit/CodexMcpServer.test.ts` covers `alembic_codex_diagnostics` host-visible readback of `runtime-control-active-stale` and `stateCleanup.activeState.cleaned`.
- Final local-dev direct-dist readback:
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage3b-final-local-dev-reload-report.json`
  - marker `gitHead=61e1aa7052c3cbfdb1142503ff2f35807be2908b`
  - `entryMode=local-dev-direct-dist`
  - runtime tarball hash `24dfba0288d23d85bab247c43d24b250b7b934bcddb5dd490ed6eb163eddae84`
  - blocked fallbacks include saved root, runtime-control selected/active, and local JobStore.
- Final packaged wrapper readback:
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage3b-final-packaged-verify-report.json`
  - marker `gitHead=61e1aa7052c3cbfdb1142503ff2f35807be2908b`
  - `entryMode=packaged-wrapper`
  - runtime tarball hash `24dfba0288d23d85bab247c43d24b250b7b934bcddb5dd490ed6eb163eddae84`
  - blocked fallbacks include saved root, runtime-control selected/active, and local JobStore.

## Commands

- `npm test -- --run test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts` - passed, 60 tests
- `npm run build:check` - passed
- `npm run build` - passed
- `npm run prepare:codex-plugin-runtime` - passed
- `npm run lint:repo-boundary` - passed
- `git diff --check && git -C plugins/alembic-codex diff --check` - passed
- `npm run lint -- --diagnostic-level=error` - passed
- `npm run lint:core-import-boundary` - passed
- `node scripts/dev-reload-codex-plugin.mjs --skip-build --skip-prepare --codex-home scratch/afapi-stage3b-final-local-codex-home --sync-target scratch/afapi-stage3b-final-local-installed-cache --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/afapi-stage3b-final-local-dev-reload-report.json --probe-report-path scratch/afapi-stage3b-final-local-dev-probe-report.json --mcp-timeout-ms 90000` - passed
- `node scripts/dev-verify-codex-plugin.mjs --packaged --skip-build --skip-tests --skip-prepare --skip-verify --skip-smoke --codex-home scratch/afapi-stage3b-final-packaged-codex-home --sync-target scratch/afapi-stage3b-final-packaged-installed-cache --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/afapi-stage3b-final-packaged-verify-report.json --mcp-timeout-ms 180000` - passed

## Risks

- Alembic producer-specific reason codes are not part of the current `@alembic/core/daemon` `ProjectRuntimeFailureReason` enum. Plugin preserves the original reason codes under `sourceOfTruth` and maps service readiness to compatible Core reasons instead of widening Core from the Plugin window.
- Fresh installed readbacks run against the local current project with no active Alembic daemon, so the installed-process readback proves entry mode, commit marker, fallback isolation, and daemon-missing degraded path. Runtime-control producer reason/stateCleanup readback is covered by focused runtime/status/MCP tests using Alembic Stage3A source-of-truth fixtures.

## Next Suggestion

- Total control can close the Plugin consumer side of AFAPI-FULL-12/15 if it accepts the split evidence: source-level producer reason/stateCleanup tests plus fresh local-dev/packaged installed readbacks.
- Do not dispatch AlembicCore unless total control wants producer-specific runtime-control reason codes promoted into the shared Core failure-reason enum.
