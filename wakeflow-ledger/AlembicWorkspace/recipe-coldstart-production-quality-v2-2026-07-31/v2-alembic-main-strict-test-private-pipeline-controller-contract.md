# V2 Alembic Main strict-test private pipeline controller contract

Date: 2026-08-01

## Authority And Outcome

- User-authorized phase: after acceptance of AlembicAgent commit
  `8688311c3970054c68a74b0ce30d8f3db4f15be6`, continue the next producer/consumer
  stage in Alembic Main.
- Goal authority: the V2 restart decision, the original cold-start plan and Requirement Design,
  the strict-test supplement, and the later automatic-selection user decision. Where the older
  supplement says a user confirms a dimension, the later decision wins: Main must select the
  preflight recommendation automatically and must not expose or wait for manual selection or
  confirmation.
- Observable outcome: Alembic Main exposes one real `strict-test-dimension` backend that freezes
  the full project/26-dimension authority, automatically selects one applicable dimension, runs
  every and only its eligible cells through the accepted same-run Agent pipeline, completes the
  existing strict private corpus/index/G4/tool-neutral serving chain in an isolated workspace,
  and returns durable Core terminal and audit receipts while proving production non-mutation.
- This is the single combined Alembic package for this demand. The target self-sequences the work;
  no second Alembic task is created for another part of the same backend.

## Verified Current Code Facts

1. `lib/http/routes/jobs.ts` exposes legacy `/api/v1/jobs/bootstrap`; it accepts ordinary bootstrap
   plus exact `strictProduction`, then creates a bootstrap DaemonJob. There is no strict-test
   preflight, start, status, or report route.
2. `lib/recipe-pipeline/RecipePipelineFacade.ts`,
   `lib/recipe-pipeline/generate/ColdStartWorkflow.ts`, and
   `lib/recipe-pipeline/generate/strict/StrictProductionContracts.ts` recognize only production
   V1. Production parsing is exact-key and must remain unchanged.
3. `lib/recipe-pipeline/generate/strict/StrictColdStartOrchestrator.ts` acquires the production
   publication lock, performs reset/blank work, builds public serving data and commits the public
   route. It cannot be called by strict-test.
4. `lib/recipe-pipeline/generate/strict/StrictAnalysisRuntime.ts` already calls the real
   `AgentService.run(generate-dimension)` chain, but it currently binds the full production port,
   reads Main-owned in-memory state, and never requires or validates the accepted Agent
   `strictTestExecutionReceipt`.
5. `persistStrictPrivateCorpusContent`, private ref/index/seal code and most G4/serving checks are
   reusable, but their resolver and coverage inputs are currently production/full-universe
   oriented. `finalizeStrictCandidate` also prepares a public route and therefore must not be
   called as a whole by strict-test.
6. Main HEAD at package authoring is `c95dccb87bdc5a8412792f97917aed6992024b7e`; the worktree is
   clean. Core and Agent are workspace links, not stale `.tgz` copies.

## Required Main Architecture

### 1. Separate exact request and HTTP surface

Add a Main-owned strict-test request parser/service and mount a distinct router from
`lib/http/HttpServer.ts` at `/api/v1/strict-test-dimension` with these operations:

- `POST /preflight`: start or deterministically resume a read-only preflight for one explicit
  project plus `demandKey` and `runId`; return the durable Core preflight receipt and preview.
- `POST /runs`: accept only `demandKey`, `runId`, and the exact `preflightHash`; revalidate current
  bindings, create Core automatic-selection and execution-projection receipts, then start the
  private run. There is no dimension or confirmation field.
- `GET /runs/:runId`: return durable phase/journal state and typed failure evidence.
- `GET /runs/:runId/report`: return the durable canonical Core audit report or typed not-ready
  response.

The router may use the repository's established async operation mechanism, but it must not enqueue
a legacy `bootstrap` DaemonJob and must not call `/jobs/bootstrap`. Caller-selected filesystem
roots, dimensions, module subsets, legacy `dimensions`, `ALEMBIC_TEST_MODE`, Plugin `testMode`, a
manual-confirmation token, or a `strictProduction` object are invalid input. Production V1 rejects
strict-test fields and strict-test rejects production fields.

### 2. One Main orchestrator and durable private state

Create `lib/recipe-pipeline/generate/strict/StrictTestDimensionOrchestrator.ts` as the sole Main
owner of this profile. A run uses a runtime-derived path such as
`<control-root>/strict-test-runs/<demandKey>/<runId>`; the caller does not provide the path. Before
the first write, prove that the resolved private root:

- is outside and not an alias/symlink/bind target of the production data root or source root;
- is absent or is a valid same-owner, same-authority resumable run;
- has an immutable policy/owner hash matching Core preflight bindings;
- contains the only journal, checkpoint, evidence, private DB/files/refs/indexes, sealed bundle and
  report written by this profile.

Status and report reads reopen this durable state. They must not infer success from process-local
objects, Dashboard state or a model reply.

### 3. Full-authority preflight and deterministic automatic selection

Using the real Main ProjectContext/Certified Project Facts, runtime-config/artifact receipts and
the complete compiled strict Plan:

1. capture/reopen facts without mutating official Recipe/publication state;
2. build `StrictTestPreflightBindingsV1` from actually loaded identities, inventory, backend,
   provider/model, prompt/SOP, runtime-artifact, private-policy and production-before hashes;
3. call Core `validateStrictTestPreflightV1` and `createStrictTestPreflightPreviewV1`;
4. on `/runs`, revalidate the exact current bindings, then call
   `createStrictTestAutomaticSelectionReceiptV1` and
   `createStrictTestDimensionExecutionProjectionV1`;
5. keep the complete 26-dimension catalog/cell/applicability/fact-query/baseline authority frozen;
   execute every and only the projection's selected eligible cells. The other 25 dimensions remain
   `not-executed-by-strict-test-profile`, never deferred/excluded/completed.

Unknown applicability, unsupported backend, empty selected cells, source/config/artifact drift,
stale preflight or a changed private-workspace policy fails before the first Agent model call.

### 4. Consume the accepted Agent receipt on the existing chain

Extend `StrictAnalysisRuntime.ts`; do not create another Agent pipeline.

1. Create `StrictTestDimensionAgentAuthorityV1` from the current bindings, preflight, automatic
   selection, projection and the same compiled Plan.
2. Derive canonical runtime cell rows from the compiled Plan, then call
   `bindStrictTestDimensionProductionRuntimePortV1` around the existing
   `StrictProductionRuntimePortV1` callbacks.
3. Run the existing public `AgentService -> generate-dimension -> AgentStageFactoryRegistry ->
   PipelineStrategy` exactly once with that bound port.
4. Require `result.strictTestExecutionReceipt`; run the public Agent validator and independently
   compare demand/run, authority, preflight, automatic-selection, projection, full-universe,
   selected-cell, fact schedule, analysis/fixpoint, expression and durable review lineage.
5. Use that same receipt and its actual stage artifacts as the authority for Main persistence.
   Missing, partial/failed, synthetic/coordinator-only, cross-run, reordered, extra, missing or
   rehashed cell evidence fails before private persistence.

Main must not run the real Agent and then synthesize another receipt from Main state, and it must
not make a second Agent call to manufacture terminal evidence.

### 5. Continue through the real private Main chain

Parameterize the existing strict components only at their real boundaries:

- `StrictPrivateCorpusRuntime.ts`: use the run's private resolver and the projection's selected
  cell authority while retaining the full-universe hashes; keep real independent semantic and
  disposition review, persistence recovery, refs and sealed-corpus verification.
- `StrictFinalizationRuntime.ts`: extract/reuse a private-only composition that builds candidate
  coverage over exactly the selected cells, sparse verification, the exact vector generation,
  lifecycle activation, immutable data manifest, G4, final coverage binding and tool-neutral
  serving validation. It must return the existing Core-compatible final coverage and serving
  manifest objects without constructing `PreparedPublicKnowledgeRouteV1`.
- The orchestrator calls Core `createStrictTestPrivateCompletionReceiptV1` only after the sealed
  private chain and production-after hashes pass. Every stage failure uses the Core failure
  authority matrix and `createStrictTestPrivateFailureReceiptV1`. It then calls
  `createStrictTestAuditReportV1` and durably persists the canonical terminal/report pair.

Success is exactly `STRICT_TEST_COMPLETED_PRIVATE` with `productionFinalized=false` and
`publicRouteChanged=false`. It is not production `FINALIZED` and does not establish coverage for
the other dimensions.

### 6. Production non-mutation boundary

Record and compare before/after hashes for production DB/WAL/SHM, official Recipe/ref/coverage/
index/session state, runtime config, public bundle/manifest and active route. The strict-test path
must never call production fullReset/setup execute/recover/complete, the publication operation
lock, `PUBLIC_CAS_PREPARED`, `PUBLIC_CAS_COMMITTED`, `commitPreparedPublicRoute`, or any public
reader switch. Any detected mutation changes the run to a typed failure; it cannot be repaired or
hidden by the test path.

