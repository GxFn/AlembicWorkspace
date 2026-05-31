# Package O Input/Output Structure Self-Check

Run ID: `pcv-20260530-1515-alembic-cold-start`
Package: `O`
Evidence scope: `live-ai-local raw package + full per-round artifact review`
Raw dir: `../AlembicTest/tmp/pcvm-package-o-same-input-live-rerun-2026-05-31`

## Evidence Inventory

Read and cross-checked:

- `package-o-raw-summary.json`
- `per-round-content-matrix.json`
- `llm-event-reading-table.md`
- `api-events.json`
- `api-events-full-from-timeline.json`
- `api-report-latest.json`
- `api-job-full.json`
- `persisted-bootstrap-report-session.json`
- `persisted-job.json`
- `timeline.json`
- `round-highlights.json`
- `stored-recipe-payload-summary.json`
- `fresh-build-dist-proof.json`
- `source-write-boundary.json`
- all 7 files in `candidates-design-patterns/`
- all provider artifact files referenced by `per-round-content-matrix.json`

Inventory check:

| Check | Result |
| --- | --- |
| `api-events-full-from-timeline` count | 75 developer views |
| per-round matrix rows | 63 |
| `llm.input` / `llm.output` / `llm.reflection` rows | 26 / 26 / 11 |
| analyze provider input/output rows | 15 / 15 |
| Producer provider input/output rows | 10 / 10 |
| candidate payload files | 7 |
| BiliDili write boundary | clean; no `.asd/` or `Alembic/` under BiliDili |
| fresh build proof | Alembic consumed local `AlembicAgent`; build passed for AlembicAgent and Alembic |

## Raw Row Read-Through

This table is based on reading the artifact files themselves, not only aggregate metrics.

