# Controller Review: P11 Alembic ModuleMining Binding-Rich Selector

Reviewed at: 2026-06-28T19:02:00+08:00

## Decision

Accept the Alembic target result as P11 source evidence.

This accepts the Alembic source change only. It does not accept the required P11
real BiliDili moduleMining REAL-TEST, G4/G6 final gates, P12+, or whole-demand
completion.

## Scope

- Demand: `alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p11-alembic-module-mining-binding-rich-selector-p1`
- Target result: `Alembic / p11-alembic-module-mining-binding-rich-selector-t1`
- Target status reviewed: `completed`
- Alembic commit: `25a86eed857294d63ee671203d3634859a6709fa`

## Evidence Reviewed

- TargetResultEnvelope: `target-results/tr-p11-alembic-module-mining-binding-rich-selector-t1.json`
- Alembic report: `evidence/p11-alembic-module-mining-binding-rich-selector-t1-report.md`
- Commit diff for `25a86eed857294d63ee671203d3634859a6709fa`
- Source files:
  - `Alembic/lib/daemon/ModuleMiningSelection.ts`
  - `Alembic/lib/daemon/ModuleMiningWorkflow.ts`
  - `Alembic/lib/daemon/DaemonJobWorkflowTypes.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- Test files:
  - `Alembic/test/unit/ModuleMiningSelection.test.ts`
  - `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`
- Read-only Agent compatibility source:
  - `AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts`
  - `AlembicAgent/src/agent/runs/module/ModuleMiningAgentRun.ts`

## Implementation Reality

The change creates a shared `selectProjectIndexModuleMiningModules` selector and
moves both in-process moduleMining entries onto it:

- Entry A (`ModuleMiningWorkflow`) now passes plan-gate `moduleBindings`,
  execution dimensions, ProjectContext facts, and `moduleScope` into the shared
  selector.
- Entry B (`KnowledgeRescanWorkflow` Step 7) now builds `moduleMiningBindings`
  from `moduleDimensionTargets` and calls the same selector instead of the
  retired scope-only selector.
- The selected module payload carries `dimensions`, `dimensionIds`, and
  `plannedDimensions`.
- `AlembicAgent` source does not require a change: moduleMining fan-out consumes
  `moduleRecord.dimensions || moduleRecord.dimensionIds`, and module input is
  preserved through normalization. There is no `plannedDimensions` dependency.

This implements the user-approved P11 behavior change: Entry B moves from
scope-only/all-dimension implicit behavior to planned per-module dimension
targeting when bindings are present, while keeping Entry A compatible.

## Controller Verification

Re-run by controller:

- `npm run test:unit -- ModuleMiningSelection.test.ts DaemonJobRunnerPlanGate.test.ts` in `Alembic` => PASS, 25 tests.
- `npm run build:check` in `Alembic` => PASS.
- `npm run lint:repo-boundary` in `Alembic` => PASS.
- `npm run lint:agent-extraction-boundary` in `Alembic` => PASS.
- `git diff --check` in `Alembic` => PASS.
- `npm test -- module-mining-agent-run.test.ts` in `AlembicAgent` => PASS, 5 tests.
- `npm run lint:core-import-boundary` in `AlembicAgent` => PASS.

Controller source review confirmed the frozen `moduleMining` stage literal is
still present and not renamed. The new `plannedDimensions` field is additive
audit/runtime evidence, not a frozen enum change.

## Boundaries

- No AlembicCore, AlembicPlugin, Test, BiliDili, release asset, version,
  vendor, provider config, or thread-id change was made.
- No Core repin is required for this Alembic-only source change.
- Plugin host-agent remains briefing-only; no cross-host orchestrator merge was
  introduced.
- R-2 cleanup root ternaries and round-loop caller ownership were not touched.

## Residual Risks

- P11 still requires independent real BiliDili moduleMining REAL-TEST.
- `alembic_code_guard` remains unavailable for this task due the known internal
  MCP schema error `unrecognized key "data"`; acceptance relies on raw source
  review plus repository tests/build/boundary checks.
- The source tests prove Entry B binding-rich routing at the selector/wiring
  level, not a real BiliDili runtime outcome.

## Next Action

Create and dispatch a Test package for P11 real BiliDili moduleMining. The test
must prove the new Entry B binding-rich behavior in a real run, including planned
dimension targeting, useful recipe/source-ref output, coverage ledger movement,
and the stage guard that keeps `deep_mining_rounds` unchanged for moduleMining.

## Forbidden Conclusions

- Do not accept P11 real-test completion from this source result.
- Do not accept G4/G6 final gates or whole-demand completion from this result.
- Do not create an AlembicAgent source follow-up unless later real-test evidence
  contradicts the current compatibility proof.
