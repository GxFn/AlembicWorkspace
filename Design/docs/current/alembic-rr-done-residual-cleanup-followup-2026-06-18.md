# Alembic RR-DONE residual cleanup — follow-up intake 2026-06-18

Seed for a SEPARATE future cleanup demand. Found by the controller RR-DONE
four-repo grep at the close of `alembic-four-tool-plugin-cleanup-sequencing-2026-06-18`
(GMAP/MTC/RIC/DRR-CCR). That demand's OWN deliverables are complete + verified
(MTC-8 dual-shell real-run: 28→19 tools, 0 retired MTC names live). The items below
are PRIOR-DEMAND / PRE-EXISTING / SEPARATE-SURFACE residuals — each needs its own
decision, so they were intentionally NOT folded into that demand's completion
(user decision 2026-06-18).

## 1. RIC-era `alembic_project_matrix` live references (needs an API-mapping decision)
project_matrix was retired in favor of alembic_recipe_map, but its operation-based
API does NOT map 1:1 to recipe_map (different interface) — so this is a
structure-skill retirement/rewrite, not a rename. Live refs:
- AlembicPlugin `lib/runtime/mcp/handlers/agent-public-tools.ts:2054`
  `recommendedTools: ['alembic_project_matrix', 'alembic_graph']` — RECOMMENDS a
  retired tool (real agent-facing bug; decide recipe_map vs graph).
- AlembicPlugin `lib/service/project-knowledge-context/contracts/KnowledgeContextStatus.ts:6`.
- AlembicCore `src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:417`
  (`structureTools: ['ProjectContext.execute', 'alembic_project_matrix']`).
- Shell submodules `plugins/*/skills/alembic-structure/SKILL.md` (~14 refs).
KEEP (intentional, NOT residual): McpServer.ts `RETIRED_PUBLIC_TOOL_REPLACEMENTS`
project_matrix→recipe_map migration-guidance entry.

## 2. Alembic daemon's own TOOL_SCHEMAS — SCOPE INVESTIGATION needed
`Alembic/lib/shared/schemas/mcp-tools.ts` `TOOL_SCHEMAS` still keys the retired
pre-four-tool names `alembic_health` / `alembic_knowledge` / `alembic_structure`
(alongside kept search/graph). This is the daemon's HTTP tool-validation surface —
SEPARATE from the AlembicPlugin MCP `tools.ts` surface that MTC merged. DECIDE:
is the Alembic daemon MCP/HTTP tool surface live + in the four-tool scope (then it
is a missed half needing the same GMAP/MTC treatment), or a separate/legacy surface
(out of scope)? (Also Alembic `ZodSchemas.test` asserts alembic_health.)

## 3. W2-era agent-public eval debt — BEHAVIORAL rewrite (pre-existing-broken since W2)
- AlembicPlugin `scripts/probe-agent-public-tools-evaluation.mjs` (~24 refs) +
  `AgentPublicToolsEvaluation.test` — evaluate the retired six-tool AFAPI surface
  (W2-deleted alembic_intent/alembic_decision_record + work_start/finish). Need a
  behavioral rewrite to the current 3-tool surface (prime/work/code_guard).
- 3 pre-existing `HostMcpServer.test` behavioral failures (output-contract /
  input-schema evolution).

## 4. Minor stale strings
- AlembicPlugin `lib/shared/schemas/mcp-tools.ts:885/895/899` legacy record_decision
  descriptions referencing the deleted alembic_decision_record.
- AlembicCore `test/CoreCodexBoundary.test.ts` / `CoreDeliveryBoundary.test.ts`
  denylist strings still naming `CodexMcpServer.ts` / `CodexRuntimeContext.ts`
  (Plugin renamed them to HostMcpServer — update the boundary-test denylist).

## Intentional keeps (record so a future RR-DONE does NOT re-flag)
bin command `alembic-codex-mcp`, `CODEX_RUNTIME_BIN`, `CODEX_PLUGIN_HOST`, `#codex`
import alias, `plugins/alembic-codex` dir — codex distribution identity (user
decision). rawRef measurement-file paths + migration comments — provenance.
