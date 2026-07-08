# p0-core-module-id-alignment-characterization-t1 Rework Evidence

Target window: AlembicCore
Task id: p0-core-module-id-alignment-characterization-t1
Dispatch group: p0-core-module-id-alignment-characterization-rework-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03

## Rework Scope

Controller rework accepted the CG-E factual conclusion and asked only for the local AlembicCore main commit required by Design §11/§12. This rework did not change the CG-E conclusion, did not implement P1 rollup, did not touch snapshot tables, did not touch rescan incremental logic, did not revive retired panorama engines, and did not branch, push, tag, or release.

## Commit

Core commit:

```text
804745945c18c4e4aa8c54df3f3147e0f2727bc6 test(project-context): characterize module id alignment
```

Commit stat:

```text
test/ProjectContextProjectMap.test.ts | 49 +++++++++++++++++++++++++++++++++++
1 file changed, 49 insertions(+)
```

Post-commit repository status:

```text
## main...origin/main [ahead 1]
```

Changed file:

- `AlembicCore/test/ProjectContextProjectMap.test.ts`

## Preserved CG-E Conclusion

The committed characterization still proves direct alignment is false:

- ProjectMap module ids: `module:core:feature:src/feature`, `module:core:shared:src/shared`
- coverage ledger module axis ids: `target:feature:src/feature`, `target:shared:src/shared`
- directAligned: `false`

Downstream Panorama should normalize ProjectMap modules into the coverage `target:<name>:<path>` axis before joining. If mapping inputs are unavailable, it should degrade to project-level totals instead of fake per-module distribution.

## Validation

Before commit:

```text
npm run test -- --run test/ProjectContextProjectMap.test.ts test/unit/BuildCoverageLedger.test.ts test/ProjectScopeContracts.test.ts test/ProjectScopeRegistryLoader.test.ts test/ProjectIndexWorkflowPlan.test.ts
Test Files 5 passed (5)
Tests 38 passed (38)

npm run build:check
tsc -p tsconfig.json --noEmit passed

git diff --check
passed
```

After commit:

```text
npm run test -- --run test/ProjectContextProjectMap.test.ts test/unit/BuildCoverageLedger.test.ts test/ProjectScopeContracts.test.ts test/ProjectScopeRegistryLoader.test.ts test/ProjectIndexWorkflowPlan.test.ts
Test Files 5 passed (5)
Tests 38 passed (38)

npm run build:check
tsc -p tsconfig.json --noEmit passed

npm run lint
biome check src/ test/ scripts/ *.ts
Checked 715 files. No fixes applied.

git diff --check HEAD~1 HEAD
passed
```

Alembic Guard:

```text
guard-public-mr9wl28g-2
1 file checked, 0 violations
```

## Residual Risks

- `coverage_ledger.moduleId` and `ProjectMap.modules[].id` remain intentionally not directly aligned; direct raw-id joins will miss.
- AlembicCore is now local `main` ahead of `origin/main` by one commit. Push remains outside this target task and is user/controller gated.
