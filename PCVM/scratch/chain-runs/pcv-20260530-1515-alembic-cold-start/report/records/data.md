# PCVM Data Records: Current LLM Token Efficiency Baseline

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `historical-evidence-retained`

## Package M Same-Input Live Evidence

Evidence scope: `live-ai-local + full per-round artifact review`

Raw evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-m-same-input-live-rerun-2026-05-31.md`
- Raw dir: `../AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptmg4ep_8a6f5854` / `bs_1780222392585_qizud3`
- Per-row self-check: `records/package-m-structure-self-check.md`

Route:

| Field | Value |
| --- | --- |
| Project | `BiliDili` |
| Dimension | `design-patterns` |
| Route | one-dimension/no-delivery |
| `maxFiles` / `contentMaxLines` / `skipGuard` | `24` / `80` / `true` |
| Provider/model | `deepseek/deepseek-v4-pro` |

Same-input live comparison:

| Metric | Package K | Package M | Delta | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| analyze input | 174988 | 175870 | +882 (+0.50%) | Flat; no meaningful analyze input improvement. |
| analyze output | 12214 | 11826 | -388 (-3.18%) | Slight raw-output improvement. |
| analyze iterations / tool calls | 16 / 38 | 14 / 25 | -2 / -13 | Analyze loop/tool use improved. |
| Producer input | 85823 | 103057 | +17234 (+20.08%) | Regression; Producer history/evidence ownership is now the dominant input issue. |
| Producer output | 13530 | 10457 | -3073 (-22.71%) | Raw Producer output improved. |
| Producer iterations / tool calls | 9 / 14 | 10 / 12 | +1 / -2 | Tool calls down, but one extra no-tool final round remains. |
| route input | 260811 | 278927 | +18116 (+6.94%) | Input regression versus K. |
| route output | 25744 | 22283 | -3461 (-13.44%) | Raw route output improved. |
| route total model | 294371 | 307767 | +13396 (+4.55%) | All-in regression versus K. |
| accepted Recipes | 6 | 5 | -1 (-16.67%) | Useful-output count falls. |
| total model / accepted Recipe | 49061.83 | 61553.40 | +12491.57 (+25.46%) | Fails useful-output unit gate. |
| stored payload avg approx tokens / Recipe | 1997.4 | 2127.2 | +129.8 (+6.50%) | Persisted Recipes are not smaller. |
| model-to-payload amplification | 24.56x | 28.94x | +4.38x | Worse than K. |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 | Quality constraint held. |
| quality score | 100 | 98 | -2 | Still pass, but breadth fell to `90.4`. |

Per-output read-through:

- Package M has 61 per-round rows: `llm.input=25`, `llm.output=25`, `llm.reflection=11`.
- Every provider input/output/reflection row was read for content in `records/package-m-structure-self-check.md`.
- Producer candidate obligations now behave correctly: 5 structured Analyst findings became 5 accepted candidates, and final Markdown-only `Middleware Chain + Observer` / `Value-Type` themes were not submitted.
- Analyze final Markdown still violates the Package L single-source contract: it lists 7 confirmed pattern families while structured `note_finding` has 5.
- Producer completion is still not clean: iteration 9 emits a terminal completion report, then a continue nudge causes one extra no-tool final-status round at iteration 10.

PCVM reading:

- Package M is partial, not pass.
- Package L repaired one real behavior: Producer no longer uses final Markdown as an extra candidate source.
- The remaining live blockers are Analyzer final-Markdown discipline, Producer terminal nudge detection, and Producer evidence/candidate-history input ownership.
- No further AlembicTest rerun should be launched before Package N source/unit repair; this gate is now superseded by the Package N source/unit evidence below.

## Package N Source/Unit Repair Evidence

Evidence scope: `source-unit-fixture`

Owner repo: `AlembicAgent`

Source changes:

- `ExplorationTracker` now normalizes Markdown emphasis in Producer completion text and recognizes `提交完成报告` plus `未提交: 0` / `unsubmitted: 0` as terminal after successful submissions.
- `NudgeGenerator`, `AgentRuntime`, `LLMInputAssembly`, and `forced-summary` now constrain Analyze confirmed/core final Markdown sections to recorded `note_finding` entries; unrecorded signals are only pending/unstructured notes.
- `insight-producer` now uses refs-first Analyst evidence packets. `buildCodeContextSection()` emits file/range/summary refs and no longer replays Analyst code bodies into the Producer prompt.
- `ContextWindow` now stores compact provider-history args for `knowledge.submit` tool calls: action + compact params such as `title`, `trigger`, `kind`, `dimensionId`, `category`, `knowledgeType`, `source`, and `supersedes`. Full `content.markdown`, `coreCode`, and reasoning payloads no longer remain provider-visible through assistant tool-call history.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts test/ContextWindow.test.ts` | pass; 3 files, 30 tests | Covers Package M `未提交: 0` completion, refs-first Producer evidence, and compacted `knowledge.submit` provider history. |
| `AlembicAgent` | `npm test -- test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` | pass; 2 files, 22 tests | Expanded runtime/evidence chain still passes after summary/terminal contract changes. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome checks 246 files with no fixes. |
| `AlembicAgent` | `git diff --check` | pass | No whitespace errors in the source/unit patch. |

PCVM reading:

- Package N repairs the deterministic source/unit blockers identified from Package M.
- Package N is not live evidence. It does not prove output-token or useful-output metrics improve.
- Next live check must compare against the same Package M route and specifically inspect Analyzer final Markdown structure, Producer terminal behavior, Producer input history shape, and route total model / accepted Recipe.

## Package O Same-Input Live Evidence

Evidence scope: `live-ai-local + full per-round artifact review`

