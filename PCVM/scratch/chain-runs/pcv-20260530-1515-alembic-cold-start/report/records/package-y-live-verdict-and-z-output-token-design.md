# Package Y Live Verdict And Package Z Output/Token Design

Run ID: `pcv-20260530-1515-alembic-cold-start`
Scope: `live-ai-local raw evidence review + pre-test output quantity/token design`
Owner: `PCVM`

## Test Evidence

- Raw dir: `../AlembicTest/tmp/pcvm-package-y-same-input-live-rerun-2026-06-01`
- Job/session: `bootstrap_mptzmd58_95ecf0f3` / `bs_1780244518190_peg825`
- Same-input request: `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`
- Raw files read: `events.json`, `analysis-summary.json`, `job-compact.json`, `report-bs_1780244518190_peg825.json`
- Job artifacts read: `.asd/job-artifacts/bootstrap_mptzmd58_95ecf0f3`

## Raw Event Self-Check

Retained events: `68`.

Event shape:

- `llm.input`: `23`
- `llm.output`: `23`
- `llm.reflection`: `10`
- workflow/checkpoint/tool/summary/artifact events: `12`

Stage shape:

- Analyze inputs/outputs: `15/15`
- Producer inputs/outputs: `7/7`
- Created/accepted candidates: `5/5`
- Rejected attempts: `0`
- Total tool calls: `30`

Producer structure read-through:

- Inputs `2-7` contain `[[Producer submit history]]` and explicitly warn that historical entries are not valid `knowledge.submit` payloads.
- No Producer input exposes imitable compacted submit JSON or a `code` schema.
- Producer outputs create all five Analyst structured findings, then call `meta.review`, then emit one no-tool final summary.
- There is no missing-`description` reject, no continue nudge after final, and no second final summary.

Analyzer output quantity read-through:

- The final Analyzer report declares 5 confirmed core findings: Singleton, Middleware, Builder/Factory, protocol DI, and Coordinator.
- It also contains `未结构化记录 / 待探索` items such as Value-Type, Actor, Error-Type, and resilience/thread-safety infrastructure notes.
- ServiceRegistry/RouteMiddleware-style files are present in evidence/context, but they were not recorded as final structured candidate obligations in Package Y.
- Therefore Y's `5/5` is a Producer coverage pass over the Analyst target, not a strict same-output `6/6` baseline pass.

## Metrics

| Metric | Package S | Package U | Package W | Package Y | PCVM reading |
| --- | ---: | ---: | ---: | ---: | --- |
| created/accepted | 6/6 | 6/6 | 6/6 | 5/5 | Y is lower output count than S/U/W. |
| rejected attempts | 0 | 2 | 4 | 0 | Package X fixed missing-description retries. |
| tool calls | 42 | 62 | 44 | 30 | Improved. |
| input tokens | 246703 | 275108 | 294769 | 190325 | Improved raw input. |
| output tokens | 22825 | 23987 | 21806 | 17370 | Improved raw output. |
| reasoning tokens | 5922 | 6044 | 5925 | 5534 | Slightly improved. |
| total model tokens | 275450 | 305139 | 322500 | 213229 | Improved raw total. |
| total model / created Recipe | 45908.33 | 50856.50 | 53750.00 | 42645.80 | Improved unit cost, but comparability is open. |
| analyze rounds / input | 16 / 184353 | 15 / 155868 | 14 / 185685 | 15 / 143874 | Analyze input improved vs S/W. |
| producer rounds / input | 7 / 62350 | 15 / 119240 | 13 / 109084 | 7 / 46451 | Producer input improved; one post-target meta round remains. |

## Gate Design Before Testing

The next test must not ask only "did total tokens go down?" It must answer whether the system preserved useful output while reducing waste.

Quantity gates:

- `analystStructuredFindingTarget`: count of Analyst structured findings that Producer is obligated to submit.
- `producerAcceptedCoverage`: accepted Recipes divided by `analystStructuredFindingTarget`.
- `sameUsefulOutputComparable`: true only when candidate and baseline have comparable structured finding target and Recipe granularity.
- `quantityDropExplainedByEvidence`: required when candidate output count is lower than the baseline; PCVM must identify whether dropped themes were duplicates, wrong-dimension, merged, or missed useful findings.

Token gates:

- `postTargetWasteRounds`: Producer rounds after `producerAcceptedCoverage=100%`, including `meta.review`, continue nudges, and repeated final summaries.
- `routeTotalModelTokens / analystStructuredFindingTarget`: primary per-target unit cost when output count differs.
- `routeTotalModelTokens / acceptedRecipeCount`: support metric; cannot pass alone if quantity is lower.
- `storedRecipePayloadApproxTokens` and model-to-payload amplification: reference metrics for Recipe granularity and value density.

## Package Z Source Repair

Implemented in `AlembicAgent`:

- `ExplorationStrategies.ts`: removed the hidden six-finding cap by changing `targetMemoryFindingCount()` from `min(6, ceil(evidenceToolCallCount / 4))` to `max(3, ceil(evidenceToolCallCount / 2))`.
- `insight-analyst.ts`: removed "5-6 high-value findings" wording and explicitly tells Analyst not to stop because count exceeds 6.
- `ExplorationStrategies.ts`: Producer transitions to `SUMMARIZE` immediately once `submitCount >= targetProducerSubmitCount`.
- `insight-producer.ts`: `meta.review` is exceptional only for tool errors or evidence uncertainty, not a normal final self-check.
- `BootstrapProduce.ts`: capability prompt mirrors the same terminal rule.
- `ExplorationStrategies.test.ts`: test expectation now covers uncapped broad evidence (`19` evidence calls -> `10` structured findings) and immediate post-target transition with `roundsSinceSubmit=0`.

Verification:

- `npm test -- test/ExplorationStrategies.test.ts test/llm-input-layering.test.ts` passed; 34 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `npm test` passed; 28 files, 180 tests.
- `npm run lint:core-import-boundary` passed.
- `git diff --check` passed.

## Scoped Verdict

Verdict: `partial(scope=live-ai-local, package=Y); repaired(scope=source-unit, package=Z); pending(scope=alembic-project-space-cold-start-boundary)`

Package Y proves Package X fixed the earlier submit-history and missing-description bugs. It does not prove final token-efficiency success because useful-output count changed from the older 10+ output baseline to 5 Analyst structured findings. Package Z removes the hidden source cap without reopening Markdown mining. The next safe action is preparing the Alembic project-space cold-start test boundary with token and structured-finding coverage evidence.
