# I3-I10 AlembicAgent strict-test execution integration controller contract

Date: 2026-07-30

## Authority and phase

- Requirement authority: `Design/docs/current/recipe-coldstart-strict-test-profile-supplement-requirement-design-2026-07-30.md` §§5-8, 11-13.
- Accepted producer: AlembicCore `744616bde2322efa92aecd66b0b4f862f17fe69a`.
- Agent baseline: `a882f61cad34eed873db5ac52870475e6d71da52`.
- Current phase is only the AlembicAgent producer step. Alembic Main, Dashboard, DaemonJob, legacy bootstrap, production cold-start button, private filesystem/persistence/index/G4/serving, and real BiliDili execution are downstream and out of scope.

## Verified code facts

1. `runStrictPlanAgent` already provides the real strict Plan cognition path.
2. `buildStrictProductionPipelineStagesV1` and `AgentStageFactoryRegistry` already route the real strict Analyst → fixpoint gate → Producer → review gate path through `AgentService.run`.
3. `StrictProductionPipeline.ts` already owns analysis epochs/fixpoint, producer expression sets, causal lineage, typed gate returns, and no-tool enforcement.
4. `DurableSemanticReviewRuntime.ts`, `IndependentValueReviewer.ts`, and `InvestigatedEmptyReviewer.ts` already own the independent-review primitives.
5. The missing link is an explicit `strict-test-dimension` authority binding. Current Agent code does not consume or conserve Core `StrictTestPreflightReceiptV1`, `StrictTestSelectionConfirmationV1`, or `StrictTestDimensionExecutionProjectionV1`; therefore it cannot prove that a run kept the full 26-dimension frozen universe while executing exactly the selected dimension's eligible cells.

## Required implementation

Implement one narrow versioned adapter in `src/agent/production/StrictTestDimensionAgentContract.ts`. Reuse the existing strict pipeline; do not create a second Agent profile, second stage graph, briefing path, orchestration service, store, workspace, or test-mode environment switch.

### 1. Authority object

Export:

- `StrictTestDimensionAgentAuthorityV1`
- `createStrictTestDimensionAgentAuthorityV1`
- `assertStrictTestDimensionAgentAuthorityV1`

The creator input must contain exactly:

- `currentBindings: StrictTestPreflightBindingsV1`
- `preflight: StrictTestPreflightReceiptV1`
- `confirmation: StrictTestSelectionConfirmationV1`
- `projection: StrictTestDimensionExecutionProjectionV1`
- `compiledPlan: CompiledColdStartPlanV2`

The creator must call Core validators, not reimplement them:

- `assertStrictTestPreflightCurrentV1`
- `assertStrictTestSelectionConfirmationV1`
- `assertStrictTestDimensionExecutionProjectionV1`
- `assertStrictTestResumeContextV1`

It must then verify:

- `compiledPlan.canonicalPlanHash === preflight.compiledPlanHash`;
- the compiled Plan catalog, catalog source artifact, complete cell universe, eligible/excluded cell hashes, required-fact applicability, fact-query catalog, baseline schedule, Certified Project Facts, source revision vector, and source inventory identities equal the corresponding preflight/projection authorities;
- `projection.executionCellIds` equals, in canonical order and without duplicates, every and only eligible cell in `compiledPlan.universe` whose `dimensionId` is `projection.selectedDimensionId`;
- no module subset, second dimension, excluded cell, or unconfirmed cell is present;
- `compiledPlan.selection.deferredCells` remains exactly empty and no production contract is weakened.

The frozen authority output must include the existing compiled Plan's `execution.planCognitionHash`, all Core authority hashes, the selected dimension and canonical selected cell IDs, `projectedAt`, `productionFinalized=false`, and `publicRouteChanged=false`. Compute an `authorityHash` with Core canonical JSON hashing. The assertion must reconstruct and compare this hash and reject extra/missing fields or malformed versions/profile values.

### 2. Existing runtime binding

Export:

- `StrictTestDimensionProductionRuntimePortV1`
- `bindStrictTestDimensionProductionRuntimePortV1`

This function wraps, without replacing, an existing `StrictProductionRuntimePortV1`. Its input must be:

- the validated `StrictTestDimensionAgentAuthorityV1`;
- the existing strict production runtime port;
- the runtime's explicit eligible cell rows `{cellId,moduleId,dimensionId}`.

Before returning, it must prove that the runtime rows have unique IDs and exactly equal the authority's selected cell set, and that every row carries the selected dimension. The returned port must preserve the original strict runtime callbacks and add immutable `strictTestAuthority` plus canonical `eligibleCells`.