| Row | Seq | Kind | Stage | Iter | Chars | Structure read |
| ---: | ---: | --- | --- | ---: | ---: | --- |
| 1 | 7 | llm.input | dimension-input | - | 5654 | design-patterns single-dimension input context |
| 2 | 8 | llm.reflection | analyze | 1 | 296 | initial exploration-plan nudge |
| 3 | 9 | llm.input | analyze | 1 | 13532 | Analyze input has note_finding contract and structured-recording instructions |
| 4 | 10 | llm.output | analyze | 1 | 602 | Markdown exploration plan; enters history |
| 5 | 11 | llm.reflection | EXPLORE | 1 | 46 | transition to focused exploration |
| 6 | 12 | llm.reflection | analyze | 2 | 604 | plan-deviation nudge |
| 7 | 13 | llm.input | analyze | 2 | 15692 | Analyze contract still visible |
| 8 | 14 | llm.output | analyze | 2 | 58 | code exploration steering |
| 9 | 15 | llm.input | analyze | 3 | 16486 | Analyze contract still visible |
| 10 | 16 | llm.output | analyze | 3 | 56 | code searches for Singleton/Factory/Delegate |
| 11 | 17 | llm.input | analyze | 4 | 21856 | Analyze history grows; structured contract retained |
| 12 | 18 | llm.output | analyze | 4 | 42 | graph + code verification steering |
| 13 | 19 | llm.reflection | analyze | 5 | 496 | mid-budget reflection |
| 14 | 20 | llm.input | analyze | 5 | 25961 | Analyze history grows |
| 15 | 21 | llm.output | analyze | 5 | 47 | more code/graph verification |
| 16 | 22 | llm.input | analyze | 6 | 34004 | Analyze history grows |
| 17 | 23 | llm.output | analyze | 6 | 56 | reread cached/unchanged files |
| 18 | 24 | llm.input | analyze | 7 | 41038 | Analyze input contains tool-result code snippets; this is Analyst evidence history, not Producer direct replay |
| 19 | 25 | llm.output | analyze | 7 | 52 | more file reads |
| 20 | 26 | llm.input | analyze | 8 | 47721 | Analyze evidence history grows |
| 21 | 27 | llm.output | analyze | 8 | 54 | Builder/protocol verification |
| 22 | 28 | llm.reflection | analyze | 9 | 624 | plan-deviation nudge |
| 23 | 29 | llm.input | analyze | 9 | 53139 | Analyze evidence history grows |
| 24 | 30 | llm.output | analyze | 9 | 57 | says it will quickly record findings |
| 25 | 31 | llm.reflection | analyze | 10 | 513 | mid-budget reflection |
| 26 | 32 | llm.input | analyze | 10 | 58217 | Analyze evidence history grows |
| 27 | 33 | llm.output | analyze | 10 | 60 | terminal/code/graph; attempts to break cache barrier |
| 28 | 34 | llm.input | analyze | 11 | 61035 | Analyze evidence history grows |
| 29 | 35 | llm.output | analyze | 11 | 43 | terminal reads; cache barrier workaround |
| 30 | 36 | llm.input | analyze | 12 | 62028 | peak analyze input before finding recording completes |
| 31 | 37 | llm.output | analyze | 12 | 77 | first 3 `note_finding` calls |
| 32 | 38 | llm.reflection | VERIFY | 12 | 173 | transition to evidence verification |
| 33 | 39 | llm.input | analyze | 13 | 65539 | highest analyze input; contains existing evidence and recording context |
| 34 | 40 | llm.output | analyze | 13 | 83 | 3 more `note_finding` calls |
| 35 | 41 | llm.reflection | RECORD | 13 | 277 | record-only transition |
| 36 | 42 | llm.input | record | 14 | 20863 | record-only input is much smaller than late analyze history |
| 37 | 43 | llm.output | analyze | 14 | 586 | final `note_finding`; total structured findings become 7 |
| 38 | 44 | llm.reflection | SUMMARIZE | 14 | 323 | summary nudge explicitly restricts confirmed sections to recorded `note_finding` |
| 39 | 45 | llm.input | summarize | 15 | 21416 | summarize input preserves recorded-finding contract |
| 40 | 46 | llm.output | analyze | 15 | 8017 | final Markdown says it is based on 7 structured `note_finding` records and demotes non-recorded signals |
| 41 | 47 | llm.input | produce | 1 | 21450 | Producer input has refs-first packet; no Package M direct-code replay marker |
| 42 | 48 | llm.output | produce | 1 | 1220 | Producer still performs 6 narrow `code.read` calls for snippets |
| 43 | 49 | llm.input | produce | 2 | 23256 | refs-first input retained |
| 44 | 50 | llm.output | produce | 2 | 76 | starts knowledge submission |
| 45 | 51 | llm.input | produce | 3 | 23556 | refs-first input retained |
| 46 | 52 | llm.output | produce | 3 | 71 | attempts all 7 candidate submissions |
| 47 | 53 | llm.input | produce | 4 | 24044 | compact `knowledge.submit` args visible; no full content/coreCode replay |
| 48 | 54 | llm.output | produce | 4 | 74 | reports missing required fields |
| 49 | 55 | llm.input | produce | 5 | 24729 | compact submit history visible |
| 50 | 56 | llm.output | produce | 5 | 95 | first candidate accepted; submits remaining 6 |
| 51 | 57 | llm.input | produce | 6 | 26525 | compact submit history visible |
| 52 | 58 | llm.output | produce | 6 | 49 | 4 submitted, 3 remaining |
| 53 | 59 | llm.input | produce | 7 | 24819 | compact submit history visible |
| 54 | 60 | llm.output | produce | 7 | 98 | three failed candidates missing `description`; retry needed |
| 55 | 61 | llm.input | produce | 8 | 26591 | compact submit history visible |
| 56 | 62 | llm.output | produce | 8 | 117 | all 7 findings now have candidate submissions; calls meta next |
| 57 | 63 | llm.input | produce | 9 | 28153 | includes completion-ready state and compact submit observations |
| 58 | 64 | llm.output | produce | 9 | 920 | first no-tool completion report: all 7 structured findings successfully submitted, blockers none |
| 59 | 65 | llm.reflection | produce | 9 | 91 | erroneous continue nudge after completion |
| 60 | 66 | llm.input | produce | 10 | 29232 | completion report and erroneous nudge enter history |
| 61 | 67 | llm.output | produce | 10 | 727 | extra no-tool final status; no new tool calls |
| 62 | 69 | llm.output | dimension-output | - | 8770 | final aggregate output preserves improved Analyze and extra Producer final status |
| 63 | 70 | llm.reflection | dimension-reflection | - | 837 | bootstrap self-check event |

