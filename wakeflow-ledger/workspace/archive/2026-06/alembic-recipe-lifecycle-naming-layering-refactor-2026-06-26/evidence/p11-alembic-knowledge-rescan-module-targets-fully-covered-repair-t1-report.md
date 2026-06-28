# P11 Alembic KnowledgeRescan Module Targets Fully-Covered Repair

Status: completed

Target task: `p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1`

Dispatch group: `p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-p1`

Alembic commit: `51b2e38828b8011a14fb89459f7b52d56b73fcca`

## Scope

This target repaired only the Alembic source path assigned by the dispatch
packet. No AlembicCore, AlembicPlugin, AlembicAgent, Test, BiliDili, vendor,
release/version, provider config, or thread-id files were edited.

## Source Evidence

- Controller review: `evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-controller-review.md`
- Test report: `evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-report.md`
- Test summary: `evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-summary.json`
- Dispatch packet: `.wakeflow-local/wakeflow-delivery/dispatch-packets/p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-p1__Alembic__p11-alembic-knowledge-rescan-module-targets-fully-covered-repair-t1.json`

## Changed Files

- `lib/daemon/ModuleMiningSelection.ts`
- `test/unit/ModuleMiningSelection.test.ts`
- `test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`

## Implementation

- Preserved explicit `moduleDimensionTargets` binding dimensions in
  `selectProjectIndexModuleMiningModules` even when the gap-filtered
  `executionDimensions` input is empty.
- Kept fallback semantics unchanged for modules without explicit planned
  dimensions: they still fall back to `input.executionDimensions`.
- Added a selector regression for Entry B when global gap analysis marks the
  explicit target dimension as fully covered.
- Added a coverage-ledger regression proving the selected module produced from
  empty execution dimensions can still write the planned `architecture` cell
  when source refs exist.

## Validation

| Command | Result |
| --- | --- |
| `npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts` | pass, 3 tests |
| `npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts test/unit/ProjectIndexWorkflow.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts` | pass, 4 files / 36 tests |
| `npm run build:check` | pass |
| `npm run lint` | exit 0, with 5 pre-existing `noExplicitAny` warnings in `lib/service/handler-runtime/types.ts` and `lib/workflows/ai-execution/AgentRunProjections.ts` |
| `npm run lint:repo-boundary` | pass |
| `npm run lint:agent-extraction-boundary` | pass |
| `npm run lint:core-import-boundary` | pass |
| `git diff --check` | pass |
| `git diff --check HEAD^ HEAD` | pass |

## Known Non-Blocking Validation Notes

- `npm run lint:layer-contract` still fails with the same 10 known violations
  seen before this task, including the pre-existing
  `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` import from
  `lib/daemon/ModuleMiningSelection.ts`.
- `alembic_work start` and `alembic_code_guard` both failed with the Alembic MCP
  internal schema error `unrecognized key "data"`. Repository validation above
  was used as the reviewable evidence for this task.

## Residual Risk And Next Step

This source repair is ready for controller review. It does not accept P11, G4,
G6, P12, or whole-demand completion. If accepted, the controller should rerun
the same real BiliDili P11 Entry B Test package to verify the KnowledgeRescan
moduleMining/per-module path now exposes planned dimensions and advances the
coverage ledger for the targeted module x dimension cell.
