# Package K Input/Output Structure Self-Check

Run ID: `pcv-20260530-1515-alembic-cold-start`
Package: `K`
Evidence scope: `live-ai-local raw package + full per-round artifact review`
Raw dir: `../AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31`

## Evidence Inventory

Read and cross-checked:

- `package-k-raw-summary.json`
- `per-round-content-matrix.json`
- `api-events.json`
- `timeline.json`
- `persisted-bootstrap-report-session.json`
- `api-report-latest.json`
- `api-job-full.json`
- `persisted-job.json`
- `job-status-snapshot.json`
- `round-highlights.json`
- `stored-recipe-payload-summary.json`
- `fresh-build-dist-proof.json`
- `source-write-boundary.json`
- all 6 files in `candidates-design-patterns/`
- sampled full redacted `job-artifacts/llm-input-*` and `job-artifacts/llm-output-*`

Inventory check, only used to identify every row that must be read:

| Check | Result |
| --- | --- |
| `api-events` count | 77 events |
| `llm.input` / `llm.output` events | 26 / 26 |
| per-round matrix rows | 52 |
| candidate payload files | 6 |
| BiliDili write boundary | clean; no `.asd/` or `Alembic/` under BiliDili |
| fresh build proof | present; AlembicAgent and Alembic build passed |

This inventory is not the verdict. The verdict below is based on reading the actual per-round input/output contents, not on package completeness.

## Input Structure Self-Check

Expected after Package J:

- runtime `Task context` should not replay the full task prompt when the initial user message already carries it.
- analyze and produce inputs should expose `inputProjection` metadata.
- stage policy, tool contract, task context, evidence context, and dynamic context should remain visible.
- Producer should be eligible for provider-input projection, not only analyze/record/summarize.

Observed:

| Stage | Input rows | `promptRef` rows | Full prompt replay in taskContext | Projection metadata rows | Projection fired | Collapsed markers |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 16 | 16 | 0 | 16 | 1 (`level=3`) | 4 |
| produce | 9 | 9 | 0 | 9 | 1 (`level=3`) | 3 |

Input structure verdict:

- `promptRef: initial-user-message` is present in all analyze/produce LLM input artifacts.
- The old duplicate `prompt:\n分析项目 BiliDili...` block is not repeated inside runtime `Task context`.
- Stage policy, tool contract, task context, evidence context, and dynamic context are present in all analyze/produce inputs.
- Producer `inputProjection` metadata is present, and provider-input projection did fire once in Producer.

Residual input issue:

- Projection is still reactive. Analyze peak input occurs at iteration 12 (`input=21770`, providerHistory estimate `13859`), while projection fires at iteration 13. Producer peak history occurs at iteration 6 (`providerHistory=11517`), while projection fires at iteration 7.
- Provider history remains the dominant input surface at peaks; runtime input layer is relatively small (`analyze peak inputLayer=916`, `produce peak inputLayer=696`).
- The full original task prompt still exists in message history once, which is expected by the current conversation model, but it means provider-visible history still carries a large static user prompt every call. Cache hit mitigates this partly, but route input totals still count it.

## Output Structure Self-Check

Expected after Package J:

- Analyze non-final rounds should mostly use tool calls or concise control text.
- Analyze structured findings should represent all candidate-worthy final findings.
- Producer should emit submission tool calls and a compact final completion summary.
- Producer completion should stop without an extra post-completion evidence/read round.

Observed:

- Analyze iterations 1-15 are mostly tool-call rounds with short visible text.
- Analyze final summary at iteration 16 is a long Markdown report (`7414` chars). It includes 7 pattern families: Singleton, DI container, Middleware, Actor, protocol abstraction, static factory, and Value Type.
- Structured findings / developer-facing findings count is 6.
- Producer submits 6 candidates and final summary says all 6 structured findings were converted.
- Producer has a completion-like output at iteration 7, but it does not stop there. Iteration 8 performs an extra "check remaining patterns" round with no candidate delta, and iteration 9 emits the final summary.
- Producer tool-call outputs include full candidate JSON payloads. This is not free-text bloat, but it is real output-token cost because candidate payloads are generated as tool arguments.