Raw evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-o-same-input-live-rerun-2026-05-31.md`
- Raw dir: `../AlembicTest/tmp/pcvm-package-o-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptor1y1_6ad15f51` / `bs_1780226261219_6210re`
- Per-row self-check: `records/package-o-structure-self-check.md`

Same-input live comparison:

| Metric | Package K | Package M | Package O | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| analyze input | 174988 | 175870 | 187313 | O regresses; Analyze history still grows. |
| analyze output | 12214 | 11826 | 11410 | O improves output slightly. |
| analyze iterations / tool calls | 16 / 38 | 14 / 25 | 15 / 31 | O is worse than M but better than K on tool calls. |
| Producer input | 85823 | 103057 | 86998 | O fixes most M Producer input regression. |
| Producer output | 13530 | 10457 | 16191 | O regresses due retries and extra final round. |
| Producer iterations / tool calls | 9 / 12 | 10 / 12 | 10 / 19 | O adds schema retry tool calls. |
| route input | 260811 | 278927 | 274311 | O improves vs M but not K. |
| route output | 25744 | 22283 | 27601 | O regresses vs K/M. |
| route reasoning | n/a | 6557 | 7712 | O regresses vs M. |
| route total model | 294371 | 307767 | 309624 | O is slightly worse than M. |
| accepted Recipes | 6 | 5 | 7 | O improves useful-output count. |
| submit attempts / rejected | n/a | 5 / 0 | 11 / 4 | O has Producer schema-contract waste. |
| total model / accepted Recipe | 49061.83 | 61553.40 | 44232.00 | O improves useful-output unit cost. |
| stored payload avg approx tokens / Recipe | 1997.4 | 2127.2 | 1457.0 | O payloads are smaller. |
| model-to-payload amplification | 24.56x | 28.94x | 30.36x | O worse than K, close to M. |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 | Quality constraint held. |
| quality score | 100 | 98 | 100 | Quality recovered. |

Per-output read-through:

- Package O has 63 per-round rows: `llm.input=26`, `llm.output=26`, `llm.reflection=11`.
- Every provider input/output/reflection artifact was read for content in `records/package-o-structure-self-check.md`.
- Analyze final Markdown now states confirmed/core sections are based on 7 recorded `note_finding` entries, and it moves Value Type, Error Type, Coordinator, and Observer into "未结构化记录".
- Producer input no longer contains Package M's direct-code replay marker and instead includes refs-first evidence refs.
- Provider-visible `knowledge.submit` assistant tool calls are compacted with `providerHistoryCompacted: true`; later inputs retain compact action/title/trigger/status/error context rather than full payload bodies.
- Producer first completion report appears at sequence 64, but sequence 65 injects a continue nudge and sequence 67 emits an extra no-tool final status.
- Producer accepted 7 candidates but made 11 submit attempts; 4 rejected attempts were missing required `description`.

PCVM reading:

- Package O is partial, not pass.
- Package O proves Package N fixed two real live behaviors: Analyze final Markdown single-source discipline and Producer direct-code/full-payload replay.
- Package O fails direct completion termination and reveals Producer submit schema-contract waste.
- Package P source/unit repair supersedes the description/completion blocker; Package Q below is the next live verdict.

## Package P Source/Unit Repair Evidence

Evidence scope: `source-unit-fixture`

Owner repo: `AlembicAgent`

Source changes:

- `ExplorationTracker` recognizes Package O's mixed English/Chinese completion report as terminal: "All 7 structured Analyst findings have been successfully submitted", `提交候选数: 7/7`, `阻塞项: 无`, and similar no-remaining summaries.
- `PRODUCER_SYSTEM_PROMPT` now explicitly makes `description` a required field and instructs Producer to self-check `params.description` before every `knowledge.submit`.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` | pass; 2 files, 25 tests | Covers Package O completion wording and Producer description pre-submit prompt contract. |
| `AlembicAgent` | `npm test -- test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` | pass; 3 files, 29 tests | Runtime/evidence chain still passes. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome checks 246 files with no fixes. |
| `AlembicAgent` | `git diff --check` | pass | No whitespace errors. |

PCVM reading:

- Package P repairs deterministic source/unit causes for the Package O residual Producer waste.
- Package Q live evidence shows the targeted description/completion effects hold, but the route still fails because Producer coverage collapses.

## Package Q Same-Input Live Failure Evidence

Evidence scope: `live-ai-local + source-logic-review`

Raw evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-q-same-input-live-rerun-2026-05-31.md`
- Raw dir: `../AlembicTest/tmp/pcvm-package-q-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptqix3b_9d08f491` / `bs_1780229241375_wkpvcc`
- Root-cause record: `records/package-q-failure-root-cause.md`
- Fresh build proof: AlembicAgent commit `603626c`; runtime package resolves to local AlembicAgent.

Same-input live comparison:

| Metric | Package O | Package Q | PCVM reading |
| --- | ---: | ---: | --- |
| analyze input | 187313 | 216300 | Q grows due more Analyze rounds. |
| analyze output | 11410 | 12086 | Slight regression. |
| Producer input | 86998 | 56793 | Lower because Producer stopped early. |
| Producer output | 16191 | 4337 | Lower because Producer stopped early. |
| route total model | 309624 | 295465 | Slightly lower, but not useful because accepted coverage collapsed. |
| accepted Recipes | 7 | 1 | Fails useful-output gate. |
| submit attempts / rejected | 11 / 4 | 2 / 1 | Attempts fell because Producer did not finish. |
| missing-description rejects | observed | 0 | Package P description repair holds. |
| missing-title rejects | observed in O logs | 1 | Required-field weakness remains. |
| unsubmitted structured findings | n/a | 5 | Main failure. |
| total model / accepted Recipe | 44232 | 295465 | Severe efficiency regression. |
| stored payload approx tokens | 1457 avg | 1490 | Payload size is not the blocker. |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | Quality grounding held. |
| quality score | 100 | 88 | QualityGate still passes, but evidenceScore drops. |

Root-cause reading:

- This is not safe to call an occasional model-only miss.
- The exact model action path is stochastic, but deterministic source logic made the failure terminal:
  - `knowledge.submit` required fields are enforced by runtime validation but provider-visible schema is generic `action`/`params`.
  - Producer prompt now mentions `description`, but the explicit required field block still omits `title`.
  - Producer can spend rounds on `knowledge.detail` and `meta.tools`.
  - `STRATEGY_PRODUCER` moves to `SUMMARIZE` after `submitCount > 0 && roundsSinceSubmit >= idleRoundsToExit`, without checking that all structured Analyst findings have been submitted.

PCVM reading:

- Package Q proves Package P partially effective: missing-`description` rejects disappeared and the Package O extra final round did not recur.
- Package Q fails the route because Producer converted only `1/6` structured findings into accepted Recipes.
- Next repair must be Package R source/unit in `AlembicAgent`; do not request another AlembicTest live run before Producer coverage and submit field contracts are repaired.

## Package R Source/Unit Repair Evidence

Evidence scope: `source-unit-fixture`

Owner repo: `AlembicAgent`

Source commit:

- `bcdc8bf` — `Repair producer coverage controls`

Source changes:

- `PipelineStrategy` now sets Producer `targetSubmits` from the structured Analyst finding count in `gateArtifact.findings`.
- `STRATEGY_PRODUCER` and `ExplorationTracker` require the target submit count before idle/text completion can move Producer to `SUMMARIZE`.
- `NudgeGenerator` emits remaining-submit guidance such as `已提交 X/Y 个结构化发现候选`, and explicitly forbids `detail/tools/plan` drift.
- `ToolExecutionPipeline` blocks Producer non-submit exploration during PRODUCE; allowed actions are `knowledge.submit`, narrow `code.read`, `memory.recall`, and `meta.review`.
- `generateLightweightSchemas()` now exposes action-specific required params in the provider-visible `params.description`; for `knowledge.submit` this includes `title`, `description`, `content.markdown`, `content.rationale`, and `reasoning.sources`.
- Producer prompts/capability/retry text now explicitly lists `title`, `description`, `content.markdown`, `content.rationale`, and `reasoning.sources` as required before `knowledge.submit`.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` | pass; 2 files, 29 tests | Covers Producer target coverage, blocked `knowledge.detail` / `meta.tools`, and schema/prompt submit required fields. |
| `AlembicAgent` | `npm test -- test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` | pass; 3 files, 29 tests | Runtime/evidence chain still passes after Producer gate insertion. |
| `AlembicAgent` | `npm test` | pass; 28 files, 174 tests | Full Agent suite passes. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome checks 246 files. |
| `AlembicAgent` | `npm run lint:core-import-boundary` | pass | Core import boundary still uses package entry correctly. |
| `AlembicAgent` | `git diff --check` | pass | No whitespace errors before commit. |

PCVM reading:

- Package R repairs the source/unit causes exposed by Package Q.
- Package S reran the same BiliDili route and supersedes this blocker with live evidence.

## Package S Live Evidence And Design Root-Cause Facts

Evidence scope: `live-ai-local + source-design-audit`

Raw evidence:

- AlembicTest raw dir: `../AlembicTest/tmp/pcvm-package-s-same-input-live-rerun-2026-05-31`.
- Job/session: `bootstrap_mptshl7z_b66ab16d` / `bs_1780232538380_vo8e6m`.
- Job JSON: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptshl7z_b66ab16d.json`.
- Artifacts: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-artifacts/bootstrap_mptshl7z_b66ab16d`.
- Candidates: `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/candidates/design-patterns/*.md`.

Live metrics:

| Metric | Package S |
| --- | ---: |
| timeline classification | `pass` |
| PCVM classification | `partial(scope=live-ai-local)` |
| retained events | `72` |
| `llm.input` / `llm.output` / `llm.reflection` | `24` / `24` / `12` |
| analyze inputs / outputs | `16` / `16` |
| produce inputs / outputs | `7` / `7` |
| extracted / created | `6` / `6` |
| tool calls | `42` |
| input / output / reasoning tokens | `246703` / `22825` / `5922` |
| total model tokens | `275450` |
| total model tokens / created Recipe | `45908.33` |
| QualityGate total score | `98` |

Useful-output facts:

- Package S fixed Package Q's useful-output collapse: Producer created all `6/6` structured findings.
- Candidate files are persisted with full payload fields and grade `A`.
- Missing-`description` rejects did not recur.

Remaining evidence-backed problems:

- Producer still attempted invalid non-submit actions after submit coverage: retained inputs include `knowledge.detail` and `knowledge.manage` blocked by `producerSubmitOnlyGate`.
- Provider-visible schemas still expose broad actions such as `knowledge.search/submit/detail/manage` and `meta.tools/plan/review`.
- Final Producer summary falsely says candidates were submitted with only partial fields, despite full persisted candidate payloads.
- `singleton-thread-safety-strategy.md` contains `aactor` typo while scoring grade `A`.

Source root-cause facts:

- `BootstrapProduce.allowedTools` declares action-level constraints, but `CapabilityV2.tools`, `AgentRuntime.#collectTools()`, and `V2CapabilityCatalog.generateSchemas()` reduce the contract to tool ids and expand each id back to all registered actions.
- `generateLightweightSchemas()` can honor action-level allowlists, but the AgentRuntime schema path does not pass the action map.
- `producerSubmitOnlyGate` blocks invalid actions only after provider selection; it is not the provider-visible source of truth.
- `ContextWindow.compactKnowledgeArgsForProviderHistory()` removes full submit payload fields and leaves only compact identifiers plus `providerHistoryCompacted: true`.
- `limitToolResult('knowledge')` keeps submit results short; live success returns status/id/title rather than full field-completeness state.
- `knowledge.submit` validation and `QualityScorer` validate structure/length/provenance, not exact-source code syntax or snippet equivalence.

PCVM reading:

- Package S is not a clean pass even though raw test classification says pass.
- The remaining blocker is design fragmentation across prompt, schema, runtime gate, tracker, history compaction, persistence, quality scoring, and final summary.
- The next package must unify stage capability/action contract and runtime submit-state source of truth before any further live rerun.

## Package T Source/Unit Contract-Unification Repair Evidence

Evidence scope: `source-unit-fixture`

Owner repo: `AlembicAgent`

Source changes:

- `AgentRuntime` now collects `RuntimeToolContract` with tool ids and action allowlists, and records `allowedToolActions` in diagnostics.
- `V2CapabilityCatalog` supports action-aware schema projection via `toToolSchemasForActions()` and `toMixedSchemasForActions()`.
- Provider-visible Producer schema now exposes only `knowledge.submit`, `code.read`, `memory.recall`, and `meta.review` for `knowledge_production`.
- Direct `note_finding` is no longer added unless `memory.note_finding` is allowed.
- `ToolExecutionPipeline.allowlistGate` blocks disallowed actions by the same runtime action contract.
- `ContextWindow` compacted `knowledge.submit` history now carries `payloadSummary.requiredFieldsComplete`, `sourceCount`, and omitted field names.
- `submitDedup` records `_producerSubmitLedger` entries after successful Producer submit.
- `LLMInputAssembly` injects `producerSubmitLedger` so final summaries can rely on runtime state instead of compacted history.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/tool-v2-contract.test.ts test/llm-input-layering.test.ts test/ContextWindow.test.ts test/ExplorationStrategies.test.ts` | pass; 4 files, 45 tests | Covers action schema projection, Producer action schema, compact payload summary, submit ledger, and action gate. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome checks 246 files. |
| `AlembicAgent` | `npm test` | pass; 28 files, 177 tests | Full Agent suite passes. |
| `AlembicAgent` | `npm run lint:core-import-boundary` | pass | Core import boundary remains valid. |
| `AlembicAgent` | `git diff --check` | pass | No whitespace errors. |

PCVM reading:

- Package T repairs Package S's schema leak and compact-history semantic-loss causes at source/unit level.
- It is not live evidence. The formerly proposed Package U rerun is not active after the user cancelled PCVM; retain this entry as historical source/unit evidence only.

## Current LLM Token Efficiency Source/Unit Baseline

Evidence scope: `source-unit-fixture`

Facts:

- Package A added deterministic prompt measurement in `AlembicAgent/src/agent/runtime/LLMInputMeasurement.ts`.
- `measureLlmInputAssembly()` records stage profile, section token estimates, provider message token estimate, tool schema token estimate, duplicate block ratio, duplicate block count, and duplicate estimated tokens.
- `measurePromptText()` records the same duplicate block metrics for standalone prompt builders such as Producer v2.
- `AlembicAgent/test/llm-input-layering.test.ts` now includes analyze input assembly and Producer v2 prompt fixtures.
- No prompt compaction, output compaction, AlembicTest run, live AI call, delivery action, or real test project source change was performed in Package A.

Measurement command:

```sh
cd ../AlembicAgent
node --input-type=module -e '<compiled deterministic fixture measurement>'
```

Measurement output:

| Stage fixture | Estimated tokens | Provider-message estimated tokens | Duplicate block ratio | Duplicate estimated tokens | Duplicate blocks |
| --- | ---: | ---: | ---: | ---: | ---: |
| analyze input assembly | 839 | 455 | 0.1292 | 80 | 2 |
| producer v2 prompt | 964 | n/a | 0.0527 | 75 | 2 |

Analyze section token estimates:

| Section | Estimated tokens |
| --- | ---: |
| `identity` | 6 |
| `stagePolicy` | 53 |
| `toolContract` | 57 |
| `taskContext` | 80 |
| `evidenceContext` | 126 |
| `dynamicContext` | 47 |

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts` | pass; 1 file, 10 tests | Source/unit fixtures cover analyze and Producer deterministic prompt measurement. |
| `AlembicAgent` | `npm run build` | pass | New runtime measurement export compiles. |
| `AlembicAgent` | `npm run lint` | pass | New source and tests pass Biome check. |

PCVM reading:

- Package A removes the first source/unit measurement blocker for input prompt size and duplicate prompt blocks.
- This is not a token-efficiency improvement verdict yet; no before/after compaction candidate exists.
- Stage output tokens and analyze quality constraints still require later same-input live evidence after source/unit compaction passes.

## Current LLM Token Efficiency Source/Unit Candidate

Evidence scope: `source-unit-fixture`

Facts:

- Package B implemented input section dedupe and section budgets in `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts`.
- Package B implemented Producer repeated-line compaction in `AlembicAgent/src/agent/prompts/insight-producer.ts`.
- Package C added provider-visible concise final-output contracts for analyze, Producer, and summary stage policies.
- No live AI, AlembicTest, delivery, or real test project source change was performed.

