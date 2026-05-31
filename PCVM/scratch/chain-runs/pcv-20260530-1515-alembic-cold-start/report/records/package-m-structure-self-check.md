# Package M Input/Output Structure Self-Check

Run ID: `pcv-20260530-1515-alembic-cold-start`
Package: `M`
Evidence scope: `live-ai-local raw package + full per-round artifact review`
Raw dir: `../AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31`

## Evidence Inventory

Read and cross-checked:

- `package-m-raw-summary.json`
- `per-round-content-matrix.json`
- `api-events.json`
- `api-report-latest.json`
- `api-job-full.json`
- `persisted-bootstrap-report-session.json`
- `persisted-job.json`
- `timeline.json`
- `round-highlights.json`
- `stored-recipe-payload-summary.json`
- `fresh-build-dist-proof.json`
- `source-write-boundary.json`
- all 5 files in `candidates-design-patterns/`
- all provider artifact files referenced by `per-round-content-matrix.json`

Inventory check, only used to identify every row that must be read:

| Check | Result |
| --- | --- |
| `api-events` count | 73 events |
| per-round matrix rows | 61 |
| `llm.input` / `llm.output` / `llm.reflection` rows | 25 / 25 / 11 |
| analyze provider input/output rows | 14 / 14 |
| Producer provider input/output rows | 10 / 10 |
| candidate payload files | 5 |
| BiliDili write boundary | clean; no `.asd/` or `Alembic/` under BiliDili |
| fresh build proof | Package L marker strings present in runtime dist; runtime package resolves to local `AlembicAgent` |

This inventory is not the verdict. The verdict below is based on reading the actual per-round input/output contents.

## Full Raw Row Re-Read Addendum

This is the second self-check pass after the user explicitly requested reading each test output rather than checking package completeness. The latest AlembicTest LLM artifact found by modified time is still Package M; no Package N raw report or tmp directory was present.

