# I3-I10 AlembicAgent strict-test automatic-selection integration controller contract

Date: 2026-07-30

## Authority and phase

- User decision:
  `i3-i10-strict-test-automatic-selection-user-decision-2026-07-30.md`.
- Accepted Core producer:
  `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`.
- Core controller acceptance:
  `i3-i10-core-strict-test-automatic-selection-replacement-controller-acceptance.md`.
- Agent clean baseline:
  `a882f61cad34eed873db5ac52870475e6d71da52`.
- Current phase is only the AlembicAgent producer/consumer step. Alembic Main, Dashboard,
  DaemonJob, legacy bootstrap, production cold-start UI, private filesystem/persistence/index/G4/
  serving orchestration, and real BiliDili execution remain downstream.

This package replaces the superseded manual-confirmation Agent task. It must consume Core
`StrictTestAutomaticSelectionReceiptV1`; it must not keep, emulate, adapt, or rename
`StrictTestSelectionConfirmationV1`.

## Recoverable baseline cleanup

The Agent worktree contains only the stopped task's uncommitted manual-confirmation residue:

- modified `src/agent/production/StrictProductionStages.ts`;
- modified `src/agent/production/index.ts`;
- modified `src/production.ts`;
- untracked `src/agent/production/StrictTestDimensionAgentContract.ts`;
- untracked `test/strict-test-dimension-agent-contract.test.ts`.

Before implementation, the target must:

1. verify that `git status --short` names exactly those five paths and that HEAD is
   `a882f61cad34eed873db5ac52870475e6d71da52`;
2. preserve only those five paths in a recoverable, named stash:

   `git stash push -u -m "wakeflow/superseded-i3-i10-agent-manual-confirmation" -- src/agent/production/StrictProductionStages.ts src/agent/production/index.ts src/production.ts src/agent/production/StrictTestDimensionAgentContract.ts test/strict-test-dimension-agent-contract.test.ts`

3. verify the worktree is clean and still at the stated HEAD;
4. never apply that stash during this package.

If any additional path is dirty, stop and return a blocker instead of stashing or reverting it.
The final result must report the stash name/ref and the clean-baseline proof. This cleanup is not a
product commit.

## Verified real Agent chain

The Agent implementation must wrap the existing chain, not duplicate it:

- `runStrictPlanAgent` owns real Plan cognition;
- `buildStrictProductionPipelineStagesV1` and `AgentStageFactoryRegistry` route the real strict
  Analyst → fixpoint gate → Producer → review gate path through `AgentService.run`;
- `StrictProductionPipeline.ts` owns analysis epochs/fixpoint, producer expression sets, causal
  lineage, typed gate returns, and no-tool enforcement;
- `DurableSemanticReviewRuntime.ts`, `IndependentValueReviewer.ts`, and
  `InvestigatedEmptyReviewer.ts` own independent-review execution.

The missing link is a versioned authority/binding/receipt adapter that proves this existing Agent
chain executes every and only the Core automatically selected dimension's eligible cells while
conserving the frozen full-universe lineage.

## Required implementation

Implement one narrow adapter in
`src/agent/production/StrictTestDimensionAgentContract.ts`.

### 1. Agent authority

Export:

- `StrictTestDimensionAgentAuthorityV1`;
- `CreateStrictTestDimensionAgentAuthorityInputV1`;
- `createStrictTestDimensionAgentAuthorityV1`;
- `assertStrictTestDimensionAgentAuthorityV1`.

The creator input must have exactly:

- `currentBindings: StrictTestPreflightBindingsV1`;
- `preflight: StrictTestPreflightReceiptV1`;
- `automaticSelection: StrictTestAutomaticSelectionReceiptV1`;
- `projection: StrictTestDimensionExecutionProjectionV1`;
- `compiledPlan: CompiledColdStartPlanV2`.

Import `CompiledColdStartPlanV2` from the stable `@alembic/core/plans` facade. Import strict-test
and production receipt/validator contracts from `@alembic/core/production`. Do not deep-import Core.

The creator must call, rather than reimplement:

- `assertStrictTestPreflightCurrentV1`;
- `assertStrictTestAutomaticSelectionReceiptV1`;
- `assertStrictTestDimensionExecutionProjectionV1`;
- `assertStrictTestResumeContextV1`.

