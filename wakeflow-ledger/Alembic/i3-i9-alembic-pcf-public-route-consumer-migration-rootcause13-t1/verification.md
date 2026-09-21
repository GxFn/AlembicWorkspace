# PCF public route consumer migration — verification

Task: `i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-t1`

## Change scope

- Production consumer:
  `lib/service/semantic-review/StrictSemanticReviewRuntimeFactory.ts`
- Regression contract:
  `test/unit/StrictSemanticReviewRuntimeFactoryContract.test.ts`
- No AlembicCore, AlembicAgent, AlembicPlugin, Test, vendor, or tracked
  Wakeflow files changed.

The production change moves only `createProjectContextFileRef` to the accepted
`@alembic/core/project-context` public facade. It leaves
`CertifiedProjectFactsArtifactV1`, `hashBytes`, and `hashCanonicalJson` on
`@alembic/core/project-context-foundation`.

## Reproduction and compatibility evidence

- Accepted Core producer built successfully at
  `f6e3f1956d67fa1d7a0a3440c2931196d9549d06`.
- Built-package probe proved:
  - `@alembic/core/project-context` exports
    `createProjectContextFileRef` as a function.
  - `@alembic/core/project-context-foundation` no longer owns the helper.
  - The required foundation hash exports remain functions.
- Before the Main fix, `npm run build:check` failed at the real consumer with
  `TS2305` because the foundation facade no longer exported the helper.
- The new source-contract test was run before the production edit and failed
  because the helper route was the foundation facade.
- After the single import migration, the contract test passed.
- A built-dist import probe loaded
  `dist/lib/service/semantic-review/StrictSemanticReviewRuntimeFactory.js` and
  observed the exported factory as a function.

## Validation

- `npm run build:check` — passed.
- `npm run build` — passed; rebuilt Core and Main emitted output.
- Focused Vitest command covering the new contract, trust store, setup, and
  real strict facade integration — 4 files, 41 tests passed.
- Fresh-process recovery suite after emitted output refresh — 1 file,
  31 tests passed.
- `npm run check` — passed end to end:
  - unit: 159 files, 1210 tests passed;
  - integration: 32 files passed, 480 tests passed, 10 skipped;
  - coverage suite: 3 files, 11 tests passed;
  - repository boundary, space edges, layer contract, doctrine, naming,
    agent-extraction, and Core consumer boundary checks passed;
  - shared asset drift: 17 checks, 0 drift, 0 pending sync;
  - retired-symbol and ring-direction checks passed.
- `git diff --check` — passed.
- Pre-commit Alembic Guard: `guard-public-ms5be424-3`, 2 files checked,
  0 violations.
- Exact commit: `d325952e23947d101ceb531bacaf47bd1d07180f`.
  - Parent: `602be24027a06284d0622e4d0d72fdbcd0831cc8`.
  - Tree: `c35f7dfc7eacc91e0e6ccad9da0e2e2240dd302c`.
- Post-commit `npm run build:check` — passed.
- Post-commit focused consumer/trust/real-facade run — 4 files,
  41 tests passed.
- Post-commit Alembic Guard: `guard-public-ms5bhf75-4`, 2 files checked,
  0 violations.
- Work-finish recommended Guard: `guard-public-ms5bi2d8-5`, 2 files checked,
  0 violations.
- Alembic finish receipt: `finish-public-ms5bhw6c-1`.

The first full-check attempt after source typechecking exposed stale Main
`dist` output in six fresh-process recovery cases. This was a validation-order
issue: `build:check` does not emit Main JavaScript. Running `npm run build`
refreshed the real process entrypoints; the recovery suite then passed 31/31,
and the complete `npm run check` passed.

## Two-stage self-review

### Stage 1 — specification and boundary

- Exact Main parent and accepted Core producer remained fixed.
- The only real Main helper consumer now uses the public facade.
- No legitimate foundation import was broadened or migrated.
- No fallback, local duplicate helper, second trust route, or artifact
  reconstruction path was added.
- Existing real facade integration still proves the full 15-receipt and
  8-harvest-group behavior.
- This result claims only the Main consumer migration; final multi-package
  artifact reconstruction and acceptance remain controller-owned.

### Stage 2 — implementation quality and risk

- Runtime behavior is unchanged beyond module ownership of one imported
  helper.
- The regression test reads source asynchronously and asserts a single exact
  public route, preventing silent reintroduction through a second import.
- Durable trust enrollment, recovery, fail-closed behavior, persistence, and
  call structure were not edited.
- Final diff and sibling status scans found no unrelated modifications.
- Alembic Guard initially identified synchronous test I/O; the test was
  corrected to `node:fs/promises`, and final Guard is clean.
- No P0, P1, or P2 findings remain.

## Residual risk and next recommendation

Residual risk is limited to controller-owned final artifact recomposition
across the accepted package chain. The controller should verify exact commit
ancestry and rebuild the final PC-F artifact; this target must not perform or
accept that reconstruction.

## Wakeflow closeout

- Target result:
  `tr-i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-t1`,
  revision 1, status `completed`.
- Review pack: group ready, all results present, no missing evidence refs,
  no craft evidence gaps.
- Controller return:
  `controller-return-i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-p1__r1`.
- Direct-thread delivery run:
  `run-controller-return-i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-p1__r1`,
  status `sent`, readback `ok=true`.

The result is awaiting controller review. Target completion and controller
acceptance remain distinct.
