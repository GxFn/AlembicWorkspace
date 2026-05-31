# Package R Source/Unit Repair

Run ID: `pcv-20260530-1515-alembic-cold-start`
Scope: `source-unit-fixture`
Owner: `PCVM`

## Target

Repair the Package Q source logic that allowed Producer to stop after converting only `1/6` structured Analyst findings.

Package R is not a new metric layer and not a SourceRef task. It repairs the deterministic Producer coverage and submit-field contract before the next same-input live rerun.

## Source Repair

Repo: `AlembicAgent`

Commit: `bcdc8bf` (`Repair producer coverage controls`)

Implemented behavior:

- Producer budget now receives `targetSubmits` from `gateArtifact.findings.length`.
- Producer idle/text completion cannot enter `SUMMARIZE` while `submitCount < targetSubmits`.
- Producer nudges report `X/Y` structured finding coverage and tell the model to continue `knowledge.submit`.
- Producer PRODUCE tool calls are gated to `knowledge.submit`, narrow `code.read`, `memory.recall`, and `meta.review`.
- Producer SUMMARIZE blocks tool calls.
- Lightweight tool schemas now expose action-specific required params in `params.description`.
- `knowledge.submit` required params visible to the provider include `title`, `description`, `content.markdown`, `content.rationale`, and `reasoning.sources`.
- Producer prompt, capability fragment, and retry prompt now repeat the same required-field contract.

## Verification

| Command | Result |
| --- | --- |
| `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` | pass; 2 files, 29 tests |
| `npm test -- test/ContextWindow.test.ts test/evidence-recording-phase-chain.test.ts test/AgentRuntime.test.ts` | pass; 3 files, 29 tests |
| `npm test` | pass; 28 files, 174 tests |
| `npm run build` | pass |
| `npm run lint` | pass |
| `npm run lint:core-import-boundary` | pass |
| `git diff --check` | pass before commit |

## PCVM Reading

Package R repairs the source/unit causes identified from Package Q. It does not prove live pass.

Package S must rerun the same BiliDili `design-patterns` one-dimension/no-delivery route and inspect:

- structured findings submitted versus available;
- accepted/submitted/rejected Recipe counts;
- missing `title` / `description` or other required-field rejects;
- Producer non-submit drift such as `knowledge.detail` / `meta.tools`;
- Producer terminal behavior and extra no-tool final rounds;
- route input/output/reasoning/total model tokens per accepted and submitted Recipe.
