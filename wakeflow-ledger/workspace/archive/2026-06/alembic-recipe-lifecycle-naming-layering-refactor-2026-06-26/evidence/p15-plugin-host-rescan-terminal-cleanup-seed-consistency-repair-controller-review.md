# P15 AlembicPlugin Host Rescan Terminal Cleanup Seed Consistency Repair Controller Review

Reviewed at: 2026-06-29

Dispatch group: `p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-p1`

Target task: `p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1`

Decision: accept target result; P15 remains open for a fresh real BiliDili Test parity rerun with an explicit BiliDili-only rebuild/reset boundary.

## Scope Reviewed

- Target result: `target-results/target-result-p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1.json`.
- Target report: `evidence/p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1-report.md`.
- Task package: `task-packages/p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-p1.json`.
- Prior Test blocker review: `evidence/p15-bilidili-final-project-index-parity-rerun-after-plugin-host-rescan-repair-controller-review.md`.
- Prior Plugin repair review: `evidence/p15-plugin-host-rescan-target-axis-round-cleanup-repair-controller-review.md`.
- AlembicPlugin commit: `773dd9563d1282ede4fc5397137e98a173186ef2` (`Fix host rescan terminal cleanup consistency`).

## Raw Evidence Reviewed

- `git show --stat --oneline --no-renames 773dd9563d1282ede4fc5397137e98a173186ef2` showed changes confined to:
  - `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - `test/unit/HostAgentSessionLease.test.ts`
- Source review found:
  - route-visible `coverageLedgerSeed` is reconciled against persisted `coverage_ledger` rows before the final rescan response is returned;
  - persisted aggregate/root rows or persisted-vs-route count mismatches now produce `status: "inconsistent"` with diagnostic reasons instead of a clean-looking seed;
  - `measuredCells` now requires real covered evidence (`coveredCount > 0` or `coveredSourceRefs`), so thin seeded cells are not counted as measured coverage;
  - terminal advisory stop reasons `diminishing-returns` and `round-cap` release no-work sessions even when produce dimensions exist;
  - terminal cleanup closes every open `host-agent-rescan` round for the project root and reports `closedOpenRounds`, instead of only closing the latest open round.
- Test review found:
  - terminal deepMining session test now covers two open host-agent rounds, releases the empty session, and closes both stale and current rounds;
  - productive deepMining with actionable produce work remains open for non-terminal `converged` advisory;
  - persisted aggregate/root coverage rows are surfaced as inconsistent seed state with `measuredCells=0` rather than hidden behind target-only route counts.

## Controller Verification

- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/RescanCoverageModuleAxis.test.ts`
  - PASS: 2 files, 15 tests.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run lint:repo-boundary`
  - PASS; escape hatch count 0 / 75.
- `npm run lint:core-import-boundary`
  - PASS; scanned 441 files and 445 `@alembic/core` imports.
- `npm run lint:layer-boundary`
  - PASS; no L1 to L2 backslip.
- `git diff --check`
  - PASS.
- `rg -n "inconsistent|closedOpenRounds|persisted-aggregate-or-root-coverage-cells|persisted-measured-cell-count-mismatch|diminishing-returns|round-cap|coverage ledger seed reconciled with persisted state" lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
  - PASS: repair markers present in source and built runtime.

## Controller Findings

- This repair directly addresses the accepted Test blocker after Plugin commit `3be8e5182c7d8cd568a9d0b327a030a815ee82a0`: host rescan could create or leave open rounds under terminal advisory and could present route-visible seed counts that disagreed with persisted SQLite rows.
- The repair stays inside AlembicPlugin host knowledge-rescan and adjacent tests. It does not change Core, Alembic main, Test, BiliDili source/data, provider configuration, public MCP tool names, response `tool` values, PlanStageId/job/source/lifecycle strings, `coverage_ledger` or `deep_mining_rounds` schema names, release assets, package version, compatibility aliases, or G6 cleanup.
- The task allowed either safe consistency using existing APIs or an explicit diagnostic/blocker when stale aggregate/root persisted rows could not be safely pruned from Plugin. The commit chooses the diagnostic route and does not invent a Core delete/prune API or manually edit data.
- Because no real BiliDili Test was run from AlembicPlugin, this review accepts only the source repair. It does not prove final P15 parity or G4/G6.

## Controller Acceptance

- User goal: finish the Recipe lifecycle naming/layering refactor through P15 hard gates.
- Scope reviewed: AlembicPlugin repair for host rescan terminal cleanup and route-visible seed/persisted-ledger consistency.
- Original requirement authority: P15 blocker review and task package required closing/fail-closing terminal host-agent rescan rounds, releasing empty sessions, and preventing success-looking seed output that hides persisted aggregate/root rows.
- Target/window: AlembicPlugin / `p15-plugin-host-rescan-terminal-cleanup-seed-consistency-repair-t1`.
- Evidence reviewed: target result/report, task package, prior blocker reviews, commit diff, source tests, controller-run focused tests, build check, boundary lint, diff check, and source/dist marker proof.
- Implementation reality: host knowledge-rescan now closes all open terminal host-agent-rescan rounds and reconciles the route-visible seed with persisted ledger state, marking persisted aggregate/root or count mismatches as inconsistent.
- Validation result: controller verification passed.
- Blockers for this target: none.
- Missing evidence: real BiliDili host-vs-in-process parity has not yet been rerun after commit `773dd9563d1282ede4fc5397137e98a173186ef2`.
- Residual risks: stale aggregate/root persisted rows are diagnosed, not physically pruned; the next Test run must use an explicit BiliDili-only rebuild/reset boundary and then verify the live route against P15 predicates.
- TODO/backlog rollup: accept this Plugin repair and create the next P15 Test rerun. Do not add a Core pruning task unless the clean rerun still proves stale aggregate/root rows survive valid rebuild/reset or that a real delete/prune API is required.
- Decision: accept-target-result.
- Next action: create and dispatch a Test rerun that proves SQLite integrity, loaded Plugin commit, no aggregate/root success rows on clean rebuilt state, target-scoped non-empty coverage rows, closed sessions/rounds, coverage seed/persisted consistency, and normalized host-vs-in-process `diffEmpty=true`.

## Forbidden Conclusions

- Do not complete or archive the demand from this Plugin result.
- Do not accept P15 final parity, G4, or G6 from source/unit evidence.
- Do not manually clean BiliDili SQLite/session/round rows.
- Do not dispatch Alembic main repair unless the next clean rerun proves an independent in-process defect.
- Do not push, version, release, or remove compatibility aliases from this evidence.
