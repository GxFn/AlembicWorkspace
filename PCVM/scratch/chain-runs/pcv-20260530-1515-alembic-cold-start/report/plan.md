# Progressive Chain Validation Plan: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Target: Alembic internal Agent cold-start / bootstrap workflow
Target project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
Source repository root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
PCV artifact root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/PCVM/scratch/chain-runs/pcv-20260530-1515-alembic-cold-start`
Data root: `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
Maintainer: `AlembicWorkspace`
Started at: `2026-05-30T15:04:00+08:00`
Current node: `none`
Current section phase: `execution`
Status values: `pending`, `running`, `pass`, `fail`, `blocked`, `skipped`

Execution cursor: no node may change status until a new runtime/AI/delivery execution round is explicitly opened.

Primary deliverable: this document is the PCVM state machine for later node-by-node execution. It is source-derived from Alembic/AlembicCore code and aligned to the canonical PCV Alembic cold-start/rescan overlay. It is not a product implementation, not a Test handoff, and not permission to run a broad cold-start.

## Scope

Workflow boundary: internal Alembic cold-start path that uses Alembic internal Agent runtime to analyze a target project, produce candidates / project skills, persist runtime evidence, finalize delivery/report state, and expose daemon / Dashboard job evidence.

Executor scope: `mixed`

- `source`: resident internal handler `Alembic/lib/resident/tool-handlers/bootstrap-internal.ts`.
- `source`: daemon / Dashboard route `Alembic/lib/daemon/DaemonJobRunner.ts` and `Alembic/lib/tools/adapters/DashboardOperations.ts`.
- `source`: core plan, intent, presenter, and project analysis modules in `AlembicCore/src/workflows/cold-start/` and `AlembicCore/src/workflows/capabilities/project-intelligence/`.
- `source`: internal dimension execution modules in `Alembic/lib/workflows/capabilities/execution/internal-agent/`.

Plan mode: `plan-only` until an explicit node execution round is opened.

Output language: Chinese, with stable English node ids.

Out of scope for this run:

- No Alembic product source changes.
- No canonical PCV source changes.
- No full cold-start execution.
- No real project AI test.
- No Dashboard manual observation.
- No real-project / runtime / AI evidence collection until a later node explicitly requires it.

## Plan Quality Standard

- `source` evidence derives from code, tests, symbols, or local source inspection.
- `reference` evidence derives from PCV skill, adapter, metrics contract, and Alembic cold-start/rescan overlay.
- `observed` evidence may be used as baseline context, but it cannot pass a new node.
- Every node has a useful unit, quality gate, stage loss, baseline placeholder, candidate placeholder, comparison rule, verdict, evidence links, and residual risk.
- Every node has a node-local fixture or frozen upstream artifact, downstream cut, reset rule, and isolation proof.
- Broad commands are forbidden before component nodes pass. A broad command can only be observation-only if no safer stop point exists and N0 has already proven the write boundary.

## Safety Boundary

- Repository under edit: none for this plan generation.
- External test project: none.
- Runtime data location: `/Users/gaoxuefeng/.asd/workspaces/ecf32806` through ProjectScope-aware Ghost resolver.
- Commands allowed after `EXP-full-dimensions` pass: read-only source inspection, current plan validation, and explicit next-stage planning only.
- Commands still requiring later node pass or explicit task package: runtime writes, daemon service starts, Dashboard service starts, broad bootstrap/rescan, AI provider calls, delivery/wiki/project-skill writes, generated knowledge writes, database mutation, and real project mutation.
- Destructive operations allowed: no.

## N0 Data Location Preflight

Status: `pass(scope=source)` at 2026-05-30 15:13 CST.

Necessary plan update:

- Current node advanced from `N0-data-location` to `N1-bootstrap-container-lifecycle`.
- Runtime data root for ProjectScope-aware execution is `/Users/gaoxuefeng/.asd/workspaces/ecf32806`.
- Broad cold-start, daemon, Dashboard, AI, delivery, and DB mutation remain blocked until later nodes authorize them.

Records:

- Data facts: `records/data.md#n0-data-location`
- Residual issues: `records/issues.md#i-001-naked-resolver-fallback-risk`
- Progress log: `records/progress.md`

## Evidence Schema

- Required artifact: this `report/plan.md`.
- Record files: `records/data.md`, `records/issues.md`, `records/progress.md`.
- Optional bulky attachments: only for command output, JSON, screenshots, or machine output that does not fit the record files.
- Metrics contract: inline in each node and in the scorecard summary.
- Baseline class: source-derived placeholders plus observed Wave 6F context for PCV scorecard/report identity only.

Observed baseline context that must not auto-pass nodes:

- `observed`: Wave 6F accepted report identity projection for N9 record repair after Alembic commit `a6155533b702e82a2e01d8cbfa69b261926fc0b8` and AlembicTest commit `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33`.
- `observed`: after-run job `bootstrap_mprx8joc_ea1bd248`, session `bs_1780119583428_0fphgd`, four report surfaces contained `n9RecordRepair`, `pcvm:n9:record_repair`, and `pcvm:cold-start:n9:repair`.
- `observed`: N11 `producer_source_refs_invalid` 7/44 remains future node risk, not a blocker for this plan artifact.

## Source-First Chain Analysis

- Entry points:
  - `source`: `Alembic/lib/resident/tool-handlers/bootstrap-internal.ts` exports `runInternalColdStartWorkflow` as `bootstrapKnowledge`.
  - `source`: `Alembic/lib/tools/adapters/DashboardOperations.ts` `bootstrapProject()` creates/runs a daemon `bootstrap` job.
  - `source`: `Alembic/lib/daemon/DaemonJobRunner.ts` `executeInternalWorkflow()` imports `bootstrap-internal` and runs `bootstrapKnowledge()`.
- Call path:
  - `source`: `runInternalColdStartWorkflow()` resolves project/data roots, creates intent, builds cold-start plan, runs full-reset cleanup, runs `ProjectIntelligenceCapability.run()`, builds snapshot/report/target map/dimensions/session, optionally dispatches async dimension execution, and returns a skeleton response.
  - `source`: `dispatchInternalDimensionExecution()` schedules `runInternalDimensionExecution()` through `setImmediate()`.
  - `source`: `runInternalDimensionExecution()` prepares runtime, checks AI readiness, initializes bootstrap runtime, runs dimension Agent session, then finalizes.
- State boundaries:
  - project/data roots, cleanup result, phase results, immutable project snapshot, target file map, dimension list, cached analysis session id, bootstrap session/task state, Agent runtime context, session store, candidate result state, skill delivery receipts, workflow report, daemon job record.
- Async / external / persistence boundaries:
  - `source`: `setImmediate()` dispatch; `BootstrapTaskManager` skeleton/filling/completed/failed/cancelled state; `AgentService.run()` model-backed child execution; `persistWorkflowResult()` / report history; daemon `JobStore`; optional Dashboard/Realtime event bridge.
- Branches and degradation:
  - `source`: `skipAsyncFill` makes skeleton-only response; `skipTargetDelivery` skips delivery/wiki; AI unavailable emits skipped dimension completions; empty project returns early; cancellation aborts active session; checkpoint/incremental restore can skip dimensions; producer summary timeout can be recoverable if candidates were already submitted.
- Side effects and write surfaces:
  - full-reset cleanup, project analysis materialization, DB/knowledge graph writes, checkpoint writes, skill writes, delivery/wiki/semantic memory writes, `.asd/bootstrap-report.json`, report history, daemon job records, job process event artifacts.
- Artifact producers and consumers:
  - snapshot/report/targetFileMap, `bootstrapSession`, `processEvents`, PCV stage node map/evidence, candidates, SessionStore reports, checkpoints, ProjectSkillDeliveryReceipt, workflow report, `pcvScorecard`, daemon job events.
- Existing focused tests:
  - `source`: `BootstrapInputBuilder.test.ts`, `BootstrapSessionExecutionBuilder.test.ts`, `BootstrapDimensionConsumer.test.ts`, `InternalDimensionFillFinalizer.test.ts`, `DaemonJobRunner.test.ts`, `PcvN11SourceRefReplay.test.ts`, `BootstrapTaskManager.test.ts`, `RealProjectBootstrap.test.ts`, `AlembicCore/test/PublicHostAgentWorkflowEntrypoints.test.ts`.
- Observability gaps:
  - `open`: N0 runtime data root and write surface are not yet resolved for the next real execution.
  - `open`: N3/N4 can inspect existing tests, but cold-start runtime write safety is not proven for any target project in this plan-only round.
  - `open`: N8/N9/N11/N12 have PCV evidence builders, but current node-local baseline fixture for a new run is not yet selected.
  - `open`: N13 delivery/no-delivery routing needs a safe target and explicit node-local fixture before runtime.

