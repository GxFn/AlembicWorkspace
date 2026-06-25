# RG6 AlembicPlugin Controller Review

- stateRoot: `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21`
- dispatchGroup: `rg6-plugin-vector-availability-consumer-migration-p1`
- targetTask: `rg6-plugin-vector-availability-consumer-migration-t1`
- targetResult: `target-results/tr-rg6-plugin-vector-availability-consumer-migration-t1.json`
- reviewedCommit: `AlembicPlugin@a68b17f6e3b2cdd17e5d31b38df9c0516d2c1e06`
- upstreamCoreAvailabilityCommit: `AlembicCore@9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`
- controllerDecision: `accept-ready`

## Raw Evidence Reviewed

`git show --stat --summary --oneline a68b17f6e3b2cdd17e5d31b38df9c0516d2c1e06` reports 9 files changed, 622 insertions, 35 deletions.

Changed files reviewed:

- `lib/runtime/mcp/host-agent-workflows/recipe-region-vector.ts`
- `lib/cli/SetupService.ts`
- `lib/service/resident/AlembicResidentServiceClient.ts`
- `lib/runtime/mcp/handlers/search.ts`
- `test/unit/RecipeRegionVectorAvailability.test.ts`
- `test/unit/SetupServiceVectorAvailability.test.ts`
- `test/unit/AlembicResidentServiceClient.test.ts`
- `test/unit/SearchHandlerResidentSearch.test.ts`
- `test/unit/VectorService.test.ts`

Implementation findings:

- `recipe-region-vector.ts` now gates region vector sync with `vectorService.getAvailability()` and returns structured `vectorAvailability` in synced, skipped, and failed reports. It no longer decides readiness from `getStats().embedProviderAvailable`.
- `SetupService.stepVectorIndex()` still reads stats for count/index compatibility, but the build/skip decision now uses `vectorService.getAvailability()` and surfaces compact availability details in done/skipped outputs.
- `AlembicResidentServiceClient` consumes structured resident `availability` telemetry and downgrades `semanticUsed` / `vectorUsed` when availability is false, even if legacy vector metadata still says available.
- `search.ts` exposes structured resident vector availability in public output and uses the availability signal for degraded/unavailable reasoning instead of stats provider presence.
- Repository scan shows `embedProviderAvailable` remains in production only as a compact legacy stats output field in `search.ts`; it is not a readiness gate. Other matches are targeted tests or Core legacy stats tests.
- Tests include direct conflict cases: Core availability true while legacy stats say provider unavailable must proceed; Core availability degraded while legacy stats say provider available must skip/downgrade.

## Controller Validation

All commands ran in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`.

- `npm run test:unit -- test/unit/RecipeRegionVectorAvailability.test.ts test/unit/SetupServiceVectorAvailability.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/VectorService.test.ts`: PASS, 5 files / 89 tests.
- `npm run build:check`: PASS. Core build used `../AlembicCore @ 9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`.
- `git diff --check`: PASS.
- `npm run lint`: PASS with existing warnings only, exit code 0.
- `npm run lint:core-import-boundary`: PASS, scanned 393 files and 413 `@alembic/core` imports.
- `npm run lint:repo-boundary`: PASS.
- `npm run lint:layer-boundary`: PASS.
- `npm run verify:release-package-boundary`: PASS.
- `alembic_status`: ready/knowledge usable for AlembicPlugin, with selected-project mismatch noted below.
- `alembic_code_guard` over 9 changed files: PASS, guard result `guard-public-mqo6jayf-1`, 0 violations.
- `git status --short --branch`: AlembicPlugin clean, `main...origin/main [ahead 6]`.
- `git -C ../AlembicCore status --short --branch`: AlembicCore clean, `main...origin/main [ahead 4]`.

## Risks / Non-Blocking Notes

- Full repository unit suite was not rerun for this review. The RG6 target covered the changed vector consumer surfaces with 89 focused tests plus build/lint/boundary/Guard; this is sufficient for this narrow consumer migration.
- Alembic status still reports the selected Alembic project as the parent workspace rather than AlembicPlugin. Explicit projectRoot status and Guard completed against AlembicPlugin, so this is a tooling-state note, not a blocker.

## Acceptance Conclusion

RG6 Plugin consumer migration satisfies the task package and the requirement design slice: Plugin consumers now use the accepted Core vector availability surface, legacy stats are preserved only as compatibility telemetry, public/search/resident/setup outputs expose structured availability and degraded reasons, and validation is green. Accept this target result and proceed to the next eligible RG phase.
