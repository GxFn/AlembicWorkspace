# p15-plugin-host-terminal-seed-projection-repair-t1 Report

- Window: AlembicPlugin
- Task: p15-plugin-host-terminal-seed-projection-repair-t1
- Dispatch group: p15-plugin-host-terminal-seed-projection-repair-p1
- Commit: `68d1e39e0387246239cedd4e0dc31141504c0975`
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`

## Scope

This repair stays inside the AlembicPlugin host MCP/project-index/rescan route output and terminal lifecycle path.

Changed files:

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `test/unit/HostAgentSessionLease.test.ts`

No BiliDili REAL-TEST was run by this window. No BiliDili data files were manually edited. No public tool names, schemas, Core/Main packages, provider config, version metadata, release path, thread ids, PlanStageId/job/source strings, or lifecycle public names were changed.

## Starting Evidence

Controller/Test evidence showed the session-bound Recipe route succeeded but final host rescan output still diverged from persisted SQLite state:

- `submit_knowledge` and `dimension_complete` succeeded.
- Three Recipe ids were bound by `dimension_complete`.
- SQLite coverage was non-empty: `coveredPathCount=138`, `measuredCells=1`, `moduleCount=16`, `targetScopedCells=16`.
- Persisted host/in-process rows were comparable with `diffEmpty=true`.
- Host route output still reported `coverageLedgerSeed.status=inconsistent` due only to persisted count mismatch reasons, while SQLite itself was written and non-empty.
- Host terminal lifecycle was not visible and did not match the full briefing.
- Active BiliDili host session/open round remained visible after the terminal route.

## Repair

The host rescan response now treats clean persisted target-scoped coverage rows as the source of truth for the route-visible `coverageLedgerSeed` projection. Count differences between the initial route seed and the clean persisted seed no longer mark the public route seed as `inconsistent`; the response projects the persisted `written` seed and logs that projection. Persisted aggregate/root coverage cells still mark the seed `inconsistent`, preserving the existing pollution guard.

The terminal no-work path now also handles deepMining runs with zero produce dimensions even when coverage advisory still says `continue`. In that case the workflow releases the empty host-agent session with `stopReason=no-produce-dimensions`, does not expose an action-required lifecycle, and does not open a new deepMining round. Existing action-required behavior for real produce dimensions remains protected by the existing tests.

## Validation

Passed:

- `npx biome check lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts`
- `npx vitest run test/unit/HostAgentSessionLease.test.ts`
- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
- `npm run build:check`
- `npm run build`
- `rg -n "no-produce-dimensions|projected from clean persisted state|coverageLedgerSeedInconsistencyReasons|releases a no-produce|projects clean persisted" lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
- `npm run lint:repo-boundary`
- `npm run lint:core-import-boundary`
- `npm run lint:layer-boundary`
- `git diff --check`
- `git diff --cached --check`

Alembic project tooling:

- `alembic_status` returned the AlembicPlugin project as ready, with a known selected/active project mismatch against BiliDili treated as background only for this target task.
- `alembic_prime` was degraded / knowledge-empty, so raw source reads and repository tests remained the authority.
- `alembic_recipe_map` was partial but identified the touched host rescan symbols.
- `alembic_code_guard` failed twice with MCP internal error `unrecognized key: "data"` / `CODEX_MCP_ERROR`; this is recorded as tool-surface risk, not as code-validation evidence.

## Result

AlembicPlugin commit `68d1e39e0387246239cedd4e0dc31141504c0975` completes this target repair. The host route now projects a clean persisted coverage ledger seed as `written` instead of surfacing count-mismatch `inconsistent`, while preserving aggregate/root inconsistency protection. A no-produce deepMining terminal route releases the empty host-agent session/round and avoids an action-required lifecycle even when coverage advisory says `continue`.

P15 final rerun should remain controller/Test-owned and should wait until the companion Alembic in-process seed repair is accepted, because this window only repaired the Plugin host terminal seed/session/round path.