## Source Chain Map

| Order | From | To | File / Symbol | Boundary Type | Node Candidate |
| --- | --- | --- | --- | --- | --- |
| 0 | handler / dashboard / daemon | root + data root resolution | `InternalColdStartWorkflow.runInternalColdStartWorkflow`, `resolveProjectRoot`, `resolveDataRoot` | path / write boundary | `N0-data-location` |
| 1 | daemon job or direct handler | service lifecycle | `DaemonJobRunner.createDaemonJob`, `runDaemonJob`, `BootstrapTaskManager` | service / state | `N1-bootstrap-container-lifecycle` |
| 2 | raw args | cold-start intent + workflow plan | `createInternalColdStartIntent`, `buildColdStartWorkflowPlan` | semantic input | `N2-entry-intent` |
| 3 | plan cleanup | full reset | `runFullResetPolicy`, `CleanupService.fullReset` | destructive runtime write | `N3-full-reset-and-discovery` |
| 4 | projectRoot | files, AST, entity/call graph, guard, panorama, dimension base | `ProjectIntelligenceCapability.run`, `ProjectIntelligenceRunner.runAllPhases` | analysis materialization | `N4-project-intelligence-materialization` |
| 5 | rescan-only fixture | recipe snapshot / cleanup | `runRescanCleanPolicy`, `InternalKnowledgeRescanWorkflow` (reference path) | rescan persistence | `N5-rescan-preservation-gate` |
| 6 | snapshot | dimension plan | `selectColdStartDimensions`, `applyTestDimensionFilter`, `runPhase4_DimensionResolve` | execution plan | `N6-dimension-plan` |
| 7 | dimensions | session + task skeleton | `startInternalDimensionExecutionSession`, `buildTaskDefs`, `BootstrapTaskManager.startSession` | async state | `N7-session-task-manager` |
| 8 | session view | stage policy + runtime preparation | `prepareInternalDimensionFillRun`, `initializeBootstrapRuntime`, `createBootstrapDimensionRuntimeInput`, `buildBootstrapSessionExecutionInput` | runtime / tool policy | `N8-stage-factory-tool-policy` |
| 9 | child Agent input | analyze / quality / record repair | `AgentService.run`, `BootstrapProjections`, `buildPcvAnalyzeGroundingLedgerSummary`, `buildPcvN9StageProjectionEvidence` | model / Agent | `N9-agent-analyze-quality` |
| 10 | existing recipe / rescan context | evolve / prescreen | `BootstrapRescanState`, `resolveBootstrapDimensionPlan` | conditional rescan branch | `N10-evolve-prescreen` |
| 11 | analysis projection | producer candidates | `projectBootstrapDimensionAgentOutput`, `buildPcvN11ProduceEvidence` | producer / candidate | `N11-produce-candidates` |
| 12 | producer output | consumers + persistence | `consumeBootstrapDimensionResult`, `saveDimensionCheckpoint`, `buildPcvN12ConsumerPersistenceEvidence`, `consumeBootstrapCandidateRelations` | persistence | `N12-consumers-persistence` |
| 13 | session result | completion finalizer | `finalizeInternalDimensionFill`, `runWorkflowCompletionFinalizer`, `consumeBootstrapSkills` | delivery / skill / semantic memory | `N13-finalizer-policy` |
| 14 | final result | report, history, daemon job | `persistWorkflowResult`, `persistEfficiencyAugmentedWorkflowReport`, `writeWorkflowReportHistory`, `JobStore`, `JobProcessEventRecorder` | report / history | `N14-report-history` |
| EXP1 | one dimension passed | two dimensions | PCV expansion rule | expansion | `EXP-two-dimensions` |
| EXP2 | two dimensions passed | full dimensions | PCV expansion rule | expansion | `EXP-full-dimensions` |

Side effects:

- Runtime cleanup, DB/file materialization, checkpoints, generated skills, delivery/wiki/semantic memory, `.asd` reports, daemon job process events.

Artifacts:

- `cleanup`, `report`, `targets`, `filesByTarget`, `analysisFramework`, `bootstrapSession`, `processEvents`, `pcvScorecard`, workflow history, daemon job record.

## Analysis Chain Narrative

1. `source`: Dashboard, daemon, or resident handler enters `bootstrapKnowledge` and reaches `runInternalColdStartWorkflow`.
2. `source`: workflow resolves `projectRoot` and `dataRoot`, creates cold-start intent from args, builds plan with full-reset cleanup and ProjectIntelligence scan/materialization options.
3. `source`: full reset runs before project analysis. This is the first true write boundary and therefore cannot be executed until N0 proves runtime write paths.
4. `source`: ProjectIntelligence collects files, performs AST/entity/call graph/dependency/panorama/guard/dimension resolution, and returns a phase result.
5. `source`: workflow builds immutable `ProjectSnapshot`, report, target file map, selected dimensions, cached project analysis session, task definitions, and bootstrap session skeleton.
6. `source`: unless `skipAsyncFill=true`, dimension fill is dispatched asynchronously. The skeleton response alone proves N0-N7 only if write boundaries and skeleton invariants pass; it does not prove Agent stages.
7. `source`: dimension fill prepares runtime, initializes memory/session/semantic/code graph state, builds dimension Agent inputs with PCV stage node maps, and runs a parent bootstrap-session profile with child bootstrap-dimension inputs.
8. `source`: child Agent results are projected into analysis/producer outputs, consumed into SessionStore/candidates/checkpoints, summarized into PCV evidence, and sent through event emitters.
9. `source`: finalizer consumes skills, candidate relations, delivery/wiki/semantic memory policy, workflow persistence, report augmentation, PCV scorecard, and job process event records.
10. `reference`: cold-start full reset should not use rescan preservation unless existing recipe/rescan fixture is deliberately selected; N5 and N10 remain explicit conditional nodes rather than silent skips.

## Node Cut Strategy

| Cut | Evidence Class | Boundary | Why Separate | Node-Local Fixture | Downstream Cut | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| C0 | source/reference | path + write roots | first safety gate | read-only resolver facts | no cleanup | keep |
| C1 | source | container/daemon/job manager | lifecycle can fail before intent | mocked ServiceContainer / JobStore | no workflow execution | keep |
| C2 | source | args -> intent/plan | semantic input can normalize/ignore flags | args object | no cleanup | keep |
| C3 | source | full reset + discovery | destructive cleanup then file scan | isolated dataRoot fixture | no Agent dispatch | split |
| C4 | source | materialization + snapshot | broad deterministic analysis boundary | frozen phase result | no task/session | keep |
| C5 | reference | rescan preservation | not in pure cold-start but must be explicit | existing-recipe fixture | no cleanup if not selected | conditional |
| C6 | source | dimensions | execution plan can over/under select | frozen snapshot | no task start | keep |
| C7 | source | session/task skeleton | async state and cancellation boundary | dimensions fixture | no Agent runtime | keep |
| C8 | source | runtime/stage/tool policy | terminal/tool policy and PCV map boundary | one dimension fixture | no model call | keep |
| C9 | source/observed | analyze/quality/record repair | quality-gated Agent output boundary | frozen Agent input or deterministic result | no producer/finalizer | split |
| C10 | reference/source | evolve/prescreen | rescan/existing-recipe branch | existing recipe fixture | no producer | conditional |
| C11 | source/observed | producer candidates | sourceRefs/dedup/tool policy boundary | frozen analysis artifact | no persistence/finalizer | keep |
| C12 | source | consumers/persistence | candidate and failure persistence boundary | producer tool calls fixture | no finalizer | keep |
| C13 | source | finalizer policy | delivery/wiki/semantic/skill side effects | final session fixture | no report history | keep |
| C14 | source/observed | report/history/job | user-visible persisted evidence | finalizer result fixture | no new workflow run | keep |

## Branch And Degradation Paths

| Branch | Boundary | Trigger | Effect | Evidence | Decision |
| --- | --- | --- | --- | --- | --- |
| empty-project | N4 | `phaseResults.isEmpty` | returns empty response; N6-N14 not applicable | `presentInternalColdStartEmptyProject` data | separate branch if selected |
| skip-async-fill | N7 | `intent.internalExecution.skipAsyncFill=true` | skeleton only; N8-N14 not evaluated | response + logger | can pass N7 only |
| ai-unavailable | N8/N9 | AI runtime not ready | emits skipped dimension completions; no normal Agent evidence | `emitInternalDimensionFillAiUnavailable` | blocks N9 quality |
| skip-target-delivery | N13 | `skipTargetDelivery=true` | delivery/wiki skipped; semantic may still be evaluated per finalizer | `runWorkflowCompletionFinalizer` steps | separate no-delivery variant |
| cancellation | N7-N13 | Dashboard/user/session abort | tasks cancelled and job can finalize cancelled | `BootstrapTaskManager.abortSession`, `cancelDaemonJob` | branch must not pass quality |
| checkpoint/incremental restore | N7/N10 | checkpoint or incremental plan | dimension may skip Agent child | `resolveBootstrapDimensionAdmissions` | cold-start conditional, rescan explicit |
| producer-timeout-recovered | N11/N12 | producer summary timeout after accepted submits | candidates preserved, runIssue cleared | `isRecoverableProducerTimeoutIssue` | evaluate N11/N12 with timeout residual risk |
| record-repair-not-needed | N9 | quality gate passed without repair phase | stage-map identity retained as not-applicable | `buildPcvN9RecordRepairStageMapEvidence` | pass identity only, not repair behavior |

