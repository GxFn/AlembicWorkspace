# Codex Plugin Identity Standard

## Purpose

Codex plugins need one stable overall identity that can be used across marketplace
entries, local cache paths, release notes, diagnostics, and support/debugging.

For Alembic, the canonical plugin coordinate is:

```text
gxfn/alembic-codex@0.1.0
```

General formula:

```text
<marketplace-name>/<plugin-name>@<plugin-version>
```

## Current Alembic Values

| Layer | Current value | Source of truth | Role |
| --- | --- | --- | --- |
| Marketplace name | `gxfn` | `.agents/plugins/marketplace.json` | Groups plugins under one marketplace in Codex. |
| Plugin name | `alembic-codex` | `plugins/alembic-codex/.codex-plugin/plugin.json` | Stable plugin identity. |
| Plugin version | `0.1.0` | `plugins/alembic-codex/.codex-plugin/plugin.json` | Installed plugin version. |
| Canonical coordinate | `gxfn/alembic-codex@0.1.0` | Derived from marketplace + plugin manifest | Overall plugin identity. |
| Codex config key | `alembic-codex@gxfn` | Codex local config/cache convention | Installed plugin record. |
| Local cache path | `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.0` | Codex local cache convention | Installed plugin files. |
| Display name | `Alembic` | `plugins/alembic-codex/.codex-plugin/plugin.json` | User-facing UI name only. |
| Channel id | `codex` | `plugins/alembic-codex/runtime/channels/codex/channel.json` | Distribution/runtime channel, not plugin identity. |
| Runtime mode | `plugin` | `ALEMBIC_RUNTIME_MODE` / channel runtime metadata | Generic runtime shape: Alembic is running from a plugin package. |
| Plugin host | `codex` | `ALEMBIC_PLUGIN_HOST` / channel runtime metadata | Concrete plugin host for this install. |
| Runtime package | `alembic-ai` | `plugins/alembic-codex/runtime/package.json` | Embedded npm runtime package, not plugin identity. |
| Runtime specifier | `./runtime.tgz` | `plugins/alembic-codex/.mcp.json` | Local package tarball consumed by `npx`. |
| MCP binary | `alembic-codex-mcp` | `plugins/alembic-codex/runtime/package.json` | Runtime executable, not plugin identity. |
| MCP server key | `alembic` | `plugins/alembic-codex/.mcp.json` | MCP connection name, not plugin identity. |

## Runtime Identity

The runtime identity is separate from the marketplace plugin coordinate. It
answers "what shape is this runtime using right now?" and "which plugin host
started it?"

For Codex:

```text
ALEMBIC_RUNTIME_MODE=plugin
ALEMBIC_PLUGIN_HOST=codex
ALEMBIC_CHANNEL_ID=codex
```

`ALEMBIC_RUNTIME_MODE=plugin` is the generic signal. Shared Alembic runtime code
should use it when it only needs to know that it is running from an installed
plugin package instead of a plain npm/global/dev invocation.

`ALEMBIC_PLUGIN_HOST=codex` is the host-specific signal. Codex-only behavior,
diagnostics, permissions, prompts, or UI copy may branch on this value.

`ALEMBIC_CHANNEL_ID=codex` remains the distribution channel id. It describes the
current packaged channel, not the generic runtime shape.

Future plugin hosts should keep the same mode and set their own host:

```text
ALEMBIC_RUNTIME_MODE=plugin
ALEMBIC_PLUGIN_HOST=claude-code
ALEMBIC_CHANNEL_ID=claude-code
```

The exact future channel id may be decided by that channel manifest, but it must
not replace `ALEMBIC_RUNTIME_MODE=plugin` as the generic plugin signal.

## Naming Rules

Use `gxfn/alembic-codex@<version>` when referring to the whole installed plugin.
This is the identity to use in support messages, release summaries, cache
diagnostics, and marketplace sync logs.

Use `alembic-codex` only when referring to the plugin manifest entry itself.

Use `Alembic` only for UI display text, screenshots, and user-facing labels.

Use `codex` only for the channel id. It means "this runtime/package layout is
for Codex" and must not be used as the plugin id.

Use `plugin` only for the generic runtime mode. It means "plugin-packaged
runtime" and must not be treated as a host name or channel id.

Use `codex` as `ALEMBIC_PLUGIN_HOST` only when the installed plugin host is
Codex. A Claude Code plugin should use its own host id while preserving
`ALEMBIC_RUNTIME_MODE=plugin`.

Use `alembic-ai` only for the runtime npm package. It is the business code
package installed by `npx --package ./runtime.tgz`.

Use `alembic-codex-mcp` only for the MCP executable exposed by the runtime
package.

Use `alembic` only for the MCP server key inside `.mcp.json`.

## Do Not Treat These As The Plugin Identity

- `Alembic`
- `codex`
- `plugin`
- `alembic-ai`
- `alembic-codex-mcp`
- `alembic`
- `GxFn`

They are valid names at their own layer, but the plugin's overall identity is
the canonical coordinate:

```text
gxfn/alembic-codex@<version>
```

## Future Plugin Template

For a new plugin under the same marketplace, use the same model:

```text
gxfn/<plugin-name>@<plugin-version>
```

Each plugin should define:

| Field | Meaning |
| --- | --- |
| `marketplace.name` | Marketplace namespace, e.g. `gxfn`. |
| `plugin.name` | Stable plugin id, e.g. `alembic-codex`. |
| `plugin.version` | Installed plugin version. |
| `interface.displayName` | Human-readable UI name. |
| `channel.id` | Distribution/runtime channel, e.g. `codex`. |
| `runtime.mode` | Generic runtime mode, e.g. `plugin`. |
| `runtime.pluginHost` | Concrete plugin host, e.g. `codex` or `claude-code`. |
| `runtimePackage` | npm runtime package shipped or installed by the plugin. |
| `runtimeBin` | MCP executable or other command entrypoint. |

The canonical coordinate should always be derived from marketplace name,
plugin name, and plugin version rather than from runtime package names or UI
labels.
