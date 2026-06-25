# RG6 Core Vector Availability Interface Controller Review

Date: 2026-06-22 CST
State root: `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21`
Dispatch group: `rg6-core-vector-availability-interface-p1`
Target task: `rg6-core-vector-availability-interface-t1`
Target window: `AlembicCore`

## Decision Basis

RG6 was assigned as the Core producer package for vector availability isolation. The package required an additive Core public surface before Plugin consumers migrate away from direct `getStats().embedProviderAvailable` checks.

Target result:
- `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21/target-results/tr-rg6-core-vector-availability-interface-t1.json`
- Reported commit: `AlembicCore@9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`
- Status: `completed`

Controller raw review:
- `git show --stat --summary --oneline 9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`
  - `scripts/smoke-public-api.mjs`
  - `src/service/vector/VectorService.ts`
  - `src/vector.ts`
  - `test/VectorAvailability.test.ts`
  - 233 insertions, 2 deletions.
- `git diff --check 9eec6303549c3678bc1b0910d5d7fd3b7d3b992f^ 9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`: passed.
- AlembicCore worktree after review: clean, `main...origin/main [ahead 4]`.

Implementation reality:
- `VectorService` now exposes `isAvailable()` and `getAvailability()`.
- `EmbedProvider` supports an optional `isAvailable()` readiness probe.
- `VectorAvailability` includes deterministic `available`, `status`, `reason`, `embedProviderConfigured`, and `probeStatus` fields, plus optional `detail`.
- `getStats().embedProviderAvailable` remains the legacy provider-presence boolean and does not change to probe-readiness semantics.
- `validate()` now uses the structured availability surface for degraded provider reporting.
- `@alembic/core/vector` exports the new availability types.
- `smoke-public-api` checks the new runtime/type public surface.

Controller validation:
- `npm run build:check`: passed.
- `npx vitest run test/VectorAvailability.test.ts test/VectorService.test.ts test/EmbedProviderSelector.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts`: passed, 4 files / 59 tests.
- `npm run lint:public-api-boundary`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `npm run lint`: passed, 635 files checked.
- `npm run smoke:public-api`: passed, 54 exact public API entrypoints imported.
- `npm run test`: passed, 134 files / 1368 tests.

Alembic Guard:
- `alembic_status` for `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` returned degraded/not initialized and noted selected project mismatch with the parent workspace.
- `alembic_code_guard` was attempted on the four changed files and failed with the same internal output schema error class observed by the target window. This is recorded as a tooling/runtime issue, not as code violation evidence.

Downstream Plugin migration notes verified by controller:
- `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/recipe-region-vector.ts` still reads `vectorService.getStats().embedProviderAvailable`.
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts` still derives availability from stats.
- `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts` still derives availability from stats.
- `AlembicPlugin/lib/cli/SetupService.ts` still checks `stats.embedProviderAvailable`.
- `AlembicPlugin/test/unit/VectorService.test.ts` still mirrors legacy stats expectations.

Boundary review:
- RG6 did not edit AlembicPlugin. Current AlembicPlugin dirty files belong to the parallel RG5 in-progress package and are not RG6 evidence.
- RG6 did not implement Plugin consumer migration, RG7 timing repair, RG8 commit-driven evolution, Test/BiliDili, daemon/watch behavior, or evidence/vector deletion.

Controller conclusion:
- The Core producer surface is real, additive, public-API clean, and validated.
- The legacy stats semantics are preserved while the new availability surface can report unavailable/degraded providers.
- The remaining Plugin consumer migration is authorized as the next RG6 consumer package only after this Core producer package is accepted.