Output structure verdict:

- Producer final stop happens at iteration 9, but stop behavior does not fully match Package J expectation because iteration 7 already declared all 6 candidates complete and iteration 8 still spent another round.
- Producer free-text completion is compact.
- Analyze final-output structure does not fully match the intended compact/structured contract: final Markdown can introduce or emphasize findings that are not represented as `note_finding`.
- The current system still has two sources of truth for Analyzer output: structured findings used by Producer, and final Markdown used by report/semantic extraction.

## Every LLM Input Read-Through

Input read-through focuses on what each next call would see, not just aggregate token totals.

| Row | Stage | Iteration | Original chars | Projection | Reading |
| --- | --- | ---: | ---: | --- | --- |
| 1 | dimension-input | n/a | 5654 | n/a | Internal Agent-run input summary; no provider artifact ref. |
| 2 | analyze | 1 | 13173 | level 0 | Initial analyze call; stage/tool/task/evidence/dynamic sections present; `promptRef` used instead of replaying task prompt in task context. |
| 3 | analyze | 2 | 15590 | level 0 | History begins to grow from previous plan/tool context; prompt replay still absent. |
| 4 | analyze | 3 | 17361 | level 0 | Corrective graph/tool planning enters history; no projection yet. |
| 5 | analyze | 4 | 20304 | level 0 | Singleton signal enters context; history growth continues. |
| 6 | analyze | 5 | 24760 | level 0 | Confirmed Singleton discussion and more tool intent are now retained. |
| 7 | analyze | 6 | 28910 | level 0 | Multiple pattern branches in history; no projection. |
| 8 | analyze | 7 | 32936 | level 0 | Tool-spec correction adds another control turn. |
| 9 | analyze | 8 | 38141 | level 0 | First structured-record intent appears; history still unprojected. |
| 10 | analyze | 9 | 45157 | level 0 | Recorded findings are present, but older exploration remains in provider history. |
| 11 | analyze | 10 | 46977 | level 0 | Terminal/file-list turn added; still no projection. |
| 12 | analyze | 11 | 57419 | level 0 | Full file-list context increases provider-visible history. |
| 13 | analyze | 12 | 64158 | level 0 | Peak analyze input before projection; this is the expensive call, not the following projected call. |
| 14 | analyze | 13 | 24503 | level 3 | Projection finally fires: `provider-input-budget:analyze messages=47/44 tokens=16676/16000`. |
| 15 | analyze | 14 | 31271 | level 0 | History grows again after projection; structure remains promptRef-based. |
| 16 | analyze | 15 | 31821 | level 0 | RECORD/tool-call payload is visible; not a prompt replay issue. |
| 17 | analyze | 16 | 32061 | level 0 | Final summarize call sees structured findings plus prior compacted context. |
| 18 | produce | 1 | 21955 | level 0 | Producer starts from compact Analyst digest and structured findings, not full raw analysis replay. |
| 19 | produce | 2 | 22912 | level 0 | Producer announces 6 findings; no prompt replay issue. |
| 20 | produce | 3 | 23173 | level 0 | First large candidate JSON payload becomes history. |
| 21 | produce | 4 | 27559 | level 0 | Candidate submission history starts to dominate. |
| 22 | produce | 5 | 37111 | level 0 | Multiple submitted candidate payloads are now in history. |
| 23 | produce | 6 | 50822 | level 0 | Peak Producer input before projection; candidate payload history is the driver. |
| 24 | produce | 7 | 28515 | level 3 | Projection fires: `provider-input-budget:produce messages=18/20 tokens=12021/12000`. |
| 25 | produce | 8 | 29330 | level 0 | Extra post-completion check reads more evidence intent despite candidate delta being done. |
| 26 | produce | 9 | 28814 | level 0 | Final Producer summary call. |