Same-fixture comparison:

| Stage fixture | Baseline tokens | Candidate tokens | Token delta | Baseline duplicate ratio | Candidate duplicate ratio | Duplicate reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze input assembly | 839 | 805 | -34 | 0.1292 | 0.0239 | 81.5% |
| producer v2 prompt | 964 | 848 | -116 | 0.0527 | 0.0161 | 69.4% |

Candidate details:

| Stage fixture | Provider-message estimated tokens | Duplicate estimated tokens | Duplicate blocks | Notes |
| --- | ---: | ---: | ---: | --- |
| analyze input assembly | 438 | 14 | 1 | `metadata.inputCompaction.dedupedSectionIds = ["dynamicContext"]`; `dynamicContext` section dropped from 47 to 14 estimated tokens. |
| producer v2 prompt | n/a | 19 | 1 | Repeated long evidence lines are retained once across analysis text, findings, and evidence map. |

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/evidence-recording-phase-chain.test.ts` | pass; 2 files, 21 tests | Source/unit candidate preserves input layering and evidence-recording behavior while asserting compaction. |
| `AlembicAgent` | `npm run build` | pass | Runtime and prompt changes compile. |
| `AlembicAgent` | `npm run lint` | pass | Source and tests pass Biome check. |

PCVM reading:

- Package B passes the source/unit duplicate reduction gate for the current fixtures.
- Package C passes only as `source-unit-instruction`; output-token reduction must be measured later with same-input live evidence.
- Next deterministic blocker is upstream `Alembic` runtime context wiring, not AlembicTest.

## Current Runtime Context Wiring Candidate

Evidence scope: `source-unit-fixture`

Facts:

- Package D changed `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` so bulky project/evidence facts have one owner surface: `strategyContext`.
- Package D changed `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts` so `context.systemRunContext` is compacted before attaching to `AgentRunInput`.
- Runtime references and PCV mapping fields remain in `systemRunContext`.
- `projectGraph`, `existingRecipes`, and `projectOverview` remain available in `strategyContext`, but are no longer duplicated onto `systemRunContext` in the source/unit runtime builder fixture.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `Alembic` | `npm run build` | pass | Dist refreshed so unit tests exercise the current implementation behind package imports. |
| `Alembic` | `npm run test:unit -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts` | pass; 2 files, 5 tests | Runtime builder and input builder preserve strategy facts while keeping `systemRunContext` compact. |
| `Alembic` | `npm run build:check` | pass | TypeScript no-emit check passes against local Core source. |
| `Alembic` | `npm run lint` | pass | Changed source and tests pass Biome check. |

PCVM reading:

- Packages A-D now pass source/unit gates for the current LLM token-efficiency route.
- The remaining token and quality verdict requires same-input live evidence.
- Package E is blocked until explicit live AI approval because it sends BiliDili project content to the configured external provider.

## Package E Same-Input Live Evidence

Evidence scope: `live-ai-local`

Raw evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-e-same-input-live-comparison-2026-05-31.md`
- Raw summary: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/package-e-raw-summary.json`
- Timeline/process evidence: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/timeline.json`
- Latest report API snapshot: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/api-report-latest.json`
- Persisted report: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780211356238_xiafi2.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptfvl61_f75bdcb6.json`

Route:

| Field | Baseline | Candidate |
| --- | --- | --- |
| Project | `BiliDili` | `BiliDili` |
| Dimension | `design-patterns` | `design-patterns` |
| Files | 24 | 24 |
| `contentMaxLines` | 80 | 80 |
| `skipGuard` | true | true |
| Provider/model | `deepseek/deepseek-v4-pro` | `deepseek/deepseek-v4-pro` |
| Baseline job/session | `bootstrap_mpsbnftk_dbfe22d0` / `bs_1780143791437_9jfho1` | n/a |
| Candidate job/session | n/a | `bootstrap_mptfvl61_f75bdcb6` / `bs_1780211356238_xiafi2` |

Same-input live comparison:

| Metric | Baseline | Candidate | Delta | Result |
| --- | ---: | ---: | ---: | --- |
| analyze input tokens | 180337 | 348915 | +168578 (+93.48%) | regression |
| analyze output tokens | 9434 | 13242 | +3808 (+40.36%) | regression |
| producer input tokens | 174149 | 171785 | -2364 (-1.36%) | improved |
| producer output tokens | 17705 | 24993 | +7288 (+41.16%) | regression |
| route input tokens | 354486 | 520700 | +166214 (+46.89%) | regression |
| route output tokens | 27139 | 38235 | +11096 (+40.89%) | regression |
| route reasoning tokens | 8146 | 8238 | +92 (+1.13%) | neutral/slight regression |
| cache-hit tokens | 184320 | 302336 | +118016 (+64.03%) | diagnostic |
| tool calls | 38 | 52 | +14 (+36.84%) | diagnostic regression |
| analyze iterations | 14 | 20 | +6 (+42.86%) | diagnostic regression |
| producer iterations | 9 | 8 | -1 (-11.11%) | improved |
| accepted candidates | 10 | 13 | +3 (+30.00%) | quality/output changed |
| rejected candidates | 0 | 1 | +1 | diagnostic |
| quality score | 97 | 100 | +3 (+3.09%) | quality held/improved |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 | quality held |

PCVM reading:

- Package E raw evidence is accepted as live local evidence for the specified route.
- Package E fails the token-efficiency gate because primary input metrics regressed.
- Quality constraints held: `pcvAnalyzeGroundingInvalidNoEvidence=0`, quality gate score improved from 97 to 100, and no timeout was reported.
- The regression is concentrated in analyze: input tokens nearly doubled and analyze iterations/tool calls increased materially.
- Candidate live route did show runtime compaction metadata (`maxCompactionLevel=1`, `totalCompactedItems=8`), but compaction did not overcome live context/iteration growth.
- This is not a SourceRef line and should not reopen SourceRef optimization.

## Package E Root-Cause Diagnostic Evidence

Evidence scope: `report-comparison + source-inspection`

Report comparison:

| Metric | Baseline | Package E | Delta | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| analyze input tokens | 180337 | 348915 | +168578 (+93.48%) | Primary live regression. |
| analyze output tokens | 9434 | 13242 | +3808 (+40.36%) | Mostly loop/output-volume growth. |
| producer input tokens | 174149 | 171785 | -2364 (-1.36%) | Slight total improvement from fewer producer iterations. |
| producer output tokens | 17705 | 24993 | +7288 (+41.16%) | Output/candidate volume changed. |
| route input tokens | 354486 | 520700 | +166214 (+46.89%) | Primary route regression. |
| route output tokens | 27139 | 38235 | +11096 (+40.89%) | Secondary regression. |
| analyze iterations | 14 | 20 | +6 (+42.86%) | Main multiplier. |
| analyze tool calls | 24 | 37 | +13 (+54.17%) | Main history-growth source. |
| producer iterations | 9 | 8 | -1 (-11.11%) | Producer loop count did not cause input regression. |
| accepted candidates | 10 | 13 | +3 (+30.00%) | Raw output must also be normalized by useful output. |

Normalized diagnostic:

| Metric | Baseline per accepted candidate | Package E per accepted candidate | Delta | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| route input | 35448.6 | 40053.8 | +4605.2 (+12.99%) | Still worse after normalizing for 13 accepted candidates. |
| analyze input | 18033.7 | 26839.6 | +8805.9 (+48.83%) | Analyze remains the dominant regression. |
| producer input | 17414.9 | 13214.2 | -4200.7 (-24.12%) | Producer input is not the first blocker. |
| route output | 2713.9 | 2941.2 | +227.3 (+8.38%) | Output is worse but lower priority than analyze input. |

Timeline diagnostic:

| Stage event | Baseline retained timeline | Package E retained timeline | Reading |
| --- | --- | --- | --- |
| `llm.input:analyze` first retained call | estimated `4044`, original chars `16173`, messages `3` | estimated `3904`, original chars `15615`, messages `3` | Runtime input-layer compaction reduced the starting call. |
| `llm.input:analyze` late retained call | estimated max `12164`, original chars `48654`, messages `37` | estimated max `19923`, original chars `79692`, messages `53` | Live history growth erased the first-call saving. |
| `llm.input:analyze` final retained call | estimated `12164`, messages `37` | estimated `14739`, messages `58` | L3/context projection happened late, after expensive calls had already occurred. |
| `llm.input:produce` late retained call | estimated max `19505`, original chars `78019`, messages `22` | estimated max `20911`, original chars `83644`, messages `20` | Producer remains large per call even though total input was slightly lower. |

Source inspection:

| File | Fact | PCVM reading |
| --- | --- | --- |
| `../AlembicAgent/src/agent/runtime/AgentRuntime.ts` | Provider call is built from `ctx.messages.toProjectedMessages()` plus the appended `LLMInputAssembly` runtime layer. | Package B/C compaction affects the runtime layer, but historical assistant/tool/nudge messages still dominate after many turns. |
| `../AlembicAgent/src/agent/context/ContextWindow.ts` | L1/L2/L3 compaction is tied to token-budget thresholds; L3 projection keeps the last two tool rounds and collapses older rounds only after thresholds. | DeepSeek V4 system context can delay projection long enough for live token spend to grow first. |
| `../AlembicAgent/src/agent/strategies/PipelineStrategy.ts` | ContextWindow resets between stages via `resetForNewStage()`. | Producer does not inherit analyze history; analyze must be fixed in its own loop/history chain. |
| `../AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts` | Analyst transitions allow EXPLORE/VERIFY until evidence, idle, or late budget thresholds; VERIFY to RECORD includes `0.75 * maxIterations`. | Extra evidence/tool activity can keep analyze alive until near the budget ceiling. |
| `../AlembicAgent/src/agent/prompts/insight-producer.ts` | Producer v2 still embeds full `analysisText`, findings, evidence map, referenced files, style guide, submit requirements, and tool boundary. | Producer input needs a later artifact-contract package, but it is not the first live blocker. |

PCVM diagnosis:

- The Package E failure is real and aligned with the user's token-efficiency concern.
- The source/unit A-D work optimized a real surface, but the live primary regression sits one layer deeper: provider-visible message history and analyze loop length.
- Output-token regression should be handled after analyze input because raw output changed together with candidate volume (`10 -> 13` accepted).
- First implementation target should be Package F: live message-history measurement plus earlier analyze projection/budgeting.
- Second target should be analyze loop/nudge control.
- Third target should be Producer artifact contract.
- AlembicTest should not rerun until the source packages produce deterministic evidence and a fresh build/dist proof is available.

## Recipe-Level Token Reference Metrics

Evidence scope: `report-normalization + local-db-readonly`

Definition:

- `accepted Recipe` means a final accepted knowledge candidate / Recipe visible in N12 persistence evidence.
- `submitted Recipe` means a Producer `knowledge.submit` attempt. Package E submitted `14`, accepted `13`, rejected `1`.
- Stage/route token usage is reported at stage level by the provider; per-Recipe stage tokens below are normalized reference metrics, not exact causal attribution per individual Recipe.
- `storedRecipePayloadApproxTokens` is computed from accepted `knowledge_entries` payload fields in the local `.asd/alembic.db`: title, description, trigger, clauses, coreCode, content JSON, reasoning JSON, headers, and module. It uses the same rough `chars / 4` estimator family as PCVM prompt diagnostics, so it is a payload-size reference rather than provider billing truth.

Per accepted Recipe normalized provider cost:

| Metric | Baseline | Package E | Delta | Reading |
| --- | ---: | ---: | ---: | --- |
| route input / accepted Recipe | 35448.6 | 40053.8 | +4605.2 (+12.99%) | Still worse after normalizing for more accepted Recipes. |
| route output / accepted Recipe | 2713.9 | 2941.2 | +227.3 (+8.37%) | Slightly worse. |
| route reasoning / accepted Recipe | 814.6 | 633.7 | -180.9 (-22.21%) | Reasoning did not drive the regression. |
| route total model / accepted Recipe | 38977.1 | 43628.7 | +4651.6 (+11.93%) | All-in unit cost regressed. |
| analyze input / accepted Recipe | 18033.7 | 26839.6 | +8805.9 (+48.83%) | Primary unit-cost regression. |
| analyze output / accepted Recipe | 943.4 | 1018.6 | +75.2 (+7.97%) | Secondary output regression. |
| producer input / accepted Recipe | 17414.9 | 13214.2 | -4200.7 (-24.12%) | Producer input improved on useful-output basis. |
| producer output / accepted Recipe | 1770.5 | 1922.5 | +152.0 (+8.59%) | Producer output still slightly worse. |
| tool calls / accepted Recipe | 3.8 | 4.0 | +0.2 (+5.26%) | Tool-call unit cost is mildly worse. |
| analyze iterations / accepted Recipe | 1.4 | 1.5 | +0.1 (+9.89%) | Loop-length unit cost is worse. |

Per submitted Recipe normalized provider cost:

| Metric | Baseline | Package E | Delta | Reading |
| --- | ---: | ---: | ---: | --- |
| route input / submitted Recipe | 35448.6 | 37192.9 | +1744.3 (+4.92%) | Regression is smaller when rejected attempt is counted. |
| route output / submitted Recipe | 2713.9 | 2731.1 | +17.2 (+0.63%) | Nearly flat. |
| route total model / submitted Recipe | 38977.1 | 40512.4 | +1535.3 (+3.94%) | Still regressed. |
| producer input / submitted Recipe | 17414.9 | 12270.4 | -5144.5 (-29.54%) | Producer conversion input improved. |
| producer output / submitted Recipe | 1770.5 | 1785.2 | +14.7 (+0.83%) | Nearly flat. |

Package E persisted Recipe payload reference:

| Metric | Package E |
| --- | ---: |
| accepted Recipe rows in local DB | 13 |
| total stored payload chars | 52460 |
| avg stored payload chars / accepted Recipe | 4035.4 |
| min stored payload chars / accepted Recipe | 3572 |
| max stored payload chars / accepted Recipe | 4582 |
| total stored payload approx tokens | 13115.0 |
| avg stored payload approx tokens / accepted Recipe | 1008.8 |
| min stored payload approx tokens / accepted Recipe | 893.0 |
| max stored payload approx tokens / accepted Recipe | 1145.5 |

Package E token amplification reference:

| Metric | Package E |
| --- | ---: |
| route input / stored Recipe payload token | 39.70x |
| route total model / stored Recipe payload token | 43.25x |
| analyze input / stored Recipe payload token | 26.60x |
| producer input / stored Recipe payload token | 13.10x |
| producer output / stored Recipe payload token | 1.91x |
| stored Recipe payload share of producer output tokens | 52.5% |
| stored Recipe payload share of route output tokens | 34.3% |

