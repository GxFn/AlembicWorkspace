# Alembic Plugin Marketplace Runtime Bootstrap Requirement Design

Status: candidate / user-requested / needs controller intake
Date: 2026-06-11
Design Key: alembic-plugin-marketplace-runtime-bootstrap
Primary Product Window: AlembicPlugin
Related Evidence: local Lark Remote market plugin, official Codex plugin docs,
OpenAI curated plugin examples, current AlembicPlugin package layout

## Problem

AlembicPlugin's current marketplace packaging direction is too heavy and too
developer-machine-dependent for Codex marketplace validation.

The current local Alembic Codex plugin artifact contains an embedded runtime,
`runtime.tgz`, and `runtime/node_modules`. Local inspection showed:

- `AlembicPlugin/plugins/alembic-codex`: around 265 MB.
- `AlembicPlugin/plugins/alembic-codex/runtime`: around 243 MB.
- `AlembicPlugin/plugins/alembic-codex/runtime/node_modules`: around 199 MB.
- `AlembicPlugin/plugins/alembic-codex/runtime.tgz`: around 22 MB.

The installed development cache can also resolve `.mcp.json` to local absolute
paths during dev refresh. That may be useful for local iteration, but it is not
a market-installable contract.

The user-provided screenshot research and official Codex plugin docs converge
on the same rule: Codex marketplace installs a plugin bundle/cache and reads
the plugin manifest and MCP config; it must not be assumed to run `npm install`
from the plugin's `package.json` during marketplace installation. A plugin that
needs heavy runtime dependencies must handle runtime availability on the MCP
startup path, or provide a fully self-contained entrypoint that is small enough
for the marketplace.

## Goal

Redesign AlembicPlugin market distribution so the public plugin artifact is a
small, clean plugin shell and the real Alembic runtime is delivered as a pinned
npm runtime package installed or refreshed by the plugin's MCP startup script.

The observable outcome is:

1. A fresh Codex marketplace install of Alembic produces a small plugin cache
   containing only manifest, MCP config, skills, assets, README, and a startup
   script.
2. The bundled `.mcp.json` starts `node ./bin/alembic-codex-start.mjs`.
3. On first MCP startup, the startup script installs an exact compatible
   runtime package into a local runtime cache if missing or mismatched.
4. On later startup, the script reuses the cached runtime without reinstalling.
5. The real Alembic MCP server starts from the cached runtime package and
   exposes the same agent-facing tools and behavior as the current runtime.
6. Marketplace validation proves there are no runtime tarballs, vendored
   `node_modules`, local absolute paths, or local `file:` dependencies in the
   public plugin artifact.

## Non-goals

- Do not redesign Lark Remote. Lark Remote is already small and market-working;
  it is reference evidence, not a target for this requirement.
- Do not make Codex marketplace install responsible for running `npm install`.
- Do not keep `runtime.tgz` as the public market fallback.
- Do not hide dependency problems by making the plugin output thinner while
  reducing Alembic functionality.
- Do not publish runtime packages that depend on local `file:` paths such as
  `../AlembicCore`.
- Do not use unpinned `latest` runtime resolution in production plugin startup.
- Do not remove Alembic skills, Recipes, Guard, dashboard hooks, daemon support,
  bootstrap/rescan workflows, or current MCP tool behavior as a packaging
  shortcut.

## Primary actors

- Codex marketplace installer: copies or resolves plugin bundles into Codex's
  plugin cache.
- Codex MCP runtime: launches the bundled `.mcp.json` server command from the
  installed plugin cache.
- AlembicPlugin startup script: verifies and installs runtime dependencies,
  then starts the real MCP server.
- Alembic runtime package: owns heavy code, AlembicCore embedding or package
  dependencies, database dependencies, grammars, daemon/runtime assets, and MCP
  implementation.
- Controller/Test: validates clean marketplace install, first-run install,
  cached restart, MCP tool behavior, failure surfaces, and artifact boundaries.

## User stories

- As a Codex user, I can install Alembic from a marketplace and start a new
  thread without manually running `npm install` inside the plugin folder.
- As a Codex user, the first Alembic MCP startup can install the pinned runtime
  package and then expose the same Alembic MCP tools.
- As a Codex user, if network/npm/runtime package resolution fails on first
  startup, I receive a clear actionable error rather than a silent missing-module
  failure.
- As a Codex user, after first startup succeeds, later Alembic MCP starts reuse
  the cached runtime and do not redownload unless the pinned version changes.
- As a plugin reviewer, I can scan the plugin artifact and see no
  `runtime.tgz`, `runtime/`, `node_modules/`, oversized generated files, local
  absolute paths, or local `file:` dependencies.
- As Alembic maintainer, I can bump the runtime package version and have the
  plugin startup path install the new exact version only when needed.
