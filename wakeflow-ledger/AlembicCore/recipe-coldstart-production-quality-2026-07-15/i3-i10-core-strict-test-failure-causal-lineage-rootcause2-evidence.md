# I3-I10 Core strict-test failure causal-lineage evidence

- Task: `i3-i10-core-strict-test-failure-causal-lineage-rootcause2-t1`
- Dispatch group: `i3-i10-core-strict-test-failure-causal-lineage-rootcause2-p1`
- Controller contract source: `wakeflow-ledger/AlembicWorkspace/recipe-coldstart-production-quality-2026-07-15/i3-i10-core-strict-test-profile-foundation-rework1-controller-review.md`
- Baseline commit: `933920fa214c1ba04787244f073145bcc48e929c`
- Symptom RED commit: `a12f0e5`
- Exact-contract RED commit: `cd295c7`
- Implementation commit: `744616bde2322efa92aecd66b0b4f862f17fe69a`
- Implementation tree: `7726cc5ba4efda2e020d09cd1c53b93c861b931b`
- Alembic Guard: `guard-public-ms74xenp-6` — 2 files checked, 0 violations

## Root cause

The previous strict-test failure API accepted stage-blind caller-supplied predecessor hashes and
always required a successful preflight authority. It therefore could not represent pre-preflight
failures, could not distinguish forbidden from required confirmation/projection authorities, and
could not prove that projection existed before the failure because projection had no hash-bound
production timestamp. Audit creation also assumed successful preflight/confirmation/projection and
manufactured late-stage report fields for early failures.

The repair makes Core the sole authority for the failure-stage matrix and derives all failure
lineage from one validated context. It deliberately removes the old raw-hash input rather than
keeping an overload or fallback.

## Implemented contract

1. Added the frozen/versioned `STRICT_TEST_FAILURE_STAGE_AUTHORITY_V1` table and total
   `resolveStrictTestFailureStageAuthorityV1` resolver for all 14 legal failed stages. Both
   `@alembic/core/plans` and `@alembic/core/production` expose the same constant and resolver
   object/function through their existing facade exports.
2. Added `StrictTestPrivateTerminalAuthorityContextV1` with exact
   `currentBindings/preflight/confirmation/projection` fields.
3. Replaced failure construction's raw predecessor hashes with that context. The creator derives
   `observedBindingsHash` plus nullable predecessor hashes and selects demand/run and non-mutation
   baselines according to the controller matrix.
4. Added hash-bound `projectedAt` to the projection input and receipt. Projection creation and
   validation enforce confirmation-before-projection ordering.
5. Failure creation and validation enforce every supplied authority at or before `failedAt`, using
   `STRICT_TEST_FAILURE_CONTEXT_AFTER_FAILURE`; expired or drifted observations remain recordable
   without invoking the success-only currency gate.
6. Terminal validation recomputes the terminal hash, validates every required predecessor in order,
   rejects missing/forbidden/undefined/mismatched authority with
   `STRICT_TEST_FAILURE_AUTHORITY_MISMATCH`, recomputes `observedBindingsHash`, and retains the
   completion chain's five prior anti-forgery checks.
7. Audit creation first validates the terminal against the same context. Its three authority hashes,
   full-universe block, projection block, unexecuted ids, and failure summary now have the exact
   stage-aware nullable shape. Failure evidence is merged into, and therefore conserved by,
   `privateArtifactRefs`.

## Scope

Only these AlembicCore files changed:

- `src/service/plan/intent/strictTestDimensionProfile.ts`
- `test/StrictTestDimensionProfile.test.ts`

No external repository, strict-production compiler, legacy test mode, persistence, daemon,
Dashboard, public CAS, release/vendor snapshot, fallback, or package export list was changed. No
additional export-file edit was required because both approved facades already explicitly
re-export the strict-test contract module.

## Test-first evidence

Before implementation, the exact controller-contract regression suite produced:

```text
npm run test -- --run test/StrictTestDimensionProfile.test.ts
Test Files  1 failed (1)
Tests       14 failed | 4 passed (18)
```

The final focused result is:

```text
npm run test -- --run test/StrictTestDimensionProfile.test.ts
Test Files  1 passed (1)
Tests       19 passed (19)
```

The focused suite covers every non-completed stage table-wise; boundary missing/forbidden
authorities; undefined authority; illegal completed failure stage; rehashed predecessor and
terminal lineage substitutions; future current/preflight/confirmation/projection times; expiry and
drift recording; early and late audit shapes; failure evidence conservation; `projectedAt` hash/time
binding; retired raw-hash input rejection; the five prior completion-forgery probes; and both public
facades.

## Final verification

Focused compatibility suite:

```text
npx vitest run test/StrictTestDimensionProfile.test.ts \
  test/ColdStartProductionPlanCompiler.test.ts \
  test/ProductionPersistenceContracts.test.ts \
  test/CorePackage.test.ts \
  test/PublicApiInventory.test.ts --reporter=dot
```

Result: 5 files passed; 66 tests passed.

Stable final full-suite run, after the final refactor and build:

```text
npm run test
Test Files  195 passed | 1 skipped (196)
Tests       1924 passed | 1 skipped (1925)
```

The following passed:

```text
npm run build:check
npm run build
npm run smoke:public-api
npm run lint
npm run lint:public-api-boundary
npm run lint:layer-contract
npm run lint:consumer-core-imports
npm run lint:scope-resolution
npm run check:output-budgets
npm run check:space-edges
npm run lint:naming
npm run lint:retired-symbols
git diff --check
```

Public API smoke imported 61 exact entrypoints. The public boundary classified 68 exports without a
growth violation. Consumer-import checks reported zero issues for AlembicAgent, Alembic, and
AlembicPlugin.

One intentionally discarded validation attempt ran `npm run build` (which starts by cleaning
`dist/`) concurrently with the full suite. `EntrypointEffects.test.ts` observed the transient clean
window and failed to import `dist/index.js`. The build and public smoke completed successfully, and
the full suite was then rerun serially on the stable built tree with the green result above.

`npm run lint:doctrine` retains the inherited unrelated finding at
`src/infrastructure/vector/ASTChunker.ts:32` for module-scope mutable `_parseToTree`. This task has no
diff in that file. Every other component of `npm run check` was run individually and passed.

## Strict-production compatibility

The protected source and build hashes are unchanged from the accepted baseline:

```text
0f98325c4f04eacbd8899076b7c1c6b03b17861885410bfe9e6bcb0768fbe435  src/service/plan/intent/coldStartProductionPlan.ts
1faf35e19ee18c84fcff75947657a163f067c5d5262c415bc47888497007653c  src/shared/testMode.ts
5dc9d47cd9220dcf78f53420103f083c1f462198c37d41afafe6833662429841  src/service/production/ProductionPersistenceContracts.ts
726da0625f9dd4a7b01857f61e1da9db024aa7f4060596bb2e1627c523459d8f  dist/service/plan/intent/coldStartProductionPlan.js
8236c6f8678afc2b0c1d6dc9fb196999a6aab3da8125f98677ce33c46de89840  dist/shared/testMode.js
f387d16d2bc630db1520d6db53e75b8be46d1f28df1c9413007067c005df3d89  dist/service/production/ProductionPersistenceContracts.js
```

## Downstream integration and residual risk

- AlembicAgent and Alembic must construct one `StrictTestPrivateTerminalAuthorityContextV1` and pass
  it to failure creation, terminal validation, and audit creation. They must also supply
  `projectedAt` when creating the execution projection.
- Consumers must not send the retired raw predecessor hashes; no compatibility overload exists.
- The public import paths remain `@alembic/core/plans` and `@alembic/core/production`.
- The only repository-wide non-green gate is the pre-existing doctrine finding described above.
  There is no known residual defect in the assigned causal-lineage contract.