## Execution Control Gate

- Current node cursor: `none`
- Current section phase: `execution`
- Only this node may change status in the next round: `no`
- Smallest allowed next action: decide a new explicitly authorized runtime/AI/delivery execution round, or stop at the completed no-live fixture expansion.
- Terminal mode and timeout budget: sync read-only commands and focused fixture tests only, max 10s each, until a focused two-dimension expansion round is explicitly opened.
- Terminal output policy: inline summary unless intent/plan facts are bulky.
- Terminal exit evidence: command exit status plus two-dimension comparison facts in EXP evidence.
- Terminal non-interactive guarantee: read-only `rg`, `sed`, `git status`, and node-local probes only; no interactive prompts.
- Forbidden broad actions before a new runtime/AI/delivery round is explicitly opened: any broad `alembic bootstrap`, broad rescan, daemon start, Dashboard start, live AI provider call, real delivery/wiki/skill write, live full dimensions, full `--wait` run.
- Node-local fixture: frozen Agent result or deterministic projection artifact for one selected dimension.
- Downstream cut: stop before producer candidate creation and persistence.
- Reset rule: no runtime writes.
- Isolation proof: N0 showed source tree mutation false and write roots external; N1 tests left product git status clean; N2 stayed pure intent/plan; N3 wrote only temporary fixture/data roots and removed them; N4 wrote only temporary fixture roots and removed them; N5 was branch-gated without runtime writes; N6 stayed pure selection/filter logic; N7 used mocked task/session state only; N8 built inputs/policies without model execution.
- Full-run confirmation allowed only after N0-N14 or explicit selected component nodes pass and expansion gates are satisfied.

## Workflow Variant Orders

### Variant A: internal cold-start skeleton-only

1. `N0-data-location`: prove safe project/data root.
2. `N1-bootstrap-container-lifecycle`: prove ServiceContainer/daemon/job/task services initialize.
3. `N2-entry-intent`: prove args normalize to internal cold-start intent.
4. `N3-full-reset-and-discovery`: prove cleanup and file discovery under isolated data root.
5. `N4-project-intelligence-materialization`: prove snapshot/report/target map materialization.
6. `N6-dimension-plan`: prove active dimension list and filtering.
7. `N7-session-task-manager`: prove skeleton session/task response with `skipAsyncFill=true`.

### Variant B: internal cold-start single-dimension no-delivery

1. Pass Variant A through `N7`.
2. `N8-stage-factory-tool-policy`: one dimension, no delivery, stage/tool policy and PCV map.
3. `N9-agent-analyze-quality`: one dimension, analyze/quality/record repair evidence.
4. `N11-produce-candidates`: same dimension, frozen analysis artifact, producer cut.
5. `N12-consumers-persistence`: same dimension, consumer/session/checkpoint persistence.
6. `N13-finalizer-policy`: no-delivery finalizer policy.
7. `N14-report-history`: persisted report/history/job evidence.

### Variant C: internal rescan / existing recipe

1. `N0`, `N1`, `N2` with rescan intent.
2. `N5-rescan-preservation-gate`.
3. `N3`, `N4`, `N6`, `N7`.
4. `N10-evolve-prescreen`.
5. `N9`, `N11`, `N12`, `N13`, `N14`.

### Variant D: expansion

1. `EXP-two-dimensions`: one extra dimension only; same provider, same data root, same no-delivery mode.
2. `EXP-full-dimensions`: full dimension set only after two-dimension evidence is stable.
3. Full end-to-end confirmation: only after delivery write boundary and Test requirement are explicitly decided by total control.

## Reference Alignment

| Reference | Requirement | Derived Node | Status | Action |
| --- | --- | --- | --- | --- |
| PCV Skill | write `scratch/chain-runs/<run-id>/report/plan.md` first | this plan | covered | keep as primary artifact |
| PCV Data Location Preflight | N0 before runtime writes | N0 | covered | execute before any runtime |
| PCV Alembic Adapter | do not run user workflow from Alembic repo without safe external project | N0/N3 | covered | block broad commands |
| Alembic overlay N0 | Ghost workspace/write boundary | N0 | covered | first product task |
| Alembic overlay N1 | Bootstrap + ServiceContainer lifecycle | N1 | covered | isolate container/job |
| Alembic overlay N2 | Entry parameters and semantic intent | N2 | covered | intent fixture |
| Alembic overlay N3 | Discovery/file collection | N3 | split | includes cleanup + discovery; can split further on failure |
| Alembic overlay N4 | Non-AI materialization | N4 | covered | snapshot/report/target map |
| Alembic overlay N5 | Rescan preservation | N5 | not-applicable for pure cold-start, conditional for rescan | keep explicit node |
| Alembic overlay N6 | Dimension plan | N6 | covered | dimension fixture |
| Alembic overlay N7 | Session and TaskManager | N7 | covered | skeleton session |
| Alembic overlay N8 | Stage factory and tool policy | N8 | covered | PCV N8 evidence builder |
| Alembic overlay N9 | Agent analyze quality | N9 | split | includes analyze, quality gate, record repair identity |
| Alembic overlay N10 | Evolve / prescreen | N10 | conditional | existing recipe / rescan branch |
| Alembic overlay N11 | Produce | N11 | covered | PCV N11 evidence builder |
| Alembic overlay N12 | Consumers / persistence | N12 | covered | SessionStore/checkpoint/report evidence |
| Alembic overlay N13 | Finalizer policy | N13 | covered | delivery/no-delivery and semantic memory |
| Alembic overlay N14 | Report/history/snapshot | N14 | covered | workflow report/job surfaces |
| Overlay expansion | two dimensions then full dimensions | EXP nodes | covered | not a broad first run |

## Reference Benchmark Review

- Benchmark reference: `progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md`.
- Meets benchmark clarity: `partial-ready`.
- Improvements over benchmark:
  - Uses current Alembic source symbols and tests rather than only overlay labels.
  - Keeps N5/N10 explicit as not-applicable/conditional instead of silently skipping.
  - Pulls daemon / Dashboard job evidence into N14 rather than treating report persistence as only file output.
  - Treats Wave 6F as observed baseline context only, not pass evidence.
- Benchmark gaps still missing:
  - N0 runtime resolver evidence must be collected in the first execution round.
  - Node-local fixtures for N3-N14 must be materialized before scoring candidates.
  - No real-project AI runtime evidence is included yet.
- Skill/template/overlay improvements discovered:
  - Overlay should explicitly mention daemon `JobStore` / process event bridge as N14 report-history consumer surfaces.
  - Overlay should mention `record_repair` can be stage-map-only when quality passes, so report identity can be valid while repair execution is not applicable.

## Node-To-Test Coverage Map

