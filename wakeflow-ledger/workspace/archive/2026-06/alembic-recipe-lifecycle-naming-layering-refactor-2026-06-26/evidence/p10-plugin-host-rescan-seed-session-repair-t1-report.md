# P10 Plugin Host Rescan Seed Session Repair Report

Date: 2026-06-28
Window: AlembicPlugin
Task: p10-plugin-host-rescan-seed-session-repair-t1
Commit: 2f5af00b61593075802ce2a4db893f7c96d9930f

## Summary

AlembicPlugin repaired the two Plugin-owned blockers found by the real BiliDili
P10 rerun:

- Host `alembic_rescan` now keeps the existing `coverageLedgerSeed` summary in
  the full briefing body through the budget/transient transport path:
  `data.coverageLedgerSeed`, `data.meta.coverageLedgerSeed`, and projected
  `response.meta.coverageLedgerSeed` all use the same sanitized summary.
- Terminal `alembic_dimension_complete` failures for `noPadding=true` plus
  `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT` now preserve the failed response but
  best-effort clear the active host-agent session and close the latest open
  `host-agent-rescan` deep mining round when at least one session-bound Recipe
  was recovered.

The repair stayed inside AlembicPlugin. No Alembic, AlembicCore, BiliDili,
provider config, frozen tool names, version, vendor, or release asset changes
were made.

## Changed Files

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - Adds `coverageLedgerSeed` to the top-level full briefing data as well as
    `data.meta`.
  - Re-applies the seed summary after advisory/session/round mutations and
    immediately before briefing budgeting.
- `lib/recipe-generation/host-agent-workflows/briefing-budget.ts`
  - Projects `coverageLedgerSeed` from budgeted briefing meta back to top-level
    `response.meta` with `fullBriefingRef`.
- `lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
  - On terminal noPadding candidate-count failure, clears the host-agent session
    by id and closes the latest open `host-agent-rescan` round without relaxing
    evidence gates or checkpoint behavior.
- `test/unit/BriefingBudget.test.ts`
  - Covers seed preservation in over-budget transient payloads and projected
    transport meta.
- `test/unit/HostAgentSessionLease.test.ts`
  - Covers real rescan workflow seed presence in `response.meta`,
    `response.data.coverageLedgerSeed`, and `response.data.meta`.
- `test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
  - Covers terminal noPadding failure keeping the failure response while clearing
    session and closing the open host-agent-rescan round.

## Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/BriefingBudget.test.ts test/unit/HostAgentSessionLease.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 4 files, 38 tests.
- `npm run build:check`
  - Passed; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npx biome check --no-errors-on-unmatched lib/recipe-generation/host-agent-workflows/briefing-budget.ts lib/recipe-generation/host-agent-workflows/dimension-completion.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/BriefingBudget.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/HostAgentSessionLease.test.ts`
  - Passed after applying Biome formatting to changed files.
- `npm run lint:repo-boundary`
  - Passed.
- `npm run lint:core-import-boundary`
  - Passed; scanned 436 files and 444 `@alembic/core` imports.
- `npm run lint:layer-boundary`
  - Passed.
- `git diff --check`
  - Passed.

## Guard

Alembic Guard was invoked for the six changed files. It failed before producing a
code-review conclusion with the MCP surface/schema error `unrecognized_keys:
data`. This is recorded as an Alembic Guard tool-surface blocker, not as a
product-code validation failure.

## Raw Evidence

- Plugin commit: `2f5af00b61593075802ce2a4db893f7c96d9930f`.
- AlembicPlugin worktree after commit: clean on `main`, ahead of origin by 8.
- Previous real Test failure had `host-rescan-full-briefing.json` with
  `coverageLedgerSeed=null` and `dataMeta=null`; this patch specifically fills
  full briefing top-level and meta seed fields before budgeting.
- Previous real Test failure had open round
  `trigger_actor='host-agent-rescan'`, `completed_at=null`,
  `new_recipes_this_round=0`; this patch closes that round on the terminal
  noPadding candidate-count failure path while returning the original failure.

## Risks And Next Step

- This Plugin repair does not address the separate Alembic in-process alias
  mismatch recorded in the controller review; that remains outside this window.
- P10 Test rerun is ready after the paired Alembic-side repair lands. The next
  rerun should verify host `alembic_rescan` full briefing seed presence, no open
  `host-agent-rescan` round after terminal noPadding failure, and the separate
  Alembic in-process alias repair.
