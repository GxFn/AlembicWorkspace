# AFAPI Full Stage1D Plugin Cross-Host Readiness Result

## Task

- Window: AlembicPlugin
- Task id: AFAPI-FULL-STAGE1D-PLUGIN-CROSS-HOST-READINESS-P4
- Dispatch group: AFAPI-FULL-STAGE1D-CROSS-HOST-READINESS-20260605
- Control plan: codex-control-workspace/.workspace-active/workspace/current/plugin-agent-facing-public-api-redesign-workspace-plan-2026-06-05.md

## Scope Completed

- Added a Plugin-owned cross-host readiness snapshot helper for the six agent-facing public tools.
- Locked Codex, Claude Code, and generic host prompt snapshots to the same schema signature.
- Proved `agentHost`, MCP input schemas, public result envelope, refs/detailRefs, and skip/degraded/blocked/failed reason shape do not fork by host.
- Added wrong-host negative coverage so unsupported host labels do not create a hidden schema branch.
- Added legacy negative coverage so cross-host prompt snapshots and active public tool descriptions do not advertise old task operation wording as the primary guide.

## Product Commit

- Repository: AlembicPlugin
- Commit: `d891e76d4866426c8b574c7fd63f70dcbec3dbd8`
- Commit message: `feat: add cross-host public tool readiness`

Changed product files:

- `lib/codex/mcp/public-tools/cross-host-readiness.ts`
- `lib/codex/mcp/public-tools/index.ts`
- `test/unit/AgentPublicToolsCrossHostReadiness.test.ts`

## Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts`
  - Passed: 4 test files, 16 tests.
- `npx biome check lib/codex/mcp/public-tools/cross-host-readiness.ts lib/codex/mcp/public-tools/index.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts`
  - Passed: checked 3 files, no fixes applied.
- `npm run lint:repo-boundary`
  - Passed: repository boundary check passed, escape-hatch count 0.
- `npm run build:check`
  - Passed.
- `npm run build`
  - Passed.
- `git diff --check`
  - Passed before commit.
- `git diff --check HEAD^ HEAD`
  - Passed after commit.
- Local dist readback:
  - Report: `AlembicPlugin/scratch/afapi-stage1d-cross-host-readiness-readback.json`.
  - Result: `ok=true`.
  - Source: `dist/lib/codex/mcp/public-tools/cross-host-readiness.js`.
  - Schema signature: `contract:v1;hosts:codex|claude-code|generic-host-agent;tools:alembic_intent|alembic_prime|alembic_work_start|alembic_work_finish|alembic_code_guard|alembic_decision_record;statuses:ready|skipped|degraded|blocked|failed`.
  - Host schema checks accepted `codex`, `claude-code`, and `generic-host-agent` for all six public tools.
  - Wrong host `internal-ai` was rejected.
  - Prompt snapshot forbidden legacy hits: none.

## Boundary Check

- AlembicPlugin status after commit: clean tracked worktree, branch ahead of `origin/main` by 2 local commits.
- Embedded runtime repository `AlembicPlugin/plugins/alembic-codex`: clean status.
- Embedded runtime diff check: `git diff --check` passed.
- Ignored local artifacts only: `dist/` and `scratch/`.
- No Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or real project changes were made.
- No legacy `alembic_task` / `alembic_guard` physical cleanup was performed.
- No full multi-project runtime, packaged wrapper, runtime bundle, marketplace, or installed-cache refresh was performed.

## Risks And Follow-Up

- This stage proves cross-host schema/envelope readiness through Plugin contract helpers, golden tests, and local dist readback. It does not prove a real Claude Code host session or external host runtime because those hosts were outside the current task boundary.
- The cross-host guide is intentionally a readiness snapshot, not a final user-facing product decision; if later product guidance needs to change visible host behavior, total control should route that as a user-confirmed design decision.
- Suggested next step: controller can review this commit and report, then decide whether to proceed to legacy physical cleanup (`AFAPI-FULL-09/10`) or defer that in favor of full runtime work.