| Node | Existing Test Or Observation | Missing Coverage | First Coverage Action |
| --- | --- | --- | --- |
| N0 | no focused runtime path test in this plan | isolated data root resolver proof | read-only resolver/config probe, then focused resolver unit if needed |
| N1 | `DaemonJobRunner.test.ts`, `BootstrapTaskManager.test.ts` | full ServiceContainer repeat init/shutdown proof | targeted lifecycle test |
| N2 | `AlembicCore/test/PublicHostAgentWorkflowEntrypoints.test.ts` | internal args edge cases for `skipTargetDelivery`/dimensions | Core intent unit |
| N3 | `RealProjectBootstrap.test.ts` Phase 1-4, cleanup policy unit entrypoints | isolated cleanup write boundary | targeted cleanup/discovery fixture |
| N4 | `RealProjectBootstrap.test.ts` Phase 1-4 | per-materializer degraded reason scorecard | focused ProjectIntelligence materialization fixture |
| N5 | rescan tests outside selected cold-start path | not applicable proof for cold-start | source inspection, no runtime |
| N6 | dimension resolve covered indirectly | exact selected/filtered dimension counts | snapshot fixture |
| N7 | `BootstrapTaskManager.test.ts`, session builder tests | skeleton-only response from workflow under safe root | skipAsyncFill fixture after N0 |
| N8 | `BootstrapInputBuilder.test.ts`, `BootstrapSessionExecutionBuilder.test.ts` | stage policy compiled from actual profile under fixture | single dimension stage policy harness |
| N9 | `BootstrapDimensionConsumer.test.ts`, `DaemonJobRunner.test.ts`, Wave 6F observed | new fixture baseline for analyze quality | frozen Agent result / deterministic projection before AI |
| N10 | rescan state/admission tests | existing recipe prescreen fixture | focused rescan branch decision fixture |
| N11 | `PcvN11SourceRefReplay.test.ts`, `BootstrapDimensionConsumer.test.ts` | useful candidate output for current fixture | frozen analysis artifact producer replay |
| N12 | `BootstrapDimensionConsumer.test.ts`, `InternalDimensionFillFinalizer.test.ts` | checkpoint and candidate relation persistence under current fixture | consumer fixture |
| N13 | `InternalDimensionFillFinalizer.test.ts`, completion finalizer tests | delivery/no-delivery write-surface proof | no-delivery finalizer fixture |
| N14 | `DaemonJobRunner.test.ts`, Wave 6F observed | current run report/history/job linkage | report fixture / job event fixture |
| EXP | none | controlled two/full dimension expansion | only after N14 current fixture passes |

## Node Plan

| Node | Source Boundary | Purpose | Stop Condition | Evidence | Pass Criteria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `N0-data-location` | resolver/write roots | confirm source/data/write boundary | no runtime command has run | path table, source pollution check | absolute safe paths, no source runtime writes | pass(scope=source) |
| `N1-bootstrap-container-lifecycle` | ServiceContainer/daemon/job/task manager | prove services can start/stop/job-link safely | before workflow execution | lifecycle unit, JobStore, TaskManager status | repeat init/shutdown/job state clean | pass(scope=unit) |
| `N2-entry-intent` | args -> intent/plan | preserve semantic input | before cleanup | intent object, plan cleanup/projectAnalysis fields | args normalize correctly; incremental ignored for cold-start | pass(scope=unit) |
| `N3-full-reset-and-discovery` | cleanup + file collection | safe full reset and project file set | before AST/materialization | cleanup result, discoverer/files/truncation | writes in dataRoot, generated files excluded | pass(scope=fixture) |
| `N4-project-intelligence-materialization` | AST/entity/call graph/dep/panorama/guard/snapshot | deterministic non-AI materialization | before dimensions/tasks | snapshot/report/target map | useful prompt context with degraded reasons | pass(scope=fixture) |
| `N5-rescan-preservation-gate` | rescan-only recipe snapshot | explicit non-cold-start branch | before cleanup in rescan | recipe snapshot/cleanup proof | not-applicable for cold-start or preserved for rescan | pass(scope=unit) |
| `N6-dimension-plan` | snapshot -> dimensions | correct dimension plan | before session start | selected dimensions, skipped reasons | expected dimensions and filters align | pass(scope=unit) |
| `N7-session-task-manager` | dimensions -> session/tasks | skeleton async state | before Agent runtime | bootstrapSession, taskDefs, events | tasks match dimensions; cancel works; skipAsyncFill safe | pass(scope=unit) |
| `N8-stage-factory-tool-policy` | runtime prep/stage factory | prove stage order/tool policy | before model execution | PCV N8 evidence, Agent input | producer no terminal; PCV map present | pass(scope=fixture) |
| `N9-agent-analyze-quality` | Agent analyze/quality/repair | quality-gated analysis artifact | before producer/finalizer | grounding ledger, quality_gate, record_repair evidence | source-backed findings or actionable rejection | pass(scope=fixture) |
| `N10-evolve-prescreen` | existing recipe/rescan branch | avoid duplicate/decay loss | before produce | rescan context, decisions | healthy recipes not duplicated, severe cases not lost | pass(scope=unit) |
| `N11-produce-candidates` | analysis -> producer | produce valid candidates | before consumer/finalizer | submitted/accepted/rejected/sourceRefs/tool calls | accepted refs valid, rejected reasons actionable | pass(scope=fixture) |
| `N12-consumers-persistence` | producer output -> session/checkpoint/candidate persistence | make accepted/failure results findable | before finalizer | SessionStore, checkpoints, relations, PCV N12 | accepted titles findable; failures persisted | pass(scope=fixture) |
| `N13-finalizer-policy` | session result -> delivery/skills/semantic memory | safe finalization | before report history | delivery verification, skill receipts, semantic summary | cold-start finalizes or no-delivery skip is explicit | pass(scope=fixture) |
| `N14-report-history` | finalizer/job -> report/history | user-visible comparable evidence | before expansion/full-run | report, history, daemon job/events, pcvScorecard | report surfaces link session/node/artifacts | pass(scope=fixture) |
| `EXP-two-dimensions` | expansion | broaden one variable | before full dimensions | two-dim report comparison | no regression against single dimension | pass(scope=fixture) |
| `EXP-full-dimensions` | expansion | full dimension confirmation | before final completion | full report comparison | all required nodes pass or explicit branch skip | pass(scope=fixture) |

## Metrics Contract Summary

Each evaluated node follows the PCV metrics contract: useful unit, quality gate, stage loss, baseline, candidate, comparison, verdict, evidence links, and residual risk. The compact scorecard below is the run-level view; each expanded node section carries the full field set.

| Node | Useful Unit | Quality Gate | Stage Loss Summary | Verdict |
| --- | --- | --- | --- | --- |
| N0 | safe path contract | ProjectScope Ghost roots explicit | naked resolver fallback remains forbidden | pass(scope=source) |
| N1 | repeatable service lifecycle | focused lifecycle tests passed | broad integration misrun recorded separately | pass(scope=unit) |
| N2 | normalized cold-start intent | pure intent/plan probe passed | duplicate dimension ids are preserved at intent boundary; downstream selection owns de-dup | pass(scope=unit) |
| N3 | cleaned isolated project scan input | isolated cleanup/discovery probes passed | only temp fixture/data roots touched; unreadable-file branch remains future edge | pass(scope=fixture) |
| N4 | non-AI project snapshot | ProjectIntelligence fixture produced report/snapshot/target map | no warnings in fixture; degraded branch still future edge | pass(scope=fixture) |
| N5 | preserved rescan recipe truth | branch-gate and rescan policy probes passed | not selected for pure cold-start; real rescan runtime remains separate branch | pass(scope=unit) |
| N6 | dimension execution plan | dimension selection/filter probe passed | unknown requested ids silently drop; no explicit skip reason surface yet | pass(scope=unit) |
| N7 | cancellable bootstrap skeleton | task/session probe passed | missing manager degrades to null session with warning | pass(scope=unit) |
| N8 | stage + tool policy evidence | focused stage/input policy tests and direct fixture passed | producer terminal tools absent; PCV map visible across prompt/shared state | pass(scope=fixture) |
| N9 | quality-gated analysis finding bundle | focused consumer/process/daemon tests plus direct frozen projection passed | live provider behavior deferred; source refs/artifact linkage covered by deterministic events | pass(scope=fixture) |
| N10 | rescan evolve/prescreen decision | branch and rescan-state/admission fixtures passed | cold-start no-context branch explicit; rescan forced execution verified at composition layer | pass(scope=unit) |
| N11 | accepted candidate digest | producer replay and sourceRef validation tests passed | live producer behavior deferred; frozen cut proves accepted/rejected/sourceRef/tool-policy projection | pass(scope=fixture) |
| N12 | findable persisted results | consumer/checkpoint/relation tests and direct N12 probe passed | accepted title findable; failure reason retained | pass(scope=fixture) |
| N13 | safe finalizer result | no-delivery/skill/semantic/finalizer tests and direct summary probe passed | real delivery not opened; skip/receipt semantics explicit | pass(scope=fixture) |
| N14 | comparable report/history row | report/history/job fixture tests and direct N14 probe passed | report/history/job event links present; expansion not yet run | pass(scope=fixture) |
| EXP-two-dimensions | two-dimension comparable report | two-dimension no-live fixture and focused tests passed | no live provider or broad runtime; cross-dimension evidence remains fixture-level | pass(scope=fixture) |
| EXP-full-dimensions | full-dimension comparable report | full TypeScript active-dimension no-live fixture and focused tests passed | live runtime/provider/delivery still deferred behind a new gate | pass(scope=fixture) |

## Expanded Node Sections

### Node `N0-data-location`: Environment, Ghost workspace, write boundary

Target: validate only path resolution and write boundary before cleanup or runtime.

Chain position: first node. Downstream cleanup, analysis, Agent runtime, delivery, and report writes are intentionally not evaluated.

