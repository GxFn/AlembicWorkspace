# Unified LLM I/O Token Efficiency Plan

Run ID: `pcv-20260530-1515-alembic-cold-start`
Target: reduce duplicated and oversized LLM input/output in Alembic cold-start stages through one unified I/O design
Owner: `PCVM`
Current phase: `stopped-by-user-after-package-t-source-unit-repair`
Status: `stopped-by-user(scope=active-pcvm); historical-evidence-retained(package=S/T)`

## Controller Snapshot

Current goal: optimize `analyze`, `producer`, and adjacent LLM stages because current prompts and outputs are too large, repeat the same content across system prompt / runtime layer / dynamic context / analysis artifact / evidence map, and waste tokens. The previous LLM I/O contract evaluation is not a separate track; it is the implementation method for this token-efficiency target.

Current evidence:

- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` appends a runtime input layer containing stage policy, tool contract, task context, evidence context, and dynamic context.
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` sends `LLMInputAssembly.providerMessages` to the provider and records `llm.input` events.
- `AlembicAgent/src/agent/prompts/insight-producer.ts` Producer v2 repeats analysis text, findings, code evidence, referenced files, style guide, submit requirements, tool boundary, panorama, and rescan constraints in one large prompt.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` injects project facts, evidence starters, graph/panorama summaries, existing recipes, and context into `strategyContext`.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts` passes full `fileCache`, `strategyContext`, `promptContext`, and system run context into Agent execution.
- External best-practice research agrees on structured prompts, separated context/task/output sections, concise examples, structured/tool output, context caching, and explicit token budgeting.
- AlembicTest Package E raw evidence completed for BiliDili `design-patterns` one-dimension / no-delivery route. Quality constraints did not regress, but live primary token metrics regressed versus the previous same-input baseline.
- AlembicTest Package I raw evidence completed for the same route after Packages F-G-H. Absolute route tokens improved materially, but accepted Recipe count and per accepted Recipe unit cost regressed, so Package I does not pass the useful-output gate.

Current segment: `llm-stage-token-efficiency-live-verdict-and-output-contract`.

First blocker: none for active PCVM, because the user has cancelled `GTODO-2026-05-25-003 / PCVM` as an active task. Package T source/unit repair is retained as historical evidence only: it preserves capability action constraints through provider schema projection, adds action-level runtime allowlist enforcement, keeps compact submit payload completeness semantics, and injects a runtime-owned Producer submit ledger for final summaries. Do not start Package U same-input live rerun unless the user explicitly reopens PCVM.

## Non-Goals

- Do not create error taxonomy, reason split, responsibility fields, fix suggestion fields, or guardrail-only work.
- Do not call AlembicTest before source/unit baseline and candidate comparison are ready.
- Do not modify BiliDili or any real test project source.

## Metrics

Primary optimization metrics:

| Metric | Meaning | Baseline | Candidate pass |
| --- | --- | --- | --- |
| `llm.stageInputTokens.analyze` | Provider input tokens for analyze stage. | Same route before change. | Lower than baseline. |
| `llm.stageInputTokens.producer` | Provider input tokens for producer stage. | Same route before change. | Lower than baseline. |
| `llm.routeInputTokens.total` | Total provider input tokens for same cold-start route. | Same route before change. | Lower than baseline. |
| `llm.routeInputTokens.total / acceptedRecipeCount` | Route input tokens normalized by accepted Recipe count. | Same route before change. | Lower than baseline; prevents raw candidate-count changes from hiding cost. |
| `llm.routeOutputTokens.total / acceptedRecipeCount` | Route output tokens normalized by accepted Recipe count. | Same route before change. | Lower than or not worse than baseline. |
| `llm.totalModelTokens / acceptedRecipeCount` | Route input + output + reasoning normalized by accepted Recipe count. | Same route before change. | Lower than baseline. |
| `producer input/output / submittedRecipeCount` | Producer conversion cost per submitted Recipe attempt. | Same route before change. | Lower than baseline, with reject rate controlled. |
| `storedRecipePayloadApproxTokens` | Approximate token size of the persisted Recipe payload fields. | Current accepted Recipe DB rows when available. | Useful-output size should stay sufficient while provider cost falls. |
| `routeTotalModelTokens / storedRecipePayloadApproxTokens` | Token amplification from model spend to persisted Recipe payload. | Same route when payload is available. | Lower than candidate; this is a reference metric, not a quality gate alone. |
| `llm.duplicateBlockRatio` | Ratio of repeated normalized prompt blocks across input sections for the same stage. | Source/unit estimator before change. | At least 30% lower than baseline. |

Quality constraints:

| Metric | Constraint |
| --- | --- |
| `pcvAnalyzeGroundingInvalidNoEvidence` | Must not increase. |
| stage output tokens | Should decrease for non-final stages; cannot increase without a matching accepted-output improvement. |

If token metrics improve but quality constraints regress, the candidate fails.

## Baseline Design

Same-input baseline route:

- Target project: `BiliDili`
- Dimension: `design-patterns`
- Route: one-dimension / no-delivery
- Input budget: fixed `maxFiles` and `contentMaxLines`
- Source writes: none

Source/unit baseline before live AI:

1. Build a deterministic prompt-size probe around `LLMInputAssembly`.
2. Build a deterministic Producer prompt-size probe around `buildProducerPromptV2`.
3. Count approximate tokens by stable local estimator and count duplicate normalized blocks.
4. Record baseline values in `records/data.md`.

Live baseline only after source/unit baseline:

1. AlembicTest runs the same BiliDili route.
2. PCVM records stage input/output token usage and analyze quality constraints from raw report/process evidence.
3. The live baseline is only for same-input comparison, not final product acceptance.

