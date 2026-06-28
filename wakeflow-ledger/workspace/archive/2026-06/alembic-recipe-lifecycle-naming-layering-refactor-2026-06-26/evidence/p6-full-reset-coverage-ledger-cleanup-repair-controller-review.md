# P6 Full Reset Coverage Ledger Cleanup Repair Controller Review

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: `p6-full-reset-coverage-ledger-cleanup-repair-p1`
Task: `p6-full-reset-coverage-ledger-cleanup-repair-t1`
Target: Alembic

## Controller Acceptance

- User goal: unblock P6 REAL-TEST by repairing the Alembic-side full reset cleanup gap found after Test proved stale `coverage_ledger` / `deep_mining_rounds` survived bootstrap rebuild.
- Scope reviewed: Alembic `CleanupService.fullReset()` cleanup contract only.
- Original requirement authority: P6 deepMining REAL-TEST requires real BiliDili bootstrap reset to clear stale state so a fresh deepMining round can open/close and satisfy G4/P6.
- Target/window: Alembic, task package `p6-full-reset-coverage-ledger-cleanup-repair-p1`.
- Evidence reviewed:
  - Target result `tr-p6-full-reset-coverage-ledger-cleanup-repair-t1`.
  - Target report `evidence/p6-full-reset-coverage-ledger-cleanup-repair-t1-report.md`.
  - Alembic commit `9d703a3fa8a6f7cbabb1d02ec5d968e2c399a3d1`.
  - Source diff for `lib/service/cleanup/CleanupService.ts`.
  - Test diff for `test/unit/CleanupService.test.ts`.
  - Controller reruns: `npx vitest run test/unit/CleanupService.test.ts`, `npm run build:check`, `npm run lint:repo-boundary`, `git diff --check HEAD~1 HEAD`.
- Implementation reality:
  - `ALL_DATA_TABLES` now includes `coverage_ledger` and `deep_mining_rounds`, the two tables implicated by the P6 Test blocker.
  - The same fullReset contract also now covers omitted data/cache tables found in the current schema scan: `recipe_warnings`, `token_usage`, source graph tables, `git_diff_checkpoints`, and `project_context_file_snapshots`.
  - `fullReset()` already iterates `ALL_DATA_TABLES`, executes `DELETE FROM <table>`, and records successful clears in `result.clearedTables`.
  - `rescanClean()` and `forceRescanClean()` table lists were not expanded to clear the coverage/round tables, so the repair stays limited to fullReset cleanup semantics.
  - The change does not alter advisor thresholds, coldStart measured-coverage writing, R-2 cleanup routing, or deepMining round-loop behavior.
- Validation result:
  - `node -v`: `v22.22.1`.
  - `npx vitest run test/unit/CleanupService.test.ts`: PASS, 3 tests.
  - `npm run build:check`: PASS, using local `../AlembicCore`.
  - `npm run lint:repo-boundary`: PASS, `@escape-hatch` 1/75.
  - `git diff --check HEAD~1 HEAD`: PASS.
  - Working tree status: `main...origin/main [ahead 5]`, no unstaged files reported by `git status --short --branch`.
- Blockers: none for accepting this Alembic repair.
- Missing evidence: real BiliDili P6 rerun is still outstanding and must be dispatched to Test before P6 can be considered green.
- Residual risks:
  - `alembic_code_guard` remains unavailable due internal MCP schema error `unrecognized key "data"`; this is a tool-surface risk, not a code finding.
  - The repair covers reset semantics only; real runtime proof still depends on Test.
- TODO/backlog rollup:
  - Close this Alembic repair task as accepted.
  - Create next Test package to rerun P6 BiliDili deepMining REAL-TEST against Alembic commit `9d703a3`.
- Decision: accept-target-result.
- Next action: create-next-package for Test rerun.
