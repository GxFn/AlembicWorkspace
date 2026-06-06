# AFAPI REQ 01 Plugin Runtime Identity Code Fact

- Demand: `AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME`
- Task: `AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-CODE-FACT-T1`
- Dispatch group: `AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-GROUP`
- Window: `AlembicPlugin`
- Mode: Stage 0 read-only code fact review
- Product source changes: none
- Product commit: none

## Boundary

This review is limited to AlembicPlugin-owned Codex MCP, skills, channel/marketplace, plugin runtime, install verification, and Codex host adaptation. It does not claim Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or real-project responsibilities.

## Source Documents

- `AGENTS.md`
- `AlembicPlugin/AGENTS.md`
- `codex-control-workspace/.workspace-active/workspace/index.md`
- `codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- `codex-control-workspace/.workspace-active/workspace/current/afapi-req-01-runtime-identity-multi-project-runtime/developer-progress.md`
- `codex-control-workspace/.workspace-active/workspace/current/afapi-req-01-runtime-identity-multi-project-runtime/task-packages/AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-CODE-FACT-P1.json`
- `workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-01-runtime-identity-multi-project-runtime-landing-2026-06-05.md`

## Code Facts

### Project Root Identity

- `lib/codex/ProjectRootResolver.ts:274-288` trusts explicit `projectRoot`, `ALEMBIC_PROJECT_DIR`, `CODEX_WORKSPACE_DIR`, and `CODEX_WORKSPACE_ROOT`; it treats `INIT_CWD`, `PWD`, and `process.cwd` as fallback only.
- `lib/codex/ProjectRootResolver.ts:283-285` documents saved project root as diagnostics/readback only and does not push it into effective candidates. `test/unit/CodexProjectRootResolver.test.ts:33-52` proves saved root is not reused as effective identity.
- `lib/codex/ProjectRootResolver.ts:326-340` rejects unsafe roots such as home/tmp/plugin cache paths; `test/unit/CodexProjectRootResolver.test.ts:90-117` covers plugin cache rejection.

### Project Runtime Context

- `lib/codex/runtime/ProjectRuntimeContext.ts:173-233` builds the shared runtime context from the current Codex project root plus optional resident ProjectScope identity.
- `lib/codex/runtime/ProjectRuntimeContext.ts:72-105` isolates `saved-project-root`, `runtime-control-selected-active`, `local-jobstore`, and `embedded-plugin-owned-runtime`; all have `effectiveIdentityAllowed=false` and `persistenceRootAllowed=false`.
- `lib/codex/runtime/ProjectRuntimeContext.ts:216-233` blocks the legacy effective-identity fallbacks and fixes `sourcePolicy.effectiveIdentitySource=codex-current-project`, `runtimeControlSource=read-only-diagnostics`, and `selectedOrActiveCanOverrideEffectiveIdentity=false`.
- `lib/codex/runtime/ProjectRuntimeContext.ts:259-321` uses resident ProjectScope dataRoot when available; otherwise it falls back to the `WorkspaceResolver` single-folder facts for the same Codex current project.
- `lib/codex/runtime/ProjectRuntimeContext.ts:531-550` detects entry mode as `packaged-wrapper`, `local-dev-direct-dist`, or `unknown` from plugin MCP config/runtime context.
- `test/unit/CodexRuntimeContext.test.ts:223-279` covers resident ProjectScope ghost dataRoot identity and fallback isolation. `test/unit/CodexRuntimeContext.test.ts:419-473` covers runtime-control stale/mismatch diagnostics without allowing selected/active override.

### Status, Diagnostics, And MCP Consumers

- `lib/codex/status/StatusService.ts:135-233` resolves `WorkspaceResolver`, daemon status, resident probe, ProjectScope identity, host alignment, diagnostics, and `projectRuntime` from one project root.
- `lib/codex/mcp/CodexMcpServer.ts:385-433` exposes status and diagnostics with the same project runtime context.
- `lib/codex/mcp/CodexMcpServer.ts:686-763` blocks dashboard handoff on host/runtime mismatch and attaches `projectRuntime` to the structured failure envelope.
- `lib/codex/mcp/CodexMcpServer.ts:814-878` uses `projectRuntime.identity.runtimeDir/dataRoot` for cleanup dry-run targets and does not delete project data by default.
- `lib/codex/mcp/CodexMcpServer.ts:884-997` attaches project runtime context to job enqueue/read paths; `test/unit/CodexMcpServer.test.ts:2220-2360` verifies local JobStore fallback remains recovery only and is not an identity source.
- `lib/codex/mcp/host/host-project-handoff.ts:14-51` returns `CODEX_HOST_PROJECT_MISMATCH` / disconnected failures instead of silently switching projects.

### Resident Search And ProjectScope

- `lib/service/resident/AlembicResidentServiceClient.ts:439-540` resolves the resident probe and ProjectScope identity for the requested `projectRoot` before search.
- `lib/service/resident/AlembicResidentServiceClient.ts:1107-1198` uses resident `/api/v1/project-scope/resolve-folder` when possible; without a local resident/token/endpoint it returns a single-folder baseline identity with diagnostics.
- `lib/service/resident/AlembicResidentServiceClient.ts:1202-1288` can inspect active runtime-control roots only to find a resident ProjectScope endpoint for the requested folder; this is discovery/diagnostics, not effective identity override.
- `lib/service/resident/AlembicResidentServiceClient.ts:1672-1708` rejects resident search results whose returned workspace paths/scope do not match the requested project. `test/unit/AlembicResidentServiceClient.test.ts:558-616` proves mismatched resident results are ignored and no cross-project knowledge is injected.
- `lib/service/resident/AlembicResidentServiceClient.ts:654-696` scopes Decision Register writes using resolved ProjectScope identity, while route/capability checks still require a local Alembic resident daemon.

### Local-dev And Packaged Runtime

- `plugins/alembic-codex/.mcp.json:1-18` is packaged mode by default: it runs `node ./bin/alembic-codex-mcp-wrapper.mjs` with Codex/plugin env.
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs:10-90` launches `npx --offline --package ./runtime.tgz alembic-codex-mcp` with a per-process npm cache.
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs:93-236` owns startup lock acquisition, stale lock cleanup, timeout diagnostics, and release.
- `channels/codex/channel.json:21-44` declares `runtimeSpecifier=./runtime.tgz` and artifact `plugins/alembic-codex/runtime.tgz`.
- `scripts/dev-reload-codex-plugin.mjs:154-184` documents local-dev reload as `local-dev-direct-dist` and packaged wrapper as separate, not used by reload.
- `scripts/sync-codex-plugin-cache.mjs:248-273` writes installed-cache markers recording local-dev vs packaged mode separation and artifact hashes.
- `scripts/dev-verify-codex-plugin.mjs:238-315` probes fresh MCP status and asserts projectRoot/dataRoot/runtimeDir/databasePath, source policy, blocked fallbacks, fallback isolation, and structured failure envelopes.
- `test/unit/CodexDevReloadScript.test.ts:31-78` and `test/unit/CodexPluginCacheSync.test.ts:35-101` cover dry-run reload/cache marker separation.

## Current Judgment

AlembicPlugin currently has the main REQ 01 identity protections in place: effective identity starts from the trusted Codex current project, resident ProjectScope can only refine the dataRoot/scope for that project, runtime-control selected/active is read-only diagnostics, saved root is not reused, local JobStore is recovery-only, and embedded packaged runtime is an execution route rather than an identity source.

The current code fact review does not prove the whole multi-window runtime requirement by itself. It does not run live local-dev or packaged MCP probes in this task, does not verify Alembic producer-side runtime-control cleanup, and does not validate multiple concurrent host windows. Those belong to later implementation/acceptance stages or paired Alembic/AlembicTest evidence.

## Validation

- `git status --short --branch` in `AlembicPlugin`: clean, `main...origin/main`.
- `git -C plugins/alembic-codex status --short --branch`: clean, `main...origin/main`.
- `git -C vendor/AlembicCore status --short --branch`: clean detached HEAD.
- `npm test -- --run test/unit/CodexProjectRootResolver.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts test/unit/AlembicResidentServiceClient.test.ts test/unit/CodexDevReloadScript.test.ts test/unit/CodexPluginCacheSync.test.ts`: passed, 7 files / 84 tests.
- `git diff --check`: passed, no output.
- `npm run lint:repo-boundary`: passed, escape-hatch count `0 / 75`.

`npm run build:check` was intentionally not run in this read-only code-fact task because the configured command starts with `npm run build:core`; this Stage 0 pass avoided generating adjacent Core build artifacts.

## Risks And Gaps

- Live local-dev and packaged wrapper evidence should be rerun in a later verification stage if implementation changes, using separate reports for `local-dev-direct-dist` and `packaged-wrapper`.
- Alembic producer-side ProjectRuntimeControl cleanup/readiness remains outside AlembicPlugin; Plugin consumes source-of-truth diagnostics but must not implement the producer or rewrite selected/active state.
- Multiple simultaneous host windows are not proven by focused unit tests alone; they need a real or simulated concurrent host probe that confirms per-window projectRoot/dataRoot isolation.
- Optional readiness services such as `api-ai`, `dashboard`, and `file-monitor` are diagnostics for Alembic resident capabilities, not Plugin-owned provider/runtime behavior.

## Next Stage Recommendation

Proceed to an implementation/acceptance wave only after controller review confirms whether REQ 01 needs more code or only fresh runtime verification. The safest Plugin-owned next package is: run fresh local-dev direct-dist and packaged wrapper probes, add or keep a concurrent projectRoot isolation probe if missing, and leave Alembic runtime-control producer cleanup to the Alembic-owned task.
