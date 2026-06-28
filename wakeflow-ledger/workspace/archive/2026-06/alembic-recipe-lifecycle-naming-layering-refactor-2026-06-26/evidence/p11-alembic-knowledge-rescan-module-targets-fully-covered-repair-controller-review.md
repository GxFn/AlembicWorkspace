# Controller Review: P11 Alembic KnowledgeRescan Fully-Covered Module Targets Repair

Status: accept-target-result

Reviewed at: 2026-06-28

Target task: `p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1`

Dispatch group: `p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-p1`

## User Goal

Continue P11 moduleMining binding-rich repair toward the confirmed Recipe
lifecycle naming/layering refactor. This review covers only the Alembic source
repair for the Entry B KnowledgeRescanWorkflow defect found by the prior real
BiliDili rerun.

## Scope Reviewed

- Target window: `Alembic`
- Repository commit: `51b2e38828b8011a14fb89459f7b52d56b73fcca`
- Changed files:
  - `Alembic/lib/daemon/ModuleMiningSelection.ts`
  - `Alembic/test/unit/ModuleMiningSelection.test.ts`
  - `Alembic/test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`

No AlembicCore, AlembicPlugin, AlembicAgent, Test, BiliDili, vendor, release,
version, provider config, or thread-id files were changed by this target.

## Evidence Reviewed

- Target result:
  `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1.json`
- Alembic report:
  `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1-report.md`
- Prior Test blocker report and summary:
  - `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-report.md`
  - `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-summary.json`
- Controller prior review:
  `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-controller-review.md`
- Raw git diff for Alembic commit
  `51b2e38828b8011a14fb89459f7b52d56b73fcca`.

## Implementation Reality

The prior real BiliDili Test blocked because Entry B passed an empty
`executionDimensions` list to `selectProjectIndexModuleMiningModules` after
global gap analysis marked the explicitly targeted `architecture` dimension as
fully covered. The selector then filtered the explicit module target away,
leaving selected module `dimensions`, `dimensionIds`, and `plannedDimensions`
empty; coverage ledger skipped with `no-matching-source-refs`.

The Alembic repair removes that incorrect intersection for explicit bindings:
`moduleDimensionTargets` dimensions are now preserved even when
`executionDimensions` is empty. Fallback behavior remains unchanged for modules
without explicit planned dimensions: those still use `input.executionDimensions`.

The added selector regression proves Entry B keeps `architecture` with
`executionDimensions: []`. The added coverage-ledger regression proves a module
selected in that state can write the `architecture` cell when source refs exist.

## Controller Validation

Controller reran the task-critical checks:

- `npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
  - PASS: 2 files, 8 tests
- `npm run build:check`
  - PASS
- `npm run lint:repo-boundary`
  - PASS
- `npm run lint:agent-extraction-boundary`
  - PASS
- `npm run lint:core-import-boundary`
  - PASS
- `git diff --check HEAD^ HEAD`
  - PASS

Alembic-reported broader validation also included:

- focused 4-file P11 unit suite: PASS, 36 tests
- `npm run lint`: exit 0 with 5 pre-existing `noExplicitAny` warnings
- `git diff --check`: PASS

## Blockers

None for accepting this Alembic target result as source repair complete.

## Missing Evidence

The remaining evidence is the real BiliDili P11 Entry B rerun. This Alembic
source result does not prove the true daemon/workspace behavior by itself.

## Residual Risks

- `npm run lint:layer-contract` still reports 10 known pre-existing layer
  violations; Alembic reports no new violation from this commit.
- Alembic MCP `alembic_work` and `alembic_code_guard` failed with internal
  schema error `unrecognized key "data"`; repository validation and raw source
  review were used instead.

## Decision

accept-target-result for
`p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1`.

This does not accept P11, G4, G6, P12, or the whole demand.

## Next Action

Create and dispatch a Test package to rerun the same real BiliDili P11 Entry B
moduleMining binding-rich scenario after Alembic commit
`51b2e38828b8011a14fb89459f7b52d56b73fcca`.
