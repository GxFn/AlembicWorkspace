# P2 Alembic Panorama Endpoints Space View Evidence

Task: `p2-alembic-panorama-endpoints-space-view-t1`

Status: completed

Commit:

- Alembic `9ccca4b212cacf022a8d46fc13f92f666cd4376e` (`feat(panorama): restore scoped endpoint views`)

Changed files:

- `lib/project-facts/PanoramaEndpointView.ts`
- `lib/http/routes/panorama.ts`
- `lib/http/HttpServer.ts`
- `lib/http/provider-contracts.ts`
- `lib/generated/dashboard-api-types.ts`
- `test/unit/PanoramaEndpointView.test.ts`
- `test/unit/PanoramaRoute.test.ts`
- `test/unit/PanoramaSurfaceDeletes.test.ts`

Implementation summary:

- Restored HTTP `GET /api/v1/panorama`, `GET /api/v1/panorama/health`, and `GET /api/v1/panorama/gaps`.
- Added a pure panorama endpoint projection helper that:
  - filters ProjectScope space views to configured member folders;
  - excludes non-member folders such as BiliDili from module and coverage views;
  - consumes `buildCoverageLedgerPanoramaRollup` from `@alembic/core/host-agent-workflows`;
  - preserves old overview/health/gaps response fields with additive explainability fields;
  - uses real per-module `recipeCount` only when ProjectMap modules and coverage ledger cells share normalized target-scoped module ids;
  - degrades to project-level `totalRecipes` with `recipeCount: null` when direct module id alignment is false.
- Wired the provider manifest and regenerated `lib/generated/dashboard-api-types.ts`.
- Updated the prior delete-surface test so HTTP endpoints are allowed while MCP `alembic_panorama`, legacy engines, and legacy direct tests remain retired.

Validation:

- `npm run test -- --run test/unit/PanoramaEndpointView.test.ts test/unit/PanoramaRoute.test.ts test/unit/PanoramaSurfaceDeletes.test.ts test/unit/PanoramaCgeContract.test.ts test/unit/AlembicProviderContracts.test.ts test/unit/DashboardApiTypesDrift.test.ts test/unit/ProjectScopeAnalysis.test.ts test/unit/ProjectContextWorkflowFacts.test.ts`
  - passed: 8 files, 42 tests.
- `npm run build:check`
  - passed.
- `npm run lint:retired-symbols`
  - passed: no retired symbols found.
- `npm run lint:repo-boundary`
  - passed: repository boundary check passed.
- `npm run lint:consumer-core-imports`
  - passed: Core import boundary OK, scanned 376 files and 468 `@alembic/core` imports.
- `git diff --check`
  - passed.
- Alembic Guard:
  - `guardResultRef=guard-public-mr9yzatn-3`
  - checked 8 explicit files.
  - result had no errors and one warning in pre-existing `HttpServer.start` length (`ast_method_too_long`, line 366). The `HttpServer.ts` diff for this task only adds the panorama import and mount, so the warning is recorded as an unrelated residual and was not refactored under this P2 scope.

Boundary notes:

- No AlembicDashboard UI change.
- No BiliDili change.
- No old `DimensionAnalyzer`, `PanoramaService`, `PanoramaAggregator`, or MCP `alembic_panorama` revival.
- No snapshot table deletion, rescan-chain change, branch, push, tag, or release.

Residual risks / next steps:

- Guard still reports the pre-existing `HttpServer.start` method length warning if `HttpServer.ts` is in the explicit Guard file list. This was left untouched because fixing it would be unrelated refactor scope.
- P4 real Dashboard/UI acceptance remains outside this target package.
