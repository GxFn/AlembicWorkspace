# P9 Controller Review - Core project-index collapse and coverage unify

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: p9-core-project-index-collapse-coverage-unify-p1
Target task: AlembicCore / p9-core-project-index-collapse-coverage-unify-t1

## Decision

Accept the P9 code backfill for the Core/consumer code phase.

P9 REAL-TEST is still required by the demand gate and should be dispatched next:
real BiliDili dual-host parity for the coverage ledger after the project-index
and coverage builder collapse.

## Authority Checked

- Requirement design P9 says Core cold-start and knowledge-rescan workflow
  implementations move under `workflows/project-index/`, with old symbols/barrels
  preserved as aliases.
- Requirement design P9 says coverage ledger advisor/write/builder move under
  `workflows/capabilities/coverage/`, with host-agent compatibility shims.
- Requirement design P9 says the in-process and host module-axis builders collapse
  into one Core builder that accepts module summaries while each host keeps a thin
  source adapter.
- R-2 trap remains mandatory: full cold-start cleanup root selection stays in Core
  and distinguishes host-agent `dataRoot` from internal `projectRoot`; incremental
  rescan cleanup uses `dataRoot`.
- Hard gates checked here: R-2 ternary remains in Core, per-host split survives,
  P9 Core touch is repinned into Alembic and AlembicPlugin, and P9 REAL-TEST remains
  open rather than inferred from unit/build evidence.

## Raw Evidence Reviewed

- Target result envelope:
  `target-results/tr-p9-core-project-index-collapse-coverage-unify-t1-evidence-repair.json`
- Target report:
  `evidence/p9-core-project-index-collapse-coverage-unify-t1-report.md`
- AlembicCore commit:
  `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- Alembic consumer commit:
  `65c244d8092a70656cd2d5f3f16883f6a053b326`
- AlembicPlugin consumer commit:
  `69c80dfc86bc1ea587058567f0016e48bb8dfec2`

## Implementation Findings

- AlembicCore real full/incremental project-index implementations now live under
  `src/workflows/project-index/`.
- Existing cold-start and knowledge-rescan import paths remain compatibility
  re-export shims.
- `buildProjectIndexWorkflowPlanParts` centralizes shared full/incremental plan
  construction while preserving response tool names and frozen stage ids.
- R-2 root behavior is preserved in Core:
  - full internal cleanup uses `input.projectRoot`;
  - full host-agent cleanup uses `input.dataRoot`;
  - incremental cleanup uses `input.dataRoot`.
- Coverage ledger advisor/write implementations now live under
  `src/workflows/capabilities/coverage/`, with host-agent shims preserved.
- `buildCoverageLedgerModuleAxisFromSummaries` is exported by Core and used by:
  - Alembic in-process knowledge-rescan coverage ledger seeding;
  - AlembicPlugin host-agent dimension-completion coverage ledger writes;
  - AlembicPlugin host-agent knowledge-rescan coverage ledger seeding.
- Consumer-side filtering and path normalization remain in thin adapters, so the
  Core builder owns the common axis mapping without absorbing host-specific source
  selection.
- Alembic and AlembicPlugin both pin `vendor/AlembicCore` to
  `99a7cf10d82056cd860eb0a1d9544662e3735b08`.

## Independent Controller Validation

AlembicCore:

```text
npx vitest run test/ProjectIndexWorkflowPlan.test.ts test/PublicHostAgentWorkflowEntrypoints.test.ts test/unit/BuildCoverageLedger.test.ts
3 files passed, 15 tests passed

npm run build:check
passed

npm run lint:public-api-boundary
passed: 61 package exports classified; stable=24, provisional=8, transitional=29

npm run lint:consumer-core-imports
passed: AlembicAgent refs=47 issues=0; Alembic refs=431 issues=0; AlembicPlugin refs=444 issues=0

npm run lint:layer-contract
passed: 404 allowed runtime cross-area imports; 253 type-only bridges exempt

git diff --check HEAD~1 HEAD
passed
```

Alembic:

```text
npx vitest run test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts
2 files passed, 20 tests passed

npm run build:check
passed, using local AlembicCore source ../AlembicCore

git ls-files -s vendor/AlembicCore
160000 99a7cf10d82056cd860eb0a1d9544662e3735b08 0 vendor/AlembicCore

git diff --check HEAD~1 HEAD
passed
```

AlembicPlugin:

```text
npx vitest run test/unit/CoverageLedgerWiring.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts
2 files passed, 28 tests passed

npm run build:check
passed, Core build used ../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08

git ls-files -s vendor/AlembicCore
160000 99a7cf10d82056cd860eb0a1d9544662e3735b08 0 vendor/AlembicCore

git diff --check HEAD~1 HEAD
passed
```

## Target-Reported Validation Also Reviewed

- AlembicCore `npm run test`: passed, 145 files / 1418 tests.
- AlembicCore `npm run lint`: passed, Biome checked 655 files.
- AlembicCore `npm run build`: passed.
- Target `alembic_code_guard` attempt failed with an existing MCP internal schema
  error (`unrecognized_keys:data`), so it is recorded as tool-surface unavailable
  evidence rather than an implementation failure.

## TODO / Risk Rollup

- No new implementation TODO is authorized from this review.
- No accepted non-goal was expanded: consolidation/RecipeSimilarity, cross-host
  single orchestrator, freeze value changes, and large Plugin FileChangeHandler
  breakup remain out of P9 scope.
- P9 cannot close the demand gate until REAL-TEST runs on the real BiliDili
  workspace and proves dual-host parity with `diff == empty`.

## Next Controller Action

Run Wakeflow review reduction, accept this P9 code backfill, then dispatch the P9
BiliDili REAL-TEST package to Test.
