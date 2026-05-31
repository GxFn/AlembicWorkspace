# Tool And Terminal Usage Baseline Plan

Run ID: `pcv-20260531-1506-tool-terminal-usage-baseline`
Target: establish baseline facts and key metrics for current tool usage and terminal usage, then choose optimization directions from evidence
Owner: `PCVM-Tool-Optimization`
Current phase: `tool-terminal-usage-repair-implemented`
Status: `repair-implemented(scope=alembictest-controlled-baseline-helper); blocked(scope=historical-all-session-baseline)`

## Controller Snapshot

Current goal: create a new PCVM requirement for the current tool-use and terminal-use situation. The goal is not to reduce usage immediately; it is to define what is being used, what can be measured, which metrics are meaningful, and which later optimization directions are justified.

Current evidence:

- User explicitly requested a new PCVM requirement for tool usage, terminal usage, baseline information, key metrics, and future optimization direction.
- PCVM current LLM token run remains blocked on live AI authorization and must not absorb this new metric line.
- AlembicTest produced raw evidence for `controlled-current-turn-evidence-intake`: report `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/docs/pcvm-tool-terminal-usage-baseline-2026-05-31.md`; raw JSON under `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/`.
- The raw evidence gives a scoped sample only; a complete historical Codex transcript/export source is still not available.
- Project fix implemented in AlembicTest: `scripts/tool-terminal-baseline.mjs` now normalizes controlled action ledgers, computes metrics, and constrains generated evidence/report output under AlembicTest.
- No product source, live AI route, external provider call, Dashboard, delivery, or real test project mutation is part of this PCVM intake verdict.

Current segment: `metric-refinement-after-controlled-baseline`.

Current round/node:

- Round: `R1-engineering-discovery`
- Node: `N02-controlled-baseline-sample-review`
- Evidence scope: `controlled-current-turn-ledger` from AlembicTest raw evidence

First blocker: historical/all-session baseline remains unavailable. The immediate controlled-ledger functional issues are repaired in AlembicTest, but global usage optimization still requires a broader raw telemetry source or future real samples.

Minimum closure for this requirement:

1. Define baseline fact fields for every counted tool call and terminal command.
2. Define primary/support/diagnostic metrics with clear pass/fail or trend semantics.
3. Identify the first raw evidence source and collection boundary.
4. Record an initial baseline sample only from that source.
5. Propose optimization directions only after the sample is measurable.

## Dedicated Responsibility Window

Window name: `PCVM-Tool-Optimization`

Window purpose:

- Own the Tool / Terminal usage baseline and later Tool optimization plan.
- Produce evidence-backed metrics for how tools, terminal commands, MCP calls, GUI/browser actions, and verification commands are used.
- Recommend optimizations only after a measurable baseline exists.

Boundary:

| In scope | Out of scope |
| --- | --- |
| Tool/terminal telemetry source map | LLM token efficiency Package F/G/H implementation |
| Tool and command baseline fact model | SourceRef optimization or SourceRef reclassification |
| Per-action evidence fields and metric coverage | Product source edits unless a later explicit task authorizes them |
| Tool usage optimization directions | Live AI / AlembicTest reruns without explicit authorization |
| Verification sufficiency and output-noise metrics | AGENTS, skill, or config edits |

Allowed write targets for short-term state:

- `PCVM/index.md`
- `PCVM/scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/plan.md`
- `PCVM/scratch/chain-runs/pcv-20260531-1506-tool-terminal-usage-baseline/report/records/*`

First responsibilities:

1. Confirm the exact evidence source and sampling window.
2. Populate required baseline fields for one bounded sample.
3. Compute support metrics and identify blind spots.
4. Only then rank optimization directions.

Stop conditions:

- Stop if the raw telemetry source cannot prove workdir, action result, or evidence reference.
- Stop if optimization would reduce source evidence, verification sufficiency, or boundary safety.
- Stop if the task drifts into LLM prompt/token implementation, SourceRef, product code, or live AI without explicit new authorization.

## Non-Goals

- Do not continue or optimize SourceRef.
- Do not add taxonomy, reason split, guardrail-only tests, or pseudo metrics.
- Do not optimize by guessing from memory or from natural-language impressions.
- Do not change AGENTS, skill, config, product source, or real test project files for this intake.
- Do not run live AI, AlembicTest, Dashboard, delivery, or external-provider routes.
- Do not treat lower tool/terminal count as success if evidence quality, verification, or repo-boundary safety becomes weaker.

