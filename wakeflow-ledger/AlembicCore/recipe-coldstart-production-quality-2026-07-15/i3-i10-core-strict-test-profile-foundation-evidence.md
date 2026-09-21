# I3-I10 Core strict-test-dimension foundation evidence

- Task: `i3-i10-core-strict-test-profile-foundation-t1`
- Dispatch group: `i3-i10-core-strict-test-profile-foundation-p1`
- Core commit: `8383808cce71e80c717b6121235597c24229f10e`
- Core tree: `bf43c2bcf993ee77d9eb714d487ebb80960992a9`
- Alembic Guard: `guard-public-ms72x1xp-2` — same explicit five-file scope, 0 violations

## Implementation

Changed Core files:

- `AlembicCore/src/service/plan/intent/strictTestDimensionProfile.ts`
- `AlembicCore/src/plans.ts`
- `AlembicCore/src/production.ts`
- `AlembicCore/test/StrictTestDimensionProfile.test.ts`
- `AlembicCore/test/ColdStartProductionPlanCompiler.test.ts`

The commit adds the explicit `strict-test-dimension` V1 profile contracts and canonical validators for
full compiled-plan preflight, exact 26-dimension and module × dimension conservation, evidence-backed
recommendation, exactly-one hash-bound confirmation, immutable selected-cell projection, private
completion/failure and audit receipts, resume drift, and production/public-route non-mutation.
The `plans` and `production` stable facades export the same implementation.

No host orchestration, filesystem, HTTP, Dashboard, Agent, Plugin, cleanup/reset, public CAS, or active
route behavior was added.

## Tests

Focused command:

```text
npx vitest run test/StrictTestDimensionProfile.test.ts test/ColdStartProductionPlanCompiler.test.ts test/ProductionPersistenceContracts.test.ts test/CorePackage.test.ts test/PublicApiInventory.test.ts --reporter=dot
```

Result: 5 test files passed; 54 tests passed.

Full command:

```text
npm run test
```

Result: 195 test files passed, 1 skipped; 1,912 tests passed, 1 skipped.

The tests cover actual `compileColdStartPlan` integration, exact catalog/full universe retention,
architecture recommendation eligibility, excluded fallback, zero/multiple/excluded selection
rejection, binding drift, missing catalog rows, duplicate cells, unsupported query backends, facts
lineage mismatch, all-eligible-cells projection, explicit unselected state, private G4/final
coverage/serving lineage, audit denominators, non-mutation, and both public facades.

## Build and boundary validation

All of these passed:

```text
npm run build:check
npm run build
npm run smoke:public-api
npm run lint:public-api-boundary
npm run lint:layer-contract
npm run lint:consumer-core-imports
npm run lint:scope-resolution
npm run lint:retired-symbols
npm run lint
git diff --check
```

Public API smoke imported 61 exact entrypoints. Alembic Guard passed with 0 violations.

The remaining composite `npm run check` blocker is inherited and unrelated:
`src/infrastructure/vector/ASTChunker.ts:32` fails `lint:doctrine`. This task has no diff in that file;
all other composite sub-gates, including output budgets, space edges, and naming, passed.

## Strict-production compatibility proof

The following source hashes are identical before and after the task:

```text
0f98325c4f04eacbd8899076b7c1c6b03b17861885410bfe9e6bcb0768fbe435  AlembicCore/src/service/plan/intent/coldStartProductionPlan.ts
1faf35e19ee18c84fcff75947657a163f067c5d5262c415bc47888497007653c  AlembicCore/src/shared/testMode.ts
5dc9d47cd9220dcf78f53420103f083c1f462198c37d41afafe6833662429841  AlembicCore/src/service/production/ProductionPersistenceContracts.ts
```

The corresponding built JavaScript hashes are also identical:

```text
726da0625f9dd4a7b01857f61e1da9db024aa7f4060596bb2e1627c523459d8f  AlembicCore/dist/service/plan/intent/coldStartProductionPlan.js
8236c6f8678afc2b0c1d6dc9fb196999a6aab3da8125f98677ce33c46de89840  AlembicCore/dist/shared/testMode.js
f387d16d2bc630db1520d6db53e75b8be46d1f28df1c9413007067c005df3d89  AlembicCore/dist/service/production/ProductionPersistenceContracts.js
```

Therefore the existing `strict-production` exact catalog, all eligible cell behavior, and
`deferredCells=[]` implementation were not modified.

## Downstream integration and residual risks

- AlembicAgent and Alembic should consume `@alembic/core/plans` or
  `@alembic/core/production`; they must not deep-import Core source.
- Main must supply exact caller-loaded project/source/facts/config/model/query/parser/vector/runtime
  binding hashes and before/after production state hashes.
- Agent/Main must execute the real selected-cell chain and supply private final coverage, G4, serving,
  and evidence receipts. Core intentionally provides deterministic admission and conservation only.
- Every strict-test query family requires an executable `queryPackHash`. Legacy catalogs without that
  strict execution identity fail closed and need a downstream loader upgrade.
- A private strict-test completion cannot imply full-production coverage, production finalization,
  public publication, or completion of unselected dimensions.