Execution scope: read-only source/config inspection. Target project is Alembic dev repo; runtime target for future execution must be an approved isolated project/data root.

Operational guidance:

- Goal: prove where `projectRoot`, `dataRoot`, DB, generated knowledge, delivery, reports, and job artifacts would land.
- Evidence checklist: absolute project realpath, source repo root, resolver source, data root, `.asd` path, knowledge/candidates/skills/wiki paths, ProjectRegistry/Ghost mode, source pollution check.
- Pass standard: all write roots are explicit, approved, and outside Alembic source repo unless the node explicitly authorizes source edits.
- Failure taxonomy: path, config, registry, source-tree pollution, unknown write mode.
- First optimization action: add or fix a read-only resolver facts probe before runtime.
- Recheck metrics: same path fixture, unsafe write risk count.

Node design/test plan:

- Fixture: resolver/config facts only.
- Upstream freeze: PCVM plan and source repo path.
- Downstream cut point: do not invoke `runFullResetPolicy`.
- Reset rule: no writes.
- Allowed action: `realpath`, `git status`, source/config reads, resolver unit if read-only.
- Forbidden broad actions: `alembic bootstrap`, daemon start, Dashboard start, cleanup, AI call.

Metrics contract:

- usefulUnit: safe runtime write contract.
- qualityGate: `pass`; all N0 required facts are present for ProjectScope-aware execution and source tree mutation remained false.
- stageLoss: `unsafeWriteRisk`, `unknownRuntimeRoot`, `sourcePollutionRisk`.
- baseline: plan-only source fact table from initial generation.
- candidate: see `records/data.md#n0-data-location`.
- comparison: runtime roots resolved to explicit external Ghost roots; raw fallback risk is kept as `records/issues.md#i-001-naked-resolver-fallback-risk`.
- verdict: `pass(scope=source)`.
- evidenceLinks: `@alembic/core/workspace resolveProjectRoot/resolveDataRoot`, `InternalColdStartWorkflow.ts`, `ProjectScopeRegistry.ts`.
- residualRisk: see `records/issues.md`.
- advance rule: N1 may start under a ProjectScope-aware lifecycle fixture only.

### Node `N1-bootstrap-container-lifecycle`: Bootstrap and ServiceContainer lifecycle

Target: validate service lifecycle and daemon/job/task-manager state before workflow logic.

Chain position: after safe paths; before intent cleanup.

Execution scope: isolated service/container/job fixture, no project analysis.

Operational guidance:

- Goal: prove bootstrap services initialize, job process event recorder resets, and TaskManager can start/cancel without dirty state.
- Evidence checklist: ServiceContainer service names, JobStore create/running/complete/cancel states, BootstrapTaskManager session status, repeated init/shutdown.
- Pass standard: repeated lifecycle has no orphan running jobs or stale sessions.
- Failure taxonomy: service registration, DB init, JobStore, event bridge, task session.
- First optimization action: isolate failing service and add focused lifecycle test.
- Recheck metrics: orphan active job count, stale session count, lifecycle error count.

Node design/test plan:

- Fixture: mocked ServiceContainer + JobStore + BootstrapTaskManager.
- Downstream cut point: do not call `executeInternalWorkflow`.
- Allowed action: targeted unit around `DaemonJobRunner` / `BootstrapTaskManager`.
- Forbidden broad actions: running bootstrap workflow.

Metrics contract:

- usefulUnit: clean, cancellable bootstrap service/session shell.
- qualityGate: `pass`; focused lifecycle transitions have terminal state and late task mutation after cancellation is ignored.
- stageLoss: dirty jobs, late task updates, missing event recorder reset.
- baseline: existing `DaemonJobRunner.test.ts`, `BootstrapTaskManager.test.ts` coverage.
- candidate: see `records/data.md#n1-bootstrap-container-lifecycle`.
- comparison: baseline existing tests rerun on same fixtures; focused unit and single-file ServiceContainer integration pass; broad integration misrun is recorded as process issue, not N1 failure.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `Alembic/lib/daemon/DaemonJobRunner.ts`, `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts`.
- residualRisk: see `records/issues.md#i-004-broad-integration-misrun`.
- advance rule: N2 starts after services can host a workflow without dirty state.

### Node `N2-entry-intent`: Entry parameters and semantic intent

Target: validate raw args -> `ColdStartWorkflowIntent` -> `ColdStartWorkflowPlan`.

Chain position: after lifecycle; before cleanup.

Execution scope: pure function fixture with args such as `maxFiles`, `contentMaxLines`, `skipGuard`, `dimensions`, `skipAsyncFill`, `skipTargetDelivery`, `incremental`.

Operational guidance:

- Goal: ensure equivalent entries produce equivalent intent and cold-start ignores file-diff incremental.
- Evidence checklist: executor `internal-agent`, analysisMode `full`, cleanupPolicy `full-reset`, completionPolicy `auto-fill`, `skipAsyncFill`, `skipTargetDelivery`, dimensionIds, projectAnalysis scan options.
- Pass standard: terminal/tool capability is not decided here; no user-project writes.
- Failure taxonomy: arg normalization, ignored flag reporting, executor mismatch, hidden defaults.
- First optimization action: add table-driven Core intent tests.
- Recheck metrics: arg-loss count, unexpected default count.

Node design/test plan:

- Fixture: args object and frozen `projectRoot` / `dataRoot`.
- Downstream cut point: do not call cleanup.
- Allowed action: pure unit for `createInternalColdStartIntent` and `buildColdStartWorkflowPlan`.
- Forbidden broad actions: any workflow execution.

Metrics contract:

- usefulUnit: normalized cold-start intent and workflow plan.
- qualityGate: args map to explicit plan fields with no hidden runtime side effects.
- stageLoss: arg loss, wrong executor, stale legacy fields, unreported ignored incremental.
- baseline: source functions in `AlembicCore/src/workflows/cold-start/`.
- candidate: see `records/data.md#n2-entry-intent`.
- comparison: same args fixture maps to explicit internal intent fields and plan scan fields; `incremental` is retained only as `ignoredFileDiffIncremental` while scan remains `incremental: false`.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `ColdStartIntent.ts`, `ColdStartPlan.ts`, `PublicHostAgentWorkflowEntrypoints.test.ts`.
- residualRisk: duplicate dimension ids are not removed at intent normalization; downstream `selectColdStartDimensions` uses a `Set`, so duplicate execution risk belongs to N6 verification.
- advance rule: N3 starts after intent/plan invariants pass.

### Node `N3-full-reset-and-discovery`: Full reset cleanup and file collection

Target: validate cleanup and file discovery only.

Chain position: after intent; before AST/materialization.

Execution scope: isolated data root, small project fixture, no Agent runtime.

Operational guidance:

- Goal: prove full reset writes to approved dataRoot and file collection selects project files while excluding Alembic-generated files.
- Evidence checklist: cleanup cleared tables/files/errors, discoverer id/name, targets, files, skipped/unreadable, truncation, generated-file exclusions.
- Pass standard: source tree not polluted; discovery respects `maxFiles` and reports truncation.
- Failure taxonomy: cleanup path, DB/file deletion, discoverer mismatch, generated self-reference, unreadable files, truncation ambiguity.
- First optimization action: split cleanup from discovery if either failure is ambiguous.
- Recheck metrics: unsafe deleted paths, collected file count, generated excluded count, unreadable count.

Node design/test plan:

- Fixture: tiny external project + isolated data root.
- Downstream cut point: stop before `runPhase1_5_AstAnalysis`.
- Allowed action: targeted cleanup/discovery harness after N0.
- Forbidden broad actions: full Phase 1-4 if cleanup/discovery is unproven.

Metrics contract:

- usefulUnit: safe, bounded source file set.
- qualityGate: cleanup stays in dataRoot and file set is traceable under projectRoot.
- stageLoss: unsafe write risk, missing skipped reasons, truncated without warning.
- baseline: source inspection of `runFullResetPolicy` and `runPhase1_FileCollection`.
- candidate: see `records/data.md#n3-full-reset-and-discovery`.
- comparison: full reset moved four knowledge-surface directories into temp trash, exported one DB snapshot row, cleared DB tables, removed cache/report/log artifacts, and left temp source project untouched; discovery collected only three fixture source files, reported `node` discoverer, and flagged truncation at `maxFiles=2`.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `InternalColdStartWorkflow.ts`, `WorkflowCleanupPolicies.ts`, `ProjectIntelligenceRunner.ts`.
- residualRisk: broad full reset not executed against real Alembic runtime; unreadable-file and target-error branches were not forced in this N3 pass.
- advance rule: N4 starts after cleanup/discovery proof.

### Node `N4-project-intelligence-materialization`: Non-AI materialization