| Row | Seq | Kind | Stage | Iter | Chars | Structure read |
| ---: | ---: | --- | --- | ---: | ---: | --- |
| 1 | 7 | llm.input | dimension-input | - | 5654 | bootstrap Agent input context; fileCount 24 and design-patterns prompt context present |
| 2 | 8 | llm.reflection | analyze | 1 | 297 | initial planning nudge |
| 3 | 9 | llm.input | analyze | 1 | 13538 | 3 messages / 3385 estimated tokens; Markdown guard visible |
| 4 | 10 | llm.output | analyze | 1 | 427 | code tool call; exploration plan enters history |
| 5 | 11 | llm.reflection | analyze | 1 | 46 | EXPLORE transition nudge |
| 6 | 12 | llm.reflection | analyze | 2 | 519 | plan deviation nudge includes note_finding guidance |
| 7 | 13 | llm.input | analyze | 2 | 15437 | 5 messages / 3860 estimated tokens; Markdown guard visible |
| 8 | 14 | llm.output | analyze | 2 | 375 | code + graph calls; project structure summary |
| 9 | 15 | llm.input | analyze | 3 | 16578 | 8 messages / 4145 estimated tokens; Markdown guard visible |
| 10 | 16 | llm.output | analyze | 3 | 58 | code calls; search correction |
| 11 | 17 | llm.input | analyze | 4 | 22137 | 12 messages / 5535 estimated tokens; Markdown guard visible |
| 12 | 18 | llm.output | analyze | 4 | 364 | code calls; broad initial pattern list |
| 13 | 19 | llm.reflection | analyze | 5 | 602 | mid-budget reflection |
| 14 | 20 | llm.input | analyze | 5 | 26144 | 16 messages / 6536 estimated tokens; Markdown guard visible |
| 15 | 21 | llm.output | analyze | 5 | 888 | code + graph calls; mid evaluation broadens candidates |
| 16 | 22 | llm.input | analyze | 6 | 31007 | 19 messages / 7752 estimated tokens; Markdown guard visible |
| 17 | 23 | llm.output | analyze | 6 | 62 | code reads; Package.swift progress |
| 18 | 24 | llm.input | analyze | 7 | 36805 | 22 messages / 9202 estimated tokens; Markdown guard visible |
| 19 | 25 | llm.output | analyze | 7 | 104 | code reads; cache/unchanged recovery |
| 20 | 26 | llm.input | analyze | 8 | 40894 | 25 messages / 10224 estimated tokens; Markdown guard visible |
| 21 | 27 | llm.output | analyze | 8 | 77 | code calls; switches to outline/focused reads |
| 22 | 28 | llm.reflection | analyze | 9 | 217 | plan deviation nudge |
| 23 | 29 | llm.input | analyze | 9 | 44351 | 28 messages / 11088 estimated tokens; Markdown guard visible |
| 24 | 30 | llm.output | analyze | 9 | 469 | code call; updated plan text enters history |
| 25 | 31 | llm.reflection | analyze | 9 | 173 | VERIFY transition nudge |
| 26 | 32 | llm.reflection | analyze | 10 | 691 | mid-budget reflection |
| 27 | 33 | llm.input | analyze | 10 | 51778 | 30 messages / 12945 estimated tokens; Markdown guard visible |
| 28 | 34 | llm.output | analyze | 10 | 858 | code + graph calls; seven-pattern status table |
| 29 | 35 | llm.input | analyze | 11 | 56326 | 33 messages / 14082 estimated tokens; Markdown guard visible |
| 30 | 36 | llm.output | analyze | 11 | 110 | first note_finding; accepted finding +1 |
| 31 | 37 | llm.input | analyze | 12 | 57304 | 35 messages / 14326 estimated tokens; Markdown guard visible |
| 32 | 38 | llm.output | analyze | 12 | 91 | three note_finding calls; accepted finding +3 |
| 33 | 39 | llm.reflection | analyze | 12 | 277 | RECORD nudge |
| 34 | 40 | llm.input | analyze | 13 | 56611 | 39 messages / 14153 estimated tokens; record phase |
| 35 | 41 | llm.output | analyze | 13 | 487 | final note_finding; accepted finding +1 |
| 36 | 42 | llm.reflection | analyze | 13 | 244 | SUMMARIZE nudge; generic final-report wording remains broad |
| 37 | 43 | llm.input | analyze | 14 | 56629 | 41 messages / 14158 estimated tokens; no-tool summarize contract visible |
| 38 | 44 | llm.output | analyze | 14 | 10457 | final Markdown lists 7 families; 2 are unstructured-only core sections |
| 39 | 45 | llm.input | produce | 1 | 20829 | 2 messages / 5208 estimated tokens; structured-finding contract + direct code replay |
| 40 | 46 | llm.output | produce | 1 | 655 | code x3; still reads code despite direct-code block |
| 41 | 47 | llm.input | produce | 2 | 21795 | 6 messages / 5449 estimated tokens; direct code replay persists |
| 42 | 48 | llm.output | produce | 2 | 63 | code x3; says it will submit 5 candidates after reads |
| 43 | 49 | llm.input | produce | 3 | 22830 | 10 messages / 5708 estimated tokens; direct code replay persists |
| 44 | 50 | llm.output | produce | 3 | 33 | knowledge submit; candidate +1 |
| 45 | 51 | llm.input | produce | 4 | 28085 | 12 messages / 7022 estimated tokens; candidate payload history starts accumulating |
| 46 | 52 | llm.output | produce | 4 | 22 | knowledge submit; candidate +1 |
| 47 | 53 | llm.input | produce | 5 | 32300 | 14 messages / 8075 estimated tokens; candidate history grows |
| 48 | 54 | llm.output | produce | 5 | 51 | knowledge submit; candidate +1 |
| 49 | 55 | llm.input | produce | 6 | 37141 | 16 messages / 9286 estimated tokens; candidate history grows |
| 50 | 56 | llm.output | produce | 6 | 48 | knowledge submit; candidate +1 |
| 51 | 57 | llm.input | produce | 7 | 41659 | 18 messages / 10415 estimated tokens; candidate history grows |
| 52 | 58 | llm.output | produce | 7 | 40 | knowledge submit; candidate +1 |
| 53 | 59 | llm.input | produce | 8 | 46871 | 20 messages / 11718 estimated tokens; peak Producer input before self-check |
| 54 | 60 | llm.output | produce | 8 | 35 | meta self-check; no candidate delta |
| 55 | 61 | llm.input | produce | 9 | 27271 | 7 messages / 6818 estimated tokens; history pruned, but no inputProjection evidence |
| 56 | 62 | llm.output | produce | 9 | 607 | completion report: 5 submitted / 0 unsubmitted; should terminate |
| 57 | 63 | llm.reflection | produce | 9 | 91 | continue nudge after producer completion |
| 58 | 64 | llm.input | produce | 10 | 28035 | 9 messages / 7009 estimated tokens; completion report and continue nudge are now in history |
| 59 | 65 | llm.output | produce | 10 | 629 | extra final status after continue nudge |
| 60 | 67 | llm.output | dimension-output | - | 11086 | downstream combined output preserves Analyze Markdown mismatch |
| 61 | 68 | llm.reflection | dimension-reflection | - | 837 | bootstrap self-check passes despite structural mismatch above |