## Baseline Fact Model

Each observed tool or terminal action should produce one compact record with these fields:

| Field | Meaning |
| --- | --- |
| `timestamp` | Local time or transcript order. |
| `surface` | `tool`, `terminal`, `browser`, `mcp`, or `other`. |
| `actionId` | Stable ordinal or command id inside the evidence source. |
| `purpose` | Short reason tied to the active PCVM node. |
| `workdir` | Effective working directory when applicable. |
| `targetRepo` | PCVM, AlembicAgent, Alembic, AlembicTest, or none. |
| `readWriteClass` | `read`, `write`, `verify`, `network`, `gui`, `git`, or `unknown`. |
| `writesFiles` | Whether the action wrote tracked or generated files. |
| `externalCall` | Whether it used network, live AI, browser, or external provider. |
| `success` | Exit status or tool success. |
| `evidenceRef` | Transcript line, command output, report path, or artifact path. |
| `notes` | Only actionable anomalies, not free-form explanation. |

Terminal commands add:

| Field | Meaning |
| --- | --- |
| `commandFamily` | `rg/find`, `sed/read`, `test`, `build`, `lint`, `git`, `mkdir`, `patch`, `long-running`, or `other`. |
| `commandShape` | `single-purpose`, `parallel-read`, `chained`, `interactive`, or `background`. |
| `sessionClosed` | Whether a long-running session was closed before final response. |
| `sandboxEscalated` | Whether escalation was required or requested. |

## Metrics

Primary gate:

| Metric | Meaning | Baseline | Candidate pass |
| --- | --- | --- | --- |
| `pcvm.toolTerminal.baselineCoverage` | Required fact fields populated for the selected evidence window. | First mapped evidence window. | `100%` for required fields before optimization starts. |

Support metrics:

| Metric | Meaning | Direction |
| --- | --- | --- |
| `pcvm.tool.countBySurface` | Count by tool/terminal/browser/MCP surface. | Inform optimization focus. |
| `pcvm.terminal.commandCountByFamily` | Command distribution by family. | Identify repetitive read/search/verify clusters. |
| `pcvm.tool.readToWriteRatio` | Read/verify actions versus write/mutation actions. | High read ratio is acceptable during discovery; unexpected writes need review. |
| `pcvm.tool.parallelReadRatio` | Eligible read actions executed in parallel. | Higher is usually better if output remains clear. |
| `pcvm.terminal.workdirMismatchCount` | Commands run outside intended repo/workdir. | Must trend to zero. |
| `pcvm.tool.failureRate` | Failed tools/commands divided by total actions. | Lower is better, but failures caused by real blockers are not hidden. |
| `pcvm.tool.escalationCount` | Sandbox or permission escalation requests. | Track cost and risk, not automatically bad. |
| `pcvm.tool.externalCallCount` | Network/live AI/browser/external-provider actions. | Must match explicit authorization and route need. |
| `pcvm.terminal.sessionLeakCount` | Long-running command sessions left open at final response. | Must be zero. |

Diagnostic metrics:

| Metric | Meaning |
| --- | --- |
| `pcvm.terminal.chainedCommandCount` | Commands that combine unrelated operations and make output hard to review. |
| `pcvm.tool.duplicateReadCount` | Re-reading the same file/range without new need. |
| `pcvm.tool.outputNoiseIncidents` | Outputs too large or mixed to support quick review. |
| `pcvm.tool.evidenceMissingCount` | Actions whose result cannot be tied to a raw output/path. |

Quality constraints:

| Constraint | Rule |
| --- | --- |
| Evidence quality | Optimization cannot reduce raw evidence traceability. |
| Boundary safety | Workdir and target repo must remain explicit before writes or verification. |
| User authorization | External/live/GUI actions must remain within the route authorization. |
| Verification sufficiency | Fewer terminal commands cannot replace required tests or source reads. |

## Round Plan

### Package A: Telemetry Source Map

Owner: `PCVM`

Goal: identify the smallest raw evidence source that can support the baseline.

Allowed actions:

- Inspect PCVM artifacts and local evidence locations.
- Read terminal output available to this thread.
- If needed, search for local transcript/export paths without modifying them.

Forbidden actions:

- Product source edits.
- Live AI or AlembicTest.
- Broad workspace automation.

Output:

- Evidence source decision.
- Collection window boundary.
- Known blind spots.

Status: `done(scope=controlled-current-turn-ledger)`. Selected source is an agent-curated controlled action ledger because a stable local historical Codex transcript export was not found. Blind spots are complete historical telemetry, app terminal output, and private shell history.

### Package B: First Baseline Sample

Owner: `PCVM`

Goal: populate the baseline fact model for one selected evidence window.

Candidate windows:

- Current PCVM intake interaction.
- The completed LLM token-efficiency PCVM implementation session if transcript evidence is available.
- A future one-turn controlled PCVM task if historical evidence is not available.

Output:

- `records/data.md` baseline table.
- Coverage and support metric values.
- Any evidence gaps in `records/issues.md`.

Status: `sampled(scope=controlled-current-turn-ledger)`. AlembicTest recorded 15 actions: 9 terminal rows and 6 tool rows. This sample is valid only for the controlled evidence-intake task.

### Package C: Optimization Direction Decision

Owner: `PCVM`

Goal: choose optimization directions only from baseline facts.

Likely direction candidates, pending data:

- Reduce duplicate file reads by using targeted ranges and recording already-read artifacts.
- Increase safe parallel read usage for independent discovery commands.
- Reduce noisy terminal output by avoiding unrelated chained commands and large unbounded searches.
- Prefer deterministic local probes over live/external routes for source/unit questions.
- Improve final evidence packing so command count drops without losing proof.

Output:

- Ranked optimization directions.
- Before/after metrics for the next round.
- Stop conditions if metrics would weaken evidence quality.

Status: `selected(scope=controlled-current-turn-ledger)`.

Ranked directions from current evidence:

1. Path-placement safety: use absolute paths or path-prefixed patch targets for generated evidence/report writes, then verify expected path immediately. Target: `filePlacementMismatchCount 1 -> 0`, placement-caused `failureRate 0.0667 -> 0`.
2. Bounded inventory probes: replace broad artifact tree scans with narrowed globs or count-first summaries before expansion. Target: `outputNoiseIncidents 1 -> 0`.
3. Controlled action ledger as near-term canonical source: keep using explicit action ledgers for scoped PCVM/Test evidence tasks while historical transcript export is unavailable. Target: `baselineCoverage 1.0` preserved with explicit `timestampMode=order`.
4. Parallel read discipline: keep independent read batches, but ensure every batch has a bounded target list and compact evidence refs. Target: keep `parallelReadRatio >= 0.7` only when output remains reviewable.
5. Authorization boundary preservation: keep external/live/browser/runtime calls at `0` unless the current route explicitly authorizes them. Target: `externalCallCount 0`, `sessionLeakCount 0`, `workdirMismatchCount 0`.

## Current Verdict

`repair-implemented(scope=alembictest-controlled-baseline-helper); blocked(scope=historical-all-session-baseline)`

AlembicTest raw evidence is enough for a scoped baseline sample and a controlled-ledger repair, not for a historical all-session baseline. The implemented helper converts `order` into a concrete `timestamp`, recomputes diagnostics, and prevents generated output from landing outside AlembicTest.

Key sampled values:

- surface counts: terminal `9`, tool `6`
- read/write ratio: `2.0`
- parallel-read ratio: `0.7`
- failure rate: `0.0667`, from action `A11`
- workdir mismatch: `0`
- external calls: `0`
- session leaks: `0`
- diagnostics: output noise `1`, evidence missing `2`, file placement mismatch `1`

Next safe action: run the next controlled Tool/Terminal sample only when there is a real PCVM task to measure, using the ranked directions above as the before/after hypothesis. Do not rerun AlembicTest solely to manufacture a cleaner metric.

Repair verification:

- `node scripts/tool-terminal-baseline.mjs --help`
- `node scripts/tool-terminal-baseline.mjs --actions tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json --source-map tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json --check --json`
- `node scripts/tool-terminal-baseline.mjs --actions tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json --source-map tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json --run-id pcv-20260531-1506-tool-terminal-usage-baseline --sampling-window controlled-current-turn-evidence-intake --out-dir tmp/tool-terminal-baseline-smoke --report tmp/tool-terminal-baseline-smoke/report.md --json`
- `npm run check`
