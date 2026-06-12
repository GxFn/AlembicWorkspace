# Alembic Plugin Marketplace Runtime Bootstrap

Status: candidate / user-requested / superseded-as-standalone 2026-06-12 — remaining scope folds into the P3 Plugin train's distribution sub-wave per [the portfolio execution plan](../alembic-portfolio-execution-plan/index.md) (packaging partially landed during CKG: thin runtime package, no embedded tarballs in committed state; P0 re-freezes the remainder)
Maintained Window: AlembicWorkspace
Date: 2026-06-11
Design Key: alembic-plugin-marketplace-runtime-bootstrap

## Controller Judgment

The current AlembicPlugin marketplace package shape is not acceptable for public
marketplace validation. The package currently relies on an embedded runtime
directory, a `runtime.tgz`, bundled `node_modules`, and development refresh
paths that can resolve to local absolute files. This is too large and too tied
to the developer machine for market distribution.

The user confirmed a new requirement direction: keep the Codex marketplace
plugin as a lightweight shell and move heavy runtime dependencies into a pinned
npm runtime package installed by the MCP startup path on first use. This differs
from Lark Remote only because Lark Remote is already small enough to ship as a
direct market artifact; AlembicPlugin is not.

## Entry Points

- Requirement design:
  [alembic-plugin-marketplace-runtime-bootstrap-requirement-design-2026-06-11.md](alembic-plugin-marketplace-runtime-bootstrap-requirement-design-2026-06-11.md)
- Candidate demand sequence:
  [alembic-plugin-marketplace-runtime-bootstrap-demand-sequence-2026-06-11.json](alembic-plugin-marketplace-runtime-bootstrap-demand-sequence-2026-06-11.json)

## Evidence Baseline

- Official Codex plugin docs state that `.codex-plugin/plugin.json` is the
  required plugin entry point, `.mcp.json` is an optional bundled MCP server
  config, and marketplace installs load plugins from Codex's plugin cache.
- Local OpenAI curated Build iOS Apps plugin uses `.mcp.json` with `npx -y
  xcodebuildmcp@latest mcp`, proving runtime package execution at MCP launch is
  an accepted shape.
- Local Lark Remote `0.3.0` marketplace artifact uses `.mcp.json` ->
  `node ./bin/lark-remote-start.mjs`; the startup script checks for runtime
  dependencies and runs `npm install` in the plugin cache before launching the
  real MCP entrypoint.
- Lark Remote source artifact is small, so it did not require a separate
  runtime package redesign. AlembicPlugin does: current local evidence showed
  `plugins/alembic-codex` around 265 MB, `runtime` around 243 MB,
  `runtime/node_modules` around 199 MB, and `runtime.tgz` around 22 MB.

## Required Direction

Implement AlembicPlugin market distribution as:

```text
Codex marketplace plugin
  -> .mcp.json
  -> node ./bin/alembic-codex-start.mjs
  -> check pinned runtime package in local runtime cache
  -> if missing or version mismatch, npm install pinned runtime package
  -> node .runtime/node_modules/<runtime-package>/bin/alembic-codex-mcp.js
```

The plugin artifact must not ship `runtime.tgz`, `runtime/`, or
`node_modules/`. Heavy runtime code, AlembicCore embedding, database/runtime
dependencies, and compiled assets belong in the pinned npm runtime package.

## Non-Goals

- Do not redesign Lark Remote; it is already market-functional and only serves
  as local reference evidence.
- Do not assume Codex marketplace install will run `npm install` from the plugin
  `package.json`.
- Do not keep runtime tarballs or vendored `node_modules` in the marketplace
  plugin artifact.
- Do not publish a runtime package that depends on local `file:` paths.
- Do not use `latest` for the production runtime package. The plugin shell must
  pin an exact compatible runtime version.

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 1 | `alembic-plugin-marketplace-runtime-bootstrap-mpb0-market-evidence-audit-2026-06-11` | AlembicWorkspace | Confirm current Codex marketplace constraints, local Lark Remote evidence, OpenAI curated plugin examples, and current Alembic artifact risks. |
| 2 | `alembic-plugin-marketplace-runtime-bootstrap-mpb1-runtime-package-boundary-2026-06-11` | AlembicPlugin | Define and build a real npm runtime package with no local file dependencies and with AlembicCore/runtime assets owned inside the package boundary. |
| 3 | `alembic-plugin-marketplace-runtime-bootstrap-mpb2-plugin-shell-bootstrap-2026-06-11` | AlembicPlugin | Replace `runtime.tgz`/embedded runtime startup with a lightweight marketplace shell and `alembic-codex-start.mjs`. |
| 4 | `alembic-plugin-marketplace-runtime-bootstrap-mpb3-first-run-cache-upgrade-2026-06-11` | AlembicPlugin | Implement first-run install, cached reuse, pinned-version upgrade, lock/concurrency, npm/network failure diagnostics, and no-network cached startup. |
| 5 | `alembic-plugin-marketplace-runtime-bootstrap-mpb4-market-simulation-smoke-2026-06-11` | AlembicPlugin + Test as assigned | Prove clean marketplace install, first MCP launch, tools/list, representative tool calls, second launch without reinstall, and failure surfaces. |
| 6 | `alembic-plugin-marketplace-runtime-bootstrap-mpb5-release-acceptance-archive-2026-06-11` | AlembicWorkspace | Review raw evidence, enforce artifact size/path/dependency gates, and archive the accepted market-ready distribution contract. |

## Stop Conditions

- The plugin artifact still contains `runtime.tgz`, `runtime/`, `node_modules/`,
  developer absolute paths, or local `file:` runtime dependencies.
- The MCP server works only because of the developer checkout, npm link, or
  already-populated local cache.
- First-run install cannot report a clear blocker when npm/network/package
  resolution fails.
- The runtime package cannot pass clean install and representative MCP smoke on
  a fresh machine/cache.
- Implementation deletes existing Alembic functionality instead of changing
  packaging and startup delivery.
