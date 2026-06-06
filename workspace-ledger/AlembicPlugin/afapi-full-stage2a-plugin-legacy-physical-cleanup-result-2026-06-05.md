# AlembicPlugin AFAPI Full Stage2A Legacy Physical Cleanup Result

- taskId: `AFAPI-FULL-STAGE2A-PLUGIN-LEGACY-PHYSICAL-CLEANUP-P5`
- dispatchGroup: `AFAPI-FULL-STAGE2A-LEGACY-PHYSICAL-CLEANUP-20260605`
- currentWindow: `AlembicPlugin`
- status: `completed`
- completedAt: `2026-06-05`

## Scope Completed

- Removed `alembic_task` from the advertised Plugin MCP public surface and catalog.
- Kept `alembic_task` only as hidden direct-call compatibility for older initialized sessions, not `tools/list`, not policy-visible, and not the new lifecycle dependency.
- Updated Plugin policy, preflight, embedded executor, and execution context resolution so hidden compatibility is isolated from visible tools.
- Disabled legacy `alembic_guard` no-args whole-diff fallback. No-scope review now returns `GUARD_SCOPE_REQUIRED` / `missing-guard-scope`; explicit scoped files and inline code remain supported.
- Updated Plugin-owned skill guidance to make the six agent-facing public tools primary and route Guard through explicit `alembic_code_guard` scope.
- Updated focused tests and smoke/probe scripts to assert the new public surface and legacy-hidden behavior.

## Commits

- AlembicPlugin parent repo: `b890fb5` (`chore: remove legacy task from public surface`)
- Nested Plugin resource repo `plugins/alembic-codex`: `1b0c63e` (`chore: hide legacy lifecycle guidance`)

## Key Files

- `lib/codex/mcp/tools.ts`
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/preflight/Preflight.ts`
- `lib/codex/mcp/CodexMcpServer.ts`
- `lib/codex/mcp/host/embedded-executor.ts`
- `lib/codex/mcp/handlers/guard.ts`
- `lib/codex/mcp/handlers/tool-router.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `plugins/alembic-codex/skills/alembic/SKILL.md`
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md`

## Verification

- `npx vitest run test/unit/CodexToolPolicy.test.ts test/unit/KnowledgeAPI.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/CodexMcpServer.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/PluginOpportunisticEvolution.test.ts` -> pass, 8 files / 130 tests.
- `npx biome check --no-errors-on-unmatched ...touched files...` -> pass with pre-existing `test/unit/KnowledgeAPI.test.ts` implicit-any warnings on `svc` / `ctx`.
- `npm run lint` -> pass.
- `npm run build:check` -> pass; Core build used `../AlembicCore @ e3eda0450db9d27974c1ef1f945fb5a5f4793ea0`.
- `npm run build` -> pass; no tracked `dist` changes.
- `npm run lint:repo-boundary` -> pass.
- `git diff --check` -> pass.
- Embedded runtime path diff: `git -C plugins/alembic-codex diff --name-only -- runtime` -> no output.
- Repo status after commits: AlembicPlugin clean/ahead 1, nested `plugins/alembic-codex` clean/ahead 1, AlembicCore clean.

## Runtime Readback

- Report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-full-stage2a-legacy-physical-cleanup-readback.json`
- Mode: local-dist stdio through `dist/bin/codex-mcp.js`.
- Before init: 17 tools, all six agent-facing public tools visible, `alembic_task=false`, `alembic_guard=false`.
- After init: 18 tools, all six agent-facing public tools visible, `alembic_task=false`, `alembic_guard=false`.
- Calls:
  - `alembic_intent`: ready.
  - `alembic_prime`: degraded with `resident-unavailable`, accepted as structured/callable in empty local-dist runtime.
  - `alembic_work_start`: ready.
  - `alembic_work_finish`: ready.
  - `alembic_code_guard` without scope: blocked with `missing-guard-scope`.
  - `alembic_code_guard` inline scope: ready.
  - `alembic_decision_record`: blocked with `decision-register-unavailable`, accepted for empty local-dist runtime.

## Not Modified

- No `runtime.tgz` refresh.
- No embedded runtime directory changes.
- No `dist` commit.
- No Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or real-project changes.
- No control-workspace plan rewrite in this execution window.

## Risks

- Hidden direct `alembic_task` compatibility remains intentionally available for older initialized direct-call sessions. It is isolated from `tools/list` and visible policy, but final physical deletion still requires a later compatibility cutoff decision.
- Legacy `alembic_guard` still exists for explicit scoped compatibility/report operations. The risky no-args whole-diff behavior is blocked.
- Installed Codex plugin caches and packaged runtime were not refreshed in this Stage2A cleanup; later runtime/package waves must refresh and re-read installed cache behavior.

## Next Suggestions

- Continue with the planned runtime/local-dev/packaged wrapper verification wave to refresh installed/plugin cache evidence after this source cleanup.
- Decide later whether hidden `alembic_task` direct-call compatibility can be fully deleted once old Codex sessions no longer depend on it.
- Keep Guard guidance pinned to explicit task-scoped files or inline code; do not reintroduce whole-repo dirty fallback in Plugin.
