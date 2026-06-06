# AFAPI Stage 0 - AlembicPlugin Public API Inventory

- Task: `AFAPI-STAGE0-PLUGIN-P0`
- Dispatch group: `AFAPI-STAGE0-INVENTORY-20260605`
- Window: `AlembicPlugin`
- Target repo: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Control plan: `codex-control-workspace/.workspace-active/workspace/current/plugin-agent-facing-public-api-redesign-workspace-plan-2026-06-05.md`
- Scope: read-only inventory of Plugin agent-facing public API, active skill/tool descriptions, runtime package surface, local-dev verification surface, legacy `alembic_task` / `alembic_guard` surface and tests.
- Not done: no product source changes, no old tool or skill deletion, no runtime bundle refresh, no service startup, no real Codex smoke, no cross-repo responsibility.

## Gate And Boundary

I am the AlembicPlugin execution window. This task only covers AlembicPlugin-owned Codex MCP, Skill, channel / marketplace, plugin runtime, install verification, and Codex host adaptation surfaces. I did not claim or inspect implementation responsibility for Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or any real project.

## Documents Read

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/index.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/.workspace-active/workspace/current/plugin-agent-facing-public-api-redesign-workspace-plan-2026-06-05.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/AGENTS.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDesign/docs/current/plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/codex-control-workspace/skills/dev/codex-automation-target/SKILL.md`

## Current Public Tool Surface

Primary source files:

- `lib/codex/mcp/tools.ts`
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `lib/codex/mcp/McpServer.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/ServiceRequestBoundary.ts`

Findings:

- `alembic_task` is still the public Codex lifecycle entry. Its public description exposes five operations: `prime`, `create`, `close`, `fail`, and `record_decision`.
- `alembic_task` is Plugin-owned in `McpServer` and `ServiceRequestBoundary`; local daemon readiness is explicitly prevented from taking over task semantics.
- `PluginToolSurfaceCatalog` classifies `alembic_task` as `plugin-embedded-core`, handler owner `McpServer.task`, schema `TaskInput`, gateway mapping for `create` / `close` / `fail` / `record_decision`, and resident route policy `resident-project-scope`. There is no gateway route for `prime`.
- `ToolPolicy` currently keeps `alembic_task` visible in initialized-empty projects and resident ProjectScope projects through `CODEX_TASK_LIFECYCLE_TOOL_NAMES` and `CODEX_RESIDENT_PROJECT_SCOPE_TOOL_NAMES`.
- `alembic_guard` remains the public Guard entry. It accepts `code`, `files`, coverage/compliance operations, and empty input. Empty input means whole-current-git-diff review.
- `PluginToolSurfaceCatalog` classifies `alembic_guard` as schema `GuardInput`, handler owner `McpServer.tool-router`, knowledge gate `knowledge-ready`, and gateway route only when explicit `files` are present.
- No current source tool names exist for the target public API set: `alembic_intent`, `alembic_prime`, `alembic_work_start`, `alembic_work_finish`, `alembic_code_guard`, `alembic_decision_record`.

## Legacy Handler Facts

Primary source files:

- `lib/codex/mcp/handlers/task.ts`
- `lib/codex/mcp/handlers/tool-router.ts`
- `lib/codex/mcp/handlers/guard.ts`
- `lib/codex/evolution/PluginOpportunisticEvolution.ts`
- `lib/codex/mcp/host/opportunistic-evolution-presenter.ts`

Findings:

- `taskHandler` routes all old lifecycle operations in one file. It prepares host intent, extracts intent, runs prime search, builds trust posture, creates in-memory task anchors, closes tasks, fails tasks, and records in-memory decisions.
- `operation=prime` prepares `HostIntentFrame`, runs `IntentExtractor.extract`, classifies lifecycle with `TaskLifecyclePolicy`, calls `PrimeSearchPipeline.search`, builds `CodexPrimeRuntimeContext`, and returns `primeKnowledgeMaterial`.
- Prime has useful output material: trusted-to-obey Guards, trusted-to-use Recipes, context-only knowledge, verification-required material, not-available/degraded material, visible host response instructions, next actions, and resident search/runtime metadata.
- `operation=create` creates an in-memory task id and binds it to the active intent session. It is a task anchor, not a durable work record.
- `operation=close` scans git diff through `GitDiffScanner`, merges explicit `changedFiles`, intersects with task/source refs through `TaskLifecyclePolicy.decideGuardTrigger`, and returns an explicit `alembic_guard` nextAction only when task-scoped code diff exists.
- `operation=fail` clears the active in-memory task/intent path.
- `operation=record_decision` records a decision only into the current in-memory intent state. It is not a durable Decision Register Recipe operation.
- `tool-router.routeGuardTool` routes `alembic_guard` coverage/compliance/code/file/no-arg inputs. Code goes to inline `guardCheck`; files or no args go to `guardReview`.
- `guardReview` with no args calls `_detectChangedFiles(projectRoot)`, using git diff/staged/untracked files. This is the public behavior the new `alembic_code_guard` should not keep as default.
- Opportunistic evolution is attached only to successful `alembic_task` `close`. It defers to resident ProjectScope when available, refuses to infer from skipped task-scoped Guard, filters git diff to task-scoped files when provided, and never auto-submits knowledge.

## Reusable Services For New API

These are Plugin-owned services worth extracting or reusing rather than deleting:

- `lib/codex/runtime/ProjectRuntimeContext.ts`: runtime identity, readiness, source-of-truth, fallback isolation, failure envelopes, and `buildCodexPrimeRuntimeContext`.
- `lib/service/task/HostIntentFrame.ts`: host-declared intent normalization, turn metadata redaction, recognized intent draft, resident intent handoff.
- `lib/service/task/IntentExtractor.ts`: deterministic query expansion, language/module/scenario inference, cross-language synonym expansion.
- `lib/service/task/PrimeSearchPipeline.ts`: multi-query search, resident semantic search handoff, quality filtering, Recipe/rule split, search metadata.
- `lib/service/task/TaskLifecyclePolicy.ts`: automation-envelope detection, task-anchor decision, task-scoped Guard decision, source file filtering.
- `lib/codex/evolution/PluginOpportunisticEvolution.ts`: Plugin-only fallback evidence surface and scoped no-auto-submit policy.
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts`: one catalog for annotations, ownership, schema, gateway policy, visibility, and resident routing.
- `lib/codex/mcp/handlers/guard.ts`: Guard engine/read/evaluate/report internals can be reused after the public input contract is narrowed.