Per accepted Recipe stored payload reference:

| ID | Title | Kind | Payload chars | Approx payload tokens |
| --- | --- | --- | ---: | ---: |
| `d69659b6` | ServiceRegistry：类型安全的 DI 容器与 NSRecursiveLock 线程安全 | pattern | 3572 | 893.8 |
| `ac375aad` | static let shared 单例惯用法：三种线程安全策略 | pattern | 3880 | 970.8 |
| `e3b34311` | Middleware 协议链：adapt/didReceive/recover 三阶段管道化 | pattern | 4116 | 1029.8 |
| `e39c246a` | ClosureCookieProvider / ClosureUserIdentityProvider：闭包适配器桥接全局单例到协议抽象 | pattern | 4073 | 1019.0 |
| `f91f1fb5` | BiliImageURL enum 静态工厂 Builder：缩略图 URL 构造器 | pattern | 4115 | 1029.5 |
| `628d0e3f` | NetworkMonitor 双通道观察者：Combine + NotificationCenter 并行发布 | pattern | 4350 | 1088.3 |
| `47ccba5f` | AppModule 插件式生命周期：register/initialize/handleEvent 模块化启动 | pattern | 4269 | 1068.0 |
| `0c16a475` | SessionPool 三层 URLSession 工厂：bare/default/delegate 按用途分层 | pattern | 4582 | 1146.3 |
| `d9c31c9e` | AppCoordinator：TabBar 导航协调器与 TabBarLoginGuard 登录守卫 | pattern | 4537 | 1135.0 |
| `43a626ad` | @Injected 属性包装器：声明式 DI 解析 | pattern | 3647 | 912.5 |
| `6c705699` | enum 无 case 命名空间惯用法：BiliImageURL 与 BiliMiddlewareChain 的工厂容器 | pattern | 3659 | 915.5 |
| `2551a181` | 协议优先于抽象基类：继承链深度 ≤1 的扁平化设计 | fact | 3867 | 967.5 |
| `76a2703a` | SchemeRouter：URL Scheme 驱动的路由分发 | pattern | 3793 | 949.0 |

PCVM reading:

- Per-Recipe normalization strengthens the diagnosis: Package E is still worse on route input and total model cost per accepted Recipe, so the regression is not merely "more Recipes produced".
- Producer input is better per accepted/submitted Recipe, so the first optimization package should not start by shrinking Producer alone.
- Stored Recipe payload averages about `1009` estimated tokens, while all-in model spend is about `43629` tokens per accepted Recipe. This `43.25x` amplification is the new reference metric for future improvements.
- Future AlembicTest reruns should always return accepted/submitted/rejected counts plus per accepted/submitted Recipe token tables, otherwise raw route totals are too easy to misread.

## Package F Source/Unit Candidate

Evidence scope: `source-unit-fixture`

Facts:

- Package F implements the first source fix target from Package E diagnosis: make provider-visible history measurable separately from the runtime input layer, then trigger analyze/record/summarize projection from a stage-level provider-input budget.
- `AlembicAgent/src/agent/runtime/LLMInputMeasurement.ts` now reports:
  - `providerHistoryEstimatedTokens`
  - `inputLayerEstimatedTokens`
  - `providerMessageEstimatedTokens`
  - `systemPromptEstimatedTokens`
  - `toolSchemaEstimatedTokens`
- `AlembicAgent/src/agent/context/ContextWindow.ts` now supports `compactForProviderInputBudget()`, which can collapse older tool rounds before the global model-context budget ratio is high.
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` applies provider-input projection before `ctx.messages.toProjectedMessages()` is sent to the provider for analyze/record/summarize profiles.
- `llm.input` metadata now includes `inputSizeEstimate` and `inputProjection` so future timeline evidence can show whether a live call is dominated by provider history, runtime layer, system prompt, or tool schemas.
- `ContextWindow` still preserves recent tool rounds through the existing L3 projection contract; Package F does not remove RECORD/note_finding behavior.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/ContextWindow.test.ts` | pass; 2 files, 15 tests | Measurement split and provider-input projection pass source/unit fixtures. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome check passes. |

PCVM reading:

- Package F resolves the first blocker created by Package E diagnosis at source/unit scope.
- This is not a live token-efficiency pass; live rerun remains blocked until explicit live AI authorization and fresh build proof are ready.

## Package G Source/Unit Candidate

Evidence scope: `source-unit-fixture`

Facts:

- Package G addresses the second Package E root-cause branch: analyze loop length and repeated nudge/progress history.
- `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts` now lets Analyst EXPLORE/VERIFY converge earlier when at least `3` findings are recorded and at least `2` evidence tool calls have occurred.
- `AlembicAgent/src/agent/context/ContextWindow.ts` now treats runtime nudges as ephemeral messages by removing older `runtime_nudge` messages before appending the latest nudge.
- This keeps the newest behavior instruction visible without accumulating repeated progress text in provider-visible history.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` | pass; 4 files, 33 tests | Strategy convergence, nudge replacement, input layering, and evidence-recording fixtures pass. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome check passes. |

PCVM reading:

- Package G reduces the risk that token savings are erased by extra analyze turns.
- It preserves the requirement that evidence must exist before EXPLORE leaves early, and it does not remove RECORD/note_finding behavior.

## Package H Source/Unit Candidate

Evidence scope: `source-unit-fixture`

Facts:

- Package H addresses the Producer prompt replay branch from Package E diagnosis.
- `AlembicAgent/src/agent/prompts/insight-producer.ts` now builds a compact `Analyst 分析摘要 (已压缩)` for Producer v2 instead of replaying full `analysisText`.
- The digest keeps headings, source paths, and finding/evidence keywords, while bounding long narrative analysis text.
- Structured findings, evidence map snippets, referenced files, style guide, submit requirements, and tool boundary remain available.

Targeted verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` | pass; 4 files, 33 tests | Producer digest, strategy convergence, nudge replacement, and input layering fixtures pass. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome check passes. |

PCVM reading:

- Packages F-G-H now pass source/unit gates.
- The remaining verdict requires Package I same-input live evidence with fresh build proof and per accepted/submitted Recipe metrics.

## Waiting-For-Package-I Code/Practice Review

Evidence scope: `source-review + external-official-docs`

External best-practice anchors:

- OpenAI prompt caching best practices: static or repeated content should be placed at the beginning, dynamic/user-specific content at the end; `prompt_cache_key` and cache metrics should be monitored when available.
- OpenAI latency optimization: for massive contexts, reduce input by filtering/pruning context and maximize shared prompt prefix by moving RAG/history/dynamic portions later.
- Anthropic prompt caching: static content such as tool definitions, system instructions, context, and examples should appear before dynamic conversation blocks; cache breakpoints are sensitive to changes before the breakpoint.
- Google Vertex AI context caching: repeated large content benefits from common-prefix caching; metadata exposes cached-content token counts for observability.

Source facts:

- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` already keeps `effectiveSystemPrompt` static and injects dynamic phase/memory context as an ephemeral runtime input layer, which matches common-prefix guidance.
- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` still appends a dynamic runtime layer after projected history; this protects system-prompt cacheability but means the provider-visible prefix is not purely static after the first user prompt.
- `AlembicAgent/src/ai/transport/OpenAiTransport.ts` normalizes OpenAI Responses `usage` through `normalizeRawUsage()`, including cache-hit tokens if present.
- `AlembicAgent/src/ai/transport/DeepSeekTransport.ts` maps DeepSeek `prompt_tokens_details.cached_tokens` / `prompt_cache_hit_tokens`, but DeepSeek V4 tools mode enables thinking and can auto-raise `max_tokens` to `16384` or `32768`, so output/reasoning cost must be separated from input compaction effects.
- `AlembicAgent/src/ai/transport/GoogleTransport.ts` currently records `promptTokenCount`, `candidatesTokenCount`, and `totalTokenCount`, but not provider-specific cached-content token metadata if present.
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` emits `llm.input` metadata with `inputSizeEstimate`, but `llm.output` metadata currently records duration/completeness, not the raw normalized usage split. Package I can still use route summaries, but per-call output/reasoning/cache diagnosis is weaker than input diagnosis.
- `AlembicAgent/src/tools/catalog/UnifiedToolCatalog.ts` already has lightweight/mixed tool schema projection, but `#getIterationToolSchemas()` depends on runtime expansion state and model behavior; Package I should report `toolSchemaNames` and `inputSizeEstimate.toolSchemas` before deciding whether tool schema cost needs another source change.

Conditional PCVM reading:

- If Package I still fails because iterations remain high, the next source target is loop policy/phase transition, not prompt compression.
- If Package I iterations improve but provider-history per-call tokens remain high, the next source target is `ContextWindow` projection content quality and cache-friendly message ordering.
- If Package I shows output/reasoning dominates, the next source target is stage-specific `maxTokens` / DeepSeek V4 thinking mode exposure and `llm.output` usage metadata.
- If Package I shows tool schema cost dominates, the next source target is deterministic tool schema projection for analyze/record/produce stages.
- Do not start any of these as implementation packages until Package I raw evidence identifies the dominant remaining cost.

## Package E Per-Round Content Audit

Evidence scope: `AlembicTest raw-event content review`

Detailed record: [round-content-audit.md](round-content-audit.md)

Key reading:

- `api-events.json` was reviewed as the authoritative retained event stream: 83 events, including 29 `llm.input`, 29 `llm.output`, 13 `llm.reflection`, 1 tool aggregate, 4 summaries, and 1 artifact event.
- `timeline.json` confirms the same event-kind counts; `api-report-latest.json` and both persisted reports confirm the same stage totals.
- Analyze early outputs were mostly short control text; the cost came from accumulated provider-visible history and tool/nudge transcript across many rounds.
- Analyze input original chars grew from `15615` at iteration 1 to `79692` at iteration 16, then dropped after late projection/collapse.
- Key findings were already visible around analyze iterations 5-8, but structured `note_finding` recording did not begin until iterations 16-19.
- Producer self-declared 9 candidates complete at iteration 5/6, then continued after a nudge and ended with 13 accepted candidates; this explains part of the output/candidate-count growth.
- Package I must return a per-round content matrix, not only aggregate token totals.

## Package I Live Rerun Verdict And Package J Source Repair

Evidence scope: `live-ai-local + source-unit-fixture`

Package I raw evidence:

- AlembicTest raw dir: `../AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptide7s_a086f60e` / `bs_1780215546262_fmbz5b`
- Route: BiliDili `design-patterns`, one-dimension/no-delivery, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.
- Package I stage totals: analyze input/output/reasoning/cache `154821 / 9342 / 2900 / 72320`; producer input/output/reasoning/cache `118548 / 10231 / 3655 / 68992`.
- Package I route totals: input/output/reasoning/cache/totalModel `273369 / 19573 / 6555 / 141312 / 299497`.
- Package I accepted/submitted/rejected: `4 / 4 / 0`.
- Package I quality constraints: quality `97`, evidenceScore `90`, invalid-no-evidence `0`.

Package I verdict:

| Metric | Package E | Package I | Delta | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| route total model tokens | 567173 | 299497 | -267676 (-47.19%) | Absolute token total improved. |
| accepted Recipes | 13 | 4 | -9 (-69.23%) | Useful output weakened. |
| route total model / accepted Recipe | 43628.7 | 74874.3 | +31245.6 (+71.62%) | Unit economics failed. |
| stored payload approx tokens / accepted Recipe | 1008.8 | 883.7 | -125.1 (-12.40%) | Persisted payload got smaller; not enough to justify accepted-count collapse. |
| model-to-payload amplification | 43.25x | 84.73x | +41.48x | More model spend per persisted payload token. |

Package I raw I/O content facts:

- First analyze input still repeated the task prompt across initial task context, message history, and provider runtime layer task context.
- Analyze final natural report contained more patterns than the structured finding set; only 3 structured `note_finding` records were available for Producer handoff.
- Producer input no longer replayed full analysis text, but still carried full previous `knowledge.submit` payloads through provider history.
- Producer declared completion after 4 candidates, then a generic continue nudge forced another Producer round.

External design anchors used only as design checks:

- OpenAI prompt engineering guidance recommends separating instructions from context and specifying output format clearly: `https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api`
- OpenAI prompt caching guidance recommends keeping static content in stable prefix positions and logging cache usage: `https://platform.openai.com/docs/guides/prompt-caching`
- OpenAI reasoning guidance recommends keeping prompts simple/direct and using examples/output contracts for complex requirements: `https://platform.openai.com/docs/guides/reasoning-best-practices`

Package J source repair:

| Design contradiction | Source repair | Evidence |
| --- | --- | --- |
| Task prompt owned by both message history and runtime task context. | `LLMInputAssembly` now writes `promptRef: initial-user-message` when the full prompt is already in provider history. | `test/llm-input-layering.test.ts` asserts provider runtime layer contains the prompt ref and does not replay the full task prompt. |
| Provider-history projection skipped Producer. | `AgentRuntime` applies stage-level provider-input projection to `produce` with a tighter budget. | Producer `llm.input` metadata now includes `inputProjection` in source/unit tests. |
| Analyst report could contain many patterns while structured findings stopped at 3. | `targetMemoryFindingCount()` scales required structured findings from 3 to 6 based on evidence tool volume; Analyst prompt now asks broad evidence surfaces to record 5-6 high-value findings. | `test/ExplorationStrategies.test.ts` proves 19 evidence calls require 5 findings before `RECORD→SUMMARIZE`. |
| Producer could say done, but loop ownership forced another generic continue nudge. | `ExplorationTracker.onTextResponse(text)` recognizes successful Producer completion with no remaining Analyst gap as final. | `test/ExplorationStrategies.test.ts` proves completion text stops after successful submission. |
| Runtime nudge/output contracts and prompt contracts were not aligned. | `NudgeGenerator` uses the same evidence-volume target in RECORD transition and current phase hints. | Expanded source/unit suite passed. |

Verification:

| Repo | Command | Result |
| --- | --- | --- |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` | pass; 4 files, 35 tests |
| `AlembicAgent` | `npm run build` | pass |
| `AlembicAgent` | `npm run lint` | pass |

PCVM reading:

- Package J is a source/unit repair, not a live-AI pass.
- The next valid live evidence step is Package K with fresh build proof and the same Package I route.
- Package K must prove both token reduction and useful-output recovery: route total model / accepted Recipe must improve without accepted Recipe count collapsing.

## Package K Same-Input Live Evidence

Evidence scope: `live-ai-local`

Raw evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-k-same-input-live-rerun-2026-05-31.md`
- Raw dir: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31`
- Raw summary: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/package-k-raw-summary.json`
- Per-round matrix: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/per-round-content-matrix.json`
- Round highlights: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/round-highlights.json`
- Fresh build proof: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/fresh-build-dist-proof.json`
- Stored payload summary: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/stored-recipe-payload-summary.json`
- Job/session: `bootstrap_mptk1wmf_acf5ee00` / `bs_1780218369370_ypny01`

