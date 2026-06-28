# r3-plugin-doc-map-shared-asset-sync-t1 Report

Target window: AlembicPlugin
Task: r3-plugin-doc-map-shared-asset-sync-t1
Dispatch group: r3-plugin-doc-map-shared-asset-sync-p1
Status: completed

## Summary

Completed the R-3 Plugin documentation-map repair as a docs-only change.
`AGENTS.md` and `CLAUDE.md` now agree on the current `lib/` source layering,
the active Window ledger destination, and the usable path aliases documented from
`package.json` plus real source directories.

Local commit:

- `8ef1ed23ed6e1a6f7f7fdf344dc6ff464e91e8ca` — `Sync plugin doc source map`

## Changed Files

- `AGENTS.md`
- `CLAUDE.md`

## What Changed

- Replaced stale `../workspace-ledger/AlembicPlugin/` file-map destination with
  `../wakeflow-ledger/AlembicPlugin/`, matching the installed Wakeflow window
  ledger card.
- Removed nonexistent `lib/` source-map entries for old Codex/daemon/governance/
  HTTP directories.
- Added current source-map entries for `lib/recipe-generation/**` and
  `lib/runtime/**`, including the host-agent, IDE-agent, host-adapter, and MCP
  runtime subareas.
- Updated path-alias documentation to list the currently usable aliases:
  `#shared/*`, `#infra/*`, `#service/*`, `#inject/*`, `#workflows/*`,
  `#recipe-generation/*`, and `#codex/*`.
- Kept `#codex/*` documented as a live compatibility alias that resolves to
  `lib/runtime/*`; it was not removed or treated as dead.
- Did not change runtime code, package metadata, vendor snapshots, marketplace
  assets, release files, freeze literals, or transport IDs.

## Validation

Passed:

- `git diff --check`
- `git diff --cached --check`
- `npm run check:shared-asset-drift`
  - 11 checks, 0 drift, 0 pending-sync.
- `npm run check:cross-shell-drift`
  - PASS.
- `npm run lint:repo-boundary`
  - Repository boundary check passed.
- Focused stale-doc grep:
  - no matches for old source-map entries `codex`, `daemon`, `governance`, or
    `http`;
  - no matches for stale documented aliases `#governance/*` or `#http/*`;
  - no matches for the stale workspace-ledger destination.
- Focused source/import comparison:
  - both docs cover all 10 real top-level `lib/` directories;
  - both docs cover all 7 usable import aliases whose `alembic-dev` targets
    exist on disk;
  - no stale documented alias remains.
- `rg` check for `#governance/` found no source/test/script consumers; the only
  remaining occurrence is the dead package import entry, which this task did not
  authorize changing.

Not applicable / blocked:

- `npx biome check AGENTS.md CLAUDE.md` is not applicable because Biome config
  ignores both Markdown files; command exited with "No files were processed".
- `alembic_code_guard` is blocked by the installed MCP output-schema issue:
  `CODEX_MCP_ERROR / unrecognized key "data"`. The tool failed before source
  review, so this is recorded as a tool-surface blocker rather than a source
  validation failure.

## Boundary Notes

- This was a documentation-only commit in AlembicPlugin.
- No Core, Alembic main, vendor, marketplace, release, runtime, schema, package,
  lockfile, or freeze literal change was made.
- No push was performed.
- AlembicPlugin `main` is clean and ahead of origin by 4 local commits after
  this commit.

## Residual Risk

- `package.json` still contains a stale `#governance/*` import mapping whose
  target directory is absent and which has no source consumers. This task only
  authorized documentation repair, so the package import itself was left
  untouched for a separately scoped cleanup decision.
