# Package W Live Verdict and Package X Source Repair

Run ID: `pcv-20260530-1515-alembic-cold-start`
Scope: `live-ai-local raw evidence review + source-unit repair`
Owner: `PCVM`

## Test Evidence

- Raw dir: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-w-same-input-live-rerun-2026-05-31`
- Job/session: `bootstrap_mptxbjo2_3e51c784` / `bs_1780240654943_3apoft`
- Same-input request: `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`
- Raw files read: `events.json`, `analysis-summary.json`, `job-compact.json`, `report-bs_1780240654943_3apoft.json`
- Job artifacts read: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-artifacts/bootstrap_mptxbjo2_3e51c784`

AlembicTest did not produce a persisted `docs/pcvm-package-w...md` report or a standalone fresh source proof file for Package W. PCVM therefore treats the runtime behavior itself as indirect Package V linkage evidence, not as release/install proof. Producer inputs show Package V behavior in the tested runtime: no `code` schema, `knowledge.submit` has real required params schema, and restricted descriptions are clean.

## Raw Event Self-Check

Retained events: `81`.

Event shape:

- `llm.input`: `28`
- `llm.output`: `28`
- `llm.reflection`: `13`
- workflow/checkpoint/tool/summary/artifact events: `12`

Stage shape:

- Analyze inputs/outputs: `14/14`
- Producer inputs/outputs: `13/13`
- Created candidates: `6`
- Rejected attempts: `4`
- Total tool calls: `44`
- Quality gate: `100`, pass

Producer structure read-through:

- Iterations `1-2`: full `knowledge.submit` payloads created Singleton and Middleware candidates.
- Iterations `3,5,7,9`: first attempts for RouteMiddleware, actor, AppCoordinator, and ServiceRegistry were rejected with `Missing required param "description" for knowledge.submit`.
- Iterations `4,6,8,10`: the same four candidates were resubmitted successfully.
- Iteration `11`: `meta.review`.
- Iteration `12`: first no-tool completion summary says all 6 Analyst-confirmed structured findings were submitted, no duplicates, no omissions.
- Iteration `13`: second no-tool completion summary repeats the final state after a continue nudge.

## Package W Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Producer provider-visible schema no longer exposes `code` | pass | All 13 Producer inputs list `availableTools: knowledge, memory, meta`; no Producer `code` schema. |
| `knowledge.submit` uses real required params schema | pass | Producer inputs show `description`, `content`, `kind`, `trigger`, `whenClause`, `doClause`, `dontClause`, `coreCode`, `reasoning` required under `params`. |
| Restricted descriptions clean | pass | Runtime analysis summary reports `restrictedDescriptionsClean=true`; Producer tool schemas do not expose `detail/manage/search/tools/plan` actions. |
| No Producer pre-submit `code.read` | pass | Producer tool calls are `knowledge x10`, `meta x1`, then two text summaries; no `code`. |
| No missing-description reject | fail | Four real `knowledge.submit` rejects with `Missing required param "description"`. |
| Direct stop after 6/6 completion | fail | Iteration 12 completion received a continue nudge, then `meta.review`, then iteration 13 final summary. |
| Same-input useful output | partial | 6 candidates created/accepted; quality held, but total model tokens and per-created Recipe regressed. |

## Metrics

| Metric | Package S | Package U | Package W | W vs S | W vs U |
| --- | ---: | ---: | ---: | ---: | ---: |
| created candidates | 6 | 6 | 6 | 0.00% | 0.00% |
| rejected attempts | 0 | 2 | 4 | regression | regression |
| tool calls | 42 | 62 | 44 | +4.76% | -29.03% |
| input tokens | 246703 | 275108 | 294769 | +19.48% | +7.15% |
| output tokens | 22825 | 23987 | 21806 | -4.46% | -9.09% |
| reasoning tokens | 5922 | 6044 | 5925 | +0.05% | -1.97% |
| total model tokens | 275450 | 305139 | 322500 | +17.08% | +5.69% |
| total model / created Recipe | 45908.33 | 50856.50 | 53750.00 | +17.08% | +5.69% |
| analyze iterations | 16 | 15 | 14 | -12.50% | -6.67% |
| analyze input tokens | 184353 | 155868 | 185685 | +0.72% | +19.13% |
| produce iterations | 7 | 15 | 13 | +85.71% | -13.33% |
| produce input tokens | 62350 | 119240 | 109084 | +74.95% | -8.52% |
| produce output tokens | 12126 | 14065 | 11357 | -6.34% | -19.25% |

## Root Cause

Package V fixed the visible tool-surface problem, but Package W exposed two deeper runtime-contract issues.

1. Historical `knowledge.submit` messages are stored in provider history with compacted args. They preserve `payloadSummary`, but the assistant-facing history still looks like a valid short tool-call shape: `title/kind/trigger` only. The model copied that compacted shape for four later candidates. This is not a random live-model artifact; it is a design contradiction between "compact provider history" and "provider history remains imitation training data".
2. Producer terminal detection did not recognize the Package W wording: `所有 6 个 Analyst 已确认结构化发现均已提交，无重复、无遗漏` plus JSON `totalSubmitted: 6`, `blockers: []`, `unsubmittedFindings: []`. Therefore iteration 12 was treated as continue-able text instead of final Producer completion.

## Package X Source/Unit Repair

Owner repo: `AlembicAgent`

Implemented source facts:

- `LLMInputAssembly` now projects Producer-stage historical `knowledge.submit` tool rounds into a plain submit-history summary before provider dispatch.
- The projected submit-history summary removes prior assistant tool-call JSON and matching tool responses from provider history, so the model no longer sees compacted `params` as a call shape to imitate.
- The summary explicitly says historical submit entries are not valid `knowledge.submit` payloads and that new calls must use the current required schema.
- `ExplorationTracker` now recognizes Package W Analyst-confirmed completion wording and JSON `totalSubmitted` / empty `blockers` / empty `unsubmittedFindings` as terminal after target submits.

Verification:

- `npm test -- test/llm-input-layering.test.ts test/ExplorationStrategies.test.ts` passed; 2 files, 34 tests.
- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed; 28 files, 180 tests.
- `npm run lint:core-import-boundary` passed.
- `git diff --check` passed.

## Scoped Verdict

Verdict: `partial(scope=live-ai-local, package=W); repaired(scope=source-unit, package=X); blocked(scope=package-y-same-input-live-rerun)`

Package W is not a pass. It proves Package V improved the visible Producer tool contract, but it also proves the current system still wastes live rounds through compacted-history imitation and missed final-summary stop. Package X repairs those source-level causes. The next safe action is Package Y same-input live rerun after Package X is committed or otherwise fixed as the tested AlembicAgent source with fresh source proof.
