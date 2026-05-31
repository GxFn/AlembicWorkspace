# PCVM Issue Records: LLM Token Efficiency

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `current`

## Current LLM Token Efficiency Work

Current blocker:

- Package L source/unit repair completed after Package K and is `pass(scope=source-unit-fixture)`.
- Route input recovered from Package E `520700` to K `260811`, and route total model recovered from `567173` to `294371`.
- Package I accepted-count collapse was partly repaired (`4 -> 6`), but K still did not restore Package E accepted count (`13`) or total model / accepted Recipe (`43628.7 -> 49061.8`).
- K persisted much larger Recipes: avg payload approx tokens / Recipe `1008.8 -> 1997.4`, and model-to-payload amplification improved `43.25x -> 24.56x`.
- Full per-output read-through found that Producer iteration 7 already declared all 6 candidates complete, but iteration 8 still ran an extra evidence-check round before final iteration 9.
- Package L repaired the deterministic contract issue in AlembicAgent: Producer candidate obligations are structured `note_finding` only, final Markdown is background only, and Package K completion wording is terminal.
- The current blocker is Package M live evidence: accepted Recipe count, Recipe payload size, Analyzer structured findings vs final Markdown coverage, and Producer terminal iteration must be measured on the same BiliDili route.

Next metric work:

- AlembicTest rerun is now allowed only as Package M same-input live evidence with Package L source/unit repair included.
- Use Package F `inputSizeEstimate` / `inputProjection` metadata to distinguish projected message history, runtime input layer, system prompt, and tool schemas per provider call.
- Add accepted/submitted Recipe normalized metrics to every live comparison: route input/output/reasoning/total model per accepted Recipe and per submitted Recipe.
- Add persisted Recipe payload approximate token metrics when local DB or raw artifacts preserve accepted Recipe fields.
- Measure the useful-output granularity ambiguity under Package M: determine whether the source contract yields more stable structured finding/candidate coverage, fewer extra Producer rounds, or merely changes payload size.
- Keep quality constraints visible: `pcvAnalyzeGroundingInvalidNoEvidence` stayed `0`, quality score improved `97 -> 100`.
- Compare only against the same-input route; do not promote live route to final product acceptance.
- Do not modify BiliDili or any real test project source.

## Open Issue: Package E Primary Token Regression

Status: `superseded-by-package-i-and-j(scope=live-ai-local/source-unit); blocked(scope=Package K)`

Evidence:

- AlembicTest raw summary: `../AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/package-e-raw-summary.json`
- Candidate job/session: `bootstrap_mptfvl61_f75bdcb6` / `bs_1780211356238_xiafi2`
- Baseline job/session: `bootstrap_mpsbnftk_dbfe22d0` / `bs_1780143791437_9jfho1`

Primary regression:

- `llm.stageInputTokens.analyze`: `180337 -> 348915` (+93.48%)
- `llm.routeInputTokens.total`: `354486 -> 520700` (+46.89%)

Support regressions:

- analyze output: `9434 -> 13242` (+40.36%)
- producer output: `17705 -> 24993` (+41.16%)
- route output: `27139 -> 38235` (+40.89%)
- tool calls: `38 -> 52` (+36.84%)
- analyze iterations: `14 -> 20` (+42.86%)

Non-regression constraints:

- `pcvAnalyzeGroundingInvalidNoEvidence`: `0 -> 0`
- quality score: `97 -> 100`
- BiliDili tracked source status: clean

Required next action:

- Package K in `AlembicTest`: rerun same-input live comparison only after fresh build proof, using the Package J source repair.

## Open Issue: Runtime Layer Compaction Does Not Cover Live History Growth

Status: `pass(scope=source-unit-fixture, owner=AlembicAgent, package=F)`

Evidence:

- Package E first retained analyze input was smaller than baseline (`3904` vs `4044` estimated tokens), so the runtime input-layer compaction was active at the start.
- Package E late retained analyze input grew to `19923` estimated tokens / `79692` original chars with `53` provider messages, versus baseline max `12164` estimated tokens / `48654` original chars with `37` provider messages.
- `AgentRuntime` sends `ctx.messages.toProjectedMessages()` and then appends the runtime input layer. Current source/unit fixtures measured the appended input layer better than the old message history.
- `ContextWindow` L3 projection appeared too late to prevent already-spent live tokens.

Package F result:

- `LLMInputMeasurement` reports provider history, input layer, system prompt, provider messages, and tool schema estimated tokens separately.
- `ContextWindow.compactForProviderInputBudget()` can trigger provider projection from stage-level message/token pressure.
- `AgentRuntime` emits `inputSizeEstimate` and `inputProjection` metadata for future live timeline comparison.
- Required preservation: recorded finding ids, recent evidence paths, and the last useful tool rounds must remain provider-visible.

## Open Issue: Analyze Loop Length Multiplies Token Spend

Status: `pass(scope=source-unit-fixture, owner=AlembicAgent, package=G)`

Evidence:

- Baseline analyze iterations/tool calls: `14` / `24`.
- Package E analyze iterations/tool calls: `20` / `37`.
- `ExplorationStrategies` allows VERIFY to RECORD around `0.75 * maxIterations` unless other evidence/idle conditions trigger earlier.
- Repeated progress/nudge text can become part of provider-visible history.

Package G result:

- Analyst EXPLORE/VERIFY can converge earlier when at least `3` findings and `2` evidence tool calls are present.
- Runtime nudge messages are ephemeral; older nudge text is removed before the latest nudge is appended.
- Source/unit tests preserve evidence-before-convergence and RECORD/note_finding behavior.

## Open Issue: Producer Prompt Still Replays Full Analysis Artifact

Status: `pass(scope=source-unit-fixture, owner=AlembicAgent, package=H)`

Evidence:

- Producer total input improved slightly (`174149 -> 171785`) because Package E used fewer producer iterations (`9 -> 8`).
- Per-call Producer retained input still reached `20911` estimated tokens / `83644` original chars.
- `buildProducerPromptV2()` still includes full `analysisText` plus structured findings, evidence map, referenced files, style guide, submit requirements, and tool boundary.

Package H result:

- Producer v2 now replaces full analysis replay with a compact `Analyst 分析摘要 (已压缩)`.
- The digest preserves source paths and finding/evidence keywords while bounding long narrative text.
- Producer output must still be evaluated per accepted Recipe in Package K.

## Open Issue: Missing First-Class Recipe Unit-Cost Reporting

Status: `open(owner=AlembicAgent/AlembicTest, package=K)`

Evidence:

- Current reports expose stage and route token totals, but not first-class per accepted/submitted Recipe token metrics.
- Package E required PCVM to compute normalized metrics manually from raw summary/API report.
- The local DB can provide stored Recipe payload approximate size for accepted rows, but AlembicTest raw summary does not preserve a ready table.

Required next action:

- Package F should expose per-call/stage split metrics enough for PCVM to compute unit costs deterministically.
- Package K should include per accepted Recipe, per submitted Recipe, reject-rate, and stored Recipe payload approximate token metrics in its return packet.
- Treat `route total model / accepted Recipe` and `route total model / stored Recipe payload token` as reference metrics alongside primary stage token gates.

## Conditional Next Optimization Queue While Package K Is Pending

Status: `queued-for-evidence(scope=post-package-i-only)`

This is not a new implementation wave. It records source-backed candidates that should only be selected after Package K shows the remaining dominant cost.

Candidate A: per-call output/reasoning/cache observability

- Evidence: input-side `inputSizeEstimate` is now first-class in `llm.input`, but `llm.output` process metadata does not expose `inputTokens`, `outputTokens`, `reasoningTokens`, `cacheHitTokens`, or provider finish reason.
- Why it matters: if Package K still regresses, PCVM must distinguish input growth from output/reasoning/tool-call growth without recomputing from raw route totals.
- Expected minimal action if selected: add usage split to `llm.output` metadata and tests; do not change model behavior.

