# Alembic Codex Plugin GitHub Local Install Guide

Date: 2026-05-08

This guide is for trusted testers installing the Alembic Codex plugin from the GitHub/local marketplace path before the next npm release.

## What This Path Tests

The GitHub/local marketplace path validates the packaged plugin directory from this repository:

```text
plugins/alembic-codex
```

It still launches the pinned npm runtime:

```text
alembic-ai@0.0.10
```

The repository plugin config includes the local-install launch fix:

```json
["-y", "--prefix", "/tmp", "--package", "alembic-ai@0.0.10", "alembic-codex-mcp"]
```

That `--prefix /tmp` flag keeps `npx` from resolving the local Alembic repository package instead of the published runtime.

## Codex Config

Use a Codex config entry like this:

```toml
[marketplaces.alembic]
source = "https://github.com/GxFn/Alembic.git"

[plugins."alembic-codex@alembic"]
enabled = true
```

After changing the config, restart Codex or open a fresh Codex conversation so the plugin tools and skills are loaded from the marketplace cache.

## First-Minute Test

Run these prompts in a project you are comfortable testing against:

```text
Run Alembic Codex diagnostics for this project
Check Alembic Codex status for this project
Initialize Alembic Codex in Ghost mode for this project
Check Alembic Codex status for this project
Start an Alembic Codex bootstrap job for this project
Open Alembic Codex Dashboard for this project
```

Expected results:

- Diagnostics passes Node, npm, npx, plugin manifest, assets, skills, MCP pin, and admin gate checks.
- Status initially reports `needs_init` on a fresh project.
- Init defaults to Ghost mode.
- Status after init reports `initialized: true`.
- Bootstrap returns a durable job id.
- `alembic_codex_job` can query that job id after the initial tool call.
- Dashboard returns a `http://127.0.0.1:<port>` URL.
- No `.cursor/` or `.vscode/mcp.json` files are created in the project.

## Optional Local Release Checks

From the Alembic repository:

```bash
npm run verify:codex-plugin
npm run smoke:codex-plugin
npm run release:codex-plugin:daemon
```

`release:codex-plugin:daemon` starts a temporary localhost daemon. If a sandbox blocks localhost listening, the command can fail with `listen EPERM: operation not permitted 127.0.0.1`; rerun it in an environment that allows local port binding.

## Known Limitations

- The first run may need npm registry access because the plugin uses pinned `npx`.
- Node.js 22 or newer is required.
- Admin tools are hidden by default. The plugin runs as `agent` tier unless admin mode is explicitly enabled.
- Without an AI provider or vector service, bootstrap can still validate file scanning, daemon startup, job recovery, and Guard audit plumbing, but candidate generation may be limited.
- Plugin uninstall does not delete Alembic data. Use `alembic_codex_cleanup` for explicit cleanup.

## What To Report

Ask testers to report:

- Operating system and Node/npm versions from diagnostics.
- Whether the plugin card appeared and the tools loaded in a new conversation.
- The first failing prompt, if any.
- Redacted `alembic_codex_diagnostics` output.
- The daemon log path from `alembic_codex_status` if Dashboard or bootstrap fails.
