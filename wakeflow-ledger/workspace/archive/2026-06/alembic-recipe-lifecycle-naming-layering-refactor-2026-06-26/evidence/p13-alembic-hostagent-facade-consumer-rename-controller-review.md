# P13 Alembic HostAgent Facade Consumer Rename Controller Review

## Scope

- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p13-alembic-hostagent-facade-consumer-rename-p1`
- Target task: `p13-alembic-hostagent-facade-consumer-rename-t1`
- Target window: `Alembic`
- Review decision: accept this Alembic main consumer task; P13 remains open for AlembicPlugin runtime surface rename and BiliDili REAL-TEST.

## Raw Evidence Reviewed

- Target result: `target-results/tr-p13-alembic-hostagent-facade-consumer-rename-t1.json`
- Target report: `evidence/p13-alembic-hostagent-facade-consumer-rename-t1-report.md`
- Alembic commit: `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`
- Upstream Core producer accepted at `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.

## Controller Checks

- `git -C Alembic rev-parse HEAD` matched `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`.
- `git -C Alembic status --short` returned clean output.
- `git -C Alembic show --name-status --no-renames HEAD` showed changes only in:
  - `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `test/unit/ProjectContextWorkflowFacts.test.ts`
- `git -C Alembic ls-tree HEAD vendor/AlembicCore` and the vendor checkout both point to Core commit `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- Source inspection confirmed `buildProjectContextMissionArtifacts` now calls `buildHostAgentAnalysisPacketFromProjectContext`.
- Source inspection confirmed `hostAgentPacket` is the new field and `ideAgentPacket` is an R1 identity alias to the same packet object.
- Cold-start and knowledge-rescan now write `hostAgentProfile`; `ideAgentProfile` remains as an R1 compatibility field sourced from `hostAgentPacket.profile`.
- Controller grep confirmed no remaining Alembic source call to `buildIDEAgentAnalysisPacketFromProjectContext`; remaining `ideAgent*` hits are the compatibility alias/report fields and the focused identity assertion.

## Validation Reviewed

- Target-reported validation passed:
  - `npx vitest run --config vitest.unit.config.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ColdStartPlanSelection.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/KnowledgeRescanIntent.test.ts`: 4 files, 29 tests.
  - `npm run build:check`.
  - `npm run lint:repo-boundary`.
  - `npx biome check` on changed P13 files.
  - `git diff --check`, `git diff --cached --check`, and `git diff HEAD^ HEAD --check`.
- Controller reran `npx vitest run --config vitest.unit.config.ts test/unit/ProjectContextWorkflowFacts.test.ts`: 1 file, 15 tests passed.
- Controller reran `git diff HEAD^ HEAD --check`: passed.

## Frozen And Boundary Result

- No changed lines touched `PlanStageId`, response tool names, lifecycle strings, `coverage_ledger`, `deep_mining_rounds`, `/api/v1/file-changes`, `file-change`, `cleanup.projectRoot`, `runProjectIndexWorkflow`, package versions, release assets, BiliDili config, Test surfaces, `moduleMiningRoutes`, AlembicCore implementation, or AlembicPlugin runtime surface.
- This package stayed inside the Alembic repository and did not push.

## Residuals

- Alembic `alembic_code_guard` failed with the known local MCP schema error `unrecognized key "data"`; repository validation and raw source review are used for this acceptance.
- Old `ideAgentPacket` and `ideAgentProfile` fields remain intentionally as R1 compatibility aliases until downstream consumers are migrated or proven absent.
- P13 still requires the authorized AlembicPlugin runtime surface rename/response compatibility package and BiliDili REAL-TEST.

## Decision

Accept `p13-alembic-hostagent-facade-consumer-rename-t1` as the Alembic main consumer package. The next dispatch should move to AlembicPlugin runtime surface rename and response compatibility handling before P13 real-scenario Test.