## Input Structure Self-Check

Expected after Package L:

- Analyze and Producer inputs should expose Package L contracts: structured `note_finding` is the single Producer fact source, and final Markdown must not create new candidate obligations.
- Stage policy, tool contract, task context, evidence context, and dynamic context should remain visible.
- Producer should consume structured Analyst findings and bounded background, not mine final Markdown for new themes.
- Provider history should not grow from repeated static prompts or unbounded evidence/code replay.

Observed:

| Stage | Input rows | Stage/tool/task/evidence/dynamic sections | Package L contract visible | Projection fired | Main growth surface |
| --- | ---: | --- | --- | --- | --- |
| analyze | 14 | yes | yes | no | provider message history grows from `9819` to `51914` chars in the retained `Messages` surface |
| produce | 10 | yes | yes | no `inputProjection` evidence in Package M matrix/report | Producer prompt/messages retain direct Analyst code excerpts and submitted candidate payload history |

Key input readings:

- All analyze/produce provider input artifacts include the Package L contract strings, including `Structured findings are the only candidate obligations` and the Chinese final-Markdown/note-finding guard.
- Analyze no longer needs provider projection in this run because estimated provider history stays below the configured budget, but it still grows steadily: provider history estimate reaches `12919` tokens at analyze iteration 14.
- Analyze input is stable versus K, not substantially better: K analyze input `174988`, M analyze input `175870` (+0.50%).
- Producer input regresses versus K: K Producer input `85823`, M Producer input `103057` (+20.08%).
- Producer iteration 1 input already contains an `Analyst 已读取的代码 (直接引用, 无需 read_file)` block with large code excerpts. The same call then still reads more code via `code.read`, so Producer uses both direct code replay and additional code tools.
- The producer-side code/history region grows from about `12363` chars on iteration 1 to about `38403` chars on iteration 8; iteration 9 drops to 7 messages / `27271` original chars after context pruning, but Package M raw artifacts do not prove provider-input projection fired.
- `persisted-bootstrap-report-session.json` reports `maxCompactionLevel=0` and `totalCompactedItems=0`; unlike Package K, Package M `per-round-content-matrix.json` has no `inputProjection` field, so projection must not be used as the M evidence explanation.
- Submitted candidate payloads average `2127.2` approx stored tokens each, so prior `knowledge.submit` tool-call payloads are real provider-history cost even when free text is short.

Input structure verdict:

- Package L's visible input contract is present.
- The old "Producer mines final Markdown for extra candidates" path is blocked at the prompt/contract level.
- The remaining input waste is not task-context prompt replay. It is Producer evidence/candidate-history ownership: direct code snippets, additional code reads, and full candidate payloads remain provider-visible across rounds.

## Output Structure Self-Check

Expected after Package L:

- Analyze final Markdown should summarize recorded `note_finding` items only.
- Producer candidate submissions should match structured Analyst findings and not include Markdown-only themes.
- Producer should stop after a completion output that says all structured findings were submitted and no blockers remain.
- Non-final text should stay compact; actions should be in tools.

Observed:

- Analyze iterations 1-10 are mostly short tool/control rounds.
- Analyze records structured findings only in iterations 11-13: deltas `1 + 3 + 1 = 5`.
- Analyze final Markdown at iteration 14 is long (`10457` chars) and contains 7 "已确认的设计模式" families:
  - `Singleton + DI Container`
  - `Delegate + 线程安全`
  - `Coordinator`
  - `Repository`
  - `Input/Output MVVM`
  - `Middleware Chain + Observer`
  - `Value-Type`
