# RG10 Plugin Commit-Driven Evolution SourceRef Repair Evidence

Target task: `rg10-plugin-commit-driven-evolution-source-ref-repair-t1`
Target window: `AlembicPlugin`
Result: completed

## Commit

- AlembicPlugin commit: `26361f21dd4b3a09d31388a3cd9d92759c4bb238`
- Previous accepted Plugin commit in this chain: `14cd105d8296367c33471e922a3472118fe80bd9`
- Local branch status after commit: `main...origin/main [ahead 2]`

## Repair Summary

- Connected public `alembic_rescan` to commit-driven unified evolution routing inside the direct MCP workflow, not only the HostMcpServer presenter path.
- Added rescan git diff checkpointing with initial `HEAD^..HEAD` range fallback when a strict refreshed Plan has already been reconfirmed at the current HEAD.
- Routed rescan diff events through `FileChangeHandler`, allowing high-confidence rename sourceRefs to be repaired from old path to new path.
- Added public `unifiedEvolution`, `gitDiffEvidence`, `evolution`, `pendingProposals`, `proposals`, `generationChangeLog`, and `recommendations` projection through the clean MCP output allow-list.
- Added visible lifecycle/change-log records for sourceRef repair, source-modified reference changes, stale sourceRefs, deprecation/update proposal signals, and new-module recommendations.
- Changed moduleMining Plan gate module scope selection to preserve requested moduleScope, Plan `plannedNextActions.modulePaths`, module bindings, and coverage gaps; testMode no longer truncates the scope to one module.

## Validation

- `npm run build:check`: passed.
- `npm run test -- test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts`: passed, 36 tests.
- `npm run test -- test/unit/McpCoreToolsCleanOutputContract.test.ts`: passed, 7 tests.
- `git diff --check`: passed.
- `./node_modules/.bin/biome check` on the 8 changed files: passed.
- `npm run lint`: exit 0; printed existing warnings in unrelated files.
- Alembic Guard: `guard-public-mqory9fa-4`, passed 8 files with 0 violations.

## Focused Coverage Added

- `FileChangeHandler` now verifies public `generationChangeLog` for high-confidence rename repair, source-modified reference records, and new-module recommendations, plus `pendingProposals` for proposal-producing paths.
- `PluginOpportunisticEvolution` now projects proposal and change-log summaries from routed unified evolution reports.
- `PlanDrivenGenerationGate` now has an RG10-style workflow test that creates a git baseline, commits a rename plus new module, runs moduleMining `alembic_rescan`, verifies `unifiedEvolution.evidenceGate.verdict=routed`, verifies sourceRef repair from `src/api/client.ts` to `src/api/RG10Client.ts`, verifies new-module recommendation, and verifies multi-module `moduleScope` preservation.

## Boundaries And Risks

- No Test repository files were edited.
- No AlembicCore changes were made.
- Full BiliDili retry remains a controller/Test acceptance step after plugin refresh or restart.
