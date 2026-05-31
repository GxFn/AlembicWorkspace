# PCVM Issue Records: LLM Token Efficiency

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `active`

## Current LLM Token Efficiency Work

Current active blocker:

- The user clarified that LLM input/output optimization is not stopped and has not reached the final goal.
- Package Y same-input live evidence is `partial(scope=live-ai-local)`, not final pass.
- Package Y shows Package X fixed compacted submit-history imitation and missing-`description` retries, but Producer still spent one post-target `meta.review` round.
- Package Y created `5/5` accepted candidates because Analyst produced 5 structured findings, while earlier same-input baselines produced around `10` to `13`; token gains cannot be treated as strict same-useful-output pass.
- User裁决: coverage metrics can follow Producer coverage of Analyst structured findings; mining additional content from Markdown or other sources is a later optimization item, not this wave.
- Package Z source/unit repair in `AlembicAgent` removes the hidden six-finding cap and targets post-target Producer waste.
- Exact candidate code-snippet validation remains a separate quality scope; do not mix it into the LLM I/O efficiency gate unless the user expands scope.

Active metric notes:

- Use Package F `inputSizeEstimate` / `inputProjection` metadata to distinguish projected message history, runtime input layer, system prompt, and tool schemas per provider call.
- Add accepted/submitted Recipe normalized metrics to every live comparison: route input/output/reasoning/total model per accepted Recipe and per submitted Recipe.
- Add Analyst structured finding target, Producer accepted coverage, post-target waste rounds, and same-useful-output comparability to every live comparison.
- Add persisted Recipe payload approximate token metrics when local DB or raw artifacts preserve accepted Recipe fields.
- Keep Package S useful-output/token facts visible: created `6`, total model tokens `275450`, total model tokens / created Recipe `45908.33`, QualityGate score `98`.
- Compare only against the same-input route; do not promote live route to final product acceptance.
- Do not modify BiliDili or any real test project source.

## Open Issue: Package Y Output Quantity Comparability And Post-Target Producer Waste

Status: `partial(scope=live-ai-local, package=Y); repaired(scope=source-unit, package=Z); pending(scope=alembic-project-space-cold-start-boundary)`

Evidence:

- Package Y retained events: `68`.
- Package Y analyze inputs/outputs: `15` / `15`.
- Package Y produce inputs/outputs: `7` / `7`.
- Package Y created/accepted candidates: `5/5`; rejected attempts: `0`.
- Package Y input/output/reasoning tokens: `190325` / `17370` / `5534`.
- Package Y total model tokens: `213229`; total model / created Recipe: `42645.80`.
- Producer submit-history summary is visible and imitable compacted submit JSON is absent.
- Producer still calls `meta.review` after all 5 Analyst structured findings have been submitted.
- Output quantity is not strict-baseline comparable: the earliest baseline had `10` accepted candidates and Package E had `13`, while Y produced `5/5` because Analyst recorded only 5 structured findings.
- Hidden source issue found: `targetMemoryFindingCount()` capped required structured findings at 6 and Analyst prompts told broad evidence surfaces to record only 5-6 high-value findings.

Package Z repair:

- `targetMemoryFindingCount()` no longer caps broad evidence at 6; 19 evidence tool calls now require 10 structured findings in source/unit tests.
- Analyst prompts no longer say "5-6 high-value findings"; they require all confirmed high-value findings and explicitly avoid stopping just because the count exceeds 6.
- Producer transitions to no-tool summary immediately when `submitCount >= targetProducerSubmitCount`.
- Verification passed: targeted 34 tests, full 180 tests, build, lint, core-import-boundary, and diff check.

Required next action:

- Prepare Alembic project-space cold-start test boundary with source proof, route, metrics, and stop conditions.
- The next live prompt must request output quantity/gate fields: `analystStructuredFindingTarget`, accepted/rejected counts, `producerAcceptedCoverage`, post-target tool calls, and per target/accepted token tables.