Candidate B: DeepSeek V4 thinking/tool cost separation

- Evidence: `DeepSeekTransport` enables thinking whenever V4 has tools and can raise `max_tokens` to `16384` / `32768`; current PCVM token target may otherwise misread output/reasoning growth as input prompt failure.
- Why it matters: Package E output growth was also material, and DeepSeek V4 tool rounds can multiply reasoning/output even when input compaction works.
- Expected minimal action if selected: report per-call reasoning/output and tool visibility mode, then only reduce stage-specific tool exposure or max output if quality evidence allows it.

Candidate C: cache-friendly static/dynamic boundary hardening

- Evidence: `AgentRuntime` already keeps system prompt static and uses an ephemeral runtime layer, but provider-visible message order is still history first, dynamic runtime layer last; providers reward stable prefixes, but agent history changes every turn.
- Why it matters: if Package K shows cache-hit tokens stay near zero while input remains high, static prompt/tool/policy ordering may need a provider-specific transport or assembly improvement.
- Expected minimal action if selected: measure cache-hit tokens first; only then consider provider-compatible request shaping.

Candidate D: deterministic tool schema projection

- Evidence: `UnifiedToolCatalog` supports lightweight/mixed schemas, and Package F now measures `toolSchemaEstimatedTokens`; stage logic already narrows RECORD to note-finding-only.
- Why it matters: if `toolSchemaEstimatedTokens` is a large share of Package K calls, analyze/produce can use a stricter stage toolset rather than sending broad schemas.
- Expected minimal action if selected: make stage tool schema projection deterministic and test allowed tool names per stage.

Candidate E: projection summary quality

- Evidence: `ContextWindow.toProjectedMessages()` currently collapses old rounds to counts and compacted submit titles. This saves tokens but may erase enough state that the model repeats exploration.
- Why it matters: if Package K shows fewer per-call tokens but iterations remain high, over-thin projection may be causing rework.
- Expected minimal action if selected: enrich collapsed summaries with compact finding/evidence refs only, not full tool outputs.

## Open Issue: Package K Needs Per-Round Content Matrix

Status: `open(owner=AlembicTest, package=K)`

Evidence:

- Package E content audit shows aggregate token totals hide the decisive shape: early analyze outputs were short, while input history grew from `15615` to `79692` original chars before late collapse.
- Analyze had enough visible findings around iterations 5-8 but did not enter effective structured recording until iterations 16-19.
- Producer declared 9 candidates complete, then a runtime nudge caused additional review/submission work and final 13 accepted candidates.

Required Package K return evidence:

- For each `llm.input` / `llm.output`: stage, phase, iteration, original chars, retained chars, truncation flag, artifact ref, output summary, tool/function names, accepted finding delta, and candidate/submission delta when available.
- Explicit comparison of the peak analyze input round, first recording round, final summary round, producer "complete" round, and producer final round.
- If only aggregate token totals are returned, Package K evidence is insufficient for next optimization selection.

## Open Issue: Package I Useful-Output Regression

Status: `partially-repaired(scope=Package K live-ai-local); blocked(scope=Package L granularity)`

Evidence:

- Package I reduced route total model tokens from `567173` to `299497` (-47.19%) versus Package E.
- Accepted Recipes fell from `13` to `4`.
- Route total model / accepted Recipe regressed from `43628.7` to `74874.3` (+71.62%).
- Raw I/O review shows the regression is rooted in structured-finding coverage and loop ownership: Analyst final prose had more pattern content than structured `note_finding`, and Producer completion was followed by another runtime nudge.

Package J repair:

- `LLMInputAssembly` removes duplicate full prompt replay from runtime `Task context` when the prompt already exists in message history.
- `AgentRuntime` applies provider-input projection to Producer.
- `ExplorationStrategies` scales Analyst structured-finding target by evidence volume.
- `NudgeGenerator` and `insight-analyst` prompt align RECORD instructions with the scaled finding target.
- `ExplorationTracker` allows Producer completion text to terminate after successful submissions and no remaining Analyst gap.

Required next action:

