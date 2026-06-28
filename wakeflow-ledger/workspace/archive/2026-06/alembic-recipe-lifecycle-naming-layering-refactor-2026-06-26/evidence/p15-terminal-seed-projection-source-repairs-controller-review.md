# P15 Terminal Seed Projection Source Repairs Controller Review

Date: 2026-06-28

State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`

Controller decision: accepted source repairs only at state revision 263. P15 final completion is still open and requires the next real BiliDili Test rerun.

## Accepted Source Repairs

- AlembicPlugin `p15-plugin-host-terminal-seed-projection-repair-t1`
  - Commit: `68d1e39e0387246239cedd4e0dc31141504c0975`
  - Evidence: `evidence/p15-plugin-host-terminal-seed-projection-repair-t1-report.md`, `target-results/target-result-p15-plugin-host-terminal-seed-projection-repair-t1.json`
  - Scope: host rescan terminal seed projection and no-produce deepMining terminal session release.
  - Controller reread the diff in `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts` and `test/unit/HostAgentSessionLease.test.ts`.
  - Controller reran `npx vitest run test/unit/HostAgentSessionLease.test.ts`: 17 tests passed.
  - Residual risk: `alembic_code_guard` hit the recorded MCP tool-surface error; source, tests, build, boundary lints, and raw diff remain the acceptance evidence.

- Alembic `p15-alembic-inprocess-seed-projection-repair-t1`
  - Commit: `4dd8083ff9b171408b120903caf7821a14452ebf`
  - Evidence: `evidence/p15-alembic-inprocess-seed-projection-repair-t1-report.md`, `target-results/target-result-p15-alembic-inprocess-seed-projection-repair-t1.json`
  - Scope: in-process `coverageLedgerSeed` projection keeps package-root targets such as `target:Account:.` when the target is not the project root, while preserving project-root aggregate rejection such as `target:BiliDili:.`.
  - Controller reread the diff in `lib/daemon/DeepMiningRoundGate.ts` and `test/unit/DaemonJobRunnerPlanGate.test.ts`.
  - Controller reran `npx vitest run test/unit/DaemonJobRunnerPlanGate.test.ts`: 25 tests passed.
  - Residual risk: Alembic Guard was skipped because the project knowledge state is empty, matching the guard skill stop condition.

## Next Required Test

Dispatch Test for a real BiliDili final parity rerun after both source repairs. The rerun must not claim P15 completion unless all final predicates hold.

Required success predicates:

- Real BiliDili workspace/data root only; no sandbox copy, no manual SQLite/session/round edits, no provider changes.
- R-2 root/dataRoot proof before any rebuild/reset; SQLite integrity must be ok before and after.
- Loaded source points include AlembicPlugin `68d1e39e0387246239cedd4e0dc31141504c0975` and Alembic `4dd8083ff9b171408b120903caf7821a14452ebf` or accepted descendants.
- DeepSeek generation and local Qwen/Ollama embedding remain configured.
- Host route-visible `coverageLedgerSeed` and full briefing project clean persisted state as `written`, not count-mismatch `inconsistent`.
- In-process route-visible `coverageLedgerSeed` keeps non-project-root package targets such as `target:Account:.` as target-scoped usable/measured cells.
- Persisted host and in-process coverage rows are non-empty and target-scoped; aggregate/root module ids such as `target:BiliDili:.` must not appear in success state.
- G4 coverage gate passes with non-empty measured in-process cells.
- Active host-agent sessions and open host-agent/deepMining rounds are closed at terminal state.
- Normalized host-vs-in-process parity diff is empty and is not a 0-vs-0 pass.

If blocked, preserve raw public-route evidence and classify the first owner precisely: AlembicPlugin host route/output/session, Alembic in-process daemon/seed projection, AlembicCore persistence/reset, Test harness/environment, or BiliDili data-root condition.
