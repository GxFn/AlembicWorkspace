# P13 BiliDili HostAgent Bootstrap Realtest Controller Review

Date: 2026-06-28
State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
Dispatch group: `p13-bilidili-hostagent-bootstrap-realtest-p1`
Target result: `target-results/tr-p13-bilidili-hostagent-bootstrap-realtest-t1.json`

## Decision

Accept the Test backfill for P13 HostAgent bootstrap realtest.

The real BiliDili bootstrap route proved the P13 HostAgent surface split without relaxing frozen public values or touching the source project storage. This closes the P13 realtest gate and allows the controller to move to P14.

## Raw Evidence Reviewed

- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/r2-preflight.json`
  - `response.tool` remains `alembic_bootstrap`.
  - Host-agent cleanup route uses `input.dataRoot`, not `input.projectRoot`.
  - Cleanup root is `/Users/gaoxuefeng/.asd/workspaces/02a25032`; source root is `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/bootstrap-raw-mcp-result.json`
  - Structured MCP clean output has `ok=true`, `status=ready`, `toolName=alembic_bootstrap`, `meta.toolName=alembic_bootstrap`.
  - Clean output includes parseable `executionPlan`, `hostAgentContract`, `gates`, `planGate`, and current guidance fields.
- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/p13-hostagent-bootstrap-structured-analysis.json`
  - `ok=true`.
  - Full briefing ref exists at data root and contains `hostAgentAnalysis`.
  - Old `ideAgentAnalysis` alias is still present and content-equivalent to `hostAgentAnalysis`.
  - `meta.hostAgentAnalysis` and `meta.ideAgentAnalysis` are also content-equivalent.
  - Compatibility probe can still read packet summary, progress, and retrieval through the old alias.
  - `buildIDEAgentAnalysisPacketFromProjectContext` runtime error needle is absent.
  - Provider route is DeepSeek generation plus local Qwen embedding route.
  - BiliDili, Alembic, AlembicPlugin, and AlembicCore HEADs are recorded; BiliDili source git stayed clean.
  - SQLite integrity before/after is `ok`.
- Full briefing file under `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/tmp/bootstrap-briefing-02a250323c6c6ade.json`
  - Top-level `hostAgentAnalysis` and `ideAgentAnalysis` are both present and equal.
  - HostAgent packet has one architecture unit, `nextUnits`, `packetSummary`, `progress`, and retrieval refs.
  - `executionPlan`, `hostAgentContract`, and `gates` are present.
- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/before-hostagent-bootstrap.json`
  - Source project `.asd` absent before run.
  - Data-root DB exists and `integrity_check=ok`.
  - BiliDili git status is clean.
  - No active bootstrap sessions before run.
- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/after-hostagent-bootstrap.json`
  - Source project `.asd` remains absent after run.
  - Data-root DB still exists and `integrity_check=ok`.
  - BiliDili git status remains clean.
  - One active bootstrap session exists for BiliDili, with project context `fileCount=163`, `modules=6`, `primaryLang=swift`.
- `Test/tmp/p13-bilidili-hostagent-bootstrap-realtest-t1/recent-log-tails.json`
  - Recent combined log shows fullReset in trash-bin mode under the data root, DB snapshot, DB reset, and HostAgent bootstrap briefing ready.
  - `error.log` and `audit.log` tails are empty.

## Controller Findings

- P13 HostAgent bootstrap real route passes: HostAgent-facing full briefing is produced and parseable.
- Old IDEAgent alias compatibility is intentionally preserved and byte/content equivalent, so existing consumers are not broken.
- Frozen public tool value `alembic_bootstrap` remains unchanged.
- R-2 root safety holds for this run: reset operated on the BiliDili data root, while the source project root remained clean and without `.asd`.
- SQLite corruption blocker is not present in this run: integrity was `ok` before and after.
- The bootstrap session left in the data root is expected post-run state for a ready bootstrap session, not acceptance blocker.

## Risks / Notes

- The target reported that an original helper summary had false structured checks. Controller accepted only after reviewing the raw MCP result, structured analysis JSON, full briefing, before/after snapshots, and log tails.
- HostAgent packet compatibility strings such as `ide_packet_*` and `ide-agent-analysis-unit-progress` remain. These are treated as preserved compatibility/frozen surface, not a P13 blocker.
- ProjectContext materialization carried degraded warning details in the packet summary. The HostAgent surface, aliases, contracts, root safety, provider route, and SQLite health still passed the P13 acceptance predicate.
