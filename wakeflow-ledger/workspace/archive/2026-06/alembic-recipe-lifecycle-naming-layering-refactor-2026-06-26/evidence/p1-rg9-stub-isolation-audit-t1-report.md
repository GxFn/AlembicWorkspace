# p1-rg9-stub-isolation-audit-t1 Report

Window: AlembicPlugin
Task: p1-rg9-stub-isolation-audit-t1
Dispatch group: p1-rg9-stub-isolation-audit-p1
State root: .wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26

## Scope Confirmation

- Worked only in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`.
- Did not edit Alembic, AlembicCore, AlembicAgent, BiliDili, vendor/AlembicCore, versions, release assets, or thread ids.
- Alembic, AlembicCore, and AlembicAgent post-checks stayed `## main...origin/main`.
- AlembicPlugin is `## main...origin/main [ahead 1]` after local commit.

## Deleted Zero-Consumer RG9 Stubs

Committed in AlembicPlugin:

- Commit: `e99e84fc1a203212cacd1574c4a4fac22a1f1834`
- Subject: `Remove unused RG9 compatibility stubs`

Deleted files:

- `lib/runtime/mcp/host-agent-workflows/knowledge-index-rebuild.ts`
- `lib/service/bootstrap/bootstrap-event-types.ts`
- `lib/service/vector/ContextualEnricher.ts`
- `lib/service/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts`
- `lib/service/evolution/git-diff-checkpoint/GitDiffCheckpointStatus.ts`
- `lib/service/evolution/git-diff-checkpoint/GitDiffScanner.ts`
- `lib/service/evolution/git-diff-checkpoint/ProjectDiffIgnore.ts`

Deletion proof:

- Exact AlembicPlugin grep after deletion returned no hits for deleted old path strings or old aliases:
  `#codex/mcp/host-agent-workflows/knowledge-index-rebuild`,
  `lib/runtime/mcp/host-agent-workflows/knowledge-index-rebuild`,
  `#service/bootstrap/bootstrap-event-types`,
  `lib/service/bootstrap/bootstrap-event-types`,
  `#service/vector/ContextualEnricher`,
  `lib/service/vector/ContextualEnricher`,
  `#service/evolution/git-diff-checkpoint/{GitDiffCheckpointService,GitDiffCheckpointStatus,GitDiffScanner,ProjectDiffIgnore}`,
  and matching `lib/service/evolution/git-diff-checkpoint/...` paths.
- Package/export check returned no `package.json` or `plugin.json` exposure for the deleted old paths.
- Cross-four-repo grep still shows same-name Alembic main live files for `bootstrap-event-types` / `ContextualEnricher`; those are Alembic main self-imports, not AlembicPlugin deleted stub consumers.

## Preserved RG9 Compatibility Paths

Preserved because they still have explicit consumers or pinned compatibility tests:

- `lib/runtime/mcp/host-agent-workflows/{cold-start,dimension-completion,knowledge-rescan,project-context-analysis,project-data-root,recipe-evidence-gate,recipe-region-vector}.ts`
  - `test/unit/RecipeGenerationSkeleton.test.ts:18-24` reads these old path files directly.
- `lib/runtime/evolution/PluginOpportunisticEvolution.ts`
  - `test/unit/RecipeGenerationSkeleton.test.ts:25` reads this old path file directly.
- `lib/service/bootstrap/{BootstrapEventEmitter,BootstrapTaskManager}.ts`
  - `test/unit/RecipeGenerationSkeleton.test.ts:26-27` reads these old path files directly.
- `lib/service/vector/LocalEmbedding.ts`
  - `test/unit/RecipeGenerationSkeleton.test.ts:28` reads this old path file directly.
- `lib/service/evolution/FileChangeHandler.ts` and `lib/service/evolution/git-diff-checkpoint/index.ts`
  - `test/unit/RecipeGenerationSkeleton.test.ts:29-30` reads these old path files directly.
- `lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts`
  - Preserved by task instruction and live consumers: `knowledge-rescan.ts:74`, `dimension-completion.ts:23-25`, and `test/unit/CoverageLedgerWiring.test.ts:34-36`.

## moduleMiningRoutes Audit For P13

No field deletion or rename was performed in P1. Current retained empty/back-compat field positions:

- `lib/recipe-generation/evolution/FileChangeHandler.ts:68-70` documents UM#1 retirement and the empty compatibility field.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:112-113` keeps `classificationCounts.moduleMiningRoutes`.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:134` keeps `moduleMiningRoutes` on `UnifiedEvolutionReport`.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:195-196` excludes moduleMining routes from review logic after retirement.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:411-415` confirms created-to-moduleMining generation is retired.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:605` initializes count to `0`.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:618` initializes routes to `[]`.
- `lib/recipe-generation/evolution/FileChangeHandler.ts:631-633` route completeness ignores generation routes and depends on proposal submission.
- `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:91-100` surfaces `moduleMiningRoutes` in unified evolution output.
- `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:324-339` passes through `moduleMiningRoutes`.
- `lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts:35-42` includes optional `moduleMiningRoutes` in route summary.
- `lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts:227-235` requires the route list to be empty for skipped-only summaries.

## Evolution Folder Audit

Plugin-owned live evolution files remain maintenance-only / generation-retired:

- `lib/recipe-generation/evolution/FileChangeHandler.ts` routes update/deprecate proposals for existing recipe evidence, records diagnostics for uncovered created files, and explicitly does not generate moduleMining routes.
- `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts` attaches commit-driven maintenance surface and reports unified evolution status.
- `lib/recipe-generation/evolution/git-diff-checkpoint/CommitDrivenMaintenance.ts` is the unique commit-driven maintenance coordinator.
- `lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts` records maintenance route outcomes and skipped-only summaries.

## Validation

Passed:

- `npm run build:check`
  - Core build used `../AlembicCore @ 934d043a0d12ac364aa582d6c39445f14a0af2e1`.
  - `tsc --noEmit` passed.
- `npm run lint:repo-boundary`
  - Repository boundary check passed.
  - `@escape-hatch count: 0 / 75 threshold`.
- `git diff --check`
  - Passed with no output.
- `git show --stat --oneline --name-status --no-renames HEAD`
  - Shows only the seven deleted AlembicPlugin stub files.

## Residual Risks

- Some similarly named files and aliases still exist in Alembic main; they are independent main-repo live paths, not AlembicPlugin deleted stub consumers.
- P13 still owns the `moduleMiningRoutes` compatibility field deletion/alias decision.
- Skeleton-pinned RG9 adapters remain intentionally preserved for a later phase that can migrate or remove those tests explicitly.