## Behavior Verdict

Passed:

- Analyze final Markdown single-source behavior improved. The final report has 7 confirmed sections corresponding to 7 recorded `note_finding` entries and moves Value Type, Error Type, Coordinator, and Observer into "未结构化记录".
- Producer no longer mines Markdown-only themes as extra obligations.
- Producer input no longer contains Package M's `Analyst 已读取的代码 (直接引用, 无需 read_file)` block or direct code body replay.
- `knowledge.submit` assistant tool-call args are compacted in provider history with `providerHistoryCompacted: true`; later inputs retain action/title/trigger/status/error context rather than full `content.markdown` and `coreCode`.

Failed / partial:

- Producer first completion report does not terminate. Row 58 says all 7 structured findings were submitted and blockers are none; row 59 still injects a continue nudge; row 61 emits an extra no-tool final status.
- Producer has 11 submit attempts for 7 accepted Recipes. Four rejected attempts are schema-contract misses, mainly missing `description`, which inflates Producer output/reasoning and history.
- Route total model is essentially flat/slightly worse versus M (`307767 -> 309624`, +0.6%) even though useful-output normalized cost improves.

## Metrics

| Metric | Package K | Package M | Package O | Reading |
| --- | ---: | ---: | ---: | --- |
| analyze input | 174988 | 175870 | 187313 | O regresses vs K/M; late analyze evidence history still grows. |
| analyze output | 12214 | 11826 | 11410 | O slightly improves output vs K/M. |
| analyze iterations / tool calls | 16 / 38 | 14 / 25 | 15 / 31 | O worse than M, better than K on tool calls. |
| Producer input | 85823 | 103057 | 86998 | O fixes most Package M Producer input regression, close to K. |
| Producer output | 13530 | 10457 | 16191 | O regresses due retries + extra final round. |
| Producer iterations / tool calls | 9 / 12 | 10 / 12 | 10 / 19 | Tool calls grow because of snippet reads and rejected submit attempts. |
| route input | 260811 | 278927 | 274311 | O improves vs M but not K. |
| route output | 25744 | 22283 | 27601 | O regresses vs K/M. |
| route reasoning | n/a | 6557 | 7712 | O regresses vs M. |
| route total model | 294371 | 307767 | 309624 | O does not pass raw total gate. |
| accepted Recipes | 6 | 5 | 7 | O improves useful-output count. |
| submit attempts / rejected | n/a | 5 / 0 | 11 / 4 | O has Producer schema retry waste. |
| total model / accepted | 49061.83 | 61553.40 | 44232.00 | O improves useful-output unit cost vs K/M. |
| stored payload avg approx tokens / Recipe | 1997.4 | 2127.2 | 1457.0 | O payloads are smaller than K/M while accepted count improves. |
| model-to-payload amplification | 24.56x | 28.94x | 30.36x | O worse than K but close to M; payload size fell. |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 | Quality constraint held. |
| quality score | 100 | 98 | 100 | Quality recovered. |

## PCVM Conclusion

Verdict: `partial(scope=live-ai-local, package=O)`

Package O proves Package N fixed two real responsibilities: Analyze final Markdown single-source discipline and Producer input direct-code/full-payload replay. It does not prove the route is final-pass because Producer completion still adds one extra no-tool round and Producer schema retries inflate output/reasoning.

The next source/unit repair is Package P: recognize Package O's mixed English/Chinese completion wording as terminal and strengthen Producer submit schema contract for `description`.
