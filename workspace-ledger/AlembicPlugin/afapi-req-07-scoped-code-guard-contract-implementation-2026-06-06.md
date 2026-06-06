# AFAPI REQ-07 Scoped Code Guard Contract Implementation

Date: 2026-06-06
Window: AlembicPlugin
Task: AFAPI-REQ-07-SCOPED-CODE-GUARD-CONTRACT-IMPLEMENTATION-T2
Dispatch group: AFAPI-REQ-07-SCOPED-CODE-GUARD-CONTRACT-GROUP
State root: codex-control-workspace/.workspace-active/workspace/current/afapi-req-07-scoped-code-guard

## Scope

Implemented only AlembicPlugin scoped code guard contract work. This pass did not claim total-control acceptance, did not create a target-window next hop, did not modify Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest, and did not change Codex host process lifecycle.

AlembicPlugin responsibility confirmed: Codex MCP, Skill, channel / marketplace, plugin runtime, install validation, and Codex host adaptation.

## Result

- `alembic_code_guard` now supports three public scoped inputs: explicit `files`, inline `code`, and current-session `workRef` derived scoped files.
- `alembic_work_finish` now merges `changedFiles` back into the local work record, so a later `alembic_code_guard({ workRef })` uses the same scoped files instead of falling back to repository dirty state.
- Invalid `workRef` with no explicit files/code returns a structured `missing-work-ref` blocker.
- Active `workRef` with no scoped files returns a structured `no-code-scope` skip.
- No-scope calls still return `missing-guard-scope` and never scan whole diff.
- `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe` remain intentionally omitted from the public `CodeGuardInput` schema. The handler reports unsupported field names in no-scope direct-call cases instead of treating them as scope.
- Public description now states Code Guard is not lint, security audit, general review, no-args whole-diff review, or a public `diffRef` / `primeRef` / `acceptedGuards` / `applicableRecipe` scope consumer.
- Root injectable skills, active Codex skill, embedded runtime skills, compiled runtime dist, and `runtime.tgz` were refreshed.

## Code Evidence

- AlembicPlugin commit: `7bb10507196479883f877d7f008ae59e818d1d4b`
- Embedded runtime commit: `522033eb0b2eb623b719dae92f0204bd41cf31a1`
- Runtime tarball hash from post-commit reload marker: `e8c074f85ce14fd4fe27483b7c0f434392caec69834645b1c8e84ee72b7bff5d`
- Post-commit reload report: `AlembicPlugin/scratch/afapi-req-07-contract-dev-reload-postcommit-report.json`
- Post-commit MCP probe report: `AlembicPlugin/scratch/afapi-req-07-contract-dev-reload-postcommit-probe-report.json`
- Installed cache marker in the post-commit probe points to `gitHead=7bb10507196479883f877d7f008ae59e818d1d4b`.

## Changed Files

- `lib/codex/mcp/handlers/agent-public-tools.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `lib/codex/mcp/public-tools/descriptions.ts`
- `injectable-skills/alembic-guard/SKILL.md`
- `injectable-skills/alembic-recipes/SKILL.md`
- `test/unit/AgentPublicToolsActive.test.ts`
- `test/unit/AgentPublicSkillLegacyCleanup.test.ts`
- `plugins/alembic-codex` submodule pointer
- Embedded runtime changed files inside `plugins/alembic-codex`: `runtime.tgz`, runtime dist JS, runtime injectable skills, runtime packaged skill copy, and `skills/alembic-guard/SKILL.md`.

## Verification

- `npm run dev:codex-plugin:reload -- --report-path scratch/afapi-req-07-contract-dev-reload-report.json --probe-report-path scratch/afapi-req-07-contract-dev-reload-probe-report.json --mcp-timeout-ms 45000` -> passed before commit; fresh MCP probe ok.
- `npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts` -> passed, 2 files / 21 tests.
- `npm run test:unit -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts` -> passed, 6 files / 82 tests.
- `npm run build:check` -> passed; Core build used `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`.
- `npm run lint:repo-boundary` -> passed.
- `npm run lint -- --diagnostic-level=error` -> passed.
- `npm run verify:codex-plugin` -> passed.
- `npm run verify:codex-channel` -> passed.
- `npm run smoke:codex-plugin` -> passed; install / stdio / npxRuntime all passed.
- `rg -n '## MCP Tool: \`alembic_guard\`|MCP \`alembic_guard\`|\`alembic_guard\` with code|\`alembic_guard\` with file paths' injectable-skills plugins/alembic-codex/runtime/injectable-skills plugins/alembic-codex/skills` -> no matches.
- `npm run dev:codex-plugin:reload -- --report-path scratch/afapi-req-07-contract-dev-reload-postcommit-report.json --probe-report-path scratch/afapi-req-07-contract-dev-reload-postcommit-probe-report.json --mcp-timeout-ms 45000` -> passed after commit; installed cache marker points to final parent commit.
- `git diff --check` -> passed.
- `git -C plugins/alembic-codex diff --check` -> passed.
- `git status --short` -> clean.
- `git -C plugins/alembic-codex status --short` -> clean.

## Risks

- `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe` are still not public input fields. This is intentional for T2: adding them would require real resolvers, schema, handler paths, tests, and runtime/golden evidence.
- `workRef` scope is session-local by design. A stale or cross-process `workRef` returns `missing-work-ref` rather than reading persisted history or repository dirty state.
- Current post-commit reload uses local-dev direct dist mode for installed cache readback. Packaged wrapper mode remains covered by `verify:codex-plugin`, `verify:codex-channel`, `smoke:codex-plugin`, and refreshed `runtime.tgz`.

## Next Suggestions

1. Total control can review T2 evidence and decide whether AFAPI-REQ-07 needs a separate runtime/golden acceptance stage for real host tool calls.
2. If full Design fields become required, create a new schema/resolver task specifically for `diffRef`, `primeRef`, `acceptedGuards`, and `applicableRecipe`.
3. Keep `alembic_guard` as hidden/legacy compatibility only; do not restore no-args whole-diff behavior.
