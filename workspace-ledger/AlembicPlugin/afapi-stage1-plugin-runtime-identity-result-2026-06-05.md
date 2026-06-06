# AFAPI Stage 1 AlembicPlugin Runtime Identity Result

- taskId: `AFAPI-STAGE1-PLUGIN-RUNTIME-P1`
- dispatchGroup: `AFAPI-STAGE1-RUNTIME-IDENTITY-20260605`
- targetWindow: `AlembicPlugin`
- completedAt: `2026-06-05T01:13:00+08:00`

## Scope Completed

- Implemented Plugin-side ProjectRuntime identity foundation so resident ProjectScope identity supplies the ghost `dataRoot`, `runtimeDir`, and `databasePath` while the effective identity source remains the Codex current project root.
- Strengthened local-dev reload/probe scripts so fresh MCP startup readback validates `projectRuntime.identity`, `projectRuntime.sourcePolicy`, blocked fallback isolation, `entryMode`, and structured `failureEnvelopes`.
- Preserved the boundary that AlembicPlugin does not inspect, stop, or restart the current Codex host MCP process; reload only refreshes installed caches and probes a fresh MCP process.
- Refreshed the embedded Codex runtime artifact in `plugins/alembic-codex`.

## Commits

- AlembicPlugin: `4b7230062900203084b9703e6949b020d490aac1`
- Embedded runtime subrepo `plugins/alembic-codex`: `613b0a1864b4cedf5401ec48e9cb0aa8ab68ceb7`

## Raw Evidence

- Reload report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage1-dev-reload-report.json`
- Nested reload probe report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage1-dev-reload-probe-report.json`
- Post-commit fresh MCP probe report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage1-postcommit-probe-report.json`

Readback highlights from the fresh MCP probe:

- tool call: `alembic_codex_status`
- target cache: `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0`
- `entryMode`: `local-dev-direct-dist`
- `projectRoot`: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- `dataRoot`: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- `runtimeDir`: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/.asd`
- `databasePath`: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/.asd/alembic.db`
- `sourcePolicy.effectiveIdentitySource`: `codex-current-project`
- `sourcePolicy.selectedOrActiveCanOverrideEffectiveIdentity`: `false`
- blocked fallbacks: `saved-project-root-effective-identity`, `runtime-control-selected-active-effective-identity`, `local-jobstore-default-effective-identity`
- fallback isolation blocked effective identity and persistence for `saved-project-root`, `runtime-control-selected-active`, `local-jobstore`, and `embedded-plugin-owned-runtime`
- readiness: `degraded`, with structured failure envelope reasons for unavailable optional services: `project-scope-unavailable`, `daemon-missing`, `jobs-unavailable`, `api-ai-unavailable`, `dashboard-unavailable`, `file-monitor-unavailable`
- explicit project root was trusted; saved project root was not reused; missing project root failed closed with `CODEX_PROJECT_ROOT_REJECTED`

## Verification Commands

- `git diff --check`
- `git -C plugins/alembic-codex diff --check`
- `npx vitest run test/unit/CodexRuntimeContext.test.ts test/unit/CodexDevReloadScript.test.ts test/unit/CodexMcpServer.test.ts`
- `npm run build:check`
- `npm run dev:codex-plugin:reload -- --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/afapi-stage1-dev-reload-report.json --probe-report-path scratch/afapi-stage1-dev-reload-probe-report.json --mcp-timeout-ms 60000`
- `npm run dev:codex-plugin:probe-installed -- --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --probe-target /Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0 --report-path scratch/afapi-stage1-postcommit-probe-report.json --mcp-timeout-ms 60000`
- `git status --short`
- `git -C plugins/alembic-codex status --short`

The first non-escalated reload attempt failed at cache sync with `EPERM` when writing `/Users/gaoxuefeng/.codex/plugins/cache/...`; the same command was rerun with approved escalation and completed successfully.

## Not Modified

- No Alembic, AlembicCore, Dashboard, Test, Design, or real project source was modified.
- No six new AFAPI public tools were implemented in this Stage 1 task.
- Legacy active surfaces such as `alembic_task` and `alembic_guard` were not deleted.
- No implicit `/api/v1/projects/*` runtime start/stop/switch route was introduced.

## Conclusion

`AFAPI-TODO-02` is resolved for AlembicPlugin Stage 1 runtime identity foundation and local-dev MCP readback proof. The resident ProjectScope ghost dataRoot path is covered by unit/MCP tests; the local installed-cache proof exercised the single-folder baseline because no resident ProjectScope daemon was active for this repository during the probe.

## Risks And Next Steps

- Stage 2 still needs the actual agent-facing public tool contract and implementation; this task only established the runtime identity/readback foundation.
- Alembic producer gaps from Stage 0 remain external to this Plugin task: no dedicated agent-facing resident on-demand handoff route and no durable Decision Register CRUD.
- The reload report marker records the git head present at cache-refresh time; the post-commit probe report confirms the installed cache still starts fresh MCP and returns the expected runtime identity contract after commit.
