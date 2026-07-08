# p0-alembic-cge-degrade-contract-t1 Rework Evidence

Target window: Alembic
Task id: p0-alembic-cge-degrade-contract-t1
Dispatch group: p0-alembic-cge-degrade-contract-rework-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03

## Rework Scope

Controller accepted the CG-E degradation direction but found a ProjectScope
boundary defect: members-only filtering allowed modules with missing
`projectRoot` to pass through the declared `memberRoots` boundary.

This rework only hardens that boundary and adds regression coverage. It does not
implement `/panorama`, `/panorama/health`, or `/panorama/gaps`; does not revive
retired panorama engines; does not touch snapshot tables, rescan incremental
chains, Dashboard, Core, or BiliDili; and does not branch, push, tag, or release.

## Commit

```text
ddf196b5a3c2a9edfcb0dabec50fb4f019707d70 fix(project-facts): fail closed panorama member roots
```

Parent commit:

```text
d28f39c8f4064b61e2f29d94baf3745187e60178 test(project-facts): lock panorama recipe count degrade contract
```

Commit stat:

```text
lib/project-facts/PanoramaCgeContract.ts | 15 ++++++++++-----
test/unit/PanoramaCgeContract.test.ts    | 15 ++++++++++++++-
2 files changed, 24 insertions(+), 6 deletions(-)
```

Post-commit repository status:

```text
## main...origin/main [ahead 2]
```

## Changed Files

- `Alembic/lib/project-facts/PanoramaCgeContract.ts`
- `Alembic/test/unit/PanoramaCgeContract.test.ts`

## Fix

`buildPanoramaModuleRecipeCountContract` now passes the normalized scope object
into `isScopedProjectRoot` instead of passing only `memberRoots`.

The boundary behavior is now:

- `mode: project-root`: missing `projectRoot` remains allowed for single-project
  inputs that do not carry per-module roots.
- `mode: members-only`: missing `projectRoot` fails closed and is excluded.
- `mode: members-only`: unknown or non-member roots remain excluded by
  `memberRoots`.

The existing CG-E directAligned=false behavior is unchanged: the contract still
returns `project-total-only`, per-module `recipeCount: null`, and
`recipeCountSource: degraded-project-total`.

## Regression Coverage

`test/unit/PanoramaCgeContract.test.ts` extends the controlRoot/member-roots
case with:

- a BiliDili module rooted outside declared members,
- an `orphan` module with missing `projectRoot`,
- an `unknown` module rooted at `/workspace/UnknownRepo`.

The test now proves only `Alembic` and `AlembicCore` member modules remain in
`moduleRecipeCounts`, and `scopeBoundary.excludedModuleCount` accounts for all
three excluded modules.

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

Alembic Guard:

```text
guard-public-mr9x91p8-2
2 files checked, 0 violations
```

## Residual Risks And Next Step

- Alembic main is local ahead of origin/main by two commits:
  `d28f39c8f4064b61e2f29d94baf3745187e60178` and
  `ddf196b5a3c2a9edfcb0dabec50fb4f019707d70`. Push remains outside this target
  task and user/controller gated.
- This remains a P0 contract seam only. P2 must still wire real
  `/panorama`, `/panorama/health`, and `/panorama/gaps` endpoints and provide
  explicit ProjectScope member roots for controlRoot aggregation.
