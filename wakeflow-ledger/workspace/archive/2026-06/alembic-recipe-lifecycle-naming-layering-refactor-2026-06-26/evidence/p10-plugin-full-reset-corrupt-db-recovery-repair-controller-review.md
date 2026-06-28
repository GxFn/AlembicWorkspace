# P10 AlembicPlugin 回填总控评审：fullReset corrupt DB recovery repair

Dispatch group: `p10-plugin-full-reset-corrupt-db-recovery-repair-p1`
Target task: `p10-plugin-full-reset-corrupt-db-recovery-repair-t1`
Target: AlembicPlugin
Controller decision: accept target result as source repair; real BiliDili rerun still required.

## Raw Evidence Reviewed

- TargetResultEnvelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p10-plugin-full-reset-corrupt-db-recovery-repair-t1.json`
- Commit reviewed: `aee228be0082e8ddb1d4494df07e0ffedc6ea292` (`fix: fail closed on corrupt full reset`)
- Files reviewed:
  - `AlembicPlugin/lib/service/cleanup/CleanupService.ts`
  - `AlembicPlugin/test/unit/CleanupService.test.ts`
- Upstream blocker evidence reviewed previously:
  - `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-controller-review.md`

## Implementation Reality

- `CleanupService.fullReset()` now includes current P10 project-index/deepMining/ProjectContext state tables in destructive reset, including `source_graph_*`, `git_diff_checkpoints`, `coverage_ledger`, `deep_mining_rounds`, `project_context_file_snapshots`, `recipe_warnings`, and `token_usage`.
- Task tables are cleared through the same error-collecting path as the main reset list.
- Any non-`no such table` database clear error now triggers `#assertFullResetDatabaseClean(...)`, logs `resetMode: fail-closed`, and throws before host Recipe generation can continue with stale `knowledge_entries`, `coverage_ledger`, or `deep_mining_rounds` rows.
- Missing DB reference is also fail-closed for full reset.
- Focused tests assert both the expanded reset table list and the malformed `knowledge_entries` failure path.

## Controller Replay

- `npm run test:unit -- test/unit/CleanupService.test.ts` passed: 1 file, 6 tests.
- `npm run test:unit -- test/unit/CleanupService.test.ts test/unit/McpEntrypointEffects.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/HostAgentSessionLease.test.ts test/unit/CoverageLedgerTargetAxis.test.ts test/unit/RescanCoverageModuleAxis.test.ts` passed: 8 files, 54 tests.
- `npm run build:check` passed; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npx biome check lib/service/cleanup/CleanupService.ts test/unit/CleanupService.test.ts` passed.
- `npm run lint` exited 0 with existing unrelated warnings in `lib/runtime/host-adapter/ClaudeCodeHostAdapter.ts` and `scripts/*.mjs`; no warning is in touched files.
- `npm run lint:repo-boundary` passed.
- `npm run lint:core-import-boundary` passed.
- `npm run lint:layer-boundary` passed.
- `npm run lint:naming` passed.
- `npm run lint:doctrine` passed.
- `git diff --check` passed.

## Judgment

Accept the AlembicPlugin source repair. It directly addresses the previous Test blocker by preventing host rebuild from continuing after a critical DB reset failure and by adding the tables that allowed stale aggregate/root coverage rows to survive a Plugin full reset.

This acceptance does not prove P10 parity, G4, G6, or later phase readiness. The repair chose fail-closed behavior rather than automatic DB recovery; therefore the real BiliDili route must be rerun by Test. If the live corrupt DB now fails closed before generation, that is a valid blocker and not a parity pass. If reset succeeds, Test must continue through host bootstrap/rescan, noPadding cleanup, in-process route, and normalized host-vs-in-process parity.

Next action: dispatch a real BiliDili Test rerun after Plugin commit `aee228be0082e8ddb1d4494df07e0ffedc6ea292`.