Input reading:

- All analyze/produce provider input artifacts use `promptRef` and avoid the old full task prompt replay inside runtime task context.
- The expensive peaks are history/candidate-payload accumulation problems: analyze iteration 12 and produce iteration 6.
- Projection works structurally but fires after peak spend, so it reduces later calls rather than preventing the most expensive prior call.

## Every LLM Output Read-Through

This is the user-facing self-check: every AlembicTest LLM output row was read for actual content and stage behavior.

| Row | Stage | Iteration | Chars | Output content read | Structure verdict |
| --- | --- | ---: | ---: | --- | --- |
| 1 | analyze | 1 | 585 | Markdown `探索计划`; lays out scan/search/protocol/file-read/anti-pattern/record plan. | Useful control plan, but it is visible prose added to history. |
| 2 | analyze | 2 | 48 | Says structure scan is complete and will explore Swift source files. | Concise control text. |
| 3 | analyze | 3 | 35 | Corrects graph query approach. | Concise corrective text. |
| 4 | analyze | 4 | 63 | Notes `CookieManager.shared` Singleton signal and plans deeper reads. | Concise evidence steering. |
| 5 | analyze | 5 | 69 | Confirms `CookieManager` Singleton and continues batch reads/graph queries. | Concise evidence steering. |
| 6 | analyze | 6 | 137 | Mentions Singleton and Coordinator, then searches Factory/Delegate/Middleware/Protocol. | Still concise, but broad branch list increases loop surface. |
| 7 | analyze | 7 | 47 | Adjusts plan after graph.query parameter issue. | Tool-error recovery round. |
| 8 | analyze | 8 | 63 | Says evidence is sufficient, records core findings, and continues verification. | Transition from explore to record starts here. |
| 9 | analyze | 9 | 120 | Reads AuthMiddleware evidence and finding count rises to 2. | Structured findings begin to materialize, but loop continues. |
| 10 | analyze | 10 | 83 | Says 2 findings exist, then uses terminal/file listing to verify remaining patterns. | Adds expensive file-list context after sufficient findings started. |
| 11 | analyze | 11 | 42 | Notes terminal found 37 Swift files and starts precise reads. | Concise but continues exploration. |
| 12 | analyze | 12 | 92 | Confirms Middleware protocol and reads more middleware/service/network files. | Peak input round; output itself is short, input history is the cost. |
| 13 | analyze | 13 | 119 | Enters verify phase and checks Middleware, Factory, Router, ServiceRegistry. | Projection has fired before this call; still broad verification. |
| 14 | analyze | 14 | 25 | Says it will record confirmed findings and continue reading key files. | Concise RECORD transition. |
| 15 | analyze | 15 | 707 | Tool-call-only structured `note_finding` payload records another finding. | Good structured output; payload cost is intentional. |
| 16 | analyze | 16 | 7414 | Final Markdown report: Singleton, DI, Middleware, Actor, protocol abstraction, static factory, Value Type, plus stats and pending explorations. | Main mismatch: final Markdown has 7 pattern families while structured findings are 6. |
| 17 | produce | 1 | 646 | Tool-call-only reads supporting evidence files. | Reasonable preparation, but starts Producer history. |
| 18 | produce | 2 | 38 | Says 6 findings will be converted, first 3 submitted. | Concise plan. |
| 19 | produce | 3 | 4169 | Tool-call-only `knowledge.submit` for `Singleton + Actor 并发安全单例模式`, including full candidate JSON. | Large but useful candidate payload, not free-text bloat. |
| 20 | produce | 4 | 31 | Says Singleton candidate created and continues. | Concise continuation. |
| 21 | produce | 5 | 52 | Says 3/6 submitted and will submit Actor, protocol abstraction, enum factory. | Concise continuation. |
| 22 | produce | 6 | 34 | Says all 6 candidates submitted and runs light review. | Completion-like state begins. |
| 23 | produce | 7 | 702 | Declares all 6 candidates submitted, covers all 6 Analyst findings, no unsubmitted findings, no blockers. | This should be terminal under the intended contract. |
| 24 | produce | 8 | 84 | Checks whether analysis also mentioned Module/Plugin registration and URL Scheme routing, then reads more files. | Extra post-completion round; no candidate delta. |
| 25 | produce | 9 | 750 | Final production summary: 6 submitted, 0 unsubmitted findings, skipped items explained. | Actual terminal output. |
| 26 | dimension-output | n/a | 8164 | Combined final output replays Analyze report and Producer result. | Long downstream aggregation; report surface still includes the Analyzer Markdown mismatch. |

