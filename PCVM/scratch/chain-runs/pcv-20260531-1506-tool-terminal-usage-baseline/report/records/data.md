# PCVM Data Records: Tool And Terminal Usage Baseline

Run ID: `pcv-20260531-1506-tool-terminal-usage-baseline`
Owner: `PCVM-Tool-Optimization`
Status: `repair-implemented(scope=alembictest-controlled-baseline-helper)`

## Responsibility Window

Window name: `PCVM-Tool-Optimization`

Scope:

- Tool, terminal, MCP, browser/GUI, and verification-command usage baseline.
- Evidence-source mapping for current and future PCVM tool-use samples.
- Metric contract and optimization direction selection for Tool-related work.

Not scope:

- LLM input/output token Package F/G/H source implementation.
- SourceRef optimization.
- Product source edits, live AI, AlembicTest, Dashboard, delivery, or external-provider routes unless later explicitly authorized.

Short-term write boundary:

- `PCVM/index.md`
- this run's `report/plan.md`
- this run's `report/records/*`

## Current Evidence

Evidence scope: `controlled-current-turn-ledger`

Facts:

- User requested a new PCVM requirement for current tool usage and terminal usage.
- The old LLM token-efficiency run remains separate and blocked on live AI approval.
- This intake step created a baseline fact model and metric contract only.
- AlembicTest produced raw evidence only, not a final PCVM verdict.
- Raw report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/docs/pcvm-tool-terminal-usage-baseline-2026-05-31.md`.
- Raw JSON:
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json`
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json`
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-metrics.json`
- No product source, live AI, Dashboard, delivery, external provider, or real test project mutation is included in this scoped sample.

## Baseline Fields

Required per observed action:

| Field | Required | Notes |
| --- | --- | --- |
| `timestamp` | yes | Local time or transcript order. |
| `surface` | yes | Tool, terminal, browser, MCP, or other. |
| `actionId` | yes | Stable ordinal inside the evidence source. |
| `purpose` | yes | Must tie to PCVM node/segment. |
| `workdir` | yes when applicable | Required for terminal and file-facing tools. |
| `targetRepo` | yes when applicable | Required for repo-scoped actions. |
| `readWriteClass` | yes | Read/write/verify/network/gui/git/unknown. |
| `writesFiles` | yes | True/false/unknown. |
| `externalCall` | yes | True/false/unknown. |
| `success` | yes | Exit status or tool success. |
| `evidenceRef` | yes | Transcript, output, path, report, or artifact ref. |

Field caveat:

- The raw action ledger uses `order`, not literal `timestamp`. Coverage is `1.0` only if `order` is accepted as the transcript-order timestamp surrogate. A strict check for a `timestamp` key fails all 15 rows; this is a metric refinement item, not a product verdict.

## Metric Contract

Primary:

| Metric | Current value | Evidence scope | Status |
| --- | ---: | --- | --- |
| `pcvm.toolTerminal.baselineCoverage` | `1.0` | controlled-current-turn ledger; `order` as timestamp surrogate | sampled |

Support:

| Metric | Current value | Evidence scope | Status |
| --- | ---: | --- | --- |
| `pcvm.tool.countBySurface` | terminal `9`, tool `6`, browser `0`, MCP `0`, other `0` | controlled-current-turn ledger | sampled |
| `pcvm.terminal.commandCountByFamily` | pwd/verify `1`, sed/read `4`, rg/find `5`, git `2`, mkdir `1`, date/verify `1`, node/verify `2`, wc/verify `2`, rsync `2` | controlled-current-turn ledger | sampled |
| `pcvm.tool.readToWriteRatio` | `2.0` (`10` read/verify, `5` write/mutation) | controlled-current-turn ledger | sampled |
| `pcvm.tool.parallelReadRatio` | `0.7` (`7` parallel read rows / `10` eligible read rows) | controlled-current-turn ledger | sampled |
| `pcvm.terminal.workdirMismatchCount` | `0` | controlled-current-turn ledger | sampled |
| `pcvm.tool.failureRate` | `0.0667` (`1` failed / `15` actions) | controlled-current-turn ledger | sampled |
| `pcvm.tool.escalationCount` | `0` | controlled-current-turn ledger | sampled |
| `pcvm.tool.externalCallCount` | `0` | controlled-current-turn ledger | sampled |
| `pcvm.terminal.sessionLeakCount` | `0` | controlled-current-turn ledger | sampled |

Diagnostic:

| Metric | Current value | Evidence scope | Status |
| --- | ---: | --- | --- |
| `pcvm.terminal.chainedCommandCount` | `0` | controlled-current-turn ledger | sampled |
| `pcvm.tool.duplicateReadCount` | `0` | controlled-current-turn ledger | sampled |
| `pcvm.tool.outputNoiseIncidents` | `1` | controlled-current-turn ledger | issue |
| `pcvm.tool.evidenceMissingCount` | `2` | controlled-current-turn ledger | issue |
| `pcvm.tool.filePlacementMismatchCount` | `1` | controlled-current-turn ledger | issue |

## Raw Evidence Review

Source map decision:

- Selected source: agent-curated controlled current-turn action ledger.
- Reason: complete historical Codex tool-call transcript/export path was not locally available.
- Scope limit: not a historical all-session baseline and not valid for cold-start/live AI/frontend/product repair sessions.

Action ledger consistency checks:

| Check | Result |
| --- | --- |
| Total actions | `15` |
| Required fields if `order` counts as timestamp surrogate | `0` missing |
| Strict literal `timestamp` key | missing in all `15` rows |
| Failed actions | `A11` |
| File-placement mismatch row | `A10` |
| Rows writing files | `A08`, `A10`, `A13`, `A14` |
| Parent workspace misplaced report file | absent after correction |
| Parent workspace misplaced tmp files | no files remain; empty tmp directory remains |

PCVM review:

- The sample exposed one real tool/file-boundary issue: `apply_patch` wrote relative paths under `/Users/gaoxuefeng/Documents/AlembicWorkspace` instead of AlembicTest, despite terminal commands using AlembicTest `workdir`.
- The failed verification `A11` is useful evidence, not a hidden failure; it caught the placement issue before final report.
- The baseline supports metric refinement and future controlled collection; it does not support broad conclusions about all Codex usage history.

## Metric Refinement

Accepted for this run:

- `pcvm.toolTerminal.baselineCoverage` is valid only with an explicit evidence scope. For this sample, `order` counts as the transcript-order timestamp surrogate.
- `pcvm.tool.filePlacementMismatchCount` is a diagnostic metric because file write tools may use a different base directory than terminal `workdir`.
- `pcvm.tool.evidenceMissingCount=2` means source-map blind spots: no historical Codex transcript export path and no attached app terminal. It does not mean the 15 sampled action rows lack `evidenceRef`.
- `pcvm.tool.outputNoiseIncidents=1` counts reviewability loss from a broad, truncated inventory output.

Not accepted:

- Using this controlled sample as an all-history baseline.
- Optimizing by lowering action count without preserving evidence traceability, placement verification, and boundary safety.

## Optimization Direction Baseline

| Rank | Direction | Current evidence | Next target |
| ---: | --- | --- | --- |
| 1 | Path-placement safety for generated evidence/report writes | `filePlacementMismatchCount=1`; action `A10` misplaced files and action `A11` failed verification | `filePlacementMismatchCount=0`; placement-caused failures `0` |
| 2 | Bounded inventory probes | `outputNoiseIncidents=1` from broad artifact inventory | `outputNoiseIncidents=0` |
| 3 | Controlled action ledger as near-term canonical source | historical transcript unavailable; scoped ledger coverage `1.0` | preserve coverage with explicit timestamp mode |
| 4 | Parallel read discipline | `parallelReadRatio=0.7`; output quality still matters | keep or improve only when output remains bounded |
| 5 | Authorization boundary preservation | external/live/browser/runtime calls `0`; session leaks `0`; workdir mismatch `0` | preserve zeros unless explicitly authorized |

## Implemented Project Fix

Owner repo: AlembicTest.

Changed files:

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/tool-terminal-baseline.mjs`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/package.json`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/README.md`

Fix behavior:

- Normalizes action ledger rows so `order` becomes a concrete `timestamp` (`order:1`, `order:2`, etc.) and records `timestampMode`.
- Recomputes metrics from the action ledger instead of relying on hand-written tables.
- Constrains generated `out-dir` and `report` paths to AlembicTest, preventing parent-workspace placement mistakes for generated evidence.
- Separates source-map blind spots from per-action missing evidence.
- Counts placement mismatch and output noise on the root-cause action, avoiding inflated diagnostic counts from follow-up locate/cleanup/session-poll rows.

Repair verification:

| Command | Result |
| --- | --- |
| `node scripts/tool-terminal-baseline.mjs --help` | Passed; help includes controlled ledger options. |
| `node scripts/tool-terminal-baseline.mjs --actions tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json --source-map tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json --check --json` | Passed; coverage `1`, timestampModes `{ "order": 15 }`, filePlacementMismatchCount `1`, outputNoiseIncidents `1`, actionEvidenceMissingCount `0`. |
| `node scripts/tool-terminal-baseline.mjs --actions tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json --source-map tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json --run-id pcv-20260531-1506-tool-terminal-usage-baseline --sampling-window controlled-current-turn-evidence-intake --out-dir tmp/tool-terminal-baseline-smoke --report tmp/tool-terminal-baseline-smoke/report.md --json` | Passed; generated normalized JSON/report under `AlembicTest/tmp/tool-terminal-baseline-smoke/`. |
| `find /Users/gaoxuefeng/Documents/AlembicWorkspace/tmp/tool-terminal-baseline-smoke -maxdepth 2 -type f` | No parent workspace files; command returned no such path. |
| `npm run check` | Passed; package help check now includes `tool-terminal-baseline.mjs --help`. |

## Initial PCVM Reading

- The primary gate for this requirement is not "use fewer tools" or "use fewer terminal commands"; it is first "can PCVM account for tool and terminal use with complete baseline fields."
- Controlled-ledger repair is implemented in AlembicTest; historical/all-session optimization remains blocked on a real telemetry source.
- A low command count is not automatically good; it fails if workdir safety, source evidence, or verification quality weakens.
