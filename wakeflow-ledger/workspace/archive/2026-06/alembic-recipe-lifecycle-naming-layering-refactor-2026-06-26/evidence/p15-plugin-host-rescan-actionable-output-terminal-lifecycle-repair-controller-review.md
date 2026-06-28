# P15 AlembicPlugin Host Rescan Actionable Output Terminal Lifecycle Repair Controller Review

Reviewed at: 2026-06-29

Dispatch group: `p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-p1`

Target task: `p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1`

Decision: accept target result; P15 remains open for a fresh real BiliDili Test rerun.

## Scope Reviewed

- Target result:
  `target-results/target-result-p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1.json`
- Target report:
  `evidence/p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1-report.md`
- Task package:
  `task-packages/p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-p1.json`
- Prior Test blocker review:
  `evidence/p15-bilidili-final-parity-rerun-after-bootstrap-session-release-repair-controller-review.md`
- AlembicPlugin commit:
  `2c03793562995c88fcf74b7e12ce48073e287453` (`Expose rescan action-required lifecycle`)

## Raw Evidence Reviewed

- `git show --stat --oneline --no-renames 2c03793562995c88fcf74b7e12ce48073e287453`
  showed the change is confined to:
  - `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - `lib/runtime/mcp/core-tools/output.ts`
  - `test/unit/HostAgentSessionLease.test.ts`
  - `test/unit/McpCoreToolsCleanOutputContract.test.ts`
- Source diff review found:
  - actionable deepMining `alembic_rescan` now attaches `hostAgentLifecycle`;
  - `hostAgentLifecycle.state` is `action-required`;
  - `hostAgentLifecycle.actionRequired` is `true`;
  - `hostAgentLifecycle.terminal` is `false`;
  - `terminalGate.pass` is `false` with reason `host-agent-action-required`;
  - the field preserves the observed coverage state, including `measuredCells=0`, and records the open host-agent rescan round;
  - productive host-agent session/round state remains open for session-bound `alembic_submit_knowledge` and `alembic_dimension_complete`;
  - existing no-actionable terminal cleanup remains separate and still releases only terminal no-output paths.
- Clean-output review found `hostAgentLifecycle` added to the `alembic_rescan` MCP clean-output allowlist, so the live host clean output can expose the new lifecycle signal instead of hiding it behind full briefing data.
- Test diff review found focused coverage for:
  - action-required lifecycle is surfaced while the productive session and round stay open;
  - clean MCP projection keeps `hostAgentLifecycle` and rejects legacy broad output leakage.

## Controller Verification

- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: 3 files, 27 tests.
- `npx biome check lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts lib/runtime/mcp/core-tools/output.ts test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - PASS.
- `npm run lint:repo-boundary`
  - PASS; escape hatch count 0 / 75.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run lint:core-import-boundary`
  - PASS; scanned 441 files and 445 `@alembic/core` imports.
- `npm run lint:layer-boundary`
  - PASS.
- `npm run build`
  - PASS; regenerated ignored runtime `dist/`.
- `git diff --check`
  - PASS.
- Post-build marker check:
  - PASS: `hostAgentLifecycle`, `action-required`, and `host-agent-action-required` appear in source, tests, and regenerated ignored `dist/` output.
- Final AlembicPlugin worktree status after controller verification:
  - clean.

## Controller Findings

- The repair matches the assigned fork in the task package: when `ready` means external host-agent work is still required, Plugin now makes that state explicit instead of allowing a clean-output consumer to infer terminal success from `status=ready`.
- The implementation does not satisfy P15 by itself, and it correctly does not pretend to. It preserves `measuredCells=0`, keeps productive session/round state open, and exposes `terminal=false`.
- This is a behavior improvement over the previous Test blocker: the controller and Test can now distinguish a real source bug from a valid host-agent action-required state.
- The change is inside AlembicPlugin. It does not edit Core, Alembic main, Test, BiliDili source/data, public tool names, response `tool` values, lifecycle/table/schema/export frozen strings, package versions, release assets, or G6 cleanup.
- Alembic MCP `alembic_work` and `alembic_code_guard` failed in the target with the known internal schema error `unrecognized key "data"`. This remains a tooling risk and is not counted as a pass.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: AlembicPlugin host-agent rescan actionable-output and terminal lifecycle repair after Test proved host rescan returned ready while leaving productive session/round state open and `measuredCells=0`.
- Original requirement authority: the prior controller review required Plugin either to expose the action-required state explicitly or to finish/close the route with real session-bound evidence. It forbade blank measured coverage, synthetic Recipe ids, broad session release, manual BiliDili DB edits, and frozen public contract drift.
- Target/window: AlembicPlugin / `p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1`.
- Evidence reviewed: target result/report, task package, prior Test blocker review, commit diff, source/test inspection, controller-run focused tests, clean-output contract tests, build check, build, boundary checks, diff check, and source/dist marker proof.
- Implementation reality: `alembic_rescan` now surfaces `hostAgentLifecycle.actionRequired=true`, `terminal=false`, and `terminalGate.pass=false` for productive deepMining rescan responses that still require host-agent Recipe evidence. Productive session and round state remain open by design.
- Validation result: controller verification passed for this Plugin scope.
- Blockers for this target: none.
- Missing evidence: real BiliDili host-vs-in-process rerun has not yet verified the live MCP clean output after commit `2c03793562995c88fcf74b7e12ce48073e287453`; P15 G4 remains unproven.
- Residual risks: if the next Test run proves the live clean output still hides `hostAgentLifecycle`, this returns to AlembicPlugin. If the signal is present, the remaining gap is real session-bound Recipe evidence and terminal cleanup, not this Plugin output repair.
- TODO/backlog rollup: accept this Plugin repair and create the next BiliDili Test rerun focused on the live action-required lifecycle signal and P15 gate classification.
- Decision: accept-target-result.
- Next action: create and dispatch a Test rerun after this Plugin repair.

## Forbidden Conclusions

- Do not complete or archive the demand from this Plugin result.
- Do not accept P15 final parity, G4, or G6 from source/unit evidence.
- Do not treat `hostAgentLifecycle.actionRequired=true` as final success.
- Do not mark blank seed rows as measured coverage.
- Do not manually clean BiliDili SQLite/session/round state.
- Do not dispatch Alembic main or Core repair unless the next live Test proves an independent source defect.
- Do not push, version, release, or remove compatibility aliases from this evidence.