- Package L should use source and Package K raw evidence to stabilize Recipe granularity/coverage before any more live reruns.
- Do not treat Package K as final pass; it is live partial.

## Open Issue: Package K Useful-Output Granularity Ambiguity

Status: `open(owner=PCVM/AlembicAgent, package=L)`

Evidence:

- Package K analyze final report listed 7 pattern families, but Producer submitted 6 candidates.
- Package K accepted Recipes are larger: avg stored payload approx tokens / Recipe `1997.4`, compared with Package E `1008.8`.
- K's `totalModel / accepted Recipe` is worse than E (`49061.8` vs `43628.7`), but `totalModel / stored payload token` is better (`24.56x` vs `43.25x`).
- `targetMemoryFindingCount()` currently caps structured findings at 6; this may be too low for design-pattern dimensions where each verified pattern family should map to a candidate.

Required next action:

- Source-review Producer and Analyst contracts for "one finding = one Recipe" versus "one broad finding may contain several Recipe-worthy subpatterns".
- Decide whether Package L is a source repair that increases structured finding granularity, or a metric-contract update that treats payload-normalized efficiency as a primary/support gate. Metric-contract change needs user confirmation.
- No AlembicTest rerun until this ambiguity is resolved.

## Open Issue: Analyzer Final Markdown And Structured Findings Diverge

Status: `pass(scope=source-unit-fixture, owner=AlembicAgent, package=L); pending(scope=live-ai-local, package=M)`

Evidence:

- Package K final analyze Markdown lists 7 pattern families, including Value Type.
- Package K structured findings / developer-facing findings count is 6.
- Producer submits exactly those 6 structured findings and correctly reports no unsubmitted structured findings.
- Therefore Producer is not missing its current contract; the contract itself allows final Markdown to contain extra candidate-worthy content that never becomes a Producer obligation.

Required next action:

- Package L aligned Analyzer/Producer source contract: final Markdown may only summarize structured `note_finding` findings, and Markdown-only themes are not Producer candidate obligations.
- Package M must verify whether the live Analyzer obeys this contract and whether final Markdown families match structured findings closely enough for Producer coverage.
- Do not ask AlembicTest to rediscover the source issue; the next Test run is only to validate live AI behavior after the deterministic repair.

## Open Issue: Producer Completion-Like Output Does Not Stop Immediately

Status: `pass(scope=source-unit-fixture, owner=AlembicAgent, package=L); pending(scope=live-ai-local, package=M)`

Evidence:

- Package K Producer iteration 7 says all 6 knowledge candidates were submitted, all 6 Analyst findings were covered, and there were no unsubmitted findings or blockers.
- Package K Producer iteration 8 still checks unstructured analysis mentions such as Module/Plugin registration and URL Scheme routing, then reads more files.
- Iteration 8 has no candidate delta and final completion only happens at iteration 9.

Required next action:

- Package L aligned Producer terminal detection with the useful-output contract: if all structured findings are converted and completion text says no unsubmitted findings/no blockers, the loop can stop.
- Package M must verify this in live AI. Success means Producer stops at the first completion-like output with no extra evidence-check round; failure means the same source path needs another deterministic repair.
- Do not treat this as a data package problem; it is a loop ownership and output-contract problem.

## Open Issue: Provider-Input Projection Is Reactive After Peak

Status: `open(owner=AlembicAgent, package=L-or-later)`

Evidence:

- Analyze peak model input occurs at iteration 12 (`input=21770`, provider history estimate `13859`), while provider projection fires at iteration 13.
- Producer peak provider history occurs at iteration 6 (`providerHistory=11517`), while provider projection fires at iteration 7.
- Runtime input layer is not the main peak cost (`analyze inputLayer<=926`, `produce inputLayer<=816`); provider history is.

Required next action:

- If Package L keeps the same route and useful-output contract, consider lowering stage projection thresholds or projecting before the next call once the prior call crosses a warning threshold.
- This is secondary to output granularity because K already shows large token savings and the current failure is useful-output unit ambiguity.
