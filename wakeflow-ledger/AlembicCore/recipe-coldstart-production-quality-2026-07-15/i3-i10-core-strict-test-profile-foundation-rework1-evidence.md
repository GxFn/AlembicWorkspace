# I3-I10 Core strict-test evidence validator rework

- Task: `i3-i10-core-strict-test-profile-foundation-rework1-t1`
- Dispatch group: `i3-i10-core-strict-test-profile-foundation-rework1-p1`
- Reworked commit: `933920fa214c1ba04787244f073145bcc48e929c`
- Reworked tree: `4c8c93eb9858d2ed1a6c863b612624721e1a5030`
- Rework base: `8383808cce71e80c717b6121235597c24229f10e`
- Alembic Guard: `guard-public-ms73qaqt-4` — 2 files checked, 0 violations

## Scope

Only these AlembicCore files changed:

- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts`
- `AlembicCore/test/StrictTestDimensionProfile.test.ts`

No host orchestration, filesystem, HTTP, Dashboard, Agent, Plugin, cleanup/reset, public CAS,
package export list, strict-production compiler, legacy testMode, or production persistence contract
was changed.

## Controller findings and repairs

1. **Projection omitted 25 dimension states.**
   `assertProjectionShape` now requires exactly 26 unique dimension ids, exactly one selected row
   whose id and cells/count match the top-level projection, and 25 zero-cell
   `not-executed-by-strict-test-profile` rows. The contextual validator reconstructs all dimension
   states from the validated preflight and confirmation.
2. **Projection changed immutable full-universe lineage.**
   `assertProjectionLineage` now reconstructs the complete projection semantic object from the
   supplied preflight and confirmation, then compares the whole canonical object. This conserves
   demand/run, binding, selection, catalog/source, eligible/excluded universe, applicability,
   fact-query catalog, schedule, certified facts, and source inventory/revision fields.
3. **Confirmation moved to another demand/run.**
   The public confirmation validator now requires a preflight authority context and conserves every
   preflight-derived field present in the confirmation, including demand/run, binding, full cell
   universe, selected cells, strict config, provider/model, runtime artifact, and private workspace
   policy. It also validates confirmation time against the preflight validity interval.
4. **Private completion replaced serving facts/source and used an empty snapshot.**
   The public terminal validator now requires preflight, confirmation, and projection contexts,
   conserves all terminal lineage, replays selected-cell final-coverage invariants, and invokes the
   existing `createServingSnapshotManifestV1` constructor to enforce exact fields and
   snapshot-to-candidate-manifest identity. Facts/source bindings must exactly match the preflight.
5. **Audit minted a report from forged nested terminal evidence.**
   `createStrictTestAuditReportV1` now invokes the contextual terminal validator with the same
   preflight, confirmation, and projection before constructing a report.

## RED to GREEN evidence

Baseline after adding the five controller probes, before the source fix:

```text
npm test -- --run test/StrictTestDimensionProfile.test.ts
Test Files  1 failed (1)
Tests       5 failed | 7 passed (12)
```

Each failure said the validator accepted the forged object and did not throw.

After the repair:

```text
npm test -- --run test/StrictTestDimensionProfile.test.ts
Test Files  1 passed (1)
Tests       12 passed (12)
```

Independent named tamper-probe command:

```text
npx vitest run test/StrictTestDimensionProfile.test.ts -t \
  'rejects a rehashed projection|rejects a rehashed confirmation|rejects a rehashed terminal|refuses to mint an audit report' \
  --reporter=verbose
```

Result: all five named probes passed; 5 passed and 7 skipped. The terminal probe additionally proves
that facts/source replacement is rejected even when the forged snapshot id remains structurally
valid.

## Focused and full validation

Focused compatibility suite:

```text
npx vitest run test/StrictTestDimensionProfile.test.ts \
  test/ColdStartProductionPlanCompiler.test.ts \
  test/ProductionPersistenceContracts.test.ts \
  test/CorePackage.test.ts \
  test/PublicApiInventory.test.ts --reporter=dot
```

Result: 5 files passed; 59 tests passed.

Final full suite:

```text
npm run test
```

Result: 195 files passed, 1 skipped; 1,917 tests passed, 1 skipped.

The following also passed:

```text
npm run build:check
npm run build
npm run smoke:public-api
npm run lint:public-api-boundary
npm run lint:layer-contract
npm run lint:consumer-core-imports
npm run lint:scope-resolution
npm run check:output-budgets
npm run check:space-edges
npm run lint:naming
npm run lint
npm run lint:retired-symbols
git diff --check
```

Public API smoke imported 61 exact entrypoints. Public boundary classified 68 exports with no
growth violation. Consumer import checks reported zero issues for AlembicAgent, Alembic, and
AlembicPlugin.

`npm run check` still stops at the inherited unrelated doctrine finding
`AlembicCore/src/infrastructure/vector/ASTChunker.ts:32`. The rework has no diff in that file.
All checks before that point passed, and every check after that point was rerun individually and
passed.

## Strict-production compatibility

The protected source and build hashes remain identical to the accepted pre-rework baseline:

```text
0f98325c4f04eacbd8899076b7c1c6b03b17861885410bfe9e6bcb0768fbe435  AlembicCore/src/service/plan/intent/coldStartProductionPlan.ts
1faf35e19ee18c84fcff75947657a163f067c5d5262c415bc47888497007653c  AlembicCore/src/shared/testMode.ts
5dc9d47cd9220dcf78f53420103f083c1f462198c37d41afafe6833662429841  AlembicCore/src/service/production/ProductionPersistenceContracts.ts
726da0625f9dd4a7b01857f61e1da9db024aa7f4060596bb2e1627c523459d8f  AlembicCore/dist/service/plan/intent/coldStartProductionPlan.js
8236c6f8678afc2b0c1d6dc9fb196999a6aab3da8125f98677ce33c46de89840  AlembicCore/dist/shared/testMode.js
f387d16d2bc630db1520d6db53e75b8be46d1f28df1c9413007067c005df3d89  AlembicCore/dist/service/production/ProductionPersistenceContracts.js
```

Therefore exact 26-dimension strict-production compilation, its complete eligible-cell universe,
and `deferredCells=[]` semantics are unchanged.

## Downstream integration and risks

- AlembicAgent and Alembic must pass the authority receipts when validating durable objects:
  confirmation requires preflight; projection requires preflight plus confirmation; private
  terminal requires preflight plus confirmation plus projection.
- Consumers should continue importing from `@alembic/core/plans` or
  `@alembic/core/production`; no deep import is needed.
- The validator can fully replay visible final-coverage binding invariants, but the private candidate
  coverage receipt remains owned by the external private execution chain. Its hash is conserved; the
  caller must retain that private authority artifact for end-to-end audit.
- A private strict-test completion still cannot imply full-production coverage, production
  finalization, public publication, or completion of unselected dimensions.