## Active Skill And Runtime Surface

Primary files:

- `plugins/alembic-codex/skills/alembic/SKILL.md`
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md`
- `plugins/alembic-codex/skills/alembic-recipes/SKILL.md`
- `injectable-skills/alembic-guard/SKILL.md`
- `injectable-skills/alembic-recipes/SKILL.md`
- `plugins/alembic-codex/runtime/plugins/alembic-codex/skills/*`
- `plugins/alembic-codex/runtime/injectable-skills/*`
- `plugins/alembic-codex/runtime.tgz`

Findings:

- Active plugin skills still instruct Codex to call `alembic_task(operation="prime")` before semantic coding and `alembic_task(operation="close")` after edits.
- Guard skill still documents `alembic_guard`, including explicit files and no-args whole-diff usage.
- Recipes skill still lists `alembic_task(operation="prime")` as lookup order step 1.
- Injectable skills still reference `alembic_guard`.
- Runtime package copies preserve the same old skill and MCP surface under `plugins/alembic-codex/runtime/...`; source edits alone will not affect installed Codex behavior until the runtime artifact and generated runtime tree are refreshed.
- README and release playbook also mention `alembic_task(operation=prime)` and `alembic_guard`.

## Local Dev And Release Surface

Primary files:

- `package.json`
- `scripts/dev-reload-codex-plugin.mjs`
- `scripts/dev-watch-codex-plugin.mjs`
- `scripts/dev-verify-codex-plugin.mjs`
- `scripts/smoke-codex-plugin.mjs`
- `scripts/prepare-codex-plugin-runtime.mjs`
- `scripts/verify-codex-plugin.mjs`
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs`

Findings:

- Canonical local-dev reload is `npm run dev:codex-plugin:reload`; `dev:codex-plugin:refresh` is retained as compatibility alias.
- Reload prepares `runtime.tgz`, refreshes installed plugin caches, and probes fresh MCP startup. It does not guarantee the current Codex MCP transport has been restarted.
- Watch mode serializes canonical reloads and watches `runtime.tgz` / relevant files.
- Smoke test asserts initialized-empty workspace exposes `alembic_task` but not `alembic_health`. That must be updated when new lifecycle tools replace `alembic_task`.
- Release and verification scripts treat `plugins/alembic-codex/runtime.tgz` as the portable runtime artifact and the source of installed Codex behavior.
- Wrapper invokes `npx --offline --package ./runtime.tgz alembic-codex-mcp` from the installed plugin root.

## Existing Test Locks

Primary tests:

- `test/integration/ZodSchemas.test.ts`
- `test/unit/CodexToolPolicy.test.ts`
- `test/unit/CodexServiceRequestBoundary.test.ts`
- `test/unit/TaskLifecyclePolicy.test.ts`
- `test/unit/TaskPrimeKnowledgeMaterial.test.ts`
- `test/unit/PluginOpportunisticEvolution.test.ts`
- `test/unit/CodexRuntimeContext.test.ts`
- `test/unit/CodexMcpServer.test.ts`
- `test/unit/CodexDevReloadScript.test.ts`
- `scripts/smoke-codex-plugin.mjs`

Findings:

- `ZodSchemas.test.ts` explicitly accepts empty `GuardInput` and all `TaskInput` operations `prime/create/close/fail/record_decision`.
- `CodexToolPolicy.test.ts` explicitly expects `alembic_task` visibility in initialized-empty and ready states.
- `CodexServiceRequestBoundary.test.ts` locks `alembic_task` as Plugin-owned for all legacy operations.
- `TaskLifecyclePolicy.test.ts` verifies automation-envelope skip, host-declared intent recovery, no anchor for design/status turns, and scoped Guard trigger.
- `PluginOpportunisticEvolution.test.ts` locks opportunistic evolution to `alembic_task` close outcomes.
- `CodexMcpServer.test.ts` contains direct `alembic_task` prime/close and `alembic_guard` assertions.
- `scripts/smoke-codex-plugin.mjs` asserts installed MCP stdio behavior around `alembic_task` visibility after init.
- There are no tests yet for the proposed new tool names or a shared `AgentContract`/result-envelope schema.

## Deletion And Migration Candidates

Safe only after replacement tools and tests exist:

- Hide or remove public `alembic_task` from active agent-facing descriptions after `alembic_intent`, `alembic_prime`, `alembic_work_start`, `alembic_work_finish`, and `alembic_decision_record` cover the same user-facing lifecycle.
- Replace `operation=record_decision` with `alembic_decision_record` backed by a durable Decision Register Recipe path, including create/update/revoke/delete semantics.
- Replace `operation=create/close/fail` with explicit work lifecycle tools. `fail` can become an outcome/status on `alembic_work_finish` if the final contract chooses that shape.
- Replace `operation=prime` with `alembic_prime`; do not keep a thin wrapper around old `taskHandler`.
- Replace no-args `alembic_guard` public workflow with `alembic_code_guard` requiring explicit scope such as files, diff refs, work refs, prime refs, or accepted Guard refs. Keep old `alembic_guard` compatibility only behind an explicit legacy path if required by controller.
- Rewrite active skills and README text that tells host agents to call `alembic_task` or no-args `alembic_guard`.
- Refresh generated runtime tree and `runtime.tgz` after source and skill changes.

## Legacy Hooks To Preserve

These behaviors should survive under the new names:

- Plugin ownership of host-agent public semantics. Resident/Alembic service can enhance or produce data through explicit APIs, but should not own Codex-facing tool names.
- Host-declared intent intake and raw automation-envelope suppression.
- Visible prime trust receipt from `primeKnowledgeMaterial`, including which knowledge is trusted-to-obey, trusted-to-use, context-only, verification-required, or unavailable/degraded.
- Runtime identity and project-root failure envelopes.
- Initialized-empty project lifecycle capability. If `alembic_task` visibility is removed, equivalent new work/prime tools must cover the same onboarding state.
- Task-scoped Guard decision logic and explicit files when a Guard check is required.
- Opportunistic evolution no-auto-submit boundary and resident ProjectScope defer behavior.
- Project Skill delivery route and generated Project Skill runtime visibility.

## Stage 1+ Suggestions

Recommended implementation order:

1. Runtime identity and local-dev proof first: make sure every new tool reports the same project-root/dataRoot/readiness/fallback identity and can be proven through a fresh installed MCP startup.
2. Add an explicit Plugin public API contract layer and schemas for `alembic_intent`, `alembic_prime`, `alembic_work_start`, `alembic_work_finish`, `alembic_code_guard`, and `alembic_decision_record`.
3. Split intent and prime out of `task.ts` using `HostIntentFrame`, `IntentExtractor`, `PrimeSearchPipeline`, and `ProjectRuntimeContext`.
4. Split work lifecycle and Guard using `TaskLifecyclePolicy`, but expose work evidence and Guard scope explicitly. Avoid a no-args dirty-diff default.
5. Add durable decision-record semantics only after the producer contract is clear from Alembic/AlembicCore Stage 0 facts.
6. Update skill text, tool descriptions, README references, catalog policy, MCP server routing, schema tests, policy tests, lifecycle tests, smoke expectations, and runtime package together.
7. Only after new public tools pass golden/smoke tests, hide or delete legacy public `alembic_task`/old Guard guidance.

## Risks

- Current AlembicPlugin worktree is already dirty in unrelated files; this inventory did not modify or revert those changes.
- `record_decision` is not currently durable, so a naive rename would overstate decision-register capability.
- No-args Guard can inspect unrelated dirty files; the new public API must fail closed or skip without explicit scope.
- Removing `alembic_task` before replacement visibility/policy tests pass could break initialized-empty project workflows and existing smoke tests.
- Source/runtime duplication means implementation must regenerate runtime package; otherwise the installed Codex plugin will still expose old behavior.
- Shared cross-repo contract ownership depends on Alembic and AlembicCore Stage 0 facts. Plugin should avoid creating a permanent shared layer before producer facts are reviewed.

## Verification

Commands required by the task:

- `git status --short` from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- `git diff --check` from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`

Observed before dossier write:

```text
 M lib/codex/diagnostics/Diagnostics.ts
 m plugins/alembic-codex
 M scripts/dev-reload-codex-plugin.mjs
 M scripts/dev-watch-codex-plugin.mjs
 M test/unit/CodexDevReloadScript.test.ts
```

`git diff --check` produced no output before dossier write.

Final verification should be rerun after this dossier is written; since this dossier is outside the AlembicPlugin repository, it should not change the target repo worktree state.
