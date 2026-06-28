# P9 Core Project Index Collapse + Coverage Unify Evidence

Task: `p9-core-project-index-collapse-coverage-unify-t1`
Window: `AlembicCore`
Date: 2026-06-28

## Scope Completed

- AlembicCore moved the real cold-start and knowledge-rescan intent, plan, and presenter implementations into `src/workflows/project-index/`.
- Old `src/workflows/cold-start/*` and `src/workflows/knowledge-rescan/*` files remain as compatibility re-export shims.
- `host-agent-workflows`, `plans`, `workflows`, and `workflows/project-index` expose ProjectIndex aliases while keeping old names stable.
- `CoverageLedgerAdvisor.ts` and `CoverageLedgerWrite.ts` real implementations moved into `src/workflows/capabilities/coverage/`.
- Old `capabilities/host-agent/CoverageLedgerAdvisor.ts` and `CoverageLedgerWrite.ts` remain compatibility re-export shims.
- `buildCoverageLedgerModuleAxisFromSummaries` was added in Core coverage builder.
- Alembic in-process knowledge-rescan and AlembicPlugin host-agent dimension-completion/rescan seed adapters now delegate module-summary-to-axis mapping to the Core builder.
- Alembic and AlembicPlugin `vendor/AlembicCore` gitlinks were pinned to the new Core commit.

## Commits

- AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08` (`Collapse project index workflow seams`)
- Alembic: `65c244d8092a70656cd2d5f3f16883f6a053b326` (`Use core coverage module axis builder`)
- AlembicPlugin: `69c80dfc86bc1ea587058567f0016e48bb8dfec2` (`Use core coverage module axis builder`)

## Vendor Pins

- Alembic `vendor/AlembicCore`: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- AlembicPlugin `vendor/AlembicCore`: `99a7cf10d82056cd860eb0a1d9544662e3735b08`

## Validation

### AlembicCore

- `npm run build:check`: passed
- `npm run build`: passed
- `npm run test`: passed, 145 files / 1418 tests
- `npm run lint`: passed, Biome checked 655 files
- `npm run lint:public-api-boundary`: passed, 61 package exports classified; stable=24, provisional=8, transitional=29; no-growth checks passed
- `npm run lint:consumer-core-imports`: passed, AlembicAgent/Alembic/AlembicPlugin issues=0
- `npm run lint:layer-contract`: passed, 404 allowed cross-area runtime imports and 253 type-only bridges
- `git diff --check`: passed
- `git diff --check HEAD~1 HEAD`: passed
- Targeted characterization: `npx vitest run test/ProjectIndexWorkflowPlan.test.ts test/PublicHostAgentWorkflowEntrypoints.test.ts test/unit/BuildCoverageLedger.test.ts`: passed, 3 files / 15 tests

### Alembic

- `npx vitest run test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`: passed, 2 files / 20 tests
- `npm run build:check`: passed using local AlembicCore source
- `git diff --check`: passed
- `git diff --check HEAD~1 HEAD`: passed

### AlembicPlugin

- `npx vitest run test/unit/CoverageLedgerWiring.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts`: passed, 2 files / 28 tests
- `npm run build:check`: passed; build-core reported `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`
- `git diff --check`: passed
- `git diff --check HEAD~1 HEAD`: passed

## Characterization Proof

- Import proof from AlembicCore `dist`: old cold-start/rescan functions resolve; `host-agent-workflows` ProjectIndex aliases are identical to old builders; `plans` aliases are identical; old `workflows/cold-start` and `workflows/knowledge-rescan` subpaths resolve; `workflows/project-index` aggregate ProjectIndex aliases resolve; coverage barrel `buildCoverageLedgerModuleAxisFromSummaries` is identical to `host-agent-workflows` export.
- R-2 cleanup proof: `ProjectIndexPlan.ts` preserves full-mode cleanup `projectRoot: intent.executor === 'host-agent' ? dataRoot : projectRoot`; incremental cleanup remains `projectRoot: dataRoot`.
- Frozen-token grep proof: `coldStart`, `deepMining`, `moduleMining`, `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`, `coverage_ledger`, and `deep_mining_rounds` remain present in their expected Core service/workflow/schema locations.

## Guard

- `alembic_code_guard` was attempted on explicit Core P9 files and failed with the existing Alembic MCP internal schema error `unrecognized_keys: data`; no code findings were returned.

## Risks / Next Step

- P9 REAL-TEST dual-host parity was not run in this target package. The target recommends controller dispatch P9 REAL-TEST parity next if code is accepted.
- No push was performed; all commits are local on `main` in their repositories.
