# AFAPI REQ-07 Scoped Code Guard Code Fact

Date: 2026-06-06
Window: AlembicPlugin
Task: AFAPI-REQ-07-SCOPED-CODE-GUARD-CODE-FACT-T1
Dispatch group: AFAPI-REQ-07-SCOPED-CODE-GUARD-GROUP
State root: codex-control-workspace/.workspace-active/workspace/current/afapi-req-07-scoped-code-guard

## Scope

Stage 0 code fact review only. This pass did not implement product changes, did not refresh runtime artifacts, did not change channel or marketplace state, and did not claim controller acceptance.

AlembicPlugin responsibility confirmed: Codex MCP, Skill, channel / marketplace, plugin runtime, install validation, and Codex host adaptation. No Alembic / Core / Dashboard / Test responsibility was claimed.

## Result

Current code supports the P0 scoped Code Guard behavior:

- Public `alembic_code_guard` is active and routed through `McpServer.agent-public-tools`.
- Public `CodeGuardInput` exposes `intentRef`, `workRef`, `files`, `code`, `filePath`, `language`, and `operation`.
- Public `alembic_code_guard` blocks no-scope calls with `missing-guard-scope` instead of falling back to whole-diff review.
- Public `alembic_code_guard` calls the underlying Guard handler only with explicit inline code or explicit file scope, and returns `guardResultRef` plus `detailRefs`.
- `alembic_work_finish` only returns scoped `guardRecommendation` metadata; it does not run Guard.
- `TaskLifecyclePolicy.decideGuardTrigger` produces structured skip reasons for `no-code-diff`, `docs-only-diff`, `unrelated-dirty-diff`, and `no-task-anchor`.
- Legacy `alembic_guard` remains available as a compatibility/report tool, but no-scope review is blocked and explicit file/code scope is required for checks.
- Legacy `alembic_task` no longer has a `guard` operation in `TaskInput`; it is hidden from active `tools/list` and retained only as direct-call compatibility for old task lifecycle operations.

## Code Evidence

- `lib/shared/schemas/mcp-tools.ts:226` defines `CodeGuardInput` with explicit files/code scope and no whole-diff fallback wording.
- `lib/shared/schemas/mcp-tools.ts:403` defines legacy `GuardInput` with no-scope `missing-guard-scope` wording.
- `lib/shared/schemas/mcp-tools.ts:618` defines `TaskInput` operations as `prime/create/close/fail/record_decision`; no `guard` operation remains.
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts:438` maps `alembic_code_guard` to `McpServer.agent-public-tools`.
- `lib/codex/mcp/McpServer.ts:580` resolves `alembic_code_guard` to `agentPublicToolHandlers.codeGuardHandler`.
- `lib/codex/mcp/handlers/agent-public-tools.ts:734` implements `codeGuardHandler`.
- `lib/codex/mcp/handlers/agent-public-tools.ts:742` returns `missing-guard-scope` for no files / no code.
- `lib/codex/mcp/handlers/agent-public-tools.ts:783` routes explicit inline code to `guardCheck` and explicit files to `guardReview`.
- `lib/codex/mcp/handlers/agent-public-tools.ts:790` creates `guardResultRef`.
- `lib/codex/mcp/handlers/agent-public-tools.ts:619` implements `workFinishHandler`; `:716` returns `guardRecommendation` and does not execute Guard.
- `lib/service/task/TaskLifecyclePolicy.ts:159` implements `decideGuardTrigger`; `:171`, `:181`, `:192`, and `:203` cover no-code, docs-only, unrelated, and scoped-code cases.
- `lib/codex/mcp/handlers/guard.ts:330` blocks legacy `alembic_guard` no-scope review.
- `lib/codex/mcp/tools.ts:176` publishes public `alembic_code_guard` with public description text; `:271` publishes legacy `alembic_guard` as compatibility/report route with no-params blocked.
- `lib/codex/mcp/public-tools/descriptions.ts:56` states Code Guard non-goal: no unbounded repo scope and no no-args whole-diff review.

## Test Evidence

- `test/unit/AgentPublicToolsActive.test.ts:867` covers public `alembic_code_guard` no-scope blocker.
- `test/unit/AgentPublicToolsActive.test.ts:887` covers explicit inline code scope and `guardResultRef`.
- `test/unit/AgentPublicToolsActive.test.ts:802` covers `work_finish` scoped Guard recommendation.
- `test/unit/AgentPublicToolsEvaluation.test.ts:479` covers blocked public Code Guard without scope.
- `test/unit/AgentPublicToolsEvaluation.test.ts:644` covers the Stage 4A noisy-guard golden case.
- `test/unit/TaskLifecyclePolicy.test.ts:106` covers no-code, docs-only, unrelated dirty diff, and task-scoped code diff decisions.
- `test/unit/CodexMcpServer.test.ts:1855` covers legacy `alembic_guard` no-scope blocked and explicit file scope allowed.
- `test/unit/AgentPublicSkillLegacyCleanup.test.ts:45` confirms active tool descriptions remove `alembic_task` and mark legacy guard no params as blocked.

## Current Gaps And Risks

- `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe` are not public `CodeGuardInput` fields today. Current implementation is P0 scoped behavior via files / inline code / workRef. If total control wants the full field contract, it should be a Stage 1 schema + handler + tests task.
- `injectable-skills/alembic-guard/SKILL.md` and `plugins/alembic-codex/runtime/injectable-skills/alembic-guard/SKILL.md` still describe the old `alembic_guard` skill route. `scripts/prepare-codex-plugin-runtime.mjs` copies `injectable-skills` into the embedded runtime, and `scripts/verify-codex-plugin.mjs` requires that runtime file to exist. This is not the active `plugins/alembic-codex/skills/alembic-guard/SKILL.md` guidance, but it is a packaged residual and should be cleaned in a later implementation task.
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md` and packaged `runtime/plugins/alembic-codex/skills/alembic-guard/SKILL.md` already use `alembic_code_guard` with explicit scope.
- Public handler tests cover no-scope and inline code directly; explicit file scope is covered through legacy server test and handler route reading. A later golden/runtime task should add direct public `alembic_code_guard({ files })` packaged evidence if total control requires runtime acceptance.

## Commands

- `git status --short` -> clean.
- `git -C plugins/alembic-codex status --short` -> clean.
- `npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts` -> passed, 6 files / 78 tests.
- `npm run build:check` -> passed; Core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `npm run lint:repo-boundary` -> passed.
- `npm run lint -- --diagnostic-level=error` -> passed.
- `npm run verify:codex-plugin` -> passed.
- `git diff --check` -> passed.
- `git -C plugins/alembic-codex diff --check` -> passed.

## Modified Scope

No product source files were modified. No embedded runtime artifact was changed. Current product commits remain:

- AlembicPlugin: `3947701274cb6f23902a04e1cc3271878d4f142e`
- `plugins/alembic-codex`: `1635e6a0afac8355f15af673254f0f6373564ab2`

This dossier is the only new written evidence for this task.

## Next Suggestions

1. Accept Stage 0 as a code fact result if total control agrees the P0 scoped Guard behavior is sufficient for this stage.
2. Create a narrow Stage 1 cleanup task to update the packaged `injectable-skills/alembic-guard` residual wording and refresh runtime artifacts if that surface is considered user-facing.
3. If the full Design fields are required, create a separate schema contract task for `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe` rather than mixing it into residual skill cleanup.
4. Follow with runtime/golden acceptance for public `alembic_code_guard` no-scope blocker and explicit `files` / `code` scope after any Stage 1 implementation.
