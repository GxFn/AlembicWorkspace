# P15 AlembicPlugin Host Rescan Target Axis / Round Cleanup Repair

Target task: `p15-plugin-host-rescan-target-axis-round-cleanup-repair-t1`

Commit: `3be8e5182c7d8cd568a9d0b327a030a815ee82a0`

## Scope

Changed AlembicPlugin only:

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `test/unit/RescanCoverageModuleAxis.test.ts`
- `test/unit/HostAgentSessionLease.test.ts`

No Core, Alembic main, BiliDili source/data, provider config, release assets, package versions, public MCP tool names, response tool values, stage/job/source/lifecycle literals, or coverage table schema names were changed.

## Failure Authority Reviewed

Controller/Test evidence for the P15 BiliDili final parity rerun showed the host MCP `alembic_rescan` path persisted only aggregate/root coverage rows (`BiliDili`, `module:root:*`), produced aggregate/root advisory gaps, had zero target-scoped/measured rows, and left a host-agent rescan round/session open. The in-process path later produced target-scoped seed evidence, but the host-polluted SQLite ledger made normalized parity invalid.

## Repair Summary

- Host rescan module-axis selection now rejects aggregate/root ProjectMap modules and can synthesize target-scoped module ids from ProjectContext repo targets plus source file facts when ProjectMap only exposes aggregate/root modules.
- Coverage seed metadata now summarizes actual written candidate cells, including target-scoped, measured, usable, and aggregate/root-id counts. The clean public projector still preserves the existing public seed contract.
- Terminal no-actionable host-agent rescan cleanup now releases the empty session and closes the latest open `host-agent-rescan` round best-effort, with explicit `closedOpenRound` metadata.
- Added focused regression coverage for aggregate/root rejection and terminal round/session cleanup.

## Source And Dist Proof

After `npm run build`, source and runtime output both contain the repair markers:

- `project-context-targets`
- `targetScopedCells`
- `aggregateOrRootModuleIds`
- `closedOpenRound`
- `host-agent rescan round close skipped`
- existing target-scoped advisory log marker

Checked with:

```sh
rg -n "project-context-targets|targetScopedCells|aggregateOrRootModuleIds|closedOpenRound|host-agent rescan round close skipped|target-scoped" \
  lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts \
  dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js
```

## Validation

- `npx vitest run test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentSessionLease.test.ts` => PASS, 2 files, 14 tests.
- `npm run build:check` => PASS, `tsc --noEmit`; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npx biome check lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentSessionLease.test.ts` => PASS.
- `npm run lint:repo-boundary` => PASS, escape hatch count `0 / 75`.
- `npm run lint:core-import-boundary` => PASS, scanned 441 files and 445 `@alembic/core` imports.
- `npm run build` => PASS, built local `dist/` runtime.
- `git diff --check` before commit => PASS.
- `git diff --check HEAD~1 HEAD` after commit => PASS.
- Post-commit `git status --short --branch` => `main...origin/main [ahead 4]`, clean.

## Guard

`alembic_code_guard` was attempted with explicit changed-file scope and again with minimal single-file scope. Both attempts failed before producing code findings with the existing Alembic MCP internal schema error:

```text
unrecognized key: "data"
```

This is recorded as a tooling risk, not a source finding. Local source review plus repository tests/build/lint checks above passed.

## Boundaries And Risks

- BiliDili REAL-TEST was not run from this AlembicPlugin window, per task package. Controller/Test should rerun P15 real parity after review.
- This repair avoids aggregate/root ledger pollution and closes the terminal host-agent round/session path; real host-vs-in-process parity still requires Test confirmation on the live BiliDili route.
- No push was performed.
