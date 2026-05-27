# Codex Plugin Local Development Verification

Date: 2026-05-13

## Goal

Local Alembic plugin development needs one reliable loop:

1. rebuild source code,
2. regenerate the embedded Codex plugin runtime,
3. refresh every installed local Codex plugin cache exactly,
4. prove the installed MCP runtime sees the expected project root.

This avoids the common false green where tests pass against `dist/` but Codex
Desktop is still running an older cached plugin copy.

## Commands

Use the full local check before handing off plugin behavior:

```bash
npm run dev:codex-plugin:verify
```

For tight code iteration:

```bash
npm run dev:codex-plugin:refresh
```

For continuous local development:

```bash
npm run dev:codex-plugin:watch
```

For a quick installed-cache probe after restarting Codex Desktop:

```bash
npm run dev:codex-plugin:probe-installed
```

## Refresh Model

`scripts/sync-codex-plugin-cache.mjs` now refreshes cache roots through a staging
directory and then renames the staging copy into place. The script also writes:

```text
.alembic-dev-refresh.json
```

inside the installed plugin cache. That marker records:

- source repository path,
- target cache root,
- refresh mode,
- git commit,
- package and plugin versions,
- hashes for `.mcp.json`, manifest, `runtime.tgz`, and the MCP wrapper.

The dev verifier passes `--all-installed`, so both the standalone
`alembic-codex/alembic-codex/<version>` cache and the older `gxfn/alembic-codex/<version>`
cache are refreshed when present.

## Runtime Modes

Default local development uses `local-mcp` mode. In that mode the installed
plugin shell stays in the Codex cache, but `.mcp.json` is rewritten to launch:

```text
node <repo>/dist/bin/codex-mcp.js
```

This makes every `npm run build` visible to the next MCP process without
requiring a full marketplace reinstall. Skill, manifest, and asset changes still
require cache refresh because those files live in the installed plugin shell.

`dev:codex-plugin:watch` polls the runtime source, Dashboard source, plugin
shell, packaging scripts, and metadata inputs. It avoids recursive filesystem
watcher fd limits, debounces file changes,
serializes refreshes so two refreshes cannot overwrite each other, and reruns a
queued refresh if files change while a previous refresh is still running.

Packaged runtime mode is still available:

```bash
node scripts/dev-verify-codex-plugin.mjs --packaged
```

That probes through the production wrapper and `runtime.tgz`.

## MCP Startup Stability

The production `.mcp.json` launches:

```text
node ./bin/alembic-codex-mcp-wrapper.mjs
```

The wrapper uses a plugin-specific npm cache and a startup lock, then invokes:

```text
npx --package ./runtime.tgz alembic-codex-mcp
```

This keeps `./runtime.tgz` relative to the installed plugin root, reuses npm
artifacts between launches, and avoids shared `_npx` install directory races
during repeated local verification or Codex Desktop restarts.

## Project Root Probe

The installed-cache probe runs three checks against each target cache root:

1. `alembic_codex_status` with explicit `projectRoot` must report
   `source: explicit-option` and `trust: trusted`.
2. A fresh MCP process with the same temporary Alembic home and no `projectRoot`
   must recover `source: saved-project-root`.
3. A fresh Alembic home with no saved root and plugin-cache `INIT_CWD/PWD` must
   fail closed with `CODEX_PROJECT_ROOT_REJECTED` or `CODEX_PROJECT_ROOT_UNRESOLVED`.

The probe uses temporary `ALEMBIC_HOME` by default, so it does not modify the
developer's real `~/.asd/codex-project-root.json`.

## Desktop Reload Boundary

The refresh script updates files on disk, but an already running Codex Desktop
MCP process may still have old JavaScript loaded in memory. After a refresh,
the watch script locates Alembic Codex MCP processes that were launched from the
local `dist/bin/codex-mcp.js` entry or the refreshed installed plugin cache and
stops them with `SIGTERM`. The next Codex tool call then starts a fresh MCP
process from the latest build.

If you only run `dev:codex-plugin:refresh`, restart Codex Desktop or start a
fresh conversation before using the plugin through the actual app. The probe
verifies the installed files themselves; the Desktop process boundary remains
host-controlled unless the watch script is managing it.
