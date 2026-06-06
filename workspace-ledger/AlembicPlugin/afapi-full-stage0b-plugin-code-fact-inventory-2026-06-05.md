# AFAPI Full Stage 0B Plugin Code Fact Inventory

- Task: `AFAPI-FULL-STAGE0B-PLUGIN-P0`
- Dispatch group: `AFAPI-FULL-STAGE0B-CODE-FACT-20260605`
- Window: `AlembicPlugin`
- Target repo: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Mode: read-only code fact inventory.
- Product source changes: none.
- Product commit: none.
- Result status: completed for Plugin Stage 0B evidence.

## Boundary

This dossier only covers AlembicPlugin-owned Codex MCP, shipped skills, plugin channel/marketplace assets, embedded runtime, install validation, and Codex host adaptation. It does not claim Alembic, AlembicCore, AlembicDashboard, AlembicAgent, AlembicDesign, AlembicTest, or real project responsibilities.

## Commands And Readbacks

- `git status --branch --short` in AlembicPlugin: `## main...origin/main`.
- `git diff --check` in AlembicPlugin: no output.
- `git submodule status --recursive` in AlembicPlugin before report write: `plugins/alembic-codex` at `7b66bb5...`; `vendor/AlembicCore` at `648055b...`.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace status --short workspace-ledger/AlembicPlugin` before this report write showed two existing untracked ledger files:
  - `workspace-ledger/AlembicPlugin/afapi-stage0-plugin-public-api-inventory-2026-06-05.md`
  - `workspace-ledger/AlembicPlugin/afapi-stage1-plugin-runtime-identity-result-2026-06-05.md`
- Read-only evidence scans used `rg --files`, `rg -n`, `nl -ba`, and `node -e` JSON summaries over `lib`, `test`, `scripts`, `plugins/alembic-codex`, `scratch`, and `package.json`.
- Installed/readback evidence:
  - `scratch/afapi-stage3-plugin-intent-prime-2026-06-05/agent-public-tools-mcp-readback.json`: `ok=true`, `hasIntent=true`, `hasPrime=true`, `visibleCount=15`.
  - `scratch/afapi-stage4c-decision-record-mcp-readback.json`: `ok=true`, durable Decision Register success route plus unavailable blocker route.
  - `scratch/afapi-stage5-installed-guidance-readback.json`: `ok=true`, shipped guidance mentions six public tools and keeps old task wording absent.
  - `scratch/afapi-stage6-agent-public-tools-readback.json`: `ok=true`, six public tools visible in installed cache; all public tool calls report `usesLegacyTaskHandler=false`.
  - `scratch/codex-plugin-dev-reload-report.json`: `ok=true`, canonical command `npm run dev:codex-plugin:reload`, probe `ok=true`.
  - `scratch/codex-plugin-dev-verify-packaged-report.json`: `ok=true`, mode `packaged-runtime`.
- Runtime artifact check: `plugins/alembic-codex/runtime.tgz` exists, size about `21M`; wrapper, runtime `package.json`, and `runtime/dist/bin/codex-mcp.js` exist.

## Code Facts

### Public Tool Surface

- Six agent-facing public tools are registered as active MCP tools in `lib/codex/mcp/tools.ts:121-180`: `alembic_intent`, `alembic_prime`, `alembic_work_start`, `alembic_work_finish`, `alembic_code_guard`, and `alembic_decision_record`.
- `lib/codex/mcp/McpServer.ts:573-593` routes those six tools to `agent-public-tools`, while `alembic_guard` still routes through `toolRouter.routeGuardTool` and `alembic_task` still routes to the legacy task handler.
- `lib/codex/mcp/public-tools/contract.ts:14` already models `codex`, `claude-code`, and `generic-host-agent`; `contract.ts:306-372` marks all six public tools as active surfaces with handler dependency `McpServer.agent-public-tools`.
- `lib/codex/mcp/public-tools/contract.ts:195-213` locks public result envelopes to `usesLegacyTaskHandler=false`.
- `lib/codex/ToolPolicy.ts:94-137` treats the six public tools as Codex host lifecycle surfaces and keeps `alembic_task` as initialized-project compatibility.
- `test/unit/AgentPublicToolsEvaluation.test.ts:115-282` locks descriptions, contracts, refs, envelopes, output budgets, and non-legacy primary guidance.

### Intent, Prime, Search, And Vector Boundary

- `lib/codex/mcp/handlers/agent-public-tools.ts:175-176` stores public `intentRef` and `workRef` records in process-local Maps, capped later at `100` records by `rememberWorkRecord` and `rememberIntentRecord`.
- `agent-public-tools.ts:183-212` captures `intentRef`, detail refs, local record, and `vectorPlan`.
- `agent-public-tools.ts:234-388` runs `alembic_prime` through `PrimeSearchPipeline`, returns `primeRef`, `primeKnowledgeMaterial`, `primePackage`, `searchMeta`, and project runtime context.
- `agent-public-tools.ts:316-318` explicitly keeps active public prime IntentEpisode handoff unavailable in this surface, while the resident client has a separate IntentEpisode API.
- `lib/service/task/PrimeSearchPipeline.ts:82-208` applies fixed retrieval quality filtering with absolute, relative, and gap thresholds.
- `PrimeSearchPipeline.ts:244-245` states Plugin no longer has an embedding executor; resident semantic/vector enhancement comes from the local Alembic resident service, with Plugin baseline search as fallback.
- `PrimeSearchPipeline.ts:327-391` calls resident semantic search with host intent handoff and returns structured unavailable metadata on failure.
- `test/unit/PrimeSearchPipelineResidentSearch.test.ts:222-280` proves resident semantic results, vector metadata, relation evidence, and prime injection package can be merged into prime material.
- `test/unit/AlembicResidentServiceClient.test.ts:336-448` proves Codex `auto` search is normalized to daemon `semantic`, and redacts private path material from resident intent evidence.

### Work, Guard, And Legacy Surfaces

- `agent-public-tools.ts:390-624` implements public work start/finish with `workRef`, `finishRef`, detail refs, and scoped Guard recommendation.
- `agent-public-tools.ts:626-764` blocks `alembic_code_guard` when neither `files` nor inline `code` is supplied; it does not fall back to whole-diff review.
- `lib/shared/schemas/mcp-tools.ts:226-246` documents this public `CodeGuardInput` as no-args blocked, although schema parsing itself stays permissive.
- `lib/codex/mcp/handlers/tool-router.ts:161-185` still keeps old `alembic_guard` no-args behavior as git-diff review.
- `lib/codex/mcp/handlers/guard.ts:316-383` implements old no-args `alembic_guard` automatic changed-file detection.
- `lib/codex/mcp/handlers/task.ts:1044-1121` shows legacy `alembic_task(operation: close)` still builds nextAction with `tool: 'alembic_guard'`, not `alembic_code_guard`.
- `lib/shared/schemas/mcp-tools.ts:618-663` still exposes legacy `TaskInput` with operations `prime`, `create`, `close`, `fail`, and `record_decision`.
- `test/unit/AgentPublicToolsActive.test.ts:364-414` proves public Code Guard blocks no-scope and runs explicit inline code only.
- `test/unit/AgentPublicSkillLegacyCleanup.test.ts:18-65` proves shipped guidance removed old `operation=prime/create/close` wording and downgrades `alembic_task` to compatibility in descriptions.

### Decision Register Consumer

- `agent-public-tools.ts:766-908` implements `alembic_decision_record` as a resident Decision Register consumer and explicitly blocks when durable persistence is unavailable; it writes no Plugin-local fake decision.
- `lib/service/resident/AlembicResidentServiceClient.ts:578-635` probes capability before create/read/update/list/revoke/delete calls and builds project-scoped request bodies.
- `AlembicResidentServiceClient.ts:861-880` requires a local Alembic resident daemon and token for Decision Register.
- `AlembicResidentServiceClient.ts:883-1027` maps capability and Decision Register HTTP responses into resident service success/unavailable envelopes.
- `scratch/afapi-stage4c-decision-record-mcp-readback.json:9-77` proves installed-cache create/read/update/list/revoke/delete success against a fake local resident route and a blocked unavailable route.
- `lib/codex/mcp/McpServer.ts:440-469` has active-decision injection deferred; it is not currently part of public tool result flow.

### Runtime, Local Dev, And Package

- `lib/codex/runtime/ProjectRuntimeContext.ts:68-105` isolates saved project root, runtime-control selected/active, local JobStore, and embedded runtime from effective identity.
- `ProjectRuntimeContext.ts:205-227` sets source policy to Codex current project as effective identity; selected/active runtime-control cannot override it.
- `ProjectRuntimeContext.ts:514-540` detects entry mode from `.mcp.json` as `packaged-wrapper`, `local-dev-direct-dist`, or `unknown`.
- `lib/codex/diagnostics/Diagnostics.ts:385-496` checks plugin manifest, MCP env, embedded runtime, wrapper startup lock, skills, and README.
- `Diagnostics.ts:551-594` reports local-dev direct dist, packaged wrapper, or stale installed cache.
- `Diagnostics.ts:680-720` validates wrapper startup lock diagnostics.
- `plugins/alembic-codex/.mcp.json:1-19` launches `node ./bin/alembic-codex-mcp-wrapper.mjs` with `ALEMBIC_RUNTIME_MODE=plugin`, agent tier, admin disabled by default, and Codex plugin host env.
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs:37-90` starts `npx --package ./runtime.tgz alembic-codex-mcp` through per-process npm cache.
- `alembic-codex-mcp-wrapper.mjs:93-236` acquires, diagnoses, clears stale, and releases startup locks.
- `package.json:58-64` exposes local-dev plugin commands; `dev:codex-plugin:reload` is canonical, while `dev:codex-plugin:refresh` is still a compatibility alias.
- `scripts/dev-reload-codex-plugin.mjs:22-25` prints compatibility guidance for the refresh alias.
- `scripts/dev-reload-codex-plugin.mjs:36-55` builds, prepares `runtime.tgz`, syncs installed caches, leaves the current Codex MCP lifecycle to Codex, then probes a fresh startup.
- `scripts/dev-watch-codex-plugin.mjs:13-44` watches plugin inputs; `dev-watch-codex-plugin.mjs:105-137` serializes reloads and queues pending changes.

