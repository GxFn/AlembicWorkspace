# PCVM Review: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Recorded at: `2026-05-30 16:55 CST`
Owner: `AlembicWorkspace`
Scope: review current PCVM execution, cold-start chain risks, task package candidates, and Test placeholders.

## 0. Review Boundary

This review is not a new pass verdict and not a real cold-start acceptance.

Current verified scope:

- Source-derived plan exists for N0-N14 plus EXP expansion.
- N0-N14 passed with focused unit tests, source inspection, temporary fixtures, and deterministic probes.
- `EXP-two-dimensions` and `EXP-full-dimensions` passed only as no-live report/history fixtures.
- Product repositories remained clean after the run.

Not verified:

- No broad `alembic bootstrap`.
- No daemon/Dashboard run.
- No live Agent/model/provider call.
- No real project cold-start result.
- No delivery/wiki/project-skill export.
- No runtime DB mutation on the real ProjectScope data root.

## 1. Plan Execution Problems And PCVM Optimization

Problems observed:

- Verdict scope was too easy to confuse. `pass` meant "node-local fixture pass", not "real cold-start pass".
- The plan mixed state-machine duties with run notes. This was reduced by moving facts to `records/data.md`, issues to `records/issues.md`, and chronology to `records/progress.md`, but the plan still contains historical detail that should eventually be compacted.
- Some PCVM probes were hand-written one-off `node -e` scripts. They produced useful evidence, but they are not reusable enough as canonical PCVM test assets.
- Issue taxonomy mixed product risks, test harness mistakes, and expected no-live boundaries in one `Open Issues` list.
- Early execution had process mistakes: wrong import path, helper-level probe at the wrong boundary, broad integration misrun, wrong tier expectation.

PCVM should optimize:

- Add evidence scope labels to every verdict: `source`, `unit`, `fixture`, `runtime`, `live-ai`, `dashboard`, `delivery`.
- Split issue classes into `product-risk`, `test-gap`, `probe-error`, `expected-boundary`, and `runtime-placeholder`.
- Make node probes reusable scripts or tests instead of one-off terminal snippets.
- Require each node to store `baseline`, `candidate`, `comparison`, `verdictScope`, and `nextBlockedBy`.
- Keep `plan.md` as plan/state only; keep data/issues/progress/review outside the plan.

## 2. Data And Test Logic Problems

Problems observed:

- Current data is useful but partly narrative. Several direct probes are summarized, not stored as machine-readable JSON attachments.
- Test commands prove focused boundaries but not whole-chain behavior.
- `N6` unknown requested dimension ids are silently dropped; this is a report/observability gap.
- `N7` task/session proof did not emit the full presenter skeleton response envelope.
- `N4` degraded analyzer path was not forced.
- `N3` unreadable-file and target-error branches were not forced.
- `N9` and `N11` rely on frozen projections, so they do not prove live provider analysis quality or live producer sourceRef quality.
- `EXP-full-dimensions` was a synthetic no-live fixture; it proves report aggregation behavior, not real full execution.

PCVM should optimize:

- Store probe result JSON under `report/artifacts/` when the output is metric-shaped.
- Add stable fixture scripts for N3/N4/N6/N7/N8-N14/EXP.
- Add explicit "not tested because..." rows for live AI, daemon, Dashboard, delivery, and real project mutation.
- Treat model-dependent quality metrics as placeholders until Test supplies real evidence.

## 3. Actions Done, Missing Actions, Data To Keep

Actions done:

- Built a source-first N0-N14 cold-start PCVM plan.
- Verified data root and write boundary read-only.
- Ran focused unit/integration tests for service lifecycle, intent, cleanup/discovery, materialization, dimension plan, task/session, stage/tool policy, projections, consumers, finalizer, report/history, and expansion aggregation.
- Ran temporary fixture probes for cleanup/discovery/materialization/report/history.
- Ran no-live two-dimension and full-dimension expansion fixtures.
- Recorded observed residual risks and process mistakes.

Actions still missing:

- Convert direct probes into stable scripts/tests.
- Add forced degraded/error fixtures for N3/N4/N7.
- Add report-facing skipped reason for unknown requested dimensions.
- Add presenter-level skeleton response verification.
- Investigate the AlembicCore `ProjectSkillDeliveryContracts` Vitest hang separately.
- Open a new runtime/AI round only after write boundary and Test scope are explicit.