- Only the first 5 are represented by structured `note_finding` and Producer candidates. `Middleware Chain + Observer` and `Value-Type` are Markdown-only core sections, not merely a "待探索" note.
- Producer submits exactly 5 candidates matching the 5 structured findings. It does not submit the Markdown-only `Middleware` or `Value-Type` themes.
- Producer iteration 8 says all 5 structured findings have been submitted and calls `meta` for self-check.
- Producer iteration 9 emits a terminal completion report: 5 submitted, 0 unsubmitted, full coverage.
- After iteration 9, the runtime injects a continue nudge asking to continue calling `knowledge`, even though no candidate obligation remains. Iteration 10 emits a second no-tool final-status message.
- Package K's extra post-completion evidence/tool-check round is gone; Package M still has an extra no-tool final round after completion.

Output structure verdict:

- Passed: Producer candidate obligations are tied to structured findings, not final Markdown.
- Passed: no extra evidence/code read happens after completion.
- Failed: Analyze final Markdown still violates the single-source contract by promoting 2 Markdown-only pattern families as confirmed core sections.
- Failed: Producer terminal detection is still incomplete for the first no-tool completion report; the continue nudge creates one extra provider round.

## Every LLM Output Read-Through

| Row | Stage | Iteration | Chars | Tools | Output content read | Structure verdict |
| --- | --- | ---: | ---: | --- | --- | --- |
| 1 | analyze | 1 | 427 | `code` | Markdown exploration plan: structure scan, pattern search, graph query, file reads, `note_finding`, summary. | Useful but visible prose enters history. |
| 2 | analyze | 2 | 375 | `code`,`graph` | Structure complete; 24 files and initial module/pattern signals. | Concise control/evidence steering. |
| 3 | analyze | 3 | 58 | `code` x3 | Search pattern count too high; adjusts. | Tool-error recovery round. |
| 4 | analyze | 4 | 364 | `code` x3 | Initial Singleton/Delegate/Factory/Middleware signals. | Broad branch list expands exploration surface. |
| 5 | analyze | 5 | 888 | `code`,`graph` | Mid evaluation table with confirmed strong signals and uncovered areas. | Long-ish progress text, but still diagnostic. |
| 6 | analyze | 6 | 62 | `code` x2 | Package.swift read, continue key files. | Concise. |
| 7 | analyze | 7 | 104 | `code` x2 | Some batch reads returned unchanged; rereads. | Tool-cache recovery. |
| 8 | analyze | 8 | 77 | `code` x2 | Uses outline and focuses core files. | Concise. |
| 9 | analyze | 9 | 469 | `code` | Plan deviation evaluation and updated plan. | Nudge-induced planning text remains in history. |
| 10 | analyze | 10 | 858 | `code`,`graph` | VERIFY status table; 7 possible patterns, some only searched/cached. | Broad verified/pending mix. |
| 11 | analyze | 11 | 110 | `note_finding` | First structured finding round. | Good structured transition. |
| 12 | analyze | 12 | 91 | `note_finding` x3 | Records three more structured findings. | Good structured output. |
| 13 | analyze | 13 | 487 | `note_finding` | Records Coordinator structured finding. | Good structured output. |
| 14 | analyze | 14 | 10457 | none | Final Markdown report with 7 confirmed pattern families and pending exploration. | Main mismatch: 7 final families vs 5 structured findings. |
| 15 | produce | 1 | 655 | `code` x3 | Reads ServiceRegistry, MetricsCollector, FollowingViewModel snippets. | Preparation step, but duplicates direct code replay. |
| 16 | produce | 2 | 63 | `code` x3 | Says it will submit 5 candidates, but first reads `@Injected` and Repository files. | Still evidence prep despite "direct code" prompt. |
| 17 | produce | 3 | 33 | `knowledge` | Begins direct submission. Candidate delta +1. | Good, compact visible text. |
| 18 | produce | 4 | 22 | `knowledge` | First candidate created, continue remaining 4. Candidate delta +1. | Compact. |
| 19 | produce | 5 | 51 | `knowledge` | Continue Coordinator, Repository, Input/Output. Candidate delta +1. | Compact. |
| 20 | produce | 6 | 48 | `knowledge` | Continue remaining 2. Candidate delta +1. | Compact. |
| 21 | produce | 7 | 40 | `knowledge` | Submit last Input/Output candidate. Candidate delta +1. | Compact. |
| 22 | produce | 8 | 35 | `meta` | All 5 structured findings submitted; self-check. | Completion-like but tool-bearing. |
| 23 | produce | 9 | 607 | none | Completion report: 5 submitted, 0 unsubmitted, all 5 Analyst findings covered. | Should be terminal. |
| 24 | produce | 10 | 629 | none | Second final-status message after continue nudge. | Extra no-tool final round. |
| 25 | dimension-output | n/a | 11086 | none | Combined Analyze + Produce output; Analyze section truncated in event bridge. | Downstream report still carries Analyzer Markdown mismatch. |

