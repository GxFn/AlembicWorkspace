# Target report: p15-plugin-host-bootstrap-rebuild-session-release-repair-t1

Window: AlembicPlugin
Task: p15-plugin-host-bootstrap-rebuild-session-release-repair-t1
Dispatch group: p15-plugin-host-bootstrap-rebuild-session-release-repair-p1
State root: .wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26

## Result

Completed in AlembicPlugin commit:

- `0d1c257a632186b72fea820b81ca9a467156d03d` (`Release empty bootstrap session before rescan`)

Changed files:

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/recipe-generation/host-agent-workflows/project-context-analysis.ts`
- `test/unit/HostAgentSessionLease.test.ts`

## Repair summary

- `alembic_rescan` now opt-in releases same-project fresh empty host-agent bootstrap sessions before acquiring its own rescan lease.
- The shared session-release helper keeps default stale-only behavior for ordinary callers; fresh cleanup is explicit through `allowFreshEmpty`.
- Sessions that contain submitted evidence remain protected even when the rescan route allows fresh empty cleanup.
- This targets the P15 blocker where an authorized `alembic_bootstrap rebuild:true` reset left a fresh empty durable session that caused the next `alembic_rescan` to fail with `BOOTSTRAP_IN_PROGRESS`.

## Evidence

- Targeted unit regression:
  - `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: 2 files, 17 tests.
- Formatter/file lint:
  - `npx biome check lib/recipe-generation/host-agent-workflows/project-context-analysis.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS.
- Repository boundaries:
  - `npm run lint:repo-boundary`
  - PASS.
  - `npm run lint:core-import-boundary`
  - PASS, scanned 441 files and 445 `@alembic/core` imports.
  - `npm run lint:layer-boundary`
  - PASS.
- Type/build:
  - `npm run build:check`
  - PASS, Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
  - `npm run build`
  - PASS, Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- Whitespace:
  - `git diff --check`
  - PASS.
  - `git diff --cached --check`
  - PASS before commit.
- Source/dist marker proof after build:
  - `rg -n "allowFreshEmpty|rescan-route-replaces-empty-bootstrap-session|Released stale empty host-agent lease|fresh empty bootstrap rebuild-boundary session" lib/recipe-generation/host-agent-workflows/project-context-analysis.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts dist/lib/recipe-generation/host-agent-workflows/project-context-analysis.js dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
  - PASS: markers present in source and generated dist output.

Alembic Guard:

- `alembic_code_guard` was attempted with explicit changed-file scope.
- Result: failed with Alembic MCP internal schema error: `unrecognized key "data"`.
- This is recorded as a tooling risk, not as a code validation pass.

## Boundaries

- No BiliDili REAL-TEST was run from this AlembicPlugin window.
- No BiliDili SQLite, session, or round files were manually edited.
- No AlembicCore API change was needed; existing `clearSession` semantics were sufficient for empty-session release.
- Public MCP tool names, response `tool` values, lifecycle strings, coverage/deep-mining schemas, export paths, provider config, package versions, and release assets were not changed.
- No push was performed.

## Remaining risk

- Controller/Test should rerun the P15 BiliDili parity scenario to prove the real host route no longer fails `alembic_rescan` with `BOOTSTRAP_IN_PROGRESS` after authorized rebuild/reset.
- The repair intentionally releases only empty sessions. If a future reset route leaves a session with submitted evidence but still needs cancellation, that would require a separate controller decision or Core-owned completion/cancel API.