## Open Issue: Package W Producer Submit-History And Terminal Regression

Status: `superseded-by-package-y-and-z-repair(scope=live-ai-local/source-unit)`

Evidence:

- Package W retained events: `81`.
- Package W analyze inputs/outputs: `14` / `14`.
- Package W produce inputs/outputs: `13` / `13`.
- Package W created candidates: `6`; rejected attempts: `4`.
- Package W input/output/reasoning tokens: `294769` / `21806` / `5925`.
- Package W total model tokens: `322500`, versus Package S `275450` (`+17.08%`) and Package U `305139` (`+5.69%`).
- Package W total model / created Recipe: `53750.00`, versus Package S `45908.33`.
- Producer visible tool contract is repaired: no Producer `code`, real `knowledge.submit` schema, restricted descriptions clean.
- Four missing-`description` rejects remain because compacted historical `knowledge.submit` tool calls look like imitable `title/kind/trigger`-only assistant tool-call shapes.
- Producer first 6/6 completion summary receives a continue nudge, then `meta.review`, then a second final summary.

Package X repair:

- Producer-stage historical `knowledge.submit` tool rounds are projected as plain submit-history summaries before provider dispatch.
- Historical compacted submit summaries are no longer provider-visible assistant tool-call JSON.
- Package W completion wording with `所有 6 个 Analyst 已确认结构化发现均已提交` plus JSON `totalSubmitted`, empty `blockers`, and empty `unsubmittedFindings` is terminal after target submits.

Package X targeted repair was validated by Package Y for submit-history imitation and missing-description retries. The remaining terminal waste and quantity comparability are tracked under Package Y/Package Z above.

## Open Issue: Package U Producer Schema And Responsibility Regression

Status: `superseded-by-package-w-and-x(scope=live-ai-local/source-unit)`

Evidence:

- Package U retained events: `86`.
- Package U analyze inputs/outputs: `15` / `15`.
- Package U produce inputs/outputs: `15` / `15`, versus Package S `7` / `7`.
- Package U created candidates: `6`.
- Package U input/output/reasoning tokens: `275108` / `23987` / `6044`.
- Package U total model tokens: `305139`, versus Package S `275450` (`+10.78%`).
- Package U tool calls: `62`.
- Provider schema narrowed `action.enum`, but descriptions still exposed broad wording such as `Knowledge management: search, submit, detail, manage`.
- Provider-visible `knowledge.submit.params` was a generic object with required fields only in natural-language description.
- Producer generated one invalid empty `knowledge` call and one missing-`description` submit reject.
- Producer spent three early produce rounds on `17` `code.read` calls before creating any candidate.
- Producer completion at iteration `13` was followed by a continue nudge, `meta.review`, and a second final summary.

Package V repair:

- Single-action schemas now expose real action `params` schema with required fields.
- Restricted provider descriptions mention only allowed actions.
- Bootstrap Producer no longer exposes `code.read`.
- Producer prompts and runtime stage policy make source reading/exploration out of scope.
- Package U completion wording is recognized as terminal after target submits.

Required next action:

- No direct action on Package U. Package W verified the visible Package V contract and exposed the next issue now tracked under Package W/Package X above.

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
- At Package K time, `targetMemoryFindingCount()` capped structured findings at 6; Package Z later removed this hidden limit.

Required next action:

- Source-review Producer and Analyst contracts for "one finding = one Recipe" versus "one broad finding may contain several Recipe-worthy subpatterns".
- Decide whether Package L is a source repair that increases structured finding granularity, or a metric-contract update that treats payload-normalized efficiency as a primary/support gate. Metric-contract change needs user confirmation.
- No AlembicTest rerun until this ambiguity is resolved.

## Open Issue: Analyzer Final Markdown And Structured Findings Diverge

Status: `pass(scope=live-ai-local, package=O)`

Evidence:

- Package K final analyze Markdown lists 7 pattern families, including Value Type.
- Package K structured findings / developer-facing findings count is 6.
- Producer submits exactly those 6 structured findings and correctly reports no unsubmitted structured findings.
- Therefore Producer is not missing its current contract; the contract itself allows final Markdown to contain extra candidate-worthy content that never becomes a Producer obligation.
- Package M repeats the same class of failure after Package L: final Analyze Markdown lists 7 confirmed pattern families, while structured `note_finding` and Producer candidates are 5.
- The Markdown-only M themes are `Middleware Chain + Observer` and `Value-Type`; Producer correctly does not submit them, but the final Analyze report still presents them as confirmed core sections.

Required next action:

- Package O verifies this behavior in live output: final Analyze Markdown has 7 confirmed sections corresponding to 7 recorded `note_finding` entries and demotes unrecorded Value Type, Error Type, Coordinator, and Observer signals to "未结构化记录".
- Preserve this behavior in Package Q.

## Open Issue: Producer Completion-Like Output Does Not Stop Immediately

Status: `failed(scope=live-ai-local, package=O); repaired(scope=source-unit, owner=AlembicAgent, package=P); pass(scope=live-ai-local-no-extra-final, package=Q)`

Evidence:

- Package K Producer iteration 7 says all 6 knowledge candidates were submitted, all 6 Analyst findings were covered, and there were no unsubmitted findings or blockers.
- Package K Producer iteration 8 still checks unstructured analysis mentions such as Module/Plugin registration and URL Scheme routing, then reads more files.
- Iteration 8 has no candidate delta and final completion only happens at iteration 9.
- Package M eliminates Package K's extra evidence/code-check round after completion.
- Package M still emits a terminal completion report at Producer iteration 9, then receives a continue nudge and emits a second no-tool final-status message at iteration 10.
- Package O's first completion report uses mixed English/Chinese wording: "All 7 structured Analyst findings have been successfully submitted", `提交候选数: 7/7`, `阻塞项: 无`.
- Package O still receives a continue nudge at sequence 65 and emits an extra no-tool final status at sequence 67.

Required next action:

- Package N source/unit repair normalizes Markdown emphasis and recognizes `提交完成报告` / `已提交候选` plus `未提交: 0` as terminal after successful submissions.
- Package P extends source/unit terminal detection to Package O mixed English/Chinese completion wording.
- Package Q verifies that the live Producer no longer receives a continue nudge or produces an extra no-tool final-status round after the only Producer final summary.
- This issue is not the current blocker; Q fails on Producer candidate coverage instead.

## Open Issue: Producer Evidence And Candidate Payload History Is Provider-Visible

Status: `pass(scope=live-ai-local-direct-replay, package=O); pass(scope=live-ai-local-direct-replay-preserved, package=Q)`

Evidence:

- Package M Producer iteration 1 input includes an `Analyst 已读取的代码 (直接引用, 无需 read_file)` block with large code excerpts.
- The same Producer phase still calls `code.read`, so direct code replay and tool-read evidence both enter provider history.
- Later Producer inputs grow as full `knowledge.submit` candidate payload history accumulates; Package M Producer input regresses versus K (`85823 -> 103057`).

Package N repair:

- Producer prompt evidence is now refs-first: file/range/summary refs are injected instead of direct code bodies.
- Producer instructions only allow narrow `code.read` when exact short snippets are missing.
- `ContextWindow` compacts `knowledge.submit` assistant tool-call args before they enter provider history, keeping compact metadata and dropping large `content.markdown`, `coreCode`, and reasoning payloads.

Required next action:

- Package O confirms Producer inputs no longer contain the old direct-code block or full submit payload replay.
- Package Q preserved the direct-code replay fix, but the route still fails because Producer stopped before submitting remaining structured findings.

## Open Issue: Producer Submit Attempts Waste Output Tokens

Status: `failed(scope=live-ai-local, package=O); repaired(scope=source-unit, owner=AlembicAgent, package=P); partial(scope=live-ai-local, package=Q); superseded-by-producer-coverage-blocker(package=R)`

Evidence:

- Package O accepted 7 Recipes but made 11 submit attempts.
- Four rejected attempts were schema-contract misses, mainly `Missing required param "description" for knowledge.submit`.
- Producer output regressed versus Package M (`10457 -> 16191`) and Producer reasoning increased (`6557 -> 7712` route reasoning), partly due these retries and the extra final round.

Package P repair:

- `PRODUCER_SYSTEM_PROMPT` now lists中文 `description` as a required field before submission.
- The prompt now instructs Producer to self-check `params.description` before every `knowledge.submit`.

Required next action:

- Package Q verifies missing-`description` rejects disappear, but submit attempts fell because Producer stopped early; this issue is superseded by the Producer coverage blocker below.

## Open Issue: Producer Coverage Stops Before Structured Findings Are Submitted

Status: `failed(scope=live-ai-local, package=Q); repaired(scope=source-unit, package=R); fixed(scope=live-ai-local-coverage, package=S); contract-blocker-repaired(scope=source-unit, package=T); regressed(scope=producer-rounds, package=U); repaired(scope=source-unit, package=V)`

Evidence:

- Package Q had 6 structured Analyst findings in the Producer obligation set.
- Producer submitted one accepted Recipe, then spent three non-submit rounds on `knowledge.detail`, `meta.tools(knowledge)`, and `meta.tools(knowledge.submit)`.
- After those three non-submit rounds, Q entered `SUMMARIZE` and final summary reported 5 structured findings unsubmitted.
- `STRATEGY_PRODUCER` transitions to `SUMMARIZE` on `(m.submitCount > 0 && m.roundsSinceSubmit >= b.idleRoundsToExit)`.
- The tracker does not know the structured finding obligation count, so it cannot distinguish "finished" from "stalled while work remains".
- Provider-visible `knowledge` schema is generic `action`/`params`; action-specific required fields such as `title` are enforced only by runtime validation after the failed call.

Package R repair:

- `PipelineStrategy` now derives Producer `targetSubmits` from structured findings.
- `STRATEGY_PRODUCER` / `ExplorationTracker` require target coverage before idle/text completion.
- `ToolExecutionPipeline` blocks `knowledge.detail`, `meta.tools`, terminal/search/graph, and other non-submit drift during Producer PRODUCE.
- Lightweight tool schemas expose action-specific required params, including `knowledge.submit` `title`, `description`, `content.markdown`, `content.rationale`, and `reasoning.sources`.
- Producer prompts now repeat the same required-field contract.
- Verified by targeted and full AlembicAgent source/unit tests; committed as `bcdc8bf`.

Current reading:

- Package S proves structured finding coverage is repaired (`6/6` created).
- Package U proves Producer still regressed through generic params, missing-description retry, pre-submit code reads, and extra completion round.
- Package V repairs those source/unit causes; Package W must verify live behavior.

## Open Issue: Stage Capability Action Contract Is Not The Provider Schema Source Of Truth

Status: `partial(scope=live-ai-local, package=U); repaired(scope=source-unit, owner=AlembicAgent, package=V); blocked(scope=Package-W-live-rerun)`

Evidence:

- `BootstrapProduce.allowedTools` declared action-level constraints: `knowledge.submit`, `code.read`, `memory.recall`, `meta.review`.
- `CapabilityV2.tools` collapses `allowedTools` to tool ids.
- `AgentRuntime.#collectTools()` collects only tool ids.
- `AgentRuntime.#getToolSchemas()` passes only ids to `V2CapabilityCatalog`.
- `V2CapabilityCatalog.generateSchemas()` expands selected ids to all registered actions.
- Package S Producer inputs show provider-visible `knowledge.search/submit/detail/manage` and `meta.tools/plan/review`.
- Package S retained inputs show invalid `knowledge.detail` / `knowledge.manage` calls blocked by `producerSubmitOnlyGate`.

Package T repair:

- `V2CapabilityCatalog` now projects provider schemas from an action-aware tool contract instead of expanding selected tool ids to every registered action.
- `AgentRuntime` preserves `CapabilityV2.tools` action constraints in a runtime tool contract and uses that same contract for provider schema generation.
- Producer-visible schemas are narrowed to the allowed actions: `knowledge.submit`, `code.read`, `memory.recall`, and `meta.review`.
- Direct `note_finding` exposure is now conditional on `memory.note_finding`, so Producer no longer receives Analyst-only direct memory actions.
- `ToolExecutionPipeline` enforces the same action-level allowlist at runtime and exposes action diagnostics for future live comparison.

Package U result:

- `action.enum` was narrowed and Producer did not choose `knowledge.detail/manage`.
- Provider-visible descriptions still leaked broad action words, and `params` remained generic.

Package V repair:

- Single-action schemas now expose real action `params` schema with required fields.
- Restricted descriptions now mention only the allowed actions.
- Bootstrap Producer no longer exposes `code.read`.

Required next action:

- Package W verifies live provider schemas and Producer calls after Package V.

## Open Issue: Submit History Compaction Drops Completion Semantics

Status: `pass(scope=live-ai-local, package=U); preserve(scope=Package-W-live-rerun)`

Evidence:

- `ContextWindow.compactKnowledgeArgsForProviderHistory()` drops full `knowledge.submit` payload fields and keeps only compact identifiers plus `providerHistoryCompacted: true`.
- `limitToolResult('knowledge')` keeps submit result short; live success exposes status/id/title, not a payload completeness ledger.
- Package S persisted candidate files contain full payload fields, but final Producer summary falsely says candidates were submitted with only partial fields and need later completion.

Package T repair:

- `ContextWindow.compactKnowledgeArgsForProviderHistory()` now keeps a compact `payloadSummary` for submitted candidates, including `requiredFieldsComplete`, `payloadStored`, `sourceCount`, and omitted-field markers.
- Successful Producer `knowledge.submit` calls now record a runtime-owned `_producerSubmitLedger` with created count, target submit count, per-candidate status/title/trigger, and completion flags.
- `LLMInputAssembly` injects the Producer submit ledger into the runtime evidence context and instructs the model to treat it as authoritative instead of inferring field loss from compacted history.

Package U result:

- Producer final summaries no longer claimed stored candidates had only partial fields after all six candidates were created.
- Preserve submit ledger and `payloadSummary` visibility in Package W.

## Open Issue: Candidate Quality Score Does Not Validate Exact Code Snippet Correctness

Status: `open(owner=AlembicAgent/AlembicCore, package=post-T-quality-scope)`

Evidence:

- Package S `singleton-thread-safety-strategy.md` contains `aactor AuthMiddleware` and `aactor WBISigner`.
- The same candidate receives `_quality.overall=0.89`, grade `A`.
- `knowledge.submit` validation checks required fields and lengths.
- `QualityScorer` scores completeness, content depth, delivery readiness, actionability, and provenance; it does not compare snippets against source files or parse Swift syntax.

Required next action:

- Keep this as a quality-contract improvement candidate.
- Do not mix it into Package T's token-efficiency gate unless the user expands scope from LLM I/O efficiency to exact Recipe content validation.

## Open Issue: Provider-Input Projection Is Reactive After Peak

Status: `open(owner=AlembicAgent, package=L-or-later)`

Evidence:

- Analyze peak model input occurs at iteration 12 (`input=21770`, provider history estimate `13859`), while provider projection fires at iteration 13.
- Producer peak provider history occurs at iteration 6 (`providerHistory=11517`), while provider projection fires at iteration 7.
- Runtime input layer is not the main peak cost (`analyze inputLayer<=926`, `produce inputLayer<=816`); provider history is.

Required next action:

- If Package L keeps the same route and useful-output contract, consider lowering stage projection thresholds or projecting before the next call once the prior call crosses a warning threshold.
- This is secondary to output granularity because K already shows large token savings and the current failure is useful-output unit ambiguity.
