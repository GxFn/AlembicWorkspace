# P10 Controller Review - Plugin host rescan seed/session repair

Date: 2026-06-28
Controller: AlembicWorkspace

Dispatch group:
- `p10-plugin-host-rescan-seed-session-repair-p1`

Target task:
- AlembicPlugin / `p10-plugin-host-rescan-seed-session-repair-t1`

## Decision

AlembicPlugin target evidence is acceptable for the scoped P10 source repair.
Together with the already reviewed Alembic scope-alias repair, this unblocks the
next P10 BiliDili REAL-TEST rerun, but it does not itself accept the real-test
gate.

## Raw Evidence Reviewed

- Target result:
  `target-results/tr-p10-plugin-host-rescan-seed-session-repair-t1.json`
- Target report:
  `evidence/p10-plugin-host-rescan-seed-session-repair-t1-report.md`
- Task package:
  `task-packages/p10-plugin-host-rescan-seed-session-repair-p1.json`
- Prior controller review requiring this repair:
  `evidence/p10-rerun-after-repairs-controller-review.md`
- Prior Test raw evidence:
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-briefing-summary.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-rescan-coverage-ledger-seed-rg.txt`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/host-after-rescan-snapshot.json`
  `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-t1/inprocess-failed-bootstrap-status.json`
- Plugin commit:
  `2f5af00b61593075802ce2a4db893f7c96d9930f`
- Source files:
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/briefing-budget.ts`
  `AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
  `AlembicPlugin/test/unit/BriefingBudget.test.ts`
  `AlembicPlugin/test/unit/HostAgentSessionLease.test.ts`
  `AlembicPlugin/test/unit/HostAgentDimensionCompletionWorkflow.test.ts`

## Controller Findings

Commit `2f5af00b61593075802ce2a4db893f7c96d9930f` changes only the three
Plugin workflow files and three focused unit-test files named above.

The implementation addresses the two Plugin-owned blockers from the prior real
BiliDili rerun:

- Host `alembic_rescan` seed visibility: `knowledge-rescan.ts` now writes
  `coverageLedgerSeed` into the full briefing body at top level and under
  `data.meta`, then re-attaches it immediately before briefing budgeting after
  advisory/session/round mutations. `briefing-budget.ts` projects the seed from
  the budgeted briefing meta/body back to top-level `response.meta`.
- Host terminal cleanup: `dimension-completion.ts` preserves the original
  `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT` failure response for
  `noPadding=true`, but when at least one session-bound recipe was recovered it
  clears the matching host-agent session id and closes the latest open
  `host-agent-rescan` round.

The cleanup path is not mock-only. Core `clearSession(sessionId)` clears only
the matching lease, and Core `CoverageLedgerRepository.upsertRound` preserves
existing `rescanId`, `startedAt`, and `triggerActor` with `?? existing`, so the
Plugin close call can set `completedAt` without erasing round identity.

Prior Test raw evidence matches the repair surface:

- `host-rescan-coverage-ledger-seed-rg.txt` was 0 bytes.
- `host-rescan-briefing-summary.json` had `coverageLedgerSeed=null` and
  `dataMeta=null` while the plan gate was ready for `toolName=alembic_rescan`,
  `generationStage=deepMining`, `moduleScope=["BiliDili"]`, and
  one-budget scale.
- `host-after-rescan-snapshot.json` showed open round `round_index=3`,
  `completed_at=null`, `new_recipes_this_round=0`,
  `trigger_actor=host-agent-rescan`.
- `inprocess-failed-bootstrap-status.json` failed with an active-session lease
  for the same BiliDili project.

No Alembic, AlembicCore, BiliDili, provider config, release asset, version,
frozen public tool name, or unrelated data-root file was changed by this Plugin
repair.

## Controller Validation

All commands below were run from `AlembicPlugin/` after reviewing the target
result, target report, raw Test evidence, and commit diff:

- `npx vitest run --config vitest.unit.config.ts test/unit/BriefingBudget.test.ts test/unit/HostAgentSessionLease.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 4 files, 38 tests.
- `npm run build:check`
  - Passed; Core build used local `../AlembicCore` at
    `99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run lint:repo-boundary`
  - Passed; escape-hatch count 0 / 75.
- `npm run lint:core-import-boundary`
  - Passed; scanned 436 files and 444 `@alembic/core` imports.
- `npm run lint:layer-boundary`
  - Passed; no L1 -> L2 backslip.
- `npx biome check --no-errors-on-unmatched lib/recipe-generation/host-agent-workflows/briefing-budget.ts lib/recipe-generation/host-agent-workflows/dimension-completion.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/BriefingBudget.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/HostAgentSessionLease.test.ts`
  - Passed: 6 files checked, no fixes applied.
- `git diff --check HEAD~1 HEAD`
  - Passed with no whitespace errors.
- `git diff --check`
  - Passed with no whitespace errors.
- `git status --porcelain`
  - Clean output.

## Remaining Gate

This accepts only the Plugin repair evidence. The P10 real-test gate still needs
a fresh Test rerun on the real BiliDili workspace after both source repairs:
AlembicPlugin `2f5af00b61593075802ce2a4db893f7c96d9930f` and Alembic
`2475fe7f72b10da02f306358febcfa00b90ea7b7`.

That rerun must re-check host `coverageLedgerSeed` visibility, absence of stale
open host-agent rescan rounds/sessions after terminal noPadding failure, the
Alembic in-process `moduleScope=["BiliDili"]` alias repair, and final host vs
in-process coverage-ledger parity.

## Forbidden Conclusions

- Do not accept P10 REAL-TEST, G4, G6, P11, P12, P13, or the whole demand from
  this Plugin result alone.
- Do not treat unit tests as a substitute for the required real BiliDili rerun.
- Do not modify Plugin/Core/Alembic source further unless the rerun exposes a
  new product-code defect.
