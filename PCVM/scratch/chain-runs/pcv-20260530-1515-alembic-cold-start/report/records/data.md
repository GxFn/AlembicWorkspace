# PCVM Data Records: Current LLM Token Efficiency Baseline

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `current`

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

## Deleted Old Records

Status: `deleted`

PCVM removed the old round ledger, task packages, review notes, and AI analysis records from the current run. They must not be used for current scoring, dispatch, testing, or verdicts.
