# Alembic Codex Plugin Local Install Status

Date: 2026-05-08

This document records the current Codex local plugin validation state before switching windows.

## Current Conclusion

Alembic Codex plugin is installed and working in Codex through the GitHub/local marketplace path.

Verified path:

1. Codex discovered the Alembic plugin from the local/GitHub marketplace.
2. The plugin card rendered correctly with name, icon, category, default prompt, and install/try controls.
3. A new Codex conversation loaded the Alembic MCP tools.
4. `alembic_codex_diagnostics` ran successfully.
5. `alembic_codex_init` initialized the Alembic repo workspace in Ghost mode.
6. `alembic_codex_status` reported the workspace as healthy.

## Verified Runtime State

Workspace:

```text
/Users/gaoxuefeng/Documents/github/Alembic
```

Ghost data root:

```text
/Users/gaoxuefeng/.asd/workspaces/a63b3383
```

Project id:

```text
a63b3383
```

Runtime package:

```text
alembic-ai@0.0.10
```

Node/npm state reported by diagnostics:

```text
Node: 22.22.1
npm/npx: 10.9.4
Codex tier: agent
Admin mode: disabled by default
Daemon: stopped
```

The daemon remaining stopped is expected. It confirms the plugin starts light and only wakes the Alembic daemon for bootstrap, rescan, Dashboard, Guard, or other long-running project knowledge workflows.

## Installed Plugin Shape

Codex config contains:

```toml
[marketplaces.alembic]
source = "https://github.com/GxFn/Alembic.git"

[plugins."alembic-codex@alembic"]
enabled = true
```

Codex local plugin cache:

```text
/Users/gaoxuefeng/.codex/.tmp/marketplaces/alembic/plugins/alembic-codex
```

The installed plugin MCP launch command has been patched to avoid local repo `package.json` shadowing the published npm runtime:

```json
["-y", "--prefix", "/tmp", "--package", "alembic-ai@0.0.10", "alembic-codex-mcp"]
```

Why this matters:

- `npx --package alembic-ai@0.0.10 alembic-codex-mcp` can be shadowed when run from inside the Alembic repo/plugin tree.
- `--prefix /tmp` forces npm to resolve the published package from an isolated prefix.
- This makes GitHub/local plugin installs much closer to real user conditions.

## Latest Repo State

Latest relevant commit:

```text
879231a fix codex plugin npx runtime launch
```

The working tree was clean when this status file was created.

Important changed files in that commit:

```text
plugins/alembic-codex/.mcp.json
plugins/alembic-codex/README.md
scripts/verify-codex-plugin.mjs
```

## Validation Already Completed

Local source checks:

```text
npm run verify:codex-plugin
npm run smoke:codex-plugin
```

Both passed after the MCP launch patch.

Manual Codex app checks:

```text
Run Alembic Codex diagnostics for this project
Initialize Alembic Codex in Ghost mode for this project
Check Alembic Codex status for this project
```

Observed result:

- Diagnostics passed.
- Ghost initialization succeeded.
- Status is healthy.
- No `.cursor` or `.vscode/mcp.json` artifacts were created.
- Daemon still stopped and starts on demand.

## Continuation Validation

Continuation run: 2026-05-08.

Codex MCP tools:

```text
alembic_codex_bootstrap
alembic_codex_job
alembic_codex_dashboard
alembic_codex_status
```

Observed result:

- `alembic_codex_bootstrap` returned durable job id `bootstrap_mowsv9k5_d6ad5edd`.
- The job completed successfully and remained queryable through `alembic_codex_job`.
- Bootstrap scanned 120 files, created one target, completed 17 dimension tasks, and reported 0 failed tasks.
- Dashboard handoff returned `http://127.0.0.1:60422`.
- `alembic_codex_status` moved from `ready` with daemon stopped to `ready_daemon_running` after Dashboard/bootstrap startup.
- Ghost mode still kept project knowledge outside the repository data path.
- No `.cursor` or `.vscode/mcp.json` artifacts were created.

HTTP probes:

```text
curl -I http://127.0.0.1:60422
curl http://127.0.0.1:60422/api/v1/jobs/bootstrap_mowsv9k5_d6ad5edd
```

Observed result:

- Dashboard root returned HTTP 200.
- Job API returned the completed bootstrap job.

Local release gates:

```text
npm run verify:codex-plugin
npm run smoke:codex-plugin
npm run release:codex-plugin:daemon
```

Observed result:

- `verify:codex-plugin` passed.
- `smoke:codex-plugin` passed with `install: passed` and `stdio: passed`.
- `release:codex-plugin:daemon` passed when run with permission to bind localhost.
- The daemon smoke verified `recovery: passed` and returned a temporary Dashboard URL.

Sandbox note:

- Running the daemon smoke inside the default command sandbox failed with `listen EPERM: operation not permitted 127.0.0.1`.
- Re-running the same command with localhost listen permission passed.
- This is an expected test-environment permission boundary, not a plugin runtime regression.

## Non-Blocking Note

Vector index initialization was skipped because no vector service / AI provider is configured yet. This does not block plugin installation, diagnostics, Ghost initialization, status checks, or daemon startup behavior.

## Important Version Note

The GitHub/local plugin install now uses the patched `.mcp.json` from the repository.

The published npm runtime is still:

```text
alembic-ai@0.0.10
```

If we want the npm package's bundled plugin files to also include the `--prefix /tmp` MCP launch patch, we need a follow-up release, likely `0.0.11`.

For GitHub/local install testing, the current repository plugin path is already enough.

## Suggested Next Steps

1. Decide whether to release `0.0.11` so npm's bundled plugin files match the GitHub/local install patch.
2. Capture screenshots/GIFs for the future marketplace submission pack.
3. Run one fresh-project manual Codex app pass after any version bump.
4. If public testers use the GitHub/local path before `0.0.11`, point them at `codex-plugin-github-local-install-guide.md`.