## Unified Optimization Design

This is one design, not separate prompt, output, and provider projects:

1. Measure where tokens are spent and repeated.
2. Assign every content class to one owner section.
3. Compact inputs by owner section and evidence packet.
4. Compact outputs by stage, keeping actions in tools/structured fields.
5. Wire Alembic runtime context so the same facts are not injected through multiple surfaces.
6. Compare same-input token metrics while enforcing quality constraints.

### A. Input Ownership Map

Create one ownership map so each content class appears once:

| Content class | Owner section | Other sections may carry |
| --- | --- | --- |
| stage role and rules | `stagePolicy` | section id only |
| tool availability and forbidden tools | `toolContract` | tool names only |
| dimension/project facts | `taskContext` | compact ids only |
| evidence starters and deterministic refs | `evidenceContext` | refs only |
| large code snippets | `evidencePacket` | snippet ids only |
| Producer findings | `producerArtifact` | finding ids only |
| style/submit requirements | `outputContract` | version id only |

### B. I/O Contract As The Compaction Mechanism

Use a single `LLMInputContract` / `LLMStageOutputContract` pair to enforce ownership and reduce repetition.

Input contract sections:

- `stagePolicy`: stage role, allowed behavior, stop condition.
- `toolContract`: available tools, allowed tools, forbidden tools.
- `taskContext`: dimension/project identifiers and current stage objective.
- `evidencePacket`: compact evidence starters, deterministic refs, graph/panorama summaries, code snippet ids.
- `producerArtifact`: Producer-only findings and candidate budget.
- `outputContract`: expected output shape, tool-call preference, and concise free-text rule.

Rules:

- Each content class has exactly one owner section.
- Other sections may reference owner ids, not repeat owner content.
- Large evidence/code appears once in `evidencePacket`.
- Static style/submit requirements appear once by contract version or compact rule list.
- Provider-specific structured output behavior is used only when it reduces output drift or free-text bloat.

### C. Input Compaction

Implement in `AlembicAgent` first:

- Add a prompt block normalizer and duplicate block detector for source/unit measurement.
- Add section budgets to `LLMInputAssembly`.
- Render compact section summaries when a section exceeds budget.
- Move repeated static style/submit text to a stable `outputContract` section with a version id.
- For Producer, avoid sending full `analysisText`, `findings`, and `evidenceMap` redundantly when findings/evidence already carry the needed facts.
- For code evidence, send one compact evidence packet with snippet ids; downstream text refers to ids instead of repeating snippets.

### D. Output Compaction

Implement in `AlembicAgent`:

- Analyze stage: output only verified findings or next evidence action; do not echo full source context.
- Producer stage: use tool calls for submissions and keep free-text response minimal.
- Summary stage: summarize only final state, not full repeated evidence.
- Keep structured/tool output behavior provider-compatible; do not introduce strict DeepSeek beta behavior unless separately proven.
- For non-tool structured output, use existing `chatStructured()` path only when it replaces verbose prose with compact JSON.
- For tool stages, prefer native or compatible tool calls over explanatory text.

### E. Alembic Runtime Wiring

Implement only after `AlembicAgent` source/unit passes:

- Pass normalized LLM context packages from `Alembic` into `strategyContext`.
- Preserve `maxFiles` as input budget only.
- Do not add unrelated scoring or AI blame logic.

## Implementation Packages

### Package E Diagnosis: Live Token Regression Root Cause

Owner repo: `PCVM` diagnosis over `AlembicAgent` / `Alembic` source and `AlembicTest` reports

Goal: compare live evidence with the same-input baseline and identify the first source-level fix target.

Status: `diagnosed(scope=root-cause-analysis)`

Findings:

- Package B/C did reduce the first provider call and source/unit fixtures, but Package E failed because live analyze ran longer and accumulated more provider-visible history.
- Baseline analyze used `14` iterations and `24` analyze tool calls; Package E analyze used `20` iterations and `37` analyze tool calls.
- Timeline retained inputs show candidate analyze started smaller than baseline (`3904` vs `4044` estimated tokens on retained iteration 1), then grew to `19923` estimated tokens / `79692` original chars by retained analyze iteration 16 before late collapse.
- `ContextWindow.compactIfNeeded()` is tied to a large model token budget and thresholds; on DeepSeek V4 system runs this allows history growth before L3 projection appears.
- `AgentRuntime` sends `ctx.messages.toProjectedMessages()` plus the runtime input layer. The Package B/C compaction covers the runtime input layer, but not old assistant/tool/nudge messages until ContextWindow projection activates.
- `PipelineStrategy` resets ContextWindow between stages, so producer does not inherit analyze history. Producer total input improved slightly because it ran fewer iterations, but Producer v2 still embeds full `analysisText` and repeated findings/evidence/style requirements in the stage prompt.
- Output regression is partly a loop-count and candidate-count effect: accepted candidates changed from `10` to `13`, so raw route output grew even though some per-event visible producer outputs became shorter.

Conclusion:

- The next optimization target is not SourceRef and not another live rerun.
- The first code target is analyze-stage history and stop/compaction behavior.
- The second code target is the Producer artifact contract, replacing full `analysisText` replay with a compact finding/evidence packet.

### Package F: Live Message-History Diagnostic And Analyze Context Budget

Owner repo: `AlembicAgent`

Goal: make analyze-stage live input growth measurable and reduce provider-visible history before DeepSeek V4's large context budget allows late collapse.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/context/ContextWindow.ts`
- `src/agent/runtime/LLMInputMeasurement.ts`
- `test/ContextWindow.test.ts`
- `test/llm-input-layering.test.ts`

