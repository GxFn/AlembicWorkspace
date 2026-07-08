# p0-alembic-cge-degrade-contract-t1 Evidence

Target window: Alembic
Task id: p0-alembic-cge-degrade-contract-t1
Dispatch group: p0-alembic-cge-degrade-contract-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03

## Scope

Alembic main consumed the accepted Core P0 fact that `coverage_ledger.moduleId`
and raw `ProjectMap.modules[].id` are not directly aligned. This target did not
implement `/panorama`, `/panorama/health`, or `/panorama/gaps`; it only locked a
P2-consumable contract for CG-E degradation and ProjectScope member boundaries.

No branch, push, tag, release, old panorama route revival, retired engine revival,
snapshot table deletion, rescan incremental-chain change, or BiliDili directory
change was performed.

## Commit

```text
d28f39c1e2fe67ee416e742efc4843f983cf76bc test(project-facts): lock panorama recipe count degrade contract
```

Commit stat:

```text
lib/project-facts/PanoramaCgeContract.ts | 206 +++++++++++++++++++++++++++++++
test/unit/PanoramaCgeContract.test.ts    | 161 ++++++++++++++++++++++++
2 files changed, 367 insertions(+)
```

Post-commit repository status:

```text
## main...origin/main [ahead 1]
```

## Changed Files

- `lib/project-facts/PanoramaCgeContract.ts`
- `test/unit/PanoramaCgeContract.test.ts`

## Consumer-Side CG-E Conclusion

The new helper `buildPanoramaModuleRecipeCountContract` is the P2 seam for
Panorama recipe-count decisions. It requires explicit module-id alignment
evidence before per-module coverage values can be emitted.

When Core P0 evidence says `directAligned=false`, the contract returns:

- `mode: project-total-only`
- `reason: direct-module-id-mismatch`
- `projectRecipeCount.totalRecipes` from knowledge entries
- per-module `recipeCount: null`
- per-module `recipeCountSource: degraded-project-total`

This prevents the future Panorama overview from joining raw ProjectMap ids to
coverage ledger ids or distributing project recipe totals by file count.

If a later runtime check or Design/user decision proves direct alignment, the
same helper can emit `per-module-coverage-ledger` using exact direct cell ids.
This keeps the current P0 gate honest without implementing P2 endpoints.

## Scope-Fix Boundary

The contract accepts explicit member roots for a controlRoot scenario. Coverage
cells and module views with `projectRoot` outside those member roots are excluded
and counted in `scopeBoundary.excludedCoverageCellCount` /
`scopeBoundary.excludedModuleCount`.

The new unit test covers a workspace with `Alembic` and `AlembicCore` as members
and `BiliDili` as a non-member. The BiliDili module/cell is excluded and does not
appear in `moduleRecipeCounts`.

## Existing Main Entrypoint Evidence

- ProjectMap/RepoContext consumer seam: `lib/project-facts/ProjectContextConsumerFacts.ts`
  loads `repo` and `map` facts for Alembic main consumers.
- Current module axis normalization: `lib/project-facts/ProjectMapModules.ts`
  builds Alembic main `projectMapModules` with
  `buildCanonicalCoverageLedgerModuleId`.
- Existing moduleMining selection also uses canonical coverage ids in
  `lib/recipe-pipeline/generate/ModuleMiningSelection.ts`; the P0 Panorama
  contract intentionally does not reuse that to synthesize per-module UI counts
  while CG-E is in the false-alignment state.
- Existing Panorama public surface remains absent: `test/unit/PanoramaSurfaceDeletes.test.ts`
  passed after this change.

## Validation

```text
npx biome check lib/project-facts/PanoramaCgeContract.ts test/unit/PanoramaCgeContract.test.ts
Checked 2 files. No fixes applied.

npm run test -- --run test/unit/PanoramaCgeContract.test.ts test/unit/PanoramaSurfaceDeletes.test.ts test/unit/ProjectScopeAnalysis.test.ts test/unit/ModuleMiningSelection.test.ts
Test Files 4 passed (4)
Tests 12 passed (12)

npm run build:check
build:core using local AlembicCore source passed
tsc --noEmit passed

npm run lint:retired-symbols
no retired symbols found

npm run lint:repo-boundary
Repository boundary check passed

git diff --check
passed

git diff --check HEAD~1 HEAD
passed
```

Additional validation:

```text
npm run lint
exited 0; reported 5 pre-existing warnings in unrelated files:
lib/recipe-pipeline/generate/execution/AgentRunProjections.ts
lib/types/handler-runtime.ts

Alembic Guard
guard-public-mr9wy8rd-1
2 files checked, 0 violations
```

## Residual Risks And Next Step

- Alembic main is local `main` ahead of `origin/main` by one commit. Push remains
  outside this target task and user/controller gated.
- The helper is a P0 contract seam only. P2 still must wire real
  `/panorama`, `/panorama/health`, and `/panorama/gaps` endpoints to ProjectMap,
  RepoContext, Core coverage rollups, DimensionRegistry, and knowledge entries.
- Scope member roots must be supplied by the future P2 space-view aggregator;
  this P0 task proves the contract rejects non-member roots when provided.