### Skills And Host Guidance

- `plugins/alembic-codex/skills/alembic/SKILL.md:22-38` makes the six public tools the knowledge-backed turn flow and marks `alembic_task` legacy compatibility only.
- `plugins/alembic-codex/skills/alembic-recipes/SKILL.md:35-41` routes Recipe lookup through `alembic_intent` + `alembic_prime` and explains resident vector diagnostics.
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md:10-31` still names `alembic_guard` and permits `{}` whole-diff only when explicitly intended; this is a remaining legacy-guidance risk.
- `scratch/afapi-stage5-installed-guidance-readback.json:5-70` proves installed-cache skill and README guidance has no forbidden old task operation wording.

## AFAPI-FULL TODO Mapping

| TODO | Plugin Stage 0B status | Evidence / reason |
| --- | --- | --- |
| AFAPI-FULL-03 Retrieval quality | 待实现 | `PrimeSearchPipeline` has thresholds and resident merge, but no golden retrieval quality acceptance or feedback metrics. |
| AFAPI-FULL-04 Intent vector anchor / hybrid collaboration | 待实现 | Public intent has `vectorPlan`; resident search accepts handoff. Plugin has no embedding executor and no durable vector anchor. |
| AFAPI-FULL-05 Recipe relation / graph route for prime | 待实现 | Plugin consumes resident `relationEvidence` and `primeInjectionPackage`; relation production is not Plugin-owned. |
| AFAPI-FULL-06 Retrieval feedback / adoption loop | 待实现 | Old Guard feedback hooks exist, but public prime/search adoption feedback loop is not complete. |
| AFAPI-FULL-07 Real Codex smoke | 待实现 | Installed-cache probes exist; no AlembicTest or manual real Codex host smoke for full workflow. |
| AFAPI-FULL-08 Cross-host readiness | 待实现 | Contract has `claude-code` and `generic-host-agent`; skills, tests, packaging, and docs remain Codex-first. |
| AFAPI-FULL-09 Legacy `alembic_task` physical cleanup | 待实现 | Tool, schema, handler, ToolPolicy, and compatibility readback still keep `alembic_task`; wait for real smoke before deletion. |
| AFAPI-FULL-10 Legacy `alembic_guard` no-args/global diff cleanup | 待实现 | Public `alembic_code_guard` blocks no scope, but old `alembic_guard` and legacy `alembic_task` close still preserve old whole-diff path. |
| AFAPI-FULL-11 Decision Register search/vector stale filter | 待实现 | Plugin consumer route works; active decision injection is deferred, and stale filter/search lifecycle appears producer-owned by Alembic resident service. |
| AFAPI-FULL-12 Full multi-project runtime unification | 待实现 | ProjectRuntimeContext blocks old identity fallbacks, but full runtime-control stale cleanup and multi-project unification still need implementation/acceptance. |
| AFAPI-FULL-13 Local-dev command semantics cleanup | 待实现 | `reload` is canonical, but `refresh` remains as compatibility alias. |
| AFAPI-FULL-14 Packaged wrapper startup reliability | 已由 P0 覆盖 | Wrapper startup lock, diagnostics, `runtime.tgz`, and packaged-runtime verification evidence are present. |
| AFAPI-FULL-15 Runtime-control stale active/selected cleanup | 待实现 | Source policy blocks selected/active as effective identity, but stale active/selected cleanup behavior still needs a cleanup package. |
| AFAPI-FULL-16 Shared schema/Core promotion decision | 待裁决 | Plugin public contract is local; Core promotion needs Alembic/Core consumer evidence. |
| AFAPI-FULL-17 Dashboard diagnostics/detailRefs UI | 不应做 | Plugin emits detailRefs/diagnostics; Dashboard UI implementation is not Plugin-owned. |
| AFAPI-FULL-18 Host prompt/golden suite expansion | 待实现 | Unit/probe golden exists for six tools; full host prompt/golden and real smoke suite is not complete. |
| AFAPI-FULL-19 Docs/design lint/check separate capability | 待裁决 | Not needed for Plugin unless user confirms separate docs/design lint capability. |
| AFAPI-FULL-20 Intent record store naming/migration | 待实现 | Public intent/work refs are process-local Maps; resident IntentEpisode API exists but public prime keeps it unavailable in this surface. |
| AFAPI-FULL-21 Final full acceptance | 待实现 | Requires Stage 0B cross-window facts, implementation waves, real smoke, and legacy cleanup acceptance. |

## Suggested Implementation Packages

1. Retrieval/intent quality package: Plugin plus Alembic producer facts. Cover AFAPI-FULL-03/04/05/06 with golden retrieval, resident vector/graph evidence, and public prime acceptance.
2. Runtime/local-dev/package cleanup package: Plugin-owned. Cover AFAPI-FULL-12/13/14/15, including alias decision, stale installed-cache diagnostics, wrapper reliability, and selected/active cleanup behavior.
3. Real host and cross-host package: Plugin plus AlembicTest when authorized. Cover AFAPI-FULL-07/08/18 with real Codex smoke first, then cross-host adapter/guidance tests.
4. Legacy physical cleanup package: Plugin-owned, only after real smoke. Cover AFAPI-FULL-09/10 by deleting or retiring `alembic_task` and no-args `alembic_guard` paths in a safe order.
5. Decision lifecycle package: Alembic producer first, Plugin consumer verification second. Cover AFAPI-FULL-11 and avoid implementing producer-owned stale filtering inside Plugin.
6. Conditional decisions package: Hold AFAPI-FULL-16/17/19 until controller/user裁决 and cross-window evidence confirm whether Core promotion, Dashboard UI, or docs/design lint is actually in scope.

## Risks

- Removing `alembic_task` or old `alembic_guard` before real Codex smoke could break initialized-project compatibility and older sessions.
- Public `intentRef` and `workRef` storage is process-local, so long-lived or cross-host continuity is not durable yet.
- Retrieval quality cannot be proven from current unit/probe evidence; it needs golden result expectations against resident producer behavior.
- Decision Register producer filtering and stale lifecycle are not Plugin-owned; Plugin should not fake or shadow them.
- Existing installed-cache probes are strong technical readbacks, but they are not the same as a real user-visible Codex host workflow smoke.

## Next Step Recommendation

Proceed to an implementation wave only after Stage 0B group review combines Plugin, Alembic, and Core facts. The first Plugin implementation wave should not start with deletion; it should first harden runtime/retrieval/public-tool behavior and run real Codex smoke, then clean legacy physical surfaces in the smallest safe order.