Target: validate ProjectIntelligence Phase 1.5-4 and snapshot/report/target map.

Chain position: after discovery; before dimension task session.

Execution scope: deterministic project analysis only; no AgentService.

Operational guidance:

- Goal: produce a useful `ProjectSnapshot`, `report`, `targetFileMap`, AST context, graph, panorama, guard summary, and degraded warnings.
- Evidence checklist: AST counts, entity/call graph stats, dependency edges, panorama summary, guard audit stats, `buildProjectSnapshot` fields, report phase totals, target file map keys.
- Pass standard: degraded analyzers record reasons; prompt context is sufficient for later dimensions.
- Failure taxonomy: parser/grammar, graph materialization, guard, target map, snapshot normalization, warning loss.
- First optimization action: add missing degraded reason or focused materializer assertion.
- Recheck metrics: missing report phase fields, warning count with no reason, target map holes.

Node design/test plan:

- Fixture: frozen discovery file set.
- Downstream cut point: stop before `selectColdStartDimensions`.
- Allowed action: targeted ProjectIntelligence test/harness.
- Forbidden broad actions: task/session or Agent dispatch.

Metrics contract:

- usefulUnit: non-AI project snapshot and report fit for prompts.
- qualityGate: all materialized artifacts are traceable to source files and degraded steps explain why.
- stageLoss: missing phase reports, missing warnings, empty target map, graph mismatch.
- baseline: `RealProjectBootstrap.test.ts` Phase 1-4 and source materializers.
- candidate: see `records/data.md#n4-project-intelligence-materialization`.
- comparison: isolated ProjectIntelligence fixture produced 2 files, 1 target, 14 active dimensions, 8 phase report entries, AST context, panorama result, dependency edge write, entity/call graph writes, cold-start report, and target file map.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `ProjectIntelligenceCapability.ts`, `ProjectIntelligenceRunner.ts`, `project-snapshot-builder.ts`, `ColdStartPresenters.ts`.
- residualRisk: fixture had no degraded warnings; future edge still needs a forced analyzer-degradation case if N4 warning quality becomes the optimization target.
- advance rule: N6 starts after snapshot/report/target map pass.

### Node `N5-rescan-preservation-gate`: Rescan existing recipe snapshot and cleanup

Target: keep rescan preservation explicit even though pure full-reset cold-start does not use it.

Chain position: not in Variant A/B pure cold-start. Applies to Variant C before rescan cleanup.

Execution scope: existing recipe fixture and rescan cleanup only.

Operational guidance:

- Goal: prove pure cold-start uses full reset, while rescan preserves active/staging/evolving recipe truth before cleanup.
- Evidence checklist: recipe snapshot, lifecycle distribution, sourceRefs, cleanup report, sync/reconcile warnings.
- Pass standard: cold-start marks this node not-applicable with reason; rescan preserves healthy recipes and does not duplicate.
- Failure taxonomy: wrong workflow selected, lost recipes, stale source refs, cleanup overreach.
- First optimization action: add explicit branch assertion at workflow entry.
- Recheck metrics: preserved count, lost active count, stale ref count.

Node design/test plan:

- Fixture: existing recipe DB fixture only for rescan branch.
- Downstream cut point: do not run cold-start full reset as proof for rescan.
- Allowed action: source inspection now; future rescan fixture later.
- Forbidden broad actions: treating cold-start full reset as rescan pass.

Metrics contract:

- usefulUnit: preserved recipe truth for rescan or explicit not-applicable for cold-start.
- qualityGate: selected variant matches cleanup policy.
- stageLoss: accidental recipe loss, duplicate healthy recipes, untracked source refs.
- baseline: overlay reference and Core cleanup policy source.
- candidate: see `records/data.md#n5-rescan-preservation-gate`.
- comparison: cold-start intent remains `full-reset`; rescan intent uses `rescan-clean` / incremental scan by default, force uses `force-rescan` / full scan, and cleanup policy order is `snapshotRecipes` before `rescanClean` or `forceRescanClean`.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `WorkflowCleanupPolicies.ts`, `InternalKnowledgeRescanWorkflow.ts`, `BootstrapRescanState.ts`.
- residualRisk: N5 is not selected for Variant A/B pure cold-start runtime; real rescan execution remains a separate Variant C branch.
- advance rule: skip only with explicit not-applicable decision for cold-start; execute for rescan.

### Node `N6-dimension-plan`: Dimension plan

Target: validate snapshot -> active dimensions -> requested/skipped dimensions.

Chain position: after N4; before session/task creation.

Execution scope: frozen snapshot and dimension filter only.

Operational guidance:

- Goal: ensure expected dimensions are selected, language/framework/enhancement filters are explained, and user-requested dimensions are honored.
- Evidence checklist: active dimension ids, skillWorthy/candidateOnly ids, requested filters, skipped reasons, enhancement packs, `expectedOutput`.
- Pass standard: task count and dimension labels match later N7 taskDefs.
- Failure taxonomy: missing dimensions, overbroad dimensions, hidden test filter, enhancement mismatch.
- First optimization action: expose skipped/reason metadata in report if missing.
- Recheck metrics: missing dimension count, unexplained skip count.

Node design/test plan:

- Fixture: frozen `ProjectSnapshot` with activeDimensions.
- Downstream cut point: do not call `startInternalDimensionExecutionSession`.
- Allowed action: pure unit around `selectColdStartDimensions` and `applyTestDimensionFilter`.
- Forbidden broad actions: starting async tasks.

Metrics contract:

- usefulUnit: dimension execution plan.
- qualityGate: every selected or skipped dimension has a reason and expected output.
- stageLoss: missing dimension, unexplained skip, mismatch with task count.
- baseline: source inspection of `selectColdStartDimensions`, `runPhase4_DimensionResolve`.
- candidate: see `records/data.md#n6-dimension-plan`.
- comparison: requested ids `code-pattern, missing, architecture, architecture` selected `[architecture, code-pattern]` in active-dimension order; unknown ids dropped, duplicates collapsed by `Set`, test-mode bootstrap filter reduced selected dimensions to `[code-pattern]`, and next steps reflected the selected dimension count.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `ColdStartPlan.ts`, `ProjectIntelligenceRunner.ts`, `InternalColdStartWorkflow.ts`.
- residualRisk: unknown requested dimension ids are dropped without an explicit user-facing skip reason; this is now tracked as a stage-loss risk for later report/observability optimization.
- advance rule: N7 starts after selected dimensions match intent.

### Node `N7-session-task-manager`: Session and TaskManager

Target: validate skeleton session/task state and cancellation before Agent runtime.

Chain position: after dimensions; before `dispatchInternalDimensionExecution` reaches runtime.

Execution scope: task definitions, TaskManager session, skipAsyncFill branch.

Operational guidance:

- Goal: create a cancellable bootstrap session with one task per selected dimension and skeleton response fields.
- Evidence checklist: session id/status/progress, task ids/meta, EventBus `bootstrap:started`, `skipAsyncFill` log when selected, cancel/abort state.
- Pass standard: task count matches dimensions; cancellation prevents new starts and late transitions do not alter cancelled tasks.
- Failure taxonomy: task mismatch, event loss, cancellation race, stale session.
- First optimization action: focused TaskManager or workflow skeleton test.
- Recheck metrics: task mismatch count, late transition count.

Node design/test plan:

- Fixture: selected dimensions from N6.
- Downstream cut point: no `runInternalDimensionExecution`.
- Allowed action: `skipAsyncFill=true` skeleton harness after N0-N6.
- Forbidden broad actions: no Agent child run, no finalizer.

Metrics contract:

- usefulUnit: cancellable bootstrap skeleton.
- qualityGate: session/task state is complete and no async child has started when skipped.
- stageLoss: task mismatch, cancel race, event missing.
- baseline: `BootstrapTaskManager.test.ts`, `BootstrapSessionExecutionBuilder.test.ts`.
- candidate: see `records/data.md#n7-session-task-manager`.
- comparison: two selected dimensions produced one `skill` task and one `candidate` task; session started with two skeleton tasks, emitted start events, completed one task, aborted the other, preserved tool-call summary, ignored a late completion, and degraded to null session with warning when the manager was missing.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `InternalDimensionExecutionWorkflow.ts`, `InternalDimensionFillDispatch.ts`, `BootstrapTaskManager.ts`.
- residualRisk: no real workflow skeleton response was emitted through `presentInternalColdStartResponse`; N7 only proves task/session skeleton behavior before async dispatch.
- advance rule: N8 starts only after skeleton is stable and async branch is deliberate.

### Node `N8-stage-factory-tool-policy`: Stage factory and tool policy

Target: validate runtime prep, dimension Agent input, stage order, tool policy, and PCV node map before model execution.

