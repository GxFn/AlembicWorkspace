# p0-core-module-id-alignment-characterization-t1 Evidence

Target window: AlembicCore
Task id: p0-core-module-id-alignment-characterization-t1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03
Core HEAD: 06495a224481230ccab61d82eb57900f885fc2e2
Changed files: AlembicCore/test/ProjectContextProjectMap.test.ts
Commit: none created; this direct-thread packet requested characterization evidence and forbade branch/push.

## Conclusion

`coverage_ledger.moduleId` and `ProjectMap.modules[].id` are not directly aligned on a non-empty ProjectMap.

ProjectMap emits:

```json
[
  "module:core:feature:src/feature",
  "module:core:shared:src/shared"
]
```

Coverage ledger module axis emits:

```json
[
  "target:feature:src/feature",
  "target:shared:src/shared"
]
```

Direct alignment is `false`. The safe downstream route is to normalize ProjectMap modules into the coverage axis through module name, module path, and owned files before joining. If those fields are unavailable, Panorama should degrade per-module recipe counts to project-level `totalRecipes` instead of distributing fake values.

## Raw Fixture Output

Temporary command:

```bash
npx tsx
```

Output:

```json
{
  "fixture": "non-empty-two-module-project",
  "projectMapModuleIds": [
    "module:core:feature:src/feature",
    "module:core:shared:src/shared"
  ],
  "coverageLedgerModuleIds": [
    "target:feature:src/feature",
    "target:shared:src/shared"
  ],
  "directAligned": false,
  "mappedCoverageAxis": [
    {
      "moduleId": "target:feature:src/feature",
      "moduleName": "feature",
      "ownedPaths": [
        "src/feature/api/index.ts",
        "src/feature/domain/model.ts",
        "src/feature/service/run.ts"
      ]
    },
    {
      "moduleId": "target:shared:src/shared",
      "moduleName": "shared",
      "ownedPaths": [
        "src/shared/format.ts"
      ]
    }
  ]
}
```

## Changed Test Evidence

- `AlembicCore/test/ProjectContextProjectMap.test.ts:77-113` adds a non-empty fixture characterization test.
- `AlembicCore/test/ProjectContextProjectMap.test.ts:99-107` asserts ProjectMap ids and coverage ledger ids are different.
- `AlembicCore/test/ProjectContextProjectMap.test.ts:108-111` asserts mapped coverage axis owned paths remain available for downstream joining.

## Code Path Evidence

- `AlembicCore/src/service/project-context/shared/moduleLayers-module/contracts.ts:181-200` creates ProjectMap module seed ids and refs.
- `AlembicCore/src/service/project-context/shared/moduleLayers-module/contracts.ts:203-227` stores moduleName, modulePath, and ownedFiles in module ref metadata.
- `AlembicCore/src/service/project-context/shared/moduleLayers-module/contracts.ts:257-265` formats ProjectMap module ids as `module:<repo>:<moduleName>:<modulePath>`.
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerBuilder.ts:82-107` canonicalizes non-target ids with moduleName and modulePath into `target:<moduleName>:<modulePath>`.
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerBuilder.ts:123-178` builds coverage ledger module axes from summaries and preserves owned paths.
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerWrite.ts:62-100` writes computed cell.moduleId directly.
- `AlembicCore/src/workflows/surfaces/coverage/CoverageLedgerWrite.ts:107-123` writes deferred.moduleId directly.
- `AlembicCore/src/repository/coverage/CoverageLedgerRepository.ts:123-166` persists input.moduleId without ProjectMap-id normalization.

## Scope Boundary Evidence

- `AlembicCore/test/ProjectScopeContracts.test.ts:49-53` keeps controlRoot `includedInFolders=false`.
- `AlembicCore/test/ProjectScopeContracts.test.ts:71-82` summarizes controlRoot outside member folders.
- `AlembicCore/test/ProjectScopeContracts.test.ts:158-166` rejects controlRoot as a source folder.
- `AlembicCore/test/ProjectScopeRegistryLoader.test.ts:151-155` proves `loadProjectScopeForFolder(controlRoot)` returns null.
- `AlembicCore/test/ProjectIndexWorkflowPlan.test.ts:223-249` keeps no-native-scope full-mode scan parameters and `sourceFolders` behavior unchanged.

## Verification

- `npm run test -- --run test/ProjectContextProjectMap.test.ts test/unit/BuildCoverageLedger.test.ts test/ProjectScopeContracts.test.ts test/ProjectScopeRegistryLoader.test.ts test/ProjectIndexWorkflowPlan.test.ts`: 5 files passed, 38 tests passed.
- `npm run build:check`: passed.
- `npm run lint`: passed after formatting the changed test file.
- `git diff --check`: passed.
- `npm run check`: passed; 166 Vitest files passed, 1573 tests passed, 2 skipped, plus public API, layer, import, scope-resolution, smoke, output-budget, space-edge, doctrine, naming, Biome, and retired-symbol checks.
- Alembic Guard: `guard-public-mr9wcjm5-1`, zero violations.

## Risks And Next

- CG-E risk: direct raw-id joins between `coverage_ledger.moduleId` and `ProjectMap.modules[].id` will miss.
- Affected downstream fields: Panorama module-level `recipeCount` and module coverage summaries.
- Recommended next implementation rule: map ProjectMap module summaries through `buildCoverageLedgerModuleAxisFromSummaries` or equivalent normalization before joining coverage rows; degrade to project-level totals when mapping inputs are missing.
- P1 rollup, freeze literal changes, snapshot deletion, incremental rescan changes, and retired panorama code revival were not performed.
