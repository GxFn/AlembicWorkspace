# Unified LLM I/O Token Efficiency Plan

Run ID: `pcv-20260530-1515-alembic-cold-start`
Target: reduce duplicated and oversized LLM input/output in Alembic cold-start stages through one unified I/O design
Owner: `PCVM`
Current phase: `llm-stage-token-efficiency-plan`
Status: `pass(scope=source-unit-fixture, packages=A-D); blocked(scope=live-ai-approval, package=E)`

## Controller Snapshot

Current goal: optimize `analyze`, `producer`, and adjacent LLM stages because current prompts and outputs are too large, repeat the same content across system prompt / runtime layer / dynamic context / analysis artifact / evidence map, and waste tokens. The previous LLM I/O contract evaluation is not a separate track; it is the implementation method for this token-efficiency target.

Current evidence:

- `AlembicAgent/src/agent/runtime/LLMInputAssembly.ts` appends a runtime input layer containing stage policy, tool contract, task context, evidence context, and dynamic context.
- `AlembicAgent/src/agent/runtime/AgentRuntime.ts` sends `LLMInputAssembly.providerMessages` to the provider and records `llm.input` events.
- `AlembicAgent/src/agent/prompts/insight-producer.ts` Producer v2 repeats analysis text, findings, code evidence, referenced files, style guide, submit requirements, tool boundary, panorama, and rescan constraints in one large prompt.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` injects project facts, evidence starters, graph/panorama summaries, existing recipes, and context into `strategyContext`.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts` passes full `fileCache`, `strategyContext`, `promptContext`, and system run context into Agent execution.
- External best-practice research agrees on structured prompts, separated context/task/output sections, concise examples, structured/tool output, context caching, and explicit token budgeting.

Current segment: `llm-stage-token-efficiency-live-comparison`.

First blocker: Package E requires AlembicTest / live AI on the BiliDili same-input route, which sends project content to the configured external provider; explicit approval is required before starting.

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

Status: `blocked(scope=live-ai-approval)`

Return:

- analyze input/output tokens
- producer input/output tokens
- route total input/output tokens
- `pcvAnalyzeGroundingInvalidNoEvidence`
- report path, job id, timeline path
- BiliDili git status

## Scoped Verdict

Verdict: `pass(scope=source-unit-fixture, packages=A-D); blocked(scope=live-ai-approval, package=E)`

Next action: Package E only after explicit approval. Run AlembicTest same-input BiliDili `design-patterns` no-delivery route and compare live analyze/producer input/output tokens plus quality constraints.