Then verify:

- `compiledPlan.canonicalPlanHash === preflight.compiledPlanHash`;
- compiled Plan catalog/catalog-source, complete cell universe, eligible/excluded cells,
  required-fact applicability, fact-query catalog, baseline schedule, Certified Project Facts,
  source revision vector, and source inventory match preflight/projection/automatic-selection
  authority;
- `projection.executionCellIds` is in canonical order, contains no duplicates, and equals every and
  only `compiledPlan.universe.cells` row with
  `dimensionId === projection.selectedDimensionId && status === eligible`;
- `automaticSelection.selectedDimensionId === projection.selectedDimensionId`;
- `automaticSelection.selectedEligibleCellIds` equals the same exact cell set;
- no module subset, second dimension, excluded cell, caller replacement, or unselected cell exists;
- `compiledPlan.selection.deferredCells` remains empty;
- ordinary strict-production contracts are unchanged.

The frozen authority must bind:

- schema/contract/profile versions;
- demand/run identities;
- current-bindings, preflight, binding, drift-invalidation, automatic-selection, projection,
  compiled-Plan, and Plan-cognition hashes;
- every full catalog/cell/applicability/fact-query/baseline-schedule hash;
- Certified Project Facts artifact/content/source-artifact/source-vector/consumer hashes;
- source revision vector and source inventory hashes;
- selected dimension and exact selected cell IDs/set hash;
- `selectedAt` and `projectedAt`;
- `productionFinalized=false`;
- `publicRouteChanged=false`;
- canonical `authorityHash`.

It must not contain `confirmation`, `confirmationHash`, `confirmedBy`, a selection override, or a
second authorization field. The assertion must enforce exact keys, versions, canonical hash,
lineage, timestamps, and cell conservation.

### 2. Existing runtime binding

Export:

- `StrictTestDimensionEligibleCellV1`;
- `StrictTestDimensionProductionRuntimePortV1`;
- `bindStrictTestDimensionProductionRuntimePortV1`;
- `assertStrictTestDimensionProductionRuntimePortBindingV1`.

The binder input is:

- validated `StrictTestDimensionAgentAuthorityV1`;
- an existing `StrictProductionRuntimePortV1`;
- explicit runtime rows `{ cellId, moduleId, dimensionId }`.

Before returning it must prove:

- unique row IDs;
- canonical row ID order and exact equality with the authority selected-cell set;
- every row carries the selected dimension;
- each row's `cellId` equals its authoritative compiled-Plan cell identity;
- no excluded, extra, missing, or second-dimension row exists.

The returned port preserves the original callbacks and freezes immutable
`strictTestAuthority` plus canonical `eligibleCells`.

Update only the existing `StrictProductionStages.ts` port-read boundary so any port carrying either
strict-test field must carry both and pass the binding assertion before every stage/gate access.
Ordinary strict production remains unchanged when both fields are absent.

Neither an environment variable, legacy `dimensions`, Plugin `testMode`, Dashboard route, a
single-element cell list, nor an arbitrary `strictTest` boolean may activate this branch.

### 3. Agent execution receipt

Export:

- `StrictTestDimensionAgentTerminalDispositionV1`;
- `StrictTestDimensionAgentCellDispositionInputV1`;
- `StrictTestDimensionAgentCellDispositionV1`;
- `StrictTestDimensionAgentExecutionReceiptV1`;
- `CreateStrictTestDimensionAgentExecutionReceiptInputV1`;
- `createStrictTestDimensionAgentExecutionReceiptV1`;
- `assertStrictTestDimensionAgentExecutionReceiptV1`.

The receipt must bind:

- authority/current-bindings/preflight/binding/drift-invalidation/automatic-selection/projection/
  compiled-Plan/Plan-cognition hashes;
- all full catalog/cell/applicability/fact-query/baseline-schedule hashes;
- selected dimension and exact selected cell set/hash;
- actual fact-execution manifest and schedule hashes;
- final expanded schedule and analysis-fixpoint hashes when those stages exist;
- producer expression-set receipt hashes;
- independent semantic-review and disposition-review durable attestation hashes;
- one terminal disposition row for every selected cell;
- attempted, accepted, rejected, investigated-empty, and failed counts;
- segment status `completed | partial | failed`;
- `productionFinalized=false`;
- `publicRouteChanged=false`;
- canonical `receiptHash`.