Output:

- Per-call measurement separates projected message history, runtime input layer, system prompt, and tool schemas.
- Analyze-stage compaction/projection can trigger from stage-specific provider-input budget or message-count growth, not only global model context ratio.
- Old tool results, nudges, and repetitive assistant text are summarized or projected earlier while preserving recent evidence rounds and recorded finding ids.
- Deterministic tests prove projected analyze input growth is capped without dropping required finding/evidence markers.

Verification:

- `npm test -- test/ContextWindow.test.ts test/llm-input-layering.test.ts`
- `npm run build`
- `npm run lint`

Evidence:

- `AlembicAgent/src/agent/runtime/LLMInputMeasurement.ts` now separates provider history, appended runtime input layer, provider messages, system prompt, and tool schema estimated tokens.
- `AlembicAgent/src/agent/context/ContextWindow.ts` now has provider-input budget projection that can trigger before the large model context ratio is high.
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` now applies the provider-input projection for analyze/record/summarize profiles before building provider messages and emits `inputSizeEstimate` plus `inputProjection` metadata in `llm.input`.
- `AlembicAgent/src/agent/runtime/MessageAdapter.ts` exposes the provider-input projection through the runtime message abstraction.
- `AlembicAgent/test/ContextWindow.test.ts` proves provider-input projection can collapse old tool rounds under a stage-level budget while preserving recent evidence.
- `AlembicAgent/test/llm-input-layering.test.ts` proves the new input-size split is visible in process metadata and measurement fixtures.
- `npm test -- test/llm-input-layering.test.ts test/ContextWindow.test.ts` passed 15 tests.
- `npm run build` passed.
- `npm run lint` passed.

### Package G: Analyze Loop Exit And Nudge Cost Control

Owner repo: `AlembicAgent`

Goal: prevent token gains from being erased by extra analyze iterations and repeated nudge/progress text.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `src/agent/context/exploration/ExplorationStrategies.ts`
- `src/agent/context/exploration/ExplorationTracker.ts`
- `src/agent/context/exploration/NudgeGenerator.ts`
- `test/ExplorationStrategies.test.ts`

Output:

- Analyze transitions should move from EXPLORE/VERIFY to RECORD/SUMMARIZE once sufficient evidence and finding count are present, instead of waiting for late budget ratios.
- Repeated progress/nudge text should be ephemeral or compacted so it does not accumulate as provider-visible history.
- Tests cover the same condition that regressed in Package E: more tool calls and findings must not automatically force more turns.

Verification:

- `npm test -- test/ExplorationStrategies.test.ts`
- targeted runtime fixture for nudge/message count growth

Evidence:

- `AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts` now allows EXPLORE/VERIFY to converge earlier when at least 3 evidence-backed findings are already recorded with sufficient evidence tool calls.
- `AlembicAgent/src/agent/context/ContextWindow.ts` now keeps runtime nudges ephemeral by removing older runtime nudge messages before appending the latest nudge.
- `AlembicAgent/test/ExplorationStrategies.test.ts` covers early convergence once enough evidence-backed findings are recorded.
- `AlembicAgent/test/ContextWindow.test.ts` covers runtime nudge replacement.
- `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` passed 33 tests.
- `npm run build` passed.
- `npm run lint` passed.

### Package H: Producer Artifact Contract

Owner repo: `AlembicAgent`

Goal: reduce Producer prompt size by replacing full analysis replay with compact, structured findings and evidence references.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `src/agent/prompts/insight-producer.ts`
- Producer prompt tests in `test/llm-input-layering.test.ts` or a dedicated producer prompt test

Output:

- Producer prompt carries finding ids, concise finding text, required source refs, and bounded evidence snippets.
- Full `analysisText` is no longer replayed alongside findings/evidence when structured artifact fields already contain the required facts.
- Style and submit requirements are represented by compact contract text or versioned requirement ids.

Verification:

- source/unit producer prompt size decreases against the current fixture
- candidate content still contains required Cursor delivery fields and source refs

Evidence:

- `AlembicAgent/src/agent/prompts/insight-producer.ts` now renders a compact `Analyst 分析摘要` instead of replaying full `analysisText` in Producer v2.
- The digest preserves headings, source paths, and finding/evidence keywords while bounding narrative body text.
- `AlembicAgent/test/llm-input-layering.test.ts` verifies the long analysis body is not replayed wholesale while the required source path and finding remain visible.
- `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` passed 33 tests.
- `npm run build` passed.
- `npm run lint` passed.

### Package I: Same-Input Live Rerun Verdict

Owner repo: `AlembicTest`

Goal: verify whether Packages F-H improve the same BiliDili route without weakening useful output.

Status: `failed(scope=live-ai-local, reason=unit-cost-and-accepted-count-regression)`

Evidence:

- AlembicTest raw dir: `../AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptide7s_a086f60e` / `bs_1780215546262_fmbz5b`
- Route: BiliDili `design-patterns`, one-dimension/no-delivery, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.
- Fresh build and clean source proof were provided by AlembicTest.

Result:

- Route total model tokens improved `567173 -> 299497` (-47.19%) versus Package E.
- Accepted Recipes fell `13 -> 4`.
- Route total model / accepted Recipe regressed `43628.7 -> 74874.3` (+71.62%).
- The failure is a useful-output regression, not a SourceRef issue.

### Package J: Systemic Source Repair

Owner repo: `AlembicAgent`

Goal: repair the design contradictions exposed by Package I while preserving the F-H token savings direction.

Status: `pass(scope=source-unit-fixture)`

Design contradictions repaired:

- Runtime input ownership: `Task context` now references the initial user message instead of replaying the full task prompt when it is already in provider history.
- Provider history ownership: provider-input budget projection now also applies to `produce`, not only analyze/record/summarize.
- Analyst coverage ownership: `RECORD→SUMMARIZE` now uses an evidence-volume target (`3-6` findings) instead of always allowing 3 findings for broad evidence surfaces.
- Producer completion ownership: Producer completion text with successful submissions and no remaining Analyst gap can stop the loop instead of receiving another generic continue nudge.
- Analyst prompt ownership: the prompt now states that broad evidence surfaces should record 5-6 high-value findings, aligning prompt contract with runtime transition policy.

Verification:

- `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` passed 35 tests.
- `npm run build` passed.
- `npm run lint` passed.

Next live gate:

- Package K should rerun the same-input route only after fresh build proof.
- Required return evidence: stage totals, per accepted/submitted Recipe metrics, per-round content matrix, `inputSizeEstimate`, `inputProjection`, accepted/submitted/rejected counts, and BiliDili clean status.

### Package A: Unified Measurement Baseline

Owner repo: `AlembicAgent`

Goal: measure current token waste and repeated content before changing behavior.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `src/agent/runtime/LLMInputAssembly.ts`
- `src/agent/prompts/insight-producer.ts`
- `test/llm-input-layering.test.ts`

Output:

- deterministic stage prompt size estimator
- duplicate block counter
- unit fixtures for analyze and producer prompt size
- ownership report: which content class is repeated across sections

Evidence:

- `AlembicAgent/src/agent/runtime/LLMInputMeasurement.ts`
- `AlembicAgent/test/llm-input-layering.test.ts`
- `npm test -- test/llm-input-layering.test.ts` passed 10 tests.
- `npm run build` passed.
- `npm run lint` passed.

Verification:

- `npm test -- test/llm-input-layering.test.ts`
- `npm run build`

### Package B: Unified Input Contract And Compaction

Owner repo: `AlembicAgent`

Goal: reduce duplicated and oversized input by introducing the unified section ownership contract.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `src/agent/runtime/LLMInputAssembly.ts`
- `src/agent/prompts/insight-producer.ts`
- matching tests

Output:

- budgeted input sections
- single evidence packet rendering
- compact Producer prompt
- no repeated style/evidence/project blocks across runtime layer and Producer prompt

Evidence:

- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` now dedupes later repeated long blocks across input sections and records `metadata.inputCompaction`.
- `AlembicAgent/src/agent/prompts/insight-producer.ts` now compacts repeated long Producer prompt lines across analysis text, findings, and evidence map.
- Same fixture candidate: analyze estimated tokens `839 -> 805`, analyze duplicate ratio `0.1292 -> 0.0239`; Producer estimated tokens `964 -> 848`, Producer duplicate ratio `0.0527 -> 0.0161`.
- `npm test -- test/llm-input-layering.test.ts test/evidence-recording-phase-chain.test.ts` passed 21 tests.
- `npm run build` passed.
- `npm run lint` passed.