Chain position: after N7; before `AgentService.run`.

Execution scope: one dimension, no model call.

Operational guidance:

- Goal: produce an Agent input with `pcvStageNodeMap`, `pcvChainNodes`, stage order, and producer terminal-tool restriction.
- Evidence checklist: `analyze`, `quality_gate`, `record_repair`, `produce` node ids; stage order; producer terminal tools; gap limit; contextWindow budget; abort signal.
- Pass standard: producer stage present when candidates are needed; producer has no terminal tools; PCV map is visible in message/context/sharedState/promptContext.
- Failure taxonomy: stage order missing, producer tool leakage, PCV map missing, runtime prep missing data root.
- First optimization action: fix PCV map/stage policy projection before model calls.
- Recheck metrics: producer terminal tool count, missing PCV identity count.

Node design/test plan:

- Fixture: one dimension plan + runtime input builder fake services.
- Downstream cut point: do not call `AgentService.run`.
- Allowed action: stage/input builder unit/harness.
- Forbidden broad actions: live AI run, producer, persistence.

Metrics contract:

- usefulUnit: stage/tool policy artifact linked to PCV nodes.
- qualityGate: stage order and tool restrictions linked to dimension id and node ids.
- stageLoss: producer terminal tools, missing stage, missing PCV map.
- baseline: existing tests assert PCV map presence.
- candidate: see `records/data.md#n8-stage-factory-tool-policy`.
- comparison: focused builder tests plus a direct one-dimension runtime fixture produced `bootstrap-session` parent input, `bootstrap-dimension` runtime profile, stage order `analyze -> quality_gate -> produce -> rejection_gate`, no producer terminal tools, and PCV stage maps in prompt context/shared state.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `BootstrapDimensionRuntimeBuilder.ts`, `BootstrapInputBuilders.ts`, `BootstrapSessionExecutionBuilder.ts`, `BootstrapPcvNodeLocalEvidence.ts`.
- residualRisk: no live Agent/model call has run; N9 owns analysis quality, grounding, and record-repair artifact usefulness.
- advance rule: N9 starts after N8 policy linked.

### Node `N9-agent-analyze-quality`: Agent analyze quality

Target: validate analyze, quality gate, and record repair identity for one dimension before Producer.

Chain position: after N8; before N11 producer.

Execution scope: one focused dimension; model-backed run only after N0-N8 pass or deterministic frozen Agent result for projection.

Operational guidance:

- Goal: produce a useful analysis finding bundle with file-level evidence, clear reason, tool/memory grounding, and report-linked PCV node evidence.
- Evidence checklist: LLM input assembly identity, selected files, grounding ledger entries, quality gate action/pass, record repair phase or stage-map identity, artifact/trace/metrics node link, fallback indicators.
- Pass standard: not fallback-only unless AI-unavailable branch selected; sourceRefs or actionable rejects; N9 artifacts link to `pcvm:cold-start:n9`.
- Failure taxonomy: source grounding, prompt/input, tool policy, quality gate, record repair, observability, provider.
- First optimization action: repair observability before changing prompt/logic if node link is missing.
- Recheck metrics: missingSourceRefs, fallbackOnlyFindings, vagueReasonCount, unlinkedArtifactCount, qualityGateRejectCount.

Node design/test plan:

- Fixture: frozen N8 Agent input or deterministic AgentRunResult.
- Downstream cut point: no producer/finalizer.
- Allowed action: deterministic projection harness first; live single-dimension AI only if explicitly authorized by total control.
- Forbidden broad actions: full async run, producer persistence, finalizer, delivery.

Metrics contract:

- usefulUnit: quality-gated analysis finding bundle.
- qualityGate: findings have file-level evidence or are rejected with actionable reasons; N9 artifact/trace/report fields are node-linked.
- stageLoss: missing source refs, fallback-only, vague reasons, unlinked artifacts, invalid grounding burns.
- baseline: Wave 6F observed N9 identity projection and source builders, not pass evidence.
- candidate: see `records/data.md#n9-agent-analyze-quality`.
- comparison: focused unit coverage plus direct frozen run-result probe showed linked analyze grounding, quality_gate projection, record_repair phase projection, and record_repair stage-map identity without live model execution.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `BootstrapConsumers.ts`, `BootstrapPcvNodeLocalEvidence.ts`, `BootstrapProcessEvents.ts`, `DaemonJobRunner.ts`.
- residualRisk: live provider behavior is not exercised in N9; later runtime/AI nodes must not reuse this as provider-quality proof.
- advance rule: N11 starts only after N9 useful unit passes or a frozen analysis artifact is explicitly accepted.

### Node `N10-evolve-prescreen`: Evolve and prescreen

Target: validate existing recipe / rescan evolve-prescreen branch when applicable.

Chain position: conditional before N9/N11 in rescan or existing-recipe branch.

Execution scope: existing recipe fixture, no broad rescan.

Operational guidance:

- Goal: prevent duplicate healthy recipes and ensure severe decay/gap cases are not silently lost.
- Evidence checklist: existingRecipes, prescreenDone, rescan execution decision, createBudget, skipped/evolved/deprecated counts, duplicate trigger blocks.
- Pass standard: cold-start without existing recipe marks node conditional/not-applicable; rescan branch preserves healthy recipes and limits create budget.
- Failure taxonomy: duplicate, decay, gap budget, prescreen missing, branch mismatch.
- First optimization action: make rescan execution decision observable before Agent run.
- Recheck metrics: duplicate trigger count, lost severe case count, over-budget candidate count.

Node design/test plan:

- Fixture: existing recipe set and rescan context.
- Downstream cut point: no producer.
- Allowed action: rescan decision unit/harness when branch selected.
- Forbidden broad actions: full rescan through finalizer before N10 pass.

Metrics contract:

- usefulUnit: rescan execution decision with create budget and dedup guard.
- qualityGate: healthy recipes are not duplicated; degraded recipes have explicit action.
- stageLoss: duplicate healthy recipes, lost decay, over-budget produce.
- baseline: `BootstrapRescanState.ts` and `resolveBootstrapDimensionPlan` source.
- candidate: see `records/data.md#n10-evolve-prescreen`.
- comparison: focused tests plus direct composition probe showed pure cold-start has no rescan context, healthy recipes seed dedup, decaying recipes remain visible, execution decisions set create budget, and rescan-forced dimensions stay runnable despite incremental skip.
- verdict: `pass(scope=unit)`.
- evidenceLinks: `BootstrapRescanState.ts`, `BootstrapDimensionRuntimeBuilder.ts`, `BootstrapDimensionAdmission.ts`.
- residualRisk: real broad rescan remains out of scope; N10 only proves the branch decision and producer budget gate before N11.
- advance rule: skip only with explicit branch decision; execute before N11 for rescan.

### Node `N11-produce-candidates`: Produce

Target: validate Producer converts N9 analysis artifact into candidate output.

Chain position: after N9 (or N10 branch) and before persistence/finalizer.

Execution scope: frozen analysis artifact, producer-only cut.

Operational guidance:

- Goal: produce accepted/rejected candidate digest with valid source refs, gap limits, dedup, schema, and no terminal tools.
- Evidence checklist: submitted/accepted/rejected counts, rejected reasons, candidate title/trigger/kind/sourceRefs, producer tool calls, gap limit, sourceRef validity.
- Pass standard: accepted candidates have real source refs; rejected items have actionable field-level reasons; producer uses allowed tools only.
- Failure taxonomy: schema, dedup, source refs, tool policy, budget, timeout.
- First optimization action: expose concrete rejected field errors or sourceRef validation before prompt changes.
- Recheck metrics: invalidSourceRefCount, rejectedUnknownReasonCount, terminalToolCallCount, accepted ratio.

Node design/test plan:

- Fixture: frozen N9 analysis artifact and source file index.
- Downstream cut point: no consumer/persistence/finalizer.
- Allowed action: deterministic N11 replay or producer-only harness.
- Forbidden broad actions: finalizer, delivery, report pass.

Metrics contract:

- usefulUnit: accepted candidate digest with valid source references.
- qualityGate: sourceRef validity and tool policy pass before improvement counts.
- stageLoss: invalid sourceRefs, vague reject reasons, producer terminal use, accepted mismatch.
- baseline: observed N11 7/44 invalid sourceRefs risk and N11 replay test.
- candidate: see `records/data.md#n11-produce-candidates`.
- comparison: focused producer replay/sourceRef tests plus direct frozen producer cut showed accepted/rejected counts, valid sourceRefs, no terminal tools, and actionable rejected tool result.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `BootstrapPcvNodeLocalEvidence.ts`, `BootstrapConsumers.ts`, `PcvN11SourceRefReplay.test.ts`.
- residualRisk: live producer/model behavior is not exercised; N12 owns findability and persistence of accepted results.
- advance rule: N12 starts after candidate digest is valid or failures are persisted as actionable.