Allowed dispositions are exactly:

- `accepted`;
- `rejected`;
- `investigated-empty`;
- `failed`.

Rules:

- every selected cell appears exactly once; no extra, missing, duplicate, or reordered cell;
- `accepted` requires non-empty validated expression-set receipts and independent semantic-review
  durable attestations;
- `investigated-empty` requires an independent disposition-review durable attestation;
- `rejected` and `failed` require a stable non-empty reason code and evidence refs;
- counts are derived from rows and conserve to the selected-cell count;
- `completed` requires no failed row and all stage receipts required for completed execution;
- `partial` / `failed` remain auditable Agent-segment results and cannot claim private test
  completion;
- nested receipt objects must be validated with existing Core/Agent constructors and validators;
  caller-supplied replacement hashes cannot stand in for available authoritative receipts.

### 4. Public surfaces

- Export the adapter from `src/agent/production/index.ts`.
- Export the stable values and types from `src/production.ts`, which backs
  `@alembic/agent/production`.
- Update existing public signature/import/strict-consumer probes.
- Do not widen the root, service, evaluation, runtime, or unrelated facades.

## Required real-chain tests

Tests must cover both authorization rejection and successful execution:

1. Build a valid Core preflight → automatic selection → projection → compiled Plan fixture and
   create one Agent authority.
2. Bind an existing real `StrictProductionRuntimePortV1`.
3. Run a valid bound port through the actual
   `AgentService → generate-dimension → AgentStageFactoryRegistry → PipelineStrategy` route and
   prove Analyst and Producer model calls occur under the selected-cell authority.
4. Run forged/missing/extra/duplicate/wrong-dimension/excluded/stale/cross-run/cross-demand/
   rehashed authority through the same route and prove rejection occurs before the first model
   call.
5. Prove all 26 dimension states and all full-universe hashes remain conserved while only the
   automatically selected dimension's complete eligible set is executable.
6. Prove a multi-module selected dimension includes all of its eligible cells, not a one-cell
   demonstration only.
7. Prove caller/manual/legacy hints cannot activate or override the branch and that no manual
   confirmation symbol/hash/state remains in Agent source or public output.
8. Exercise completed, partial, failed, accepted, rejected, investigated-empty, and invalid
   per-cell evidence/count conservation.
9. Prove Plan → fact execution → Analyst fixpoint → Producer expression sets → independent durable
   review lineage survives in the Agent receipt.
10. Keep existing ordinary strict-production and public-consumer tests green.

Tests use mock model/provider behavior and controlled fixtures; no real API key or network call.

## Validation and evidence

Return:

- recoverable cleanup evidence and clean Agent baseline proof;
- one clean Agent commit based on
  `a882f61cad34eed873db5ac52870475e6d71da52`;
- accepted Core dependency commit
  `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`;
- parent/commit/tree hashes and exact changed files;
- focused RED and GREEN output;
- deterministic valid and fail-closed real-AgentService runtime JSON containing selected cells,
  full-universe hashes, stage/model-call evidence, disposition counts, and Agent receipt hash;
- `npm run build:check`;
- focused strict production/strict-test tests;
- `npm run smoke:public-imports`;
- `npm run smoke:public-signatures`;
- `npm run smoke:strict-consumer`;
- `npm run lint:core-import-boundary`;
- `npm run lint:public-api-boundary`;
- `npm run lint:agent-import-boundary`;
- `npm run check`;
- full `npm test`;
- `git diff --check`;
- a boundary scan proving no Main/Dashboard/Plugin/daemon/store/public-route/production-finalization,
  legacy bootstrap, environment activation, or second Agent pipeline was added.

If an unrelated baseline failure appears, run the same command on parent and HEAD and report both.
Do not modify unrelated files to obtain green.

## Completion definition

This package is complete only when Alembic Main can import a validated Agent authority, bind the
existing real strict Agent runtime to the accepted Core automatic selection, and receive a
canonical Agent execution receipt proving exact selected-cell execution under the unchanged full
strict universe. It does not complete the whole test mode and does not authorize Main, Dashboard,
or real BiliDili Test work before controller acceptance.