Data to keep:

- `plan.md` as the state machine and node definitions.
- `records/data.md` measured facts, command evidence, and probe summaries.
- `records/issues.md` unresolved product/test/runtime boundaries.
- `records/progress.md` chronological execution log.
- This `records/review.md` as the review and next-task anchor.

Data to avoid keeping in the plan:

- Long command output.
- Raw terminal transcripts.
- Process mistake narratives.
- Runtime/AI placeholders that are not part of the current state machine.

## 4. Cold-start Chain Problems And Main Causes

Current chain risks:

- Write boundary is still the first real hazard. A ProjectScope-aware resolver is safe, but naked resolver fallback can still point runtime output toward the source repo.
- The synchronous cold-start entry performs cleanup, project intelligence, snapshot/report/target-map construction, session creation, async dispatch, and hook calls in one large flow.
- Async fill makes the user-visible skeleton available before real Agent work finishes, so report/status surfaces must be very precise about what is complete.
- `BootstrapConsumers` handles projection consumption, SessionStore updates, candidate accounting, token logging, checkpoint save, event emission, and PCV evidence construction together.
- `InternalDimensionFillFinalizer` handles skill generation, candidate relation graph population, delivery/wiki/semantic memory, report persistence, and PCV report augmentation together.
- Live model quality is not proven. Existing no-live fixtures cannot answer whether analyze/producer prompts produce grounded, valid candidates.
- Observed prior risk remains important: N11 invalid sourceRefs appeared in real-ish Wave 6F context and must be retested live.

Main causes:

- Cold-start grew from a product workflow, not from a PCVM-verifiable chain contract.
- Runtime branches (`skipAsyncFill`, rescan/incremental, checkpoint restore, no-delivery, live delivery, AI-unavailable) are valid but concentrated in the same path.
- Report evidence was retrofitted after workflow behavior existed, so PCV scorecard identity and runtime artifacts are still being projected from several layers.

## 5. Chain Simplicity, Branching, And Responsibility

Conceptual chain is clear:

1. root/data boundary
2. lifecycle
3. intent/plan
4. cleanup/discovery/materialization
5. dimension selection
6. session/task
7. Agent runtime
8. projection/consumer/persistence
9. finalizer
10. report/history/job observability

Implementation is not yet simple enough:

- Branches are visible, but not sufficiently isolated as typed stage contracts.
- Rescan/incremental logic and cold-start logic share runtime builders and admission logic; this is practical but makes PCVM harder to score.
- Consumer and finalizer modules have too many responsibilities.
- Skill-only dimensions and candidate dimensions share the same report scorecard path; this works, but must remain explicit through `not-applicable` rather than hidden skip.

Responsibility clarity is partial:

- `AlembicCore` owns deterministic plan/materialization/report contracts.
- `Alembic` owns runtime/container/Agent/finalizer integration.
- `AlembicAgent` owns live model execution quality.
- `AlembicTest` must own real project/live AI/Dashboard evidence.

## 6. Decoupling And Data Transfer

Current data transfer:

- `InternalColdStartArgs` -> `ColdStartWorkflowIntent` -> `ColdStartWorkflowPlan`.
- Project analysis output -> `ProjectSnapshot`.
- `ProjectSnapshot` -> cold-start report, target file map, selected dimensions.
- selected dimensions -> task definitions and `bootstrapSession`.
- runtime preparation -> `InternalDimensionFillPreparation` and initialized runtime services.
- parent Agent session -> child dimension `AgentRunResult`s.
- child result -> `BootstrapDimensionProjection`.
- projection -> `dimensionStats`, `dimensionCandidates`, `candidateResults`, SessionStore, checkpoint, process events.
- session/finalizer result -> workflow report, history, snapshot, job events, PCV scorecard.

Decoupling assessment:

- Intent/plan/project snapshot are reasonably decoupled.
- Agent result projection is a good boundary.
- Consumer side effects are too coupled: one function updates too many surfaces.
- Finalizer side effects are too coupled: delivery, semantic memory, skills, graph relations, and report augmentation should be separable steps with typed outputs.
- PCV evidence currently travels inside `dimensionStats.pcvNodeEvidence`, which works for report aggregation but should be treated as a first-class evidence envelope for tests and runtime reports.