## Metrics And Unit-Cost Reading

| Metric | Package K | Package M | Delta | Reading |
| --- | ---: | ---: | ---: | --- |
| analyze input | 174988 | 175870 | +882 (+0.50%) | essentially flat |
| analyze output | 12214 | 11826 | -388 (-3.18%) | slight improvement |
| analyze iterations | 16 | 14 | -2 | loop shorter |
| analyze tool calls | 38 | 25 | -13 | substantially fewer tool calls |
| Producer input | 85823 | 103057 | +17234 (+20.08%) | regression, driven by Producer history/evidence payloads |
| Producer output | 13530 | 10457 | -3073 (-22.71%) | improved raw output |
| Producer iterations | 9 | 10 | +1 | extra final no-tool round |
| route input | 260811 | 278927 | +18116 (+6.94%) | regression |
| route output | 25744 | 22283 | -3461 (-13.44%) | raw output improves |
| route total model | 294371 | 307767 | +13396 (+4.55%) | regression |
| accepted Recipes | 6 | 5 | -1 (-16.67%) | useful-output count falls |
| total model / accepted | 49061.83 | 61553.40 | +12491.57 (+25.46%) | fails useful-output unit gate |
| stored payload avg approx tokens / Recipe | 1997.4 | 2127.2 | +129.8 (+6.50%) | payloads are not smaller |
| model-to-payload amplification | 24.56x | 28.94x | +4.38x | worse than K |

Per accepted Recipe payload reference:

| Candidate | Approx stored tokens |
| --- | ---: |
| AppCoordinator: 导航协调器模式 + SchemeRouter 路由驱动 | 2160 |
| Input/Output Struct: MVVM 响应式变体模式 | 2350 |
| MetricsCollector: Delegate 模式 + OSAllocatedUnfairLock 线程安全 | 1878 |
| Repository Protocol: 协议导向依赖反转模式 | 1999 |
| ServiceRegistry: 线程安全 DI 容器 + Singleton 复合模式 | 2249 |

## Self-Check Verdict

`partial(scope=live-ai-local-structure, package=M)`

Passed:

- every provider `llm.input`, `llm.output`, and `llm.reflection` row has been read for content, not only counted
- Package L contract text is present in provider-visible inputs
- Producer submits exactly the 5 structured Analyst findings
- Producer does not submit Markdown-only `Middleware` or `Value-Type` themes
- Package K's extra post-completion evidence/code-check round is eliminated
- BiliDili source write boundary stays clean
- `pcvAnalyzeGroundingInvalidNoEvidence=0`

Failed / residual:

- Analyze final Markdown still promotes 2 unstructured pattern families as confirmed core sections
- Producer completion at iteration 9 is followed by a continue nudge and iteration 10 no-tool final status
- Producer input regresses because direct Analyst code excerpts, extra code reads, and candidate payload history remain provider-visible
- route total model / accepted Recipe regresses versus K and remains worse than E

First blocker:

Package N should be another source/unit repair, not another AlembicTest rerun. The repair target is the same LLM I/O chain:

1. Generate or constrain Analyst final Markdown from recorded `note_finding` items only; Markdown-only signals must be downgraded to "未结构化/待探索" and excluded from core confirmed sections.
2. Recognize no-tool Producer completion reports such as `提交完成报告` with submitted count equal to Analyst structured findings and unsubmitted `0` as terminal, so no continue nudge fires.
3. Compact Producer evidence ownership: choose either bounded direct snippets or `code.read`, not both; after `knowledge.submit`, retain compact candidate ids/titles/status in history instead of full payload replay.

Do not reopen SourceRef. The next optimization target is LLM input/output ownership and stop behavior.