### Node `N12-consumers-persistence`: Consumers, dedup, persistence

Target: validate accepted candidates / failures are findable after consumer side effects.

Chain position: after N11; before finalizer.

Execution scope: producer tool call fixture and SessionStore/checkpoint consumers.

Operational guidance:

- Goal: make accepted candidates and failure details visible to SessionStore/checkpoints/candidate relation consumers.
- Evidence checklist: accepted candidate titles, findable titles, checkpoint path/result, candidate relation edges, persisted failure reason, N12 PCV evidence.
- Pass standard: accepted candidate titles are findable; failure reasons are non-empty and retained.
- Failure taxonomy: persistence, session store, relation graph, checkpoint, error detail.
- First optimization action: fix consumer projection/persistence before finalizer.
- Recheck metrics: acceptedNotFindable, missingFailureReason, relationWriteFailures.

Node design/test plan:

- Fixture: N11 accepted/rejected tool calls.
- Downstream cut point: no `finalizeInternalDimensionFill`.
- Allowed action: consumer unit/harness.
- Forbidden broad actions: finalizer/report.

Metrics contract:

- usefulUnit: findable persisted candidate/failure record.
- qualityGate: accepted candidate or failure state is retrievable by dimension/session.
- stageLoss: accepted candidates not findable, missing failure details, relation errors.
- baseline: existing consumer/finalizer tests.
- candidate: see `records/data.md#n12-consumers-persistence`.
- comparison: focused consumer/checkpoint/relation tests plus direct N12 probe showed accepted titles findable in SessionStore snapshot and non-empty failure reasons retained.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `BootstrapConsumers.ts`, `BootstrapPcvNodeLocalEvidence.ts`, `InternalDimensionFillFinalizer.ts`.
- residualRisk: real finalizer side effects and delivery/write-zone behavior remain N13 scope.
- advance rule: N13 starts after persistence boundary passes.

### Node `N13-finalizer-policy`: Finalizer policy

Target: validate finalizer side effects and explicit delivery/no-delivery routing.

Chain position: after N12; before report/history.

Execution scope: final session fixture, with no-delivery mode unless total control explicitly authorizes delivery writes.

Operational guidance:

- Goal: finalize skills, candidate relations, semantic memory, delivery/wiki policy, and completion summary without unsafe writes.
- Evidence checklist: `skipTargetDelivery`, delivery verification status, wiki status, semantic memory result, ProjectSkillDeliveryReceipt, skill runtime export pending status, abort behavior.
- Pass standard: cold-start finalizes fully or no-delivery skip is explicit and reportable; rescan skips non-rescan side effects explicitly.
- Failure taxonomy: delivery, wiki, semantic memory, skill generation, abort/cancel, write zone.
- First optimization action: add no-delivery / write-zone proof before real delivery.
- Recheck metrics: unapproved write count, missing receipt count, finalizer skipped reason count.

Node design/test plan:

- Fixture: sessionResult + runtime fixture.
- Downstream cut point: do not write workflow report/history yet if finalizer itself fails.
- Allowed action: finalizer unit with fake write zone.
- Forbidden broad actions: live delivery/wiki to real project.

Metrics contract:

- usefulUnit: safe finalization summary and delivery/skill receipts.
- qualityGate: every side effect is either completed under approved root or explicitly skipped with reason.
- stageLoss: unapproved delivery, missing skill receipt, semantic memory failure, abort ignored.
- baseline: `InternalDimensionFillFinalizer.test.ts`, `WorkflowCompletionFinalizer` tests.
- candidate: see `records/data.md#n13-finalizer-policy`.
- comparison: focused completion/skill/semantic/finalizer tests plus direct no-delivery summary and ProjectSkillDeliveryReceipt report augmentation probe.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `InternalDimensionFillFinalizer.ts`, `WorkflowSkillCompletionCapability.ts`, `WorkflowCompletionFinalizer.ts`.
- residualRisk: no real delivery/wiki/skill export was authorized; N14 owns report/history/job visibility, not finalizer side effects.
- advance rule: N14 starts after finalizer summary and side-effect policy are trustworthy.

### Node `N14-report-history`: Report, snapshot, history

Target: validate report, history, snapshots, daemon job, and process event evidence.

Chain position: after N13; before expansion/full run.

Execution scope: persisted workflow result fixture and job process event fixture.

Operational guidance:

- Goal: reports are valid, comparable, and link session id, node ids, artifact refs, trace ids, scorecards, and snapshots.
- Evidence checklist: latest report, history index, session report, `pcvScorecard`, `comparisonHints`, per-dimension PCV evidence, JobStore status/result, JobProcessEventRecorder entries, artifact refs.
- Pass standard: report surfaces contain canonical node ids and enough evidence to compare before/after; no node is scored without link.
- Failure taxonomy: report missing, history mismatch, job status mismatch, unlinked artifact, scorecard projection gap.
- First optimization action: add missing report/job link, not a broad rerun.
- Recheck metrics: unlinkedArtifactCount, missingNodeIdCount, reportSurfaceMismatchCount.

Node design/test plan:

- Fixture: finalizer result + dimensionStats with PCV evidence + job event drafts.
- Downstream cut point: no expansion/full run.
- Allowed action: report/job unit/harness.
- Forbidden broad actions: full cold-start to claim downstream pass.

Metrics contract:

- usefulUnit: comparable report/history/job evidence row.
- qualityGate: artifacts, traces, metrics, and source refs can be linked to the node under review.
- stageLoss: missing PCV node id, missing chain node id, unlinked artifacts, report mismatch.
- baseline: Wave 6F observed N9 report projection and `DaemonJobRunner.test.ts`.
- candidate: see `records/data.md#n14-report-history`.
- comparison: focused report/history/job tests plus direct report/history/job-event probe showed pcvScorecard node links, history index entry, and artifact trace carry.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `InternalDimensionFillFinalizer.ts`, `DaemonJobRunner.ts`, `PcvObservabilityLinkage.ts`, `JobProcessEventRecorder.ts`.
- residualRisk: no expansion/full run has been executed; current evidence is fixture-level report/history comparability.
- advance rule: expansion starts only after N14 is linked and no required node is blocked.

### Node `EXP-two-dimensions`: Expansion to two dimensions

Target: validate one extra dimension without changing other variables.

Chain position: after N0-N14 single-dimension pass.

Execution scope: same provider/mode/data root/no-delivery setting; add exactly one dimension.

Metrics contract:

- usefulUnit: two-dimension comparable report.
- qualityGate: both dimensions preserve N8-N14 evidence links.
- stageLoss: cross-dimension regression, cache/session contamination, duplicate candidates.
- baseline: single-dimension pass.
- candidate: two-dimension run.
- comparison: one variable changed, dimensions count.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `records/data.md#exp-two-dimensions`, `records/progress.md`.
- residualRisk: no live provider, broad runtime, daemon, Dashboard, or delivery path was opened; the pass proves controlled fixture expansion only.
- advance rule: full dimensions only after this passes.

### Node `EXP-full-dimensions`: Expansion to full dimensions

Target: validate full selected dimension set after focused nodes are stable.

Chain position: after two-dimension pass.

Execution scope: full TypeScript active-dimension no-live fixture, still respecting delivery/write boundary.

Metrics contract:

- usefulUnit: full active-dimension comparable report with all required nodes linked or explicitly branch-skipped.
- qualityGate: required dimensions complete or branch-skip explicitly; report/history surfaces align.
- stageLoss: timeout, missing dimensions, invalid sourceRefs, delivery/report mismatch.
- baseline: two-dimension pass.
- candidate: full-dimension no-live fixture.
- comparison: dimension count only unless total control approves delivery/provider change.
- verdict: `pass(scope=fixture)`.
- evidenceLinks: `records/data.md#exp-full-dimensions`, `records/progress.md`, `records/issues.md#i-017-full-dimension-pass-is-no-live-fixture-only`.
- residualRisk: no live provider, broad runtime, daemon, Dashboard, or delivery path was opened; true project AI/runtime evidence remains a separate authorized round.
- advance rule: real runtime/AI/delivery confirmation requires a new explicit round.

## Current Run State

Progress belongs in `records/progress.md`; measured data belongs in `records/data.md`; issues and residual risks belong in `records/issues.md`.

Status: `complete / no-live PCVM fixture expansion passed`

Current node: `none`.

Current restriction: broad cold-start, broad rescan, daemon, Dashboard, live AI/model calls, delivery, and DB mutation remain outside this plan state until a matching node execution round authorizes them.