Verification:

- same source/unit estimator shows lower input tokens and duplicate ratio
- `npm test -- test/llm-input-layering.test.ts test/evidence-recording-phase-chain.test.ts`
- `npm run build`

### Package C: Output Contract And Stage Output Compaction

Owner repo: `AlembicAgent`

Goal: reduce non-final free-text output and keep actions in tools/structured fields without changing provider behavior blindly.

Status: `pass(scope=source-unit-instruction)`

Likely files:

- `src/agent/runtime/AgentRuntime.ts`
- `src/agent/prompts/insight-analyst.ts`
- `src/agent/prompts/insight-producer.ts`
- matching tests

Output:

- concise stage output instructions
- no full evidence echo in analyze/producer text
- compact structured/tool output preference by stage

Evidence:

- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` stage policies now tell analyze to emit only verified finding ids or the next evidence action, Producer to emit submit counts and blockers only, and summarize not to replay full evidence text.
- `AlembicAgent/test/llm-input-layering.test.ts` asserts the analyze and Producer output-compaction instructions are present in provider-visible stage policy.
- Output-token reduction still requires later live same-input evidence; this source/unit step only verifies the instruction contract.

Verification:

- unit tests confirm prompt instructions and process evidence shape
- live route later compares output tokens

### Package D: Runtime Context Wiring

Owner repo: `Alembic`

Goal: stop injecting duplicated project/evidence context into multiple Agent input surfaces.

Status: `pass(scope=source-unit-fixture)`

Likely files:

- `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts`
- `test/unit/BootstrapInputBuilder.test.ts`

Verification:

- `npm run test:unit -- test/unit/BootstrapInputBuilder.test.ts`
- `npm run build:check`
- `npm run lint`

Evidence:

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` now keeps bulky project/evidence facts in `strategyContext` while keeping `systemRunContext` to runtime references and PCV mapping fields.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts` compacts `context.systemRunContext` before attaching it to `AgentRunInput`.
- `test/unit/BootstrapDimensionRuntimeBuilder.test.ts` asserts `projectGraph`, `existingRecipes`, and `projectOverview` remain in `strategyContext` and are not duplicated onto `systemRunContext`.
- `npm run build` passed and refreshed dist used by unit imports.
- `npm run test:unit -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts` passed 5 tests.
- `npm run build:check` passed.
- `npm run lint` passed.

### Package E: Same-Input Live Comparison

Owner: `AlembicTest`

Run only after Package A-D source/unit pass.

Status: `failed(scope=live-ai-local, reason=primary-token-regression)`

Return:

- analyze input/output tokens
- producer input/output tokens
- route total input/output tokens
- `pcvAnalyzeGroundingInvalidNoEvidence`
- report path, job id, timeline path
- BiliDili git status

Evidence:

- AlembicTest report: `../AlembicTest/docs/pcvm-package-e-same-input-live-comparison-2026-05-31.md`
- Raw summary: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/package-e-raw-summary.json`
- Timeline/process evidence: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/timeline.json`
- Latest report API snapshot: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/api-report-latest.json`
- Job id: `bootstrap_mptfvl61_f75bdcb6`
- Session id: `bs_1780211356238_xiafi2`
- BiliDili git status: clean