Update the existing `StrictProductionStages.ts` read boundary so that a port carrying `strictTestAuthority` validates that authority and cell conservation before every stage/gate access. Keep ordinary strict-production behavior unchanged when the field is absent. Neither `ALEMBIC_TEST_MODE`, legacy `dimensions`, Plugin `testMode`, Dashboard route origin, a single-element cell list, nor an arbitrary `strictTest` boolean may activate this branch.

### 3. Agent-segment execution receipt

Export:

- `StrictTestDimensionAgentCellDispositionV1`
- `StrictTestDimensionAgentExecutionReceiptV1`
- `createStrictTestDimensionAgentExecutionReceiptV1`
- `assertStrictTestDimensionAgentExecutionReceiptV1`

The receipt is the Agent segment's output contract for Alembic Main. It must bind:

- authority/preflight/confirmation/projection/compiled Plan/Plan cognition hashes;
- full catalog/cell/applicability/fact-query/baseline-schedule hashes;
- selected dimension and exact selected cell set/hash;
- actual fact-execution manifest and final expanded schedule hashes;
- analysis fixpoint hash;
- producer expression-set receipt hashes;
- independent semantic/disposition review attestation hashes;
- one terminal disposition row for every selected cell;
- attempted, accepted, rejected, investigated-empty, and failed counts;
- `productionFinalized=false` and `publicRouteChanged=false`;
- canonical `receiptHash`.

Allowed cell dispositions are exactly `accepted | rejected | investigated-empty | failed`.

- Every selected cell appears exactly once; no extra or omitted cell passes.
- `accepted` requires non-empty expression receipt hashes and independent-review attestation hashes.
- `investigated-empty` requires an independent disposition-review attestation.
- `rejected` and `failed` require a stable reason code plus evidence refs.
- Counts must be derived from rows and conserve to the selected cell count.
- A partial or failed Agent segment may produce an auditable receipt, but must not be reported as private test completion.

Use existing Agent/Core receipt constructors and validators for nested artifacts. Do not accept caller-supplied replacement hashes for objects that can be validated and hashed from their authoritative receipts.

### 4. Public surfaces

- Export the new contract from `src/agent/production/index.ts`, `src/production.ts`, and the established `@alembic/agent/production` package facade only.
- Do not widen the root package or unrelated service/evaluation facades unless an existing public-boundary test proves that the production facade cannot expose the symbols.
- Update public import/signature fixtures and probes for the new stable symbols.

## Required tests

Add focused RED/GREEN tests that prove:

1. Valid Core preflight → confirmation → projection → compiled Plan creates one authority object and conserves the exact selected cells.
2. A real existing strict stage-factory/PipelineStrategy run executes through the bound port; this is not a static or briefing-only test.
3. Full 26-dimension catalog/facts/applicability/schedule hashes survive unchanged while only the confirmed dimension's eligible cells are executable.
4. Missing/extra/duplicate/wrong-dimension/excluded cells fail before any model call.
5. Tampered, stale, expired, cross-run, cross-demand, rehashed, wrong-`projectedAt`, or compiled-Plan-drift authority fails closed.
6. Legacy env/testMode/dimensions/route hints cannot activate strict-test.
7. Per-cell terminal disposition conservation rejects missing/extra/duplicate rows and invalid accepted/investigated-empty/rejected/failed evidence.
8. The receipt retains Plan → fact execution → Analyst fixpoint → Producer expression → independent review lineage and cannot claim product completion.
9. Existing strict-production tests and public imports remain green.

## Validation and evidence

Required target evidence:

- one clean AlembicAgent commit based on the stated baseline, with parent/commit/tree hashes;
- changed files and exported symbols;
- focused RED and GREEN command output;
- a deterministic real-runtime probe output showing the selected cell IDs, full-universe hashes, stage route receipts, terminal disposition counts, and Agent receipt hash;
- `npm run build:check`;
- focused strict production/test-profile tests;
- `npm run smoke:public-imports`, `npm run smoke:public-signatures`, and `npm run smoke:strict-consumer`;
- `npm run lint:core-import-boundary`, `npm run lint:public-api-boundary`, `npm run check`, full `npm test`, and `git diff --check`;
- an explicit boundary scan proving no production store/root, daemon, public CAS/route, legacy bootstrap, Plugin, Dashboard, or environment-trigger implementation was added.

If an unrelated baseline failure appears, compare parent and HEAD with the same command and report both. Do not modify unrelated code to obtain green.

## Completion definition

This package is complete only when Alembic Main can import a validated Agent authority/bound runtime port and receive a canonical Agent execution receipt that proves exact selected-cell execution under the unchanged full strict universe. It does not complete the strict-test feature, does not authorize Main/Dashboard work early, and does not change the production cold-start entry.
