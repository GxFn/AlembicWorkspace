# V2 Alembic Main strict-test private pipeline controller review — rework 1

Date: 2026-08-01

## Review conclusion

- User goal: continue the accepted AlembicAgent producer into Alembic Main so one explicit strict-test flow freezes the complete authority, automatically selects one applicable dimension, consumes the same-run Agent receipt, completes the isolated private corpus/index/G4/serving chain, and returns durable private terminal/report evidence without production or public mutation.
- Target: `Alembic / v2-alembic-main-strict-test-private-pipeline-t1`.
- Reviewed commit: `b0f3f31494c991030f4aeae7bff75f99a07253dd`, parent `c95dccb87bdc5a8412792f97917aed6992024b7e`, clean worktree.
- Decision: **rework**. The successful fixture proves a real happy-path chain, but the implementation and evidence do not satisfy all five acceptance anchors.
- Forbidden conclusion: this review does not authorize Dashboard or Test dispatch and does not claim production cold-start completion.

## Authority reviewed

- `Design/docs/current/recipe-coldstart-production-quality-original-plan-2026-07-15.md`
- `Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md`
- `Design/docs/current/recipe-coldstart-strict-test-profile-supplement-requirement-design-2026-07-30.md`
- `wakeflow-ledger/AlembicWorkspace/recipe-coldstart-production-quality-2026-07-15/i3-i10-strict-test-automatic-selection-user-decision-2026-07-30.md`
- `wakeflow-ledger/AlembicWorkspace/recipe-coldstart-production-quality-v2-2026-07-31/legacy-flow-closure-and-v2-restart-decision.md`
- `wakeflow-ledger/AlembicWorkspace/recipe-coldstart-production-quality-v2-2026-07-31/v2-alembic-main-strict-test-private-pipeline-controller-contract.md`
- current task package, target result, execution plan, result evidence, commit diff, source, tests and probe.

## Implementation reality

The following chain is real and must be preserved:

`strict-test HTTP mount → DI → StrictTestDimensionOrchestrator → existing AgentService/PipelineStrategy → same-run receipt → private corpus/ref/index → private G4/serving validation → Core terminal/report`

The new runtime has no direct DaemonJob, legacy bootstrap, production reset, publication lock or public CAS call. `finalizeStrictPrivateCandidate` does not construct a public route.

## Blocking defects

### 1. Valid investigated-empty receipts are rejected

`StrictAnalysisRuntime` emits a non-empty `expectedTrustPolicies` set for a valid investigated-empty durable attestation, but `requireStrictTestExecutionReceipt()` validates every receipt with `assertStrictTestDimensionAgentExecutionReceiptV1(receipt, [])`. The Agent validator requires exact policy conservation, so the legal zero-candidate branch cannot complete.

Repair contract:

- pass the exact same-run expected trust policies sealed by the review-stage evidence into the public Agent validator;
- never infer or erase those policies after the Agent returns;
- add a real investigated-empty Main pipeline case that reaches `STRICT_TEST_COMPLETED_PRIVATE` with selected-cell `investigated-empty` final coverage and durable report lineage.

### 2. Start-time revalidation is partial

`revalidateStrictTestPreflight()` checks production/public state, private policy and source facts, then returns the old `checkpoint.currentBindings`. It does not freshly reload and compare provider/model, prompt/SOP, strict config, fact-query/parser backends, embedding adapter, runtime artifact manifest/binding or official Recipe authority.

Repair contract:

- factor one Main-owned fresh binding observation used by both preflight and start revalidation;
- compare every frozen semantic binding from the accepted preflight: project/control/source identities, certified facts/inventory, provider/model, prompt/SOP, strict config, fact/parser backends, embedding, runtime manifest and binding, private policy, production/public/official Recipe hashes;
- preserve the original receipt timestamps while comparing fresh semantic observations;
- any drift must fail before automatic selection and before all Agent/model calls; add real provider, manifest, source and private-policy drift probes with call count zero.

### 3. Failure stages are inaccurate

The orchestrator sets `failedStage=PRIVATE_WORKSPACE_READY` before the whole private execution and changes it only after execution returns. Except for one Agent-receipt error, analysis, expression review, corpus, index, G4 and serving failures are therefore recorded at the wrong stage.