Output reading:

- Analyze per-round outputs 1-15 are mostly concise; the output bloat is concentrated in final Markdown and structured tool payloads.
- The critical correctness issue is not that Producer ignored structured findings. Producer followed the 6-finding contract.
- The mismatch is that Analyzer final Markdown and dimension output expose extra candidate-worthy content outside the structured finding contract.
- Producer stop logic is still imperfect: iteration 7 meets the apparent completion condition, then iteration 8 spends another round checking unstructured analysis mentions.

## Cross-Stage Coverage Check

Candidate payloads:

| Candidate | Approx tokens | Ref count | Reading |
| --- | ---: | ---: | --- |
| `Singleton + Actor 并发安全单例模式` | 1779.5 | 7 | broad Singleton + actor safety pattern |
| `ServiceRegistry 类型安全 DI 容器` | 1931.8 | 4 | DI container |
| `Middleware 责任链拦截器模式` | 2155.5 | 7 | middleware / chain |
| `Actor 状态隔离并发模式` | 2044.5 | 10 | actor isolation |
| `协议 + 闭包注入解耦模式` | 2162.5 | 8 | protocol/closure injection |
| `无 case 枚举命名空间工厂模式` | 1910.8 | 2 | static factory / namespace |

Coverage mismatch:

- Final analysis reports Value Type as a pattern family, but there is no corresponding candidate.
- Final analysis also lists Coordinator/Router, Observer/Rx, and Repository as "待探索", not candidates.
- Producer truthfully converts all 6 structured findings, but it does not consume unstructured final Markdown findings as candidate obligations.

PCVM reading:

- Package K's accepted count is not simply "low quality"; the 6 Recipes are significantly larger and richer than Package E's average Recipe.
- The remaining blocker is not SourceRef, and not primarily prompt duplication.
- The next design issue is useful-output granularity: `note_finding`/Producer must decide whether each final pattern family becomes one Recipe, whether broad Recipes are acceptable, and which metric is primary.

## Data-Quality Notes

- `report.totals.efficiency.maxCompactionLevel=0` does not reflect the new provider-input projection path. Per-round `inputProjection.level=3` shows projection did fire. Do not use the old efficiency compaction field as the provider-projection truth.
- Some `inputProjection.beforeProjectedTokens/afterProjectedTokens` fields are redacted as `[redacted-secret]` in highlights, so the reliable per-call size evidence is `inputSizeEstimate` plus provider token usage.
- `dimension-input` row has no artifact ref, but this is the internal Agent-run input summary, not a missing provider LLM artifact.

## Self-Check Verdict

`partial(scope=live-ai-local-structure)`

Passed:

- every provider `llm.output` row has now been read for content, not only counted
- no runtime task-context prompt replay
- producer projection metadata present
- candidate payloads are real and evidence-heavy
- grounding/quality constraints held

Failed / residual:

- provider-history projection fires after peak rounds, not before them
- analyze final Markdown can introduce findings not backed by structured `note_finding`
- producer has one extra post-completion evidence-check round after declaring all 6 candidates complete
- accepted Recipe count is not a stable useful-output unit because Recipe payload size changed materially

First blocker:

Package L should stabilize the output contract between Analyzer structured findings, final Markdown report, and Producer candidate obligations before another live rerun.
