# P4 Alembic Panorama Endpoint Timeout Repair Evidence

Status: completed
Target window: Alembic
Task: p4-alembic-panorama-endpoint-timeout-repair-t1
Task package: p4-alembic-panorama-endpoint-timeout-repair-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03

## Commit

- Alembic main: `0f11298e77e44523a37e1b767ffa315bbe86ffe5` (`fix(panorama): bound endpoint facts build`)

## Changed Files

- `lib/http/routes/panorama.ts`
- `lib/project-facts/PanoramaEndpointFacts.ts`
- `test/unit/PanoramaRoute.test.ts`
- `test/unit/PanoramaEndpointFacts.test.ts`

## Implementation Summary

- Replaced the per-request Panorama route call to full `buildProjectContextWorkflowFacts` with a dedicated lightweight `buildPanoramaEndpointFacts` path.
- The lightweight path scans only the active ProjectScope member folders, excludes runtime/ledger/vendor-heavy folders, and applies a hard 800-file budget split across members.
- Added a 15s route-level view cache plus in-flight coalescing so `/panorama`, `/panorama/health`, and `/panorama/gaps` share one bounded build when Dashboard requests them together.
- Kept P2 response contracts through `buildPanoramaEndpointView`; coverage ledger, total recipe count, ProjectScope filtering, and CG-E `recipeCount: null` degradation remain in the existing contract path.
- Did not touch Dashboard, AlembicCore, BiliDili, snapshot tables, rescan incremental logic, retired Panorama engines, push/tag/release, or branches.

## Validation

- `npm run test -- --run test/unit/PanoramaEndpointFacts.test.ts test/unit/PanoramaRoute.test.ts test/unit/PanoramaEndpointView.test.ts test/unit/PanoramaSurfaceDeletes.test.ts test/unit/PanoramaCgeContract.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/unit/ProjectScopeAnalysis.test.ts test/unit/ProjectContextWorkflowFacts.test.ts`
  - passed: 9 files, 46 tests.
- `npm run build:check`
  - passed.
- `npm run build:self`
  - passed.
- `npm run lint:retired-symbols`
  - passed: no retired symbols found.
- `npm run lint:repo-boundary`
  - passed: repository boundary check passed.
- `npm run lint:consumer-core-imports`
  - passed: Core import boundary OK, scanned 378 files and 469 `@alembic/core` imports.
- `npx biome check lib/http/routes/panorama.ts lib/project-facts/PanoramaEndpointFacts.ts test/unit/PanoramaRoute.test.ts test/unit/PanoramaEndpointFacts.test.ts`
  - passed.
- `git diff --check` and `git diff --check HEAD~1 HEAD`
  - passed.
- Alembic Guard:
  - `guardResultRef=guard-public-mra1nqd8-1`
  - checked 4 explicit files.
  - passed with 0 violations.

## Real-Scale Smoke

Read-only Node smoke against the real AlembicWorkspace ProjectScope members:

- Members: Alembic, AlembicCore, AlembicPlugin, AlembicDashboard, AlembicAgent.
- Budget: `maxFiles=800`.
- Result: `elapsedMs=48`, `fileCount=750`, `moduleCount=5`.
- Returned modules: Alembic, AlembicCore, AlembicPlugin, AlembicDashboard, AlembicAgent.

This proves the repaired endpoint facts path is bounded on the real workspace scale without starting the daemon or running P4 Test rerun.

## Residual Risks / Next

- This target did not rerun the real Dashboard P4 gate; controller should redispatch Test for endpoint/UI contrast and rescan evidence.
- The lightweight facts path intentionally provides member-folder modules and zero dependency cycles/coupling when ProjectContext is not invoked. Coverage health/gaps and recipe counts still come from coverage_ledger and knowledge repositories; no per-module recipeCount is fabricated when ids do not align.
- Alembic main is ahead of origin/main by local commits; push remains user-gated.