Repair contract:

- make the runtime report or tag exact Core stages at the actual boundaries: `PLAN_COMPILED`, `FACT_SCHEDULE_FROZEN`, `ANALYSIS_FIXPOINT_CLOSED`, `EXPRESSION_SETS_REVIEWED`, `PRIVATE_CORPUS_SEALED`, `PRIVATE_INDEXES_VERIFIED`, `PRIVATE_G4_READY`, `PRIVATE_SERVING_VALIDATED`;
- persist a canonical `STRICT_TEST_FAILED` terminal/report with the exact reached authority for each representative injected failure;
- a detected production/public mutation must not be represented as a completed or ordinary private failure. Preserve the mutation evidence and return a typed fail-closed response consistent with the Core non-mutation contract.

### 4. Public API exposes internal checkpoint and frozen source bytes

The durable checkpoint stores the execution context, whose certified projection includes each file's `contentBase64`. `start()` and `status()` return the whole checkpoint and the HTTP router serializes it unchanged.

Repair contract:

- define explicit public preflight/start/status/report DTOs; never return `executionContext`, carrier, compiled Plan internals, frozen source bytes, credentials, private filesystem paths or private trust material;
- expose only the consumer-needed run identity, phase, automatic-selection summary, typed failure, terminal/report hashes and safe evidence/artifact references;
- keep the full authority only in private durable storage;
- add HTTP response-shape tests that recursively reject `contentBase64`, `executionContext`, source content and private path fields.

### 5. Durable status/report do not revalidate private evidence

Fresh status/report rehash only the checkpoint's embedded objects. They do not reopen the owner policy, reject a new private-data alias, or verify the private-chain/corpus/index/serving artifacts still exist and match the terminal hashes. Deleting or replacing the private artifacts can leave a completed response.

Repair contract:

- before returning a completed status/report, reopen the exact owner/policy and private workspace, then verify the durable private-chain checkpoint and the corpus/index/G4/serving bindings referenced by the terminal;
- owner, alias, missing artifact or hash drift returns a typed integrity failure and never a completed DTO;
- add fresh-process owner, alias, missing-artifact and altered-artifact tests.

## Evidence defects that must be replaced

- The HTTP integration injects a mock service; add at least one `HttpServer → real DI → real strict-test service` flow, plus a forbidden legacy/bootstrap request proving zero DaemonJob enqueue.
- The success fixture has one module and one selected cell. Add a multi-module plan where the selected dimension has multiple eligible cells, then challenge missing, reordered, extra and rehashed receipt cell sets.
- The production fixture is nearly empty. Seed DB/WAL/SHM, Recipe/ref/index/session/config, public bundle/manifest and active-route sentinels and prove exact before/after equality.
- The probe's forbidden-path counts are hard-coded zeros. Replace them with actual spies/instrumentation for legacy bootstrap, DaemonJob, reset, publication lock and public CAS.
- Inject representative persistence, seal, index, G4 and serving failures and verify their exact durable failure stages.
- Align the provider contract with the real HTTP contract. If start is `202 Accepted`, it must return a safe accepted/status DTO and a failed terminal must not be wrapped as success; declare the real 202/409/422 response shapes. The Dashboard consumer must not receive a generated 200-only fiction.

## Fresh controller validation

- `npm run build:check` — pass.
- focused unit suite — 4 files / 44 tests pass.
- focused HTTP + real Main/Agent pipeline — 2 files / 9 tests pass.
- combined independent audit suite — 6 files / 53 tests pass.
- `npm run probe:strict-test-main` — exits successfully, but the forbidden invocation counts are hard-coded and therefore are not accepted proof.
- `git diff --check` — pass; worktree clean.

Passing tests establish the happy path and existing negative cases only. They do not override the blocking defects above.

## TODO / next action

- Rework the same Alembic task and preserve its current scope. Do not create another Alembic package, alter Core/Agent contracts, wire Dashboard, redesign DaemonJob, or dispatch Test.
- Return one superseding commit with raw RED/GREEN evidence for every repair item and the original five anchors.