- As controller, I can validate the market artifact, startup install, cached
  reuse, MCP tools/list, representative callTool behavior, and failure branches
  from raw evidence.

## Proposed behavior

### Plugin Shell

The marketplace plugin shell should contain only:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `bin/alembic-codex-start.mjs`
- `skills/`
- `assets/`
- README/LICENSE and minimal config needed by the shell

It must not contain:

- `runtime.tgz`
- `runtime/`
- `node_modules/`
- packaged npm cache
- local checkout paths
- package metadata that implies Codex marketplace installation will run
  dependency installation

### MCP Config

The bundled `.mcp.json` should use a relative command shape similar to:

```json
{
  "mcpServers": {
    "alembic": {
      "command": "node",
      "args": ["./bin/alembic-codex-start.mjs"],
      "cwd": ".",
      "env": {
        "ALEMBIC_CHANNEL_ID": "codex",
        "ALEMBIC_PLUGIN_HOST": "codex",
        "ALEMBIC_CODEX_MCP_MODE": "1",
        "ALEMBIC_RUNTIME_MODE": "plugin"
      }
    }
  }
}
```

No absolute path may appear in the market `.mcp.json`.

### Runtime Package

Create a real npm runtime package, candidate name
`@gxfn/alembic-codex-runtime`, with a pinned version such as `0.3.x`.

The runtime package owns:

- compiled AlembicPlugin MCP/runtime code;
- AlembicCore dependency or embedded Core package in a publishable form;
- grammars/resources;
- default config/templates/injectable skills/channels needed at runtime;
- database/runtime dependencies;
- `bin/alembic-codex-mcp` or equivalent runtime entrypoint.

It must not depend on local `file:` paths. If AlembicCore remains embedded, the
runtime package must treat it as package-internal runtime content. If Core is
published separately, the runtime package must pin its Core dependency.

### Startup Script

`bin/alembic-codex-start.mjs` should:

1. Determine `pluginRoot` from `import.meta.url`, not from developer paths.
2. Determine a runtime cache directory. Preferred order:
   - a Codex-provided writable plugin data directory if available and verified;
   - plugin-root `.runtime/` as fallback when writable;
   - a documented user cache directory as last resort.
3. Check installed runtime package `package.json` for exact expected version.
4. Acquire a cross-process startup/install lock.
5. If missing or version-mismatched, run npm install for the exact runtime
   package into the cache directory.
6. Verify the runtime package entrypoint exists after install.
7. Spawn the real Alembic MCP entrypoint with inherited stdio.
8. Preserve current Alembic MCP environment and project-root semantics.
9. Return clear structured stderr diagnostics for:
   - npm missing;
   - network unavailable;
   - package not found;
   - install failed;
   - version mismatch after install;
   - runtime entrypoint missing;
   - cache not writable;
   - startup lock timeout/stale lock.

The Lark Remote `bin/lark-remote-start.mjs` is a local reference for this
pattern, but Alembic must not blindly copy its install flags. Lark Remote can
use `--ignore-scripts` because its dependency set is small and pure-JS enough
for that path. Alembic currently depends on heavier runtime/database packages,
so implementation must explicitly decide whether to:

- eliminate native install requirements from the runtime package;
- allow necessary package install scripts with a justified security boundary;
- or ship a self-contained runtime package that does not need native postinstall
  behavior.

### Version And Upgrade Semantics

The shell pins one exact runtime version. Startup should not use `latest`.

On each MCP startup:

- if cached version matches, start immediately;
- if cached version is missing, install pinned version;
- if cached version differs, install or replace with pinned version;
- if install fails and an older cached runtime exists, do not silently run the
  wrong version unless the design explicitly defines a safe downgrade mode and
  labels the output degraded.

### Market Artifact Boundary

Release packaging must produce two artifacts:

1. Plugin shell artifact for Codex marketplace.
2. Runtime npm package for Alembic MCP implementation.

The shell artifact may be small enough to scan and review. The runtime package
may be larger, but it is distributed through npm's normal package mechanism and
installed on the MCP startup path.

## Implementation decisions

- Use Lark Remote `0.3.0` as the local proven market-shape reference for
  `.mcp.json -> node ./bin/*start.mjs -> ensure deps -> spawn real MCP`.
- Do not use Lark Remote's small-package direct artifact as the Alembic target;
  Alembic's current runtime footprint requires extraction to npm runtime.
- Replace `runtime.tgz` wrapper startup with npm runtime bootstrap.
- Preserve current Alembic agent-facing MCP tools and clean output behavior.
- Preserve Alembic skills in the shell plugin so Codex can still discover
  Alembic setup/status/Recipes/Guard usage guidance before runtime starts.
- Keep development refresh paths separate from market artifact paths. Dev tools
  may point to local `dist/bin/codex-mcp.js`; market `.mcp.json` must not.
