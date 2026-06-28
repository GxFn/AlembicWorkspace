# P15 AlembicPlugin Host Rescan Target-Axis Round Cleanup Repair Controller Review

Reviewed at: 2026-06-29

Dispatch group: `p15-plugin-host-rescan-target-axis-round-cleanup-repair-p1`

Target task: `p15-plugin-host-rescan-target-axis-round-cleanup-repair-t1`

Decision: accept target result; P15 remains open for a fresh real BiliDili Test parity rerun.

## Scope Reviewed

- Target result: `target-results/tr-p15-plugin-host-rescan-target-axis-round-cleanup-repair-t1.json`.
- Target report: `evidence/p15-plugin-host-rescan-target-axis-round-cleanup-repair-t1-report.md`.
- Task package: `task-packages/p15-plugin-host-rescan-target-axis-round-cleanup-repair-p1.json`.
- Prior blocker review: `evidence/p15-bilidili-final-project-index-parity-gap-rerun-controller-review.md`.
- AlembicPlugin commit: `3be8e5182c7d8cd568a9d0b327a030a815ee82a0` (`Fix host rescan target-axis cleanup`).
- AlembicPlugin worktree: clean at controller review time.

## Raw Evidence Reviewed

- `git show --name-status --oneline --no-renames 3be8e5182c7d8cd568a9d0b327a030a815ee82a0` showed changes confined to:
  - `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - `test/unit/HostAgentSessionLease.test.ts`
  - `test/unit/RescanCoverageModuleAxis.test.ts`
- Source review found host knowledge-rescan now prefers target-scoped module ids, rejects aggregate/root ids, and can synthesize target module summaries from ProjectContext targets plus source facts when ProjectMap exposes only aggregate/root entries.
- Seed reporting now records internal target-scoped/measured/usable/aggregate-root counts while preserving the public `coverageLedgerSeed` contract.
- The terminal no-actionable host-agent rescan path now releases the no-work session and best-effort closes the latest open `host-agent-rescan` round, reporting `closedOpenRound`.
- Built runtime proof: both source and `dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js` contain repair markers including `project-context-targets`, `targetScopedCells`, `aggregateOrRootModuleIds`, `closedOpenRound`, and `host-agent rescan round close skipped`.

## Controller Verification

- `npx vitest run test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentSessionLease.test.ts`
  - PASS: 2 files, 14 tests.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run lint:repo-boundary`
  - PASS; escape hatch count 0 / 75.
- `npm run lint:core-import-boundary`
  - PASS; scanned 441 files and 445 `@alembic/core` imports.
- `git diff --check HEAD~1 HEAD`
  - PASS.
- `git status --short`
  - clean.
- `rg -l "project-context-targets|targetScopedCells|aggregateOrRootModuleIds|closedOpenRound|host-agent rescan round close skipped" lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts dist/lib/recipe-generation/host-agent-workflows/knowledge-rescan.js`
  - PASS: both source and built runtime file matched.

## Controller Findings

- The accepted prior Test blocker was host-route specific: host `alembic_rescan` wrote only aggregate/root coverage rows (`BiliDili`, `module:root:*`), produced 0 target-scoped rows, and left one active host-agent session plus one open `host-agent-rescan` round.
- This Plugin repair directly targets the two first blockers: target-axis selection/seed persistence and terminal round/session cleanup.
- The focused module-axis tests cover ProjectMap target preference and the BiliDili-shaped fallback where aggregate/root ProjectMap modules are rejected in favor of ProjectContext target/source facts.
- The host session lease tests cover closing an open host-agent rescan round when a terminal no-work deepMining session is released, while preserving productive deepMining work that still has produce dimensions.
- No Core, Alembic main, BiliDili, provider configuration, package version, release asset, public MCP tool name, response `tool` value, job/source/lifecycle string, schema table name, R-2 dataRoot route, P14 Agent key, compatibility alias, or G6 cleanup was changed by this package.

## Risks And Residuals

- Target attempted `alembic_code_guard` twice; it failed before source findings with the known Alembic MCP internal schema error (`unrecognized key "data"`). Controller did not treat that tool failure as source approval.
- No real BiliDili Test was run by AlembicPlugin, by design. The next required evidence is a fresh P15 real BiliDili host-vs-in-process parity rerun using this Plugin commit or accepted descendant.
- This review accepts only the AlembicPlugin repair package. It does not accept P15 final parity, G4, G6 cleanup, whole-demand completion, archive, push, or release.

## Controller Acceptance

- User goal: continue unattended P15 closure for the Recipe lifecycle naming/layering refactor.
- Minimum loop: accept or reject the AlembicPlugin repair against the prior raw Test blocker, then dispatch only the needed Test rerun.
- Evidence reviewed: target result/report, task package, prior blocker review, commit diff, source and dist repair proof, controller-run focused tests, build, boundary lint, diff check, and clean status.
- Implementation reality: host knowledge-rescan now has target-scoped fallback/filters and no-work rescan round/session cleanup coverage in Plugin source and built runtime.
- Validation result: controller verification passed.
- Blockers for this target: none.
- Remaining blocker for the demand: real BiliDili P15 host-vs-in-process parity has not yet been rerun after Plugin commit `3be8e5182c7d8cd568a9d0b327a030a815ee82a0`.
- Decision: accept-target-result.
- Next action: create and dispatch a P15 Test rerun that reuses the prior parity predicate and proves target-scoped non-empty rows, no aggregate/root ids, closed sessions/rounds, SQLite integrity ok, and normalized `diffEmpty=true`.

## Forbidden Conclusions

- Do not complete or archive the demand from this Plugin result.
- Do not manually clean BiliDili DB/session/round rows to create a parity pass.
- Do not claim G4 or G6 from unit tests or source proof alone.
- Do not push, version, release, or remove compatibility aliases from this evidence.
