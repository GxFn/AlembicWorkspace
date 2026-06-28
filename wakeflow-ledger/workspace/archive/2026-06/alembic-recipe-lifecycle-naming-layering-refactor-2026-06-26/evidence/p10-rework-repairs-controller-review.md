# P10 Controller Review - Rework repairs

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch groups:
- `p10-plugin-coverage-ledger-seed-output-repair-p1`
- `p10-alembic-deep-mining-round-parity-repair-p1`

Target tasks:
- AlembicPlugin / `p10-plugin-coverage-ledger-seed-output-repair-t1`
- Alembic / `p10-alembic-deep-mining-round-parity-repair-t1`

## Decision

Accept both P10 source repair backfills as valid repairs for the prior
`p10-bilidili-project-index-workflow-unify-realtest-t1` rework finding.

This does not accept the P10 REAL-TEST gate. The next controller action is to
rerun the P10 BiliDili dual-host real test after these repairs.

## Raw Evidence Reviewed

- Prior failing Test review:
  `evidence/p10-bilidili-project-index-workflow-unify-realtest-controller-review.md`
- Plugin target result:
  `target-results/tr-p10-plugin-coverage-ledger-seed-output-repair-t1.json`
- Plugin target report:
  `evidence/p10-plugin-coverage-ledger-seed-output-repair-t1-report.md`
- Plugin commit:
  `f7fe95e422eb155f04a38ff5602318be71ffef8a`
- Alembic target result:
  `target-results/tr-p10-alembic-deep-mining-round-parity-repair-t1.json`
- Alembic task package:
  `task-packages/p10-alembic-deep-mining-round-parity-repair-p1.json`
- Alembic commit:
  `1a07b0f89044855913ac4cb4fb5d9172915990b4`

The Alembic target did not provide a separate report file. Controller therefore
reviewed the target envelope, task package, commit diff, changed source files,
and tests directly.

## Plugin Repair Findings

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts` now attaches
  the existing coverage ledger seed summary to both
  `response.meta.coverageLedgerSeed` and
  `response.data.meta.coverageLedgerSeed`.
- `lib/runtime/mcp/core-tools/output.ts` now projects
  `coverageLedgerSeed` through clean MCP output for `alembic_rescan` and
  sanitizes it to bounded public fields.
- `lib/runtime/mcp/output-contract.ts` now declares the clean schema for the
  public seed summary.
- Unit coverage proves the seed survives clean output and full briefing data
  while nested internal fields are stripped.

Controller validation:

```text
npx vitest run --config vitest.unit.config.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/HostAgentSessionLease.test.ts
passed: 2 files, 19 tests

git diff --check HEAD~1 HEAD
passed
```

The target also reported `npm run build:check`, `npm run lint:repo-boundary`,
Biome on changed files, `git diff --check`, and `npm run check` as passed.
Alembic Guard remained unavailable because the MCP surface returned
`unrecognized_keys: data`; this is a tool-surface blocker, not a product-code
acceptance blocker for this repair.

## Alembic Repair Findings

- `lib/daemon/DeepMiningRoundGate.ts` now fail-closes an opened
  `deep_mining_rounds` row when the incremental project-index workflow throws,
  setting `completedAt` and `newRecipesThisRound=0`, recording a process event,
  and then rethrowing the original workflow failure.
- `lib/daemon/PlanSelectionGate.ts` now applies explicit deepMining request
  constraints to plan projection and rescan arguments for the gate path:
  dimensions, module scope, scale cap, max files, content line budget, and
  missing plan max-round/min-new-recipes values.
- `test/unit/DaemonJobRunnerPlanGate.test.ts` proves both the fail-close path and
  the explicit parity seed projection used by the P10 rerun path.

Controller validation:

```text
npx vitest run test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts test/unit/ProjectIndexWorkflow.test.ts
passed: 3 files, 37 tests

git diff --check HEAD~1 HEAD
passed
```

The target also reported `npm run build:check`,
`npm run lint:repo-boundary`, Biome on changed files, and `git diff --check` as
passed. Alembic Guard had the same `unrecognized_keys: data` MCP surface
failure class.

## Acceptance Boundary

These repairs address the two product-source causes identified by the prior
P10 Test review:

- host `alembic_rescan` evidence can now expose the already-produced
  `coverageLedgerSeed` in clean output and full briefing data;
- in-process deepMining failures no longer leave an open stale round, and the
  parity rerun path can honor explicit module/dimension/scale seed constraints.

The repairs do not prove normalized host vs in-process parity on real BiliDili.
They authorize the P10 real-test rerun; they do not replace it.

## Next Action

Reduce and accept the rework repair candidate, then dispatch a Test rerun for
P10 BiliDili project-index workflow parity using the repaired AlembicPlugin and
Alembic commits.