## Required RED/GREEN Probes

### Anchor `v2-main-explicit-profile-entry`

- RED/probe: call the new preflight/start/status/report API before implementation; challenge it
  with production fields, legacy bootstrap, env test mode and caller dimension/confirmation.
- Expected: only the exact new API starts strict-test; all legacy/ambiguous activations fail closed
  and production V1 behavior remains unchanged.

### Anchor `v2-main-automatic-selection-authority`

- RED/probe: build preflight from real Main facts and a 26-dimension compiled Plan, start without a
  dimension, then inject unknown, empty, stale and binding-drift variants.
- Expected: one backend-recommended applicable dimension and all its eligible cells are selected
  automatically; all full-universe hashes survive; invalid authority reaches zero Agent calls.

### Anchor `v2-main-same-run-agent-receipt`

- RED/probe: run the public real AgentService with a controlled provider and count calls; compare
  its returned receipt against Main authority/stage evidence; remove or alter the receipt and its
  run/cell/stage hashes.
- Expected: exactly one existing Agent pipeline supplies the canonical same-run receipt; only an
  exact completed receipt can reach persistence and every drift yields zero private writes.

### Anchor `v2-main-private-chain-nonmutation`

- RED/probe: execute selected-cell private persistence/ref/index/G4/serving with before/after
  production hashes and spies on reset/publication/CAS; inject failures at persistence, seal,
  vector, G4 and serving validation.
- Expected: writes remain under the absent-before private root; production/public hashes are
  identical; no reset/publication/CAS call occurs; no failed stage can mint a completed terminal.

### Anchor `v2-main-durable-terminal-report`

- RED/probe: execute one successful and representative failed run, restart/reopen the status/report
  reader and verify the stored Core objects and phase lineage.
- Expected: success reopens as canonical `STRICT_TEST_COMPLETED_PRIVATE`; failure reopens as the
  correct `STRICT_TEST_FAILED` stage. Both conserve full versus selected denominators and retain
  the two false production flags with no legacy fallback.

## Required Tests And Evidence

Add focused request/API, orchestrator, same-run Agent-consumer, private-workspace and integration
tests. The main integration test must use the real `AgentService` plus a controlled provider; a
handwritten object implementing `AgentService.run()` or a fabricated `agentResult()` is not chain
evidence. Existing Core contract tests and Agent probes are upstream evidence only.

At minimum return:

```text
npm run build:check
npx vitest run test/unit/StrictTestDimensionOrchestrator.test.ts test/unit/StrictTestDimensionApi.test.ts test/unit/StrictTestRequestContracts.test.ts test/unit/StrictTestPrivateWorkspace.test.ts
npx vitest run test/integration/StrictTestDimensionPipeline.integration.test.ts test/integration/StrictTestDimensionHttpContract.integration.test.ts
npx vitest run test/unit/StrictPreparedPersistenceRecovery.test.ts test/unit/StrictPrivateCorpusRevisionIsolation.test.ts test/unit/StrictSealedCorpusVerification.test.ts
npx vitest run test/integration/StrictRecipePipelineFacade.integration.test.ts
npm run lint:repo-boundary
npm run lint:consumer-core-imports
npm run check
git diff --check
```

Add one deterministic Main probe, exposed as `npm run probe:strict-test-main`. Its JSON must show:
one start, selected dimension, dimension count 26, selected cell IDs, Agent call count/run/receipt
and stage hashes, private terminal/report hashes, production before/after equality, and reset/
publication/CAS call counts. Include the probe output, exact changed files, commit/parent/tree hashes
and clean-worktree proof in the result.

## Repository And Scope Boundaries

- In scope: Alembic Main source/tests/scripts/package metadata required by this backend.
- Out of scope: AlembicCore, AlembicAgent, AlembicDashboard, AlembicPlugin, Test, BiliDili source,
  Dashboard wiring, DaemonJob redesign and production UI behavior.
- Forbidden: legacy bootstrap fallback; manual selection/confirmation; a second Agent pipeline;
  synthetic success receipts; production reset/publication/CAS; exposing the private bundle through
  public MCP/readers; treating one selected dimension as full production completion.

## Completion Definition

The Alembic target may return completed only when the exact public Main API runs the accepted
producer/consumer chain from real preflight through the same-run Agent receipt and sealed private
terminal/report, all five anchors pass with reviewable raw evidence, production non-mutation is
proved, the scoped implementation is committed, and the worktree is clean. Dashboard and real Test
remain blocked until controller review accepts this target and later phases are separately created.