Same-input live comparison:

| Metric | Baseline | Candidate | Delta | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| analyze input tokens | 180337 | 348915 | +168578 (+93.48%) | primary regression |
| analyze output tokens | 9434 | 13242 | +3808 (+40.36%) | output regression |
| producer input tokens | 174149 | 171785 | -2364 (-1.36%) | small improvement |
| producer output tokens | 17705 | 24993 | +7288 (+41.16%) | output regression |
| route input tokens | 354486 | 520700 | +166214 (+46.89%) | primary regression |
| route output tokens | 27139 | 38235 | +11096 (+40.89%) | output regression |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 | quality constraint held |
| quality score | 97 | 100 | +3 | quality did not regress |

This package answered the live evidence question but did not pass the optimization gate. The result must not be promoted to product acceptance or hidden behind the source/unit fixture improvement.

### Package K: Same-Input Live Rerun Verdict

Owner repo: `AlembicTest`

Goal: verify Package J source repair on the same BiliDili route with fresh build proof and per-round matrix.

Status: `partial(scope=live-ai-local)`

Evidence:

- Raw dir: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31`
- Report: `../AlembicTest/docs/pcvm-package-k-same-input-live-rerun-2026-05-31.md`
- Job/session: `bootstrap_mptk1wmf_acf5ee00` / `bs_1780218369370_ypny01`
- Route: BiliDili `design-patterns`, one-dimension/no-delivery, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.
- Fresh build proof confirmed AlembicAgent and Alembic builds and runtime linkage to local AlembicAgent source.
- BiliDili git status was clean; no `.asd/` or `Alembic/` write surface under BiliDili.

Result:

| Metric | Package E | Package I | Package K | PCVM reading |
| --- | ---: | ---: | ---: | --- |
| route input | 520700 | 273369 | 260811 | K improves over E and I. |
| route total model | 567173 | 299497 | 294371 | K improves over E and I. |
| accepted Recipes | 13 | 4 | 6 | K recovers I collapse partly, but not E coverage. |
| total model / accepted | 43628.7 | 74874.3 | 49061.8 | K improves over I but remains worse than E. |
| stored payload approx tokens / Recipe | 1008.8 | 883.6 | 1997.4 | K persisted Recipes are much larger. |
| model-to-payload amplification | 43.25x | 84.73x | 24.56x | K improves payload-normalized efficiency. |
| invalid-no-evidence | 0 | 0 | 0 | Quality constraint held. |
| quality score | 100 | 97 | 100 | Quality held/recovered. |

Per-round reading:

- Peak analyze input by model tokens was iteration 12: input `21770`, provider history estimate `13859`, input layer `916`, tool schemas `427`.
- First `note_finding` appeared at analyze iteration 8; first RECORD phase was iteration 15.
- Analyze final summary listed 7 pattern families, while Producer converted 6 structured findings into 6 accepted candidates.
- Every LLM output row was read after the user challenge. Producer iteration 7 already declared all 6 candidates complete and no unsubmitted findings, but iteration 8 still performed an extra evidence-check round before the actual terminal summary at iteration 9. Candidate delta stayed done, but stop behavior is not clean.

PCVM conclusion:

- Package K passes the token-input recovery part of the gate.
- Package K does not pass accepted-count / total-model-per-accepted gate versus Package E.
- Payload-normalized efficiency improved strongly, so accepted Recipe count alone is now an unstable useful-output metric.
- Package L should stabilize Recipe granularity, Analyzer/Producer coverage contract, and Producer terminal detection before another live rerun.

### Package L: Output Contract And Stop Ownership Source Repair

Owner repo: `AlembicAgent`

Goal: repair the deterministic design contradiction found by reading every Package K LLM output row: Producer followed 6 structured findings, but final Analyst Markdown remained a second source of candidate-worthy themes, and Producer completion-like text at iteration 7 was not recognized as terminal.

Status: `pass(scope=source-unit-fixture)`

Source changes:

- `src/agent/context/ExplorationTracker.ts` now passes text into Producer completion detection and recognizes real Package K wording such as `所有 6 个知识候选已成功提交...无未提交发现，无阻断`.
- `src/agent/runtime/LLMInputAssembly.ts` now states that Analyst final text must summarize recorded `note_finding` items only, and Producer obligations come only from structured Analyst findings.
- `src/agent/prompts/insight-analyst.ts` now makes `note_finding` the single Producer fact source; final Markdown must not introduce unstructured candidate families.
- `src/agent/prompts/insight-producer.ts` now says structured findings are the only candidate obligations and final Markdown digest is background only.
- `src/agent/context/exploration/NudgeGenerator.ts` now tells Producer not to mine final Markdown for new candidate themes and to request Analyst structured-finding gaps instead.

Verification:

- `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` passed; 2 files, 21 tests.
- `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts` passed; 4 files, 38 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `git diff --check` passed in `AlembicAgent`.

PCVM reading:

- Package L does not change SourceRef, does not change BiliDili, and does not add taxonomy or guardrail-only work.
- This was a source/unit repair only. It could not prove live AI would follow the new output contract.
- Package M was the next same-input live rerun on the Package K route, with explicit attention to: Producer terminal iteration, Analyzer final Markdown vs structured findings, accepted Recipe count, stored payload size, and route total model / accepted Recipe.

### Package M: Same-Input Live Rerun Verdict

Owner repo: `AlembicTest` evidence, `PCVM` raw row review

Goal: verify Package L live behavior on the same BiliDili route by reading actual inputs/outputs, not only aggregate metrics.

Status: `partial(scope=live-ai-local-structure)`

Evidence:

- Raw dir: `../AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31`
- Report: `../AlembicTest/docs/pcvm-package-m-same-input-live-rerun-2026-05-31.md`
- Job/session: `bootstrap_mptmg4ep_8a6f5854` / `bs_1780222392585_qizud3`
- Per-row self-check: `report/records/package-m-structure-self-check.md`
- Route: BiliDili `design-patterns`, one-dimension/no-delivery, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.

Result:

| Metric | Package K | Package M | PCVM reading |
| --- | ---: | ---: | --- |
| route input | 260811 | 278927 | M regresses versus K. |
| route output | 25744 | 22283 | Raw output improves. |
| route total model | 294371 | 307767 | M regresses all-in. |
| accepted Recipes | 6 | 5 | Useful-output count falls. |
| total model / accepted | 49061.83 | 61553.40 | Fails useful-output unit gate. |
| stored payload avg approx tokens / Recipe | 1997.4 | 2127.2 | Payloads are not smaller. |
| model-to-payload amplification | 24.56x | 28.94x | Worse than K. |
| invalid-no-evidence | 0 | 0 | Quality constraint held. |
| quality score | 100 | 98 | Still pass, but breadth fell. |

Per-row reading:

- `per-round-content-matrix.json` has 61 rows: `llm.input=25`, `llm.output=25`, `llm.reflection=11`.
- Every provider input/output/reflection artifact was read in `package-m-structure-self-check.md`.
- Analyze final Markdown has 7 confirmed pattern-family sections, while structured `note_finding` and Producer candidates are 5.
- Producer submits exactly the 5 structured findings and does not submit the Markdown-only `Middleware Chain + Observer` or `Value-Type` themes.
- Package K's post-completion evidence/code-check round is gone.
- Producer iteration 9 emits a terminal completion report, then a continue nudge creates iteration 10 no-tool final status.
- Producer input regresses because direct Analyst code excerpts, additional code reads, and candidate payload history stay provider-visible.

PCVM conclusion:

- Package M proves Package L's Producer obligation contract is directionally correct.
- Package M does not prove final Markdown single-source discipline or direct Producer termination.
- Package M fails the useful-output normalized gate versus K.
- Package N source/unit repair below supersedes this blocker; the next action is Package O same-input live rerun.

### Package N: Final Markdown, Producer Stop, And Producer Input Ownership Repair

Owner repo: `AlembicAgent`

Goal: repair the Package M residual contradictions before another live rerun.

Status: `repaired(scope=source-unit); pending(scope=same-input-live-rerun, package=O)`

Implemented source outcomes:

- Analyze final Markdown nudges, forced summaries, and stage policy now require confirmed/core sections to come from recorded `note_finding` only; unrecorded signals must be downgraded to "待探索/未结构化记录".
- Producer no-tool completion reports such as `提交完成报告` with Markdown-bold `未提交: 0` are recognized as terminal by `ExplorationTracker` and do not require another continue nudge.
- Producer evidence input is refs-first: `buildCodeContextSection()` now emits bounded Analyst evidence refs instead of direct code bodies, and Producer instructions only allow narrow `code.read` when exact short snippets are missing.
- `ContextWindow` compacts provider-visible `knowledge.submit` tool-call args to action + compact params (`title`, `trigger`, `kind`, `dimensionId`, etc.) before the next provider turn, while keeping execution args unchanged.

Source/unit verification:

- `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts test/ContextWindow.test.ts` passed; 3 files, 30 tests.
- `npm test -- test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` passed; 2 files, 22 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `git diff --check` passed.

Remaining blocker:

- Package N was not a live verdict; Package O below supersedes this blocker with live evidence.

### Package O: Same-Input Live Rerun After Package N

Evidence:

- Raw dir: `../AlembicTest/tmp/pcvm-package-o-same-input-live-rerun-2026-05-31`
- Report: `../AlembicTest/docs/pcvm-package-o-same-input-live-rerun-2026-05-31.md`
- Job/session: `bootstrap_mptor1y1_6ad15f51` / `bs_1780226261219_6210re`
- Per-row self-check: `report/records/package-o-structure-self-check.md`
- Route: BiliDili `design-patterns`, one-dimension/no-delivery, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.

Result:

| Metric | Package M | Package O | PCVM reading |
| --- | ---: | ---: | --- |
| route input | 278927 | 274311 | Slight improvement, but still above K. |
| route output | 22283 | 27601 | Regression caused by Producer retries and extra final round. |
| route reasoning | 6557 | 7712 | Regression. |
| route total model | 307767 | 309624 | Essentially flat/slightly worse. |
| accepted Recipes | 5 | 7 | Useful-output count improves. |
| submit attempts / rejected | 5 / 0 | 11 / 4 | Producer schema-contract waste appears. |
| total model / accepted | 61553.40 | 44232.00 | Useful-output normalized cost improves. |
| stored payload avg approx tokens / Recipe | 2127.2 | 1457.0 | Payloads are smaller. |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | Quality constraint held. |
| quality score | 98 | 100 | Quality recovered. |

PCVM conclusion:

- Package O proves Package N fixed Analyze final Markdown single-source behavior in live output.
- Package O proves Producer direct-code replay and full candidate-payload provider-history replay are substantially improved.
- Package O does not pass the raw route token gate because Producer completion still adds one extra no-tool round, and submit schema retries increase output/reasoning.
- Verdict: `partial(scope=live-ai-local, package=O)`.

### Package P: Producer Completion And Submit Schema Repair

Owner repo: `AlembicAgent`

Goal: repair the two Package O residual Producer wastes before another live rerun.

Status: `repaired(scope=source-unit); partial(scope=live-ai-local, package=Q, target=Package-P-effects)`

Implemented source outcomes:

- `ExplorationTracker` now recognizes Package O's mixed English/Chinese completion wording, including "All 7 structured Analyst findings have been successfully submitted", `提交候选数: 7/7`, `阻塞项: 无`, and similar no-remaining summaries.
- `PRODUCER_SYSTEM_PROMPT` now surfaces `description` as a required field before submission and tells Producer to self-check `params.description` before every `knowledge.submit`.

Source/unit verification:

- `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` passed; 2 files, 25 tests.
- `npm test -- test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` passed; 3 files, 29 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `git diff --check` passed.

Live effect in Package Q:

- Missing-`description` submit rejects disappeared.
- No continue nudge or extra no-tool final round appeared after Q's only Producer final summary.
- Package P's all-submitted terminal detection is still not fully proven because Q never reached an all-submitted completion; Producer stopped with `5` structured findings unsubmitted.

### Package Q: Same-Input Live Rerun Failure Root-Cause

Evidence:

- Raw dir: `../AlembicTest/tmp/pcvm-package-q-same-input-live-rerun-2026-05-31`
- Report: `../AlembicTest/docs/pcvm-package-q-same-input-live-rerun-2026-05-31.md`
- Job/session: `bootstrap_mptqix3b_9d08f491` / `bs_1780229241375_wkpvcc`
- Root-cause record: `report/records/package-q-failure-root-cause.md`
- Package under validation: `AlembicAgent` commit `603626c`.

Result:

| Metric | Package O | Package Q | PCVM reading |
| --- | ---: | ---: | --- |
| route input | 274311 | 273093 | Essentially flat/slightly improved. |
| route output | 27601 | 16423 | Lower because Producer stopped early. |
| route reasoning | 7712 | 5949 | Lower. |
| route total model | 309624 | 295465 | Lower, but not useful without accepted coverage. |
| accepted Recipes | 7 | 1 | Useful output collapsed. |
| submit attempts / rejected | 11 / 4 | 2 / 1 | Attempts fell because Producer stopped early; remaining reject is missing `title`. |
| total model / accepted | 44232 | 295465 | Severe useful-output regression. |
| unsubmitted structured findings | n/a | 5 | Main failure. |

PCVM conclusion:

- Q is `fail(scope=live-ai-local, package=Q)`.
- The failure is not safe to classify as an occasional model-only issue. The exact model path was stochastic, but source logic made it possible and then deterministic:
  - provider-visible tool schema exposes only generic `action`/`params`, while runtime `knowledge.submit` validation requires `title`;
  - Producer can spend rounds on `knowledge.detail` and `meta.tools`;
  - `STRATEGY_PRODUCER` transitions to `SUMMARIZE` after `submitCount > 0 && roundsSinceSubmit >= idleRoundsToExit`, without checking remaining structured findings.
- The next repair is Package R source/unit: make required submit fields provider-visible, constrain Producer non-submit actions, and add candidate-obligation tracking before another live rerun.

### Package R: Producer Coverage Source/Unit Repair

Owner repo: `AlembicAgent`

Goal: repair the deterministic source causes that let Package Q stop after `1/6` structured findings.

Status: `repaired(scope=source-unit-fixture); fixed(scope=live-ai-local-coverage, package=S); superseded-by-contract-unification-blocker(package=T)`

Implemented source outcomes:

- `PipelineStrategy` derives `targetSubmits` from `gateArtifact.findings.length` for the Producer stage.
- `STRATEGY_PRODUCER` and `ExplorationTracker` no longer accept idle/text completion while `submitCount < targetSubmits`.
- `NudgeGenerator` tells Producer exactly how many structured findings remain and forbids `detail/tools/plan` drift.
- `ToolExecutionPipeline` adds `producerSubmitOnlyGate`: Producer PRODUCE allows only `knowledge.submit`, narrow `code.read`, `memory.recall`, and `meta.review`; SUMMARIZE disables tools.
- `generateLightweightSchemas()` now includes action-specific required params in `params.description`, including nested `content.markdown`, `content.rationale`, and `reasoning.sources`.
- Producer system/capability/retry prompts now make `title`, `description`, `content.markdown`, `content.rationale`, and `reasoning.sources` explicit pre-submit fields.

Source/unit verification:

- `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` passed; 2 files, 29 tests.
- `npm test -- test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` passed; 3 files, 29 tests.
- `npm test` passed; 28 files, 174 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `npm run lint:core-import-boundary` passed.
- `git diff --check` passed.
- Commit: `AlembicAgent` `bcdc8bf` (`Repair producer coverage controls`).

PCVM reading:

- Package R is not live evidence. It proves the deterministic state machine/tool schema/tool boundary repair is in place.
- Package S used the same BiliDili `design-patterns` one-dimension/no-delivery route and supersedes this blocker with live evidence.

### Package S: Same-Input Live Rerun Design Root-Cause Audit

Owner repo: `PCVM` diagnosis over `AlembicAgent` / `AlembicCore` source and `AlembicTest` raw evidence

Goal: read Package S raw evidence and confirm whether remaining failures are occasional/live-noise or design-level source causes.

Status: `partial(scope=live-ai-local); diagnosed(scope=design-root-cause); blocked(scope=Package-T-contract-unification)`

Live evidence:

- AlembicTest raw dir: `../AlembicTest/tmp/pcvm-package-s-same-input-live-rerun-2026-05-31`.
- Job/session: `bootstrap_mptshl7z_b66ab16d` / `bs_1780232538380_vo8e6m`.
- Timeline classification says `ok=true`, `classification=pass`, but PCVM classifies it as partial, not final pass.
- Retained events: `72` (`llm.input=24`, `llm.output=24`, `llm.reflection=12`).
- Stage counts: analyze `16` inputs / `16` outputs; produce `7` inputs / `7` outputs.
- Job result: `extracted=6`, `created=6`, `degraded=false`, `toolCallCount=42`.
- Token usage: input `246703`, output `22825`, reasoning `5922`, total model `275450`, per created Recipe `45908.33`.
- QualityGate total score: `98`.

Confirmed improvements:

- Package S fixes the Package Q useful-output collapse: Producer created `6/6` structured findings.
- Missing-`description` rejects did not recur.
- Candidate files are persisted with full required payload fields.

Confirmed remaining problems:

- Producer still attempts invalid actions after submit coverage: `knowledge.detail` and `knowledge.manage` are visible in retained inputs and blocked by `producerSubmitOnlyGate`.
- Provider-visible schemas still expose broad actions: `knowledge.search/submit/detail/manage` and `meta.tools/plan/review`, even though `BootstrapProduce.allowedTools` only allows `knowledge.submit` and `meta.review`.
- Final Producer summary falsely says candidates were submitted with only partial fields; persisted candidate files prove full payloads exist.
- One candidate contains `aactor` typos while still receiving grade `A`, proving current quality scoring is structural rather than exact-code validation.

Root cause:

- Action-level capability constraints are declared in `BootstrapProduce.allowedTools`, but `CapabilityV2.tools`, `AgentRuntime.#collectTools()`, and `V2CapabilityCatalog.generateSchemas()` reduce them to tool ids and expand back to all registered actions.
- Runtime gates enforce Producer constraints after bad actions are selected, so they are safety nets rather than the provider-visible source of truth.
- `ContextWindow.compactKnowledgeArgsForProviderHistory()` removes submit payload fields for token savings, but no compact semantic ledger preserves `requiredFieldsComplete` / `payloadStored` facts.
- Final summaries reconstruct completion from compressed conversation history instead of runtime-owned submit state.
- `knowledge.submit` validation and `QualityScorer` check field presence, length, structure, and provenance, not exact-source code correctness.