- Add release verification gates that fail on forbidden artifact contents and
  absolute paths.

## Testing decisions

Controller and product windows should require raw validation, not document-only
claims.

Minimum self-tests in AlembicPlugin:

- Unit tests for `alembic-codex-start.mjs` runtime detection, version mismatch,
  install command construction, lock behavior, cache selection, and error
  classification.
- Package-boundary tests proving the plugin shell artifact excludes
  `runtime.tgz`, `runtime/`, `node_modules/`, local absolute paths, and `file:`
  dependencies.
- Runtime package tests proving clean `npm pack`, clean install from tarball or
  registry, runtime entrypoint exists, and no local file dependency remains.
- MCP smoke from a clean plugin cache:
  - first launch installs pinned runtime;
  - tools/list returns Alembic tools;
  - representative status/diagnostics/bootstrap or prime tool calls work;
  - second launch reuses cached runtime without reinstall;
  - network-disabled second launch still works when cache exists.
- Failure probes:
  - npm not found;
  - cache not writable;
  - package install failure;
  - package version mismatch;
  - runtime entrypoint missing;
  - concurrent startup.

Use Test only for real marketplace simulation that needs a clean external
environment, Codex plugin reload, or runtime observation that product unit tests
cannot prove.

## Acceptance criteria

- Official Codex plugin docs and local Lark Remote evidence are cited in the
  controller evidence package.
- The Alembic marketplace plugin artifact contains no `runtime.tgz`, `runtime/`,
  `node_modules/`, local absolute path, or local `file:` dependency.
- The plugin shell starts through relative `.mcp.json` and a local startup
  script.
- The startup script installs an exact pinned runtime package only when missing
  or mismatched.
- Cached second launch works without reinstalling and without network.
- Clean first launch from an empty cache produces a working MCP tools/list and
  representative Alembic tool call.
- Runtime package installation and startup do not depend on the developer
  checkout.
- Failure branches return actionable diagnostics and non-zero exit status
  instead of hanging or silently starting a wrong runtime.
- Existing Alembic MCP behavior, skills, Recipe/Guard/Decision capabilities,
  and bootstrap/rescan workflows remain functionally complete.
- Controller final acceptance reviews raw package sizes, file lists, install
  logs, MCP JSON, tools/list output, representative callTool output, and failure
  probe logs.

## Risks and open questions

- Alembic's current native/heavy dependencies may not work with Lark Remote's
  `--ignore-scripts` install flags. The implementation must decide and validate
  the runtime dependency strategy.
- It must be verified whether Codex sets writable plugin data environment
  variables for MCP servers. Official docs explicitly mention `PLUGIN_ROOT` and
  `PLUGIN_DATA` for hooks; MCP startup must not rely on those variables unless
  runtime evidence proves they are present.
- Runtime package publishing and version pinning must not break local
  development refresh workflows.
- If npm registry access is unavailable on first use, the plugin cannot install
  the runtime. This is acceptable only with a clear blocker and documented
  offline preinstall path.
- If an older cached runtime exists, fallback behavior must be explicitly
  decided; silent downgrade is not acceptable.

## Controller intake notes

This requirement is ready for controller intake as a new independent demand. It
should not be appended as D33 or CR8 to the completed interface/compatibility
sequences unless the controller deliberately chooses that route.

Recommended next step:

1. Claim MPB0 to audit current market evidence and artifact boundaries.
2. Dispatch AlembicPlugin implementation only after MPB0 confirms exact
   package names, runtime dependency strategy, and validation commands.
3. Hold final acceptance until clean market simulation proves first-run install,
   cached restart, and representative MCP behavior.

## Source references

- User-provided screenshots of Codex plugin marketplace behavior. Local
  clipboard paths are intentionally omitted from the long-term ledger.
- OpenAI Codex plugin docs:
  `https://developers.openai.com/codex/plugins`
- OpenAI Codex plugin build docs:
  `https://developers.openai.com/codex/plugins/build`
- OpenAI curated Build iOS Apps local cache `.mcp.json`, observed under the
  installed Codex plugin cache.
- Local Lark Remote market source `.mcp.json`.
- Local Lark Remote startup reference `plugins/codex-lark-remote/bin/lark-remote-start.mjs`.
- Local Lark Remote plugin manifest `plugins/codex-lark-remote/.codex-plugin/plugin.json`.
- Current Alembic Codex plugin manifest:
  `AlembicPlugin/plugins/alembic-codex/.codex-plugin/plugin.json`
- Current Alembic Codex plugin MCP config:
  `AlembicPlugin/plugins/alembic-codex/.mcp.json`
- Current Alembic runtime wrapper:
  `AlembicPlugin/plugins/alembic-codex/bin/alembic-codex-mcp-wrapper.mjs`
- Current Alembic runtime packager:
  `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs`
