# Target report: p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1

Window: AlembicPlugin
Task: p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1
Dispatch group: p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-p1
State root: .wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26

## Result

Completed in AlembicPlugin commit:

- `773dd9563d1282ede4fc5397137e98a173186ef2` (`Fix host rescan terminal cleanup consistency`)

Changed files:

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `test/unit/HostAgentSessionLease.test.ts`

## Repair summary

- Terminal `host-agent-rescan` advisory stop reasons now release no-work deepMining sessions even when produce dimensions exist for terminal stop reasons (`diminishing-returns`, `round-cap`).
- Terminal cleanup now closes every open `host-agent-rescan` round for the project root, not only the latest open round, and reports `closedOpenRounds`.
- Coverage ledger seed metadata is reconciled against persisted ledger cells before the final rescan response is returned.
- If persisted ledger state still contains aggregate/root coverage rows, or route-visible counts disagree with persisted counts, the response marks the seed `status: inconsistent` and emits a diagnostic reason instead of presenting a clean target-only seed.
- Measured seed cells now require real covered evidence (`coveredCount > 0` or `coveredSourceRefs`) so thin seeded cells are not counted as measured evidence.

## Evidence

- Targeted unit regression:
  - `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: 2 files, 15 tests.
- Formatter/file lint:
  - `npx biome check lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
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
  - `rg -n "inconsistent|closedOpenRounds|persisted-aggregate-or-root-coverage-cells|persisted-measured-cell-count-mismatch|diminishing-returns|round-cap|coverage ledger seed reconciled with persisted state" lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
  - PASS: markers present in source and generated dist output.

Additional broad check:

- `npm run lint`
- Exit 0. The command reported existing broad warnings in unrelated files such as `lib/runtime/host-adapter/ClaudeCodeHostAdapter.ts` and several scripts. The changed source file passed the targeted Biome check above.

Alembic Guard:

- `alembic_code_guard` was attempted with explicit changed-file scope.
- Result: failed with Alembic MCP internal schema error: `unrecognized key "data"`.
- This is recorded as a tooling risk, not as a code validation pass.

## Boundaries

- No BiliDili REAL-TEST was run from this AlembicPlugin window.
- No Core delete/prune API was added or called; stale persisted aggregate/root cells are diagnosed rather than manually removed from Plugin code.
- Public MCP tool names, response tool values, lifecycle/stage/source strings, coverage table names, provider config, release assets, and package metadata were not changed.
- No push was performed.

## Remaining risk

- Controller/Test should rerun the BiliDili parity scenario to prove the host route now closes terminal sessions/rounds and surfaces persisted seed inconsistency correctly in the live route.
- If stale aggregate/root coverage rows must be physically removed from persisted state, that requires a Core-owned ledger pruning/delete capability or reset/rebuild path; Plugin did not invent one in this task.