PCVM reading:

- Package S is a useful live improvement but not a clean pass.
- The repeated failures are systemic design fragmentation across prompt, provider schema, runtime gate, tracker, history compaction, persistence, quality scoring, and final summary.
- The next step must be Package T contract-unification, not another temporary Producer-only patch.

Evidence record:

- `records/package-s-root-cause-design-audit.md`

### Package T: Stage Capability Action Contract And Submit Ledger Repair

Owner repo: `AlembicAgent`

Goal: repair Package S's design root cause at the source/unit level, without a Producer-only ad hoc patch.

Status: `repaired(scope=source-unit-fixture); stopped-by-user(scope=active-pcvm)`

Implemented source outcomes:

- `AgentRuntime` now carries a `RuntimeToolContract` containing tool ids and action allowlists.
- `V2CapabilityCatalog` now exposes action-aware schema projection methods and can render schemas from `Record<tool, action[]>`.
- Producer `knowledge_production` provider schema now exposes `knowledge.submit`, `code.read`, `memory.recall`, and `meta.review`, not broad actions such as `knowledge.detail/manage/search` or `meta.tools/plan`.
- Direct `note_finding` is only added when `memory.note_finding` is allowed; Producer has `memory.recall`, so direct `note_finding` is no longer leaked to Producer.
- `ToolExecutionPipeline.allowlistGate` checks action-level allowlists before execution, aligning runtime blocking with the provider schema contract.
- Compacted `knowledge.submit` provider history now carries a small `payloadSummary` with `requiredFieldsComplete`, `sourceCount`, omitted fields, and `contentOmittedForProviderHistory=true`.
- Producer successful submit creates `_producerSubmitLedger` entries with `payloadStored`, `requiredFieldsComplete`, `sourceCount`, status, title, trigger, and target count when available.
- `LLMInputAssembly` injects the compact `producerSubmitLedger` as the final-summary source of truth.
- Diagnostics record `allowedToolActions` with stage toolsets.

Source/unit verification:

- `npm test -- test/tool-v2-contract.test.ts test/llm-input-layering.test.ts test/ContextWindow.test.ts test/ExplorationStrategies.test.ts` passed; 4 files, 45 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `npm test` passed; 28 files, 177 tests.
- `npm run lint:core-import-boundary` passed.
- `git diff --check` passed.

PCVM reading:

- Package T repairs the source/unit causes behind Package S's schema leak and final-summary misread.
- This is not live evidence. The formerly proposed Package U same-input live rerun is not active after the user cancelled PCVM; retain this as historical source/unit evidence only.

Evidence record:

- `records/package-t-contract-unification-repair.md`

## Scoped Verdict

Verdict: `stopped-by-user(scope=active-pcvm); historical-evidence-retained(package=S/T)`

Next action: none. Do not launch Package U or any new PCVM live rerun unless the user explicitly reopens PCVM with a new goal and completion definition.