## 7. Engineering Task Packages

### Package A: PCVM Evidence Contract And Artifact Hygiene

Goal: make PCVM impossible to confuse fixture pass with runtime pass.

Tasks:

- Add verdict scope fields and issue classes to PCVM artifacts.
- Move reusable probes from ad hoc commands into `PCVM` or product test scripts.
- Store machine-readable probe JSON under `report/artifacts/`.
- Add a validator that fails if a node `pass` lacks scope, evidence links, and residual-risk status.

Success metrics:

- 100% nodes have `verdictScope`.
- 100% open issues have issue class.
- No direct probe is accepted without a stored JSON summary or stable test reference.

### Package B: Cold-start Boundary And Presenter Tests

Goal: fix deterministic engineering/test gaps before live AI.

Tasks:

- Add presenter skeleton response test for N7.
- Add unknown requested dimension skipped-reason reporting.
- Add N3 unreadable-file / target-error fixtures.
- Add N4 degraded analyzer warning fixture.
- Investigate `ProjectSkillDeliveryContracts` Vitest hang as a separate Core test issue.

Success metrics:

- N7 skeleton envelope has session/task/status evidence.
- Unknown dimensions appear in report or diagnostics with reason.
- N3/N4 degraded fixtures produce explicit warnings, not silent pass.
- Core contract test either passes or is marked with a reproducible failure.

### Package C: Runtime Report Evidence Refactor

Goal: make PCV evidence a first-class runtime envelope.

Tasks:

- Introduce a typed `PcvNodeEvidenceEnvelope` separate from generic `dimensionStats`.
- Keep skill-only N11 as explicit `not-applicable`.
- Preserve N8-N14 links in report/history/job events from a single evidence source.
- Add reusable two/full-dimension fixtures to product tests.

Success metrics:

- Report scorecard, comparison hints, history manifest, and job events derive from the same evidence envelope.
- Candidate and skill-only dimensions are distinguishable in report metrics.
- N11 sourceRef validity is visible per dimension and in aggregate.

### Package D: Consumer/Finalizer Responsibility Split

Goal: simplify cold-start chain responsibilities.

Tasks:

- Split `consumeBootstrapDimensionResult` into projection validation, session-store update, candidate accounting, checkpoint persistence, PCV evidence construction, and event emission steps.
- Split finalizer into skill generation, candidate relation graph, delivery/wiki/semantic memory, report persistence, and report augmentation steps.
- Add typed step outputs and step-local tests.

Success metrics:

- Each side-effect step can be tested without running Agent or finalizer.
- Failure in one optional step does not obscure the main dimension result.
- PCVM can score each step independently.

## 8. Test Placeholders For AI-Dependent Stages

Reserved for `AlembicTest`:

- `TEST-AI-1`: one real project, one selected dimension, live Agent analyze + quality + record repair; no delivery.
- `TEST-AI-2`: one real project, candidate-producing dimension, live producer; verify sourceRefs, rejected reasons, and N11 scorecard.
- `TEST-AI-3`: real project full active dimensions, no delivery; verify missing/failed dimensions, N8-N14 links, performance, and sourceRef validity.
- `TEST-AI-4`: Dashboard/daemon observation; verify job status, process events, report/history surfaces, cancellation/timeout behavior.
- `TEST-AI-5`: explicitly authorized delivery/wiki/project-skill export on a safe test project.

Each Test task must return:

- real project id/path category, not sensitive details
- command or UI route used
- job id/session id
- report/history paths
- pcvScorecard summary
- sourceRef validity summary
- failed/missing/skipped dimension list
- screenshots only if Dashboard/manual observation is part of the task

## 9. PCVM Completeness Principle

PCVM should not optimize against fake success.

Rules for the next round:

- No-live fixture pass can only unlock engineering refactor and deterministic test work.
- Live Agent/model quality cannot be inferred from frozen projections.
- Real project behavior belongs to `AlembicTest` after engineering gates are stable.
- Every optimization must declare its metric before execution: invalid sourceRefs, missing evidence links, skipped dimensions, stage timeout, candidate usefulness, duplicate ratio, report mismatch, delivery write safety, or Dashboard observability.
- A unified design/fix task package must be created before code changes; random one-off bug fixes should be avoided unless they unblock a named metric.