Route:

| Field | Value |
| --- | --- |
| Project | `BiliDili` |
| Dimension | `design-patterns` |
| Route | one-dimension / no-delivery |
| Files | 24 |
| `contentMaxLines` | 80 |
| `skipGuard` | true |
| Provider/model | `deepseek/deepseek-v4-pro` |
| BiliDili status | clean; no `.asd/` or `Alembic/` write surface |

Same-input comparison:

| Metric | Package E | Package I | Package K | K vs E | K vs I | Reading |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| analyze input | 348915 | 154821 | 174988 | -49.85% | +13.03% | K remains far below E, but higher than I because it did more useful work. |
| producer input | 171785 | 118548 | 85823 | -50.04% | -27.60% | Producer projection/digest path improved. |
| route input | 520700 | 273369 | 260811 | -49.91% | -4.59% | Primary input token recovery holds. |
| route output | 38235 | 19573 | 25744 | -32.67% | +31.53% | Output rose vs I with more/larger payload. |
| route reasoning | 8238 | 6555 | 7816 | -5.12% | +19.18% | Reasoning not the primary blocker. |
| route total model | 567173 | 299497 | 294371 | -48.10% | -1.71% | Absolute model spend improved. |
| accepted Recipes | 13 | 4 | 6 | -53.85% | +50.00% | Useful output partly recovered, not restored. |
| submitted / rejected | 14 / 1 | 4 / 0 | 6 / 0 | n/a | n/a | Reject rate controlled. |
| total model / accepted | 43628.7 | 74874.3 | 49061.8 | +12.45% | -34.47% | K fails E unit-cost gate but fixes most of I regression. |
| invalid-no-evidence | 0 | 0 | 0 | 0 | 0 | Grounding held. |
| quality score | 100 | 97 | 100 | 0 | +3 | Quality held/recovered. |

Stored payload comparison:

| Metric | Package E | Package I | Package K | Reading |
| --- | ---: | ---: | ---: | --- |
| total stored payload approx tokens | 13115.0 | 3534.6 | 11984.6 | K nearly restores E persisted payload volume. |
| avg payload approx tokens / accepted Recipe | 1008.8 | 883.6 | 1997.4 | K Recipes are much larger/coarser. |
| model-to-payload amplification | 43.25x | 84.73x | 24.56x | K is best by payload-normalized efficiency. |
| input-to-payload amplification | 39.70x | 77.34x | 21.76x | K is best by payload-normalized input efficiency. |

Per-round facts:

- Peak analyze input by model tokens: iteration 12, input `21770`, provider history estimate `13859`, runtime input layer `916`, tool schema `427`.
- Provider-input projection first fired at analyze iteration 13 (`level=3`) and producer iteration 7 (`level=3`).
- First `note_finding` appeared at analyze iteration 8; first RECORD phase appeared at iteration 15.
- Analyze final output listed 7 pattern families: Singleton, DI container, Middleware, Actor, protocol abstraction, static factory, value type.
- Producer submitted 6 candidates and completed cleanly at iteration 9 with no extra post-completion candidate delta.

PCVM reading:

- Package K is `partial(scope=live-ai-local)`.
- The token-input target is materially improved versus Package E.
- Package I's accepted-count collapse is partially repaired (`4 -> 6`) but not restored to Package E (`13`).
- The accepted Recipe count gate is now confounded by Recipe granularity: K persisted fewer but much larger Recipes, and its model-to-payload amplification is better than E.
- First blocker for Package L: define and implement a stable useful-output granularity contract before more live reruns.

## Package K Input/Output Structure Self-Check

Evidence scope: `live-ai-local raw package full-structure review`

Detailed record: [package-k-structure-self-check.md](package-k-structure-self-check.md)

Self-check summary:

- The raw package is complete: `77` API events, `26` `llm.input`, `26` `llm.output`, `52` per-round matrix rows, `6` candidate payload files, fresh build proof, and clean BiliDili write boundary.
- All `16` analyze inputs and all `9` produce inputs contain `promptRef: initial-user-message`; none replay the full task prompt inside runtime `Task context`.
- All analyze/produce inputs include stage policy, tool contract, task context, evidence context, dynamic context, and `inputProjection` metadata.
- Provider-input projection fired once in analyze and once in Producer, but only after the peak input/history rounds.
- Analyze final report contains `7` pattern families, but structured findings and Producer candidates cover `6`; Value Type remains final prose / semantic insight, not a Recipe.
- Producer completion structure is not fully clean: 6 submitted, iteration 7 already says no remaining findings, iteration 8 still performs an extra evidence-check round with no candidate delta, and iteration 9 is the actual terminal summary.
- Producer tool-call outputs still carry full candidate JSON payloads. This is required for current submission, but it is real output-token cost.

PCVM reading:

- Input structure is mostly aligned with Package J expectations.
- Output structure is only partially aligned: Analyzer final Markdown and structured `note_finding` remain two sources of truth.
- Package L should focus on output granularity, structured finding coverage, and Producer terminal detection before another live AI rerun.

## Package L Source/Unit Repair Evidence

Evidence scope: `source-unit-fixture`

Owner repo: `../AlembicAgent`

Implemented source facts:

- `src/agent/context/ExplorationTracker.ts` recognizes Producer completion text that matches Package K output wording: all candidates successfully submitted, no unsubmitted findings, no blockers.
- `src/agent/runtime/LLMInputAssembly.ts` defines provider-visible stage policy that Analyzer final text must summarize recorded `note_finding` items only, and Producer candidate obligations come only from structured Analyst findings.
- `src/agent/prompts/insight-analyst.ts` defines `note_finding` as the single Producer fact source and prevents final Markdown from adding unstructured candidate families.
- `src/agent/prompts/insight-producer.ts` defines structured findings as the only candidate obligations; final Markdown digest is background only.
- `src/agent/context/exploration/NudgeGenerator.ts` directs Producer to treat Markdown-only themes as Analyst structured-finding gaps, not as extra candidate work.

Verification:

| Repo | Command | Result | PCVM reading |
| --- | --- | --- | --- |
| `AlembicAgent` | `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` | pass; 2 files, 21 tests | Covers Package K completion wording and provider-visible contract strings. |
| `AlembicAgent` | `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` | pass; 4 files, 38 tests | Expanded F-J source/unit suite remains green after Package L. |
| `AlembicAgent` | `npm run build` | pass | TypeScript compile passes. |
| `AlembicAgent` | `npm run lint` | pass | Biome checked 246 files, no fixes. |
| `AlembicAgent` | `git diff --check` | pass | No whitespace errors. |

PCVM reading:

- Package L is `pass(scope=source-unit-fixture)`.
- Product source was touched in `AlembicAgent` only; BiliDili and AlembicTest were not modified.
- This source/unit result is not live acceptance. Package M must verify the same-input route with real AI before PCVM can claim live improvement.

## Deleted Old Records

Status: `deleted`

PCVM removed the old round ledger, task packages, review notes, and AI analysis records from the current run. They must not be used for current scoring, dispatch, testing, or verdicts.
