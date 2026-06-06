# AlembicPlugin AFAPI Full Stage3A Runtime Localdev Packaged Result

- taskId: `AFAPI-FULL-STAGE3A-PLUGIN-RUNTIME-LOCALDEV-PACKAGED-P6`
- dispatchGroup: `AFAPI-FULL-STAGE3A-RUNTIME-LOCALDEV-PACKAGED-20260605`
- currentWindow: `AlembicPlugin`
- status: `completed`
- completedAt: `2026-06-05`

## Scope Completed

- Hardened AlembicPlugin local-dev/package mode evidence without changing Alembic producer behavior.
- Added runtime mode separation metadata to local-dev reload reports and installed cache markers:
  - local-dev cache rewrite: `local-dev-direct-dist`
  - packaged startup: `packaged-wrapper`
  - canonical local command: `npm run dev:codex-plugin:reload`
- Extended diagnostics stale-reason checks for installed marker entry-mode, package version, and plugin version mismatches.
- Added packaged wrapper runtime tarball preflight diagnostics before the scoped npm startup lock.
- Refreshed nested `plugins/alembic-codex` packaged runtime artifact and `runtime.tgz`.
- Verified `alembic_codex_status` readback in both local-dev direct-dist and packaged wrapper modes.

## Commits

- AlembicPlugin parent repo: `1dfaa30` (`feat: harden codex plugin runtime mode diagnostics`)
- Nested Plugin resource repo `plugins/alembic-codex`: `d5b165a` (`chore: refresh packaged runtime wrapper diagnostics`)

## Key Files

- `lib/codex/diagnostics/Diagnostics.ts`
- `scripts/dev-reload-codex-plugin.mjs`
- `scripts/sync-codex-plugin-cache.mjs`
- `plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs`
- `plugins/alembic-codex/runtime.tgz`
- `test/unit/CodexDevReloadScript.test.ts`
- `test/unit/CodexPluginCacheSync.test.ts`
- `test/unit/CodexRuntimeContext.test.ts`
- `test/unit/CodexMcpServer.test.ts`

## Verification

- `npm test -- --run test/unit/CodexDevReloadScript.test.ts test/unit/CodexPluginCacheSync.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexMcpServer.test.ts` -> pass, 4 files / 58 tests.
- `npm run build:check` -> pass; Core build used `../AlembicCore @ e3eda0450db9d27974c1ef1f945fb5a5f4793ea0`.
- `npm run build` -> pass.
- `npm run prepare:codex-plugin-runtime` -> pass, refreshed `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/plugins/alembic-codex/runtime.tgz`.
- `npm run lint:repo-boundary` -> pass.
- `git diff --check` -> pass.
- `git -C plugins/alembic-codex diff --check` -> pass.
- `node scripts/dev-reload-codex-plugin.mjs --skip-build --skip-prepare --codex-home scratch/afapi-stage3a-local-codex-home --sync-target scratch/afapi-stage3a-local-installed-cache --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/afapi-stage3a-local-dev-reload-report.json --probe-report-path scratch/afapi-stage3a-local-dev-probe-report.json --mcp-timeout-ms 90000` -> pass.
- `node scripts/dev-verify-codex-plugin.mjs --packaged --skip-build --skip-tests --skip-prepare --skip-verify --skip-smoke --codex-home scratch/afapi-stage3a-packaged-codex-home --sync-target scratch/afapi-stage3a-packaged-installed-cache --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin --report-path scratch/afapi-stage3a-packaged-verify-report.json --mcp-timeout-ms 180000` -> pass.

## Runtime Readback

- Local-dev report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage3a-local-dev-reload-report.json`
  - `ok=true`, `mode=local-dev-reload`
  - probes: 2
  - marker mode: `local-mcp`
  - runtime readback entryMode: `local-dev-direct-dist`
  - saved-root no-argument call fails closed with `CODEX_PROJECT_ROOT_UNRESOLVED`
- Local-dev probe report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage3a-local-dev-probe-report.json`
  - `ok=true`, `mode=local-mcp`
  - runtime readback entryMode: `local-dev-direct-dist`
- Packaged wrapper report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/afapi-stage3a-packaged-verify-report.json`
  - `ok=true`, `mode=packaged-runtime`
  - probes: 2
  - marker mode: `packaged-runtime`
  - runtime readback entryMode: `packaged-wrapper`
  - saved-root no-argument call fails closed with `CODEX_PROJECT_ROOT_UNRESOLVED`

## Not Modified

- No Alembic, AlembicCore, AlembicAgent, AlembicDashboard, AlembicDesign, AlembicTest, or real-project changes.
- No Alembic runtime-control producer fallback was added in Plugin.
- No current Codex MCP process stop/restart behavior was reintroduced.
- No control-workspace source/capability repo commit was made by this window.

## Risks

- AlembicPlugin can now diagnose and prove local-dev/package mode separation, but runtime-control producer readiness still depends on the paired Alembic target in this dispatch group.
- The first packaged verification attempt used `--probe-target` before sync and failed with missing `.mcp.json`; the corrected packaged sync/probe command passed and is the recorded evidence.
- Packaged runtime refresh pulled the current parent build into `plugins/alembic-codex/runtime`; this is intended for Stage3A artifact freshness and includes previously committed AFAPI public-tool/runtime updates.

## Next Suggestions

- Wait for the paired Alembic producer result before total-control acceptance of AFAPI-FULL-12/13/14 as a whole.
- Use the Stage3A reports above as the Plugin-side baseline for future installed-cache or wrapper startup regressions.
