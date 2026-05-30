# PCVM Data Records: Alembic Internal Cold-start

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `AlembicWorkspace`
Purpose: store measured facts and command evidence for the run. The plan remains in `../plan.md`.

## N0 Data Location

Recorded at: `2026-05-30 15:13 CST`
Status used by plan: `pass`
Evidence mode: read-only local source/config inspection.

### Resolver Facts

```json
{
  "targetProjectRoot": "/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic",
  "projectRealpath": "/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic",
  "sourceRepositoryRoot": "/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic",
  "runtimeRoot": "/Users/gaoxuefeng/.asd/workspaces/ecf32806",
  "runtimeRootSource": "ProjectScopeRegistry ghost dataRoot",
  "workspaceRoot": "/Users/gaoxuefeng/Documents/AlembicWorkspace",
  "databasePath": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd/alembic.db",
  "generatedOutputRoot": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic",
  "deliveryOutputRoot": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic/skills",
  "integrationFiles": [
    "/Users/gaoxuefeng/.asd/project-scopes.json",
    "/Users/gaoxuefeng/.asd/projects.json"
  ],
  "writeMode": "read-only",
  "sourceTreeMutationAllowed": false,
  "runtimeMutationAllowed": false,
  "requiresUserConfirmation": false,
  "adapter": "alembic",
  "adapterFacts": {
    "isAlembicDevRepo": true,
    "packageName": "alembic-ai",
    "ghostMode": "project-scope",
    "registryPath": "/Users/gaoxuefeng/.asd/project-scopes.json",
    "dataRoot": "/Users/gaoxuefeng/.asd/workspaces/ecf32806",
    "runtimeDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd",
    "databasePath": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd/alembic.db",
    "knowledgeBaseDir": "Alembic",
    "knowledgeDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic",
    "recipesDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic/recipes",
    "skillsDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic/skills",
    "candidatesDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic/candidates",
    "wikiDir": "/Users/gaoxuefeng/.asd/workspaces/ecf32806/Alembic/wiki"
  }
}
```

### Command Evidence

| Command | Result |
| --- | --- |
| `node --input-type=module -e "resolveAlembicWorkspace(...).toFacts()"` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; returned ProjectScope Ghost dataRoot `/Users/gaoxuefeng/.asd/workspaces/ecf32806` |
| `git status --short` in `Alembic` | exit 0; no output |
| `git status --short` in `AlembicCore` | exit 0; no output |
| `realpath /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; returned `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` |
| `find /Users/gaoxuefeng/.asd/workspaces/ecf32806 ...` | exit 0; found external `.asd`, `.asd/jobs`, `Alembic`, `Alembic/candidates`, `Alembic/skills` |
| `find /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic ...` | exit 0; found pre-existing source markers `.asd`, `.cursor/skills`, `skills` |

### Source Evidence

- `Alembic/lib/project-scope/ProjectScopeRegistry.ts`: `resolveAlembicWorkspace(projectRoot)` resolves a ProjectScope-bound folder to a `WorkspaceResolver`.
- `AlembicCore/src/shared/WorkspaceResolver.ts`: `toFacts()` exposes dataRoot, runtimeDir, databasePath, knowledgeDir, skillsDir, candidatesDir, and wikiDir.
- `Alembic/lib/bootstrap.ts`: bootstrap initialization calls `resolveAlembicWorkspace(projectRoot)` and stores `workspaceResolver`.
- `Alembic/lib/injection/ServiceContainer.ts`: initialized bootstrap components are injected as `_projectRoot` and `_workspaceResolver`.
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`: cold-start reads `projectRoot` / `dataRoot` through `resolveProjectRoot` and `resolveDataRoot`.

## N1 Bootstrap Container Lifecycle

Recorded at: `2026-05-30 15:29 CST`
Status used by plan: `pass`
Evidence mode: focused existing tests plus source inspection; no cold-start workflow execution.

### Test Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/DaemonJobRunner.test.ts test/unit/BootstrapTaskManager.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 2 files passed; 13 tests passed | JobStore recovery/cancel, daemon job process event bridge, TaskManager cancel/late-transition/summary behavior |
| `npx vitest run test/integration/ServiceContainer.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 1 file passed; 15 tests passed | ServiceContainer construction, singleton reset, bootstrap initialize, service resolution, shutdown |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no product source mutation after N1 tests |

### Covered Assertions

- `BootstrapTaskManager` ignores late task transitions after user cancellation.
- `BootstrapTaskManager` aggregates task efficiency into running and final session status.
- `BootstrapTaskManager` preserves failed task payloads for progress and efficiency summary.
- `DaemonJobRunner` marks interrupted active daemon jobs as failed and stays quiet when no active jobs exist.
- `cancelDaemonJob` persists a running bootstrap abort as a cancelled job with final session evidence.
- Bootstrap process event bridge records explicit events and materializes artifacts.
- `ServiceContainer` initializes core modules, resolves services, preserves singleton behavior, and shuts down through the test bootstrap fixture.

## N2 Entry Intent

Recorded at: `2026-05-30 15:35 CST`
Status used by plan: `pass`
Evidence mode: source inspection plus pure intent/plan probe; no cleanup, daemon, DB, Dashboard, AI, delivery, or report writes.

### Source Facts

- `AlembicCore/src/workflows/shared/WorkflowTypes.ts`: `normalizeStringArray()` splits comma-separated string values, trims whitespace, filters empty values, and ignores non-string values. It does not de-duplicate.
- `AlembicCore/src/workflows/cold-start/ColdStartIntent.ts`: `createInternalColdStartIntent()` sets executor `internal-agent`, analysis mode `full`, cleanup policy `full-reset`, completion policy `auto-fill`, source tag `bootstrap`, AST context generation `true`, and internal execution flags from args.
- `AlembicCore/src/workflows/cold-start/ColdStartPlan.ts`: `buildColdStartWorkflowPlan()` maps intent fields into cleanup/projectAnalysis/materialization plan, keeps internal cleanup `projectRoot` as source `projectRoot`, and sets scan `incremental: false`.
- `AlembicCore/src/workflows/cold-start/ColdStartPlan.ts`: `selectColdStartDimensions()` later wraps `intent.dimensionIds` in a `Set`, so duplicate execution is a N6 dimension-plan question, not an N2 intent normalization failure.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/WorkflowTypes.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 1 file passed; 2 tests passed | existing normalization contract for comma split, trim, and empty/non-string filtering |
| `node --input-type=module -e "... createInternalColdStartIntent(args); buildColdStartWorkflowPlan(...); assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; emitted intent/plan JSON and all assertions passed | pure N2 fixture for internal cold-start args and plan fields |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N2 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N2 |

### Probe Fixture Summary

Args:

```json
{
  "maxFiles": 42,
  "contentMaxLines": 17,
  "skipGuard": true,
  "dimensions": ["quality,,architecture", " quality "],
  "skipAsyncFill": true,
  "skipTargetDelivery": true,
  "incremental": true
}
```

Observed intent/plan facts:

```json
{
  "intent": {
    "executor": "internal-agent",
    "analysisMode": "full",
    "cleanupPolicy": "full-reset",
    "completionPolicy": "auto-fill",
    "dimensionIds": ["quality", "architecture", "quality"],
    "internalExecution": {
      "skipAsyncFill": true,
      "skipTargetDelivery": true
    },
    "ignoredFileDiffIncremental": true
  },
  "plan": {
    "cleanup": {
      "policy": "full-reset",
      "projectRoot": "/fixture/project",
      "dataRoot": "/fixture/data"
    },
    "projectAnalysis": {
      "prepare": {
        "clearOldData": true
      },
      "scan": {
        "maxFiles": 42,
        "contentMaxLines": 17,
        "skipGuard": true,
        "sourceTag": "bootstrap",
        "generateReport": true,
        "generateAstContext": true,
        "incremental": false,
        "logPrefix": "Bootstrap"
      },
      "materializeAll": true
    },
    "response": {
      "tool": "alembic_bootstrap"
    }
  }
}
```

### Covered Assertions

- Internal cold-start args preserve `maxFiles`, `contentMaxLines`, `skipGuard`, `skipAsyncFill`, and `skipTargetDelivery`.
- Comma-separated and whitespace-padded dimensions normalize to non-empty string ids, with duplicate ids preserved at the intent boundary.
- `incremental: true` is not silently applied to scan mode; it is recorded as `ignoredFileDiffIncremental: true` and scan remains `incremental: false`.
- Internal cleanup plan points at the provided source `projectRoot` and `dataRoot`; external-agent `prepare.dataRoot` override is not used in this internal fixture.
- All deterministic materialization flags are enabled before later nodes decide actual cleanup/discovery/materialization execution.

## N3 Full Reset And Discovery

Recorded at: `2026-05-30 15:41 CST`
Status used by plan: `pass`
Evidence mode: isolated temporary fixtures only; no real Alembic runtime, daemon, Dashboard, AI, delivery, or report history.

### Source Facts

- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`: cleanup runs before `ProjectIntelligenceCapability.run()`.
- `AlembicCore/src/workflows/capabilities/WorkflowCleanupPolicies.ts`: `runFullResetPolicy()` delegates to injected `cleanupService.fullReset()`.
- `Alembic/lib/service/cleanup/CleanupService.ts`: `fullReset()` moves `candidates`, `recipes`, `skills`, and `wiki` into `.asd/.trash`, exports DB snapshot rows, clears runtime tables, deletes context index, bootstrap report, and signal logs, then recreates cleared knowledge directories.
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`: `runPhase1_FileCollection()` detects project discoverer, loads targets, collects target files, filters Alembic-generated paths, reads source content, computes language stats, and reports truncation when `maxFiles` is reached.
- `AlembicCore/src/core/discovery/NodeDiscoverer.ts`: Node fixtures skip dot directories and excluded generated/build directories during file collection.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `node --input-type=module -e "... runFullResetPolicy({ cleanupService: new CleanupService(...) }) ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; temp fixture removed | proves full reset can be isolated to provided temp `dataRoot` and leaves temp source project untouched |
| `node --input-type=module -e "... runPhase1_FileCollection(tempProject, logger, ...) ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; temp fixture removed | proves Phase 1 discovery can stop before AST/materialization and reports file/truncation facts |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N3 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N3 |

### Cleanup Probe Summary

```json
{
  "movedItems": 4,
  "dbSnapshotRows": 1,
  "deletedFiles": 7,
  "clearedTables": 15,
  "errors": 0,
  "sourceUntouched": true,
  "tempRootRemoved": true
}
```

### Discovery Probe Summary

```json
{
  "discoverer": "node",
  "targets": ["pcvm-fixture"],
  "files": ["src/a.ts", "src/b.ts", "src/c.ts"],
  "langStats": {
    "ts": 3
  },
  "truncatedAt2": true,
  "limitedCount": 2,
  "generatedGuards": {
    "agents": true,
    "mdc": true
  },
  "tempRootRemoved": true
}
```

### Covered Assertions

- Full reset moved four knowledge-surface directories into a temporary trash folder and recreated/cleared runtime surfaces under the temporary `dataRoot`.
- DB cleanup path was exercised through a fake DB handle and exported one snapshot row before clearing runtime tables.
- Temporary project source file remained present until the fixture cleanup, proving the full reset did not target `projectRoot`.
- Phase 1 selected the Node discoverer, returned one target, collected only fixture TypeScript source files, computed `ts: 3`, and reported truncation when `maxFiles=2`.
- Alembic-generated path guard returned true for `AGENTS.md` and `.cursor/rules/*.mdc`; dot/build/generated directories were not collected by the Node discoverer fixture.

## N4 Project Intelligence Materialization

Recorded at: `2026-05-30 15:45 CST`
Status used by plan: `pass`
Evidence mode: focused materialization tests plus isolated temporary ProjectIntelligence fixture; no bootstrap, daemon, Dashboard, AI, delivery, report history, or Agent runtime.

### Source Facts

- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts`: `ProjectIntelligenceCapability.run()` performs preparation, then `runAllPhases()`, and prep warnings are merged into result warnings.

- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`: `runAllPhases()` executes Phase 1 file collection, incremental evaluation, AST, entity graph, call graph, dependency graph, module entities, panorama, Guard audit, and dimension resolve before returning deterministic project analysis data.
- `AlembicCore/src/types/project-snapshot-builder.ts`: `buildProjectSnapshot()` normalizes the run output into a typed `ProjectSnapshot`.
- `AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts`: `buildInternalColdStartReport()` and `buildInternalColdStartTargetFileMap()` project snapshot data into cold-start report and prompt file-map surfaces.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/ProjectAnalysisMaterialization.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 1 file passed; 8 tests passed | focused materialization behavior for dependency/entity/call graph pieces |
| `node --input-type=module -e "... ProjectIntelligenceCapability.run(tempProject) ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; temp fixture removed | full deterministic Phase 1.5-4 fixture with fake repositories/services and snapshot/report/target-map projection |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N4 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N4 |

### ProjectIntelligence Probe Summary

```json
{
  "files": 2,
  "primaryLang": "typescript",
  "targets": 1,
  "activeDimensions": 14,
  "reportPhases": [
    "fileCollection",
    "ast",
    "entityGraph",
    "callGraph",
    "depGraph",
    "panorama",
    "guard",
    "dimension"
  ],
  "warnings": [],
  "entityWrites": 4,
  "graphEdgeWrites": 3,
  "depEdgesWritten": 1,
  "depEdgeCalls": 1,
  "violationsWritten": 0,
  "panorama": {
    "summary": "ok",
    "modules": 1
  },
  "targetMapKeys": ["pcvm-n4-fixture"],
  "targetMapFileCount": 2,
  "astContextLength": 120,
  "tempRootRemoved": true
}
```

### Covered Assertions

- ProjectIntelligence produced a non-empty deterministic analysis result from the temporary fixture.
- Snapshot/report/target map surfaces were all built from the same fixture output before dimension/session creation.
- Phase report contained all expected deterministic phase keys.
- Entity graph, call graph, dependency edge, and panorama service calls were exercised through fake repositories/services.
- Temporary fixture was removed and product repositories remained clean.

## N5 Rescan Preservation Gate

Recorded at: `2026-05-30 15:47 CST`
Status used by plan: `pass / branch-gated`
Evidence mode: branch eligibility source check, focused rescan unit tests, and pure policy-order probe. No real rescan runtime was executed.

### Source Facts

- `AlembicCore/src/workflows/cold-start/ColdStartIntent.ts`: internal cold-start intent has `cleanupPolicy: full-reset`; N5 is not selected in Variant A/B pure cold-start.
- `AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`: internal rescan defaults to `cleanupPolicy: rescan-clean`, `analysisMode: incremental`, and switches to `force-rescan` / `full` only when `force` is true.
- `AlembicCore/src/workflows/capabilities/WorkflowCleanupPolicies.ts`: `runRescanCleanPolicy()` and `runForceRescanCleanPolicy()` call `snapshotRecipes()` before the cleanup method.
- `Alembic/lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`: rescan workflow records preserved recipe count and coverage before proceeding.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/CleanupService.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 3 files passed; 11 tests passed | rescan intent cleanup policy, domain plan preservation, and rescan cleanup table-preservation coverage |
| `node --input-type=module -e "... runRescanCleanPolicy / runForceRescanCleanPolicy order assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0 | pure proof that policy order snapshots recipes before cleanup and that cold-start remains `full-reset` |

### Policy Probe Summary

```json
{
  "coldStartCleanup": "full-reset",
  "rescanCleanup": "rescan-clean",
  "rescanAnalysisMode": "incremental",
  "rescanScanIncremental": true,
  "policyCallOrder": ["snapshot", "rescanClean", "snapshot", "forceRescanClean"],
  "normalPreserved": 2,
  "forceDeletedFiles": 2
}
```

### Covered Assertions

- Pure cold-start does not use the rescan preservation branch.
- Rescan preservation is not skipped silently: the branch contract snapshots recipe truth before both normal and force cleanup.
- Existing focused tests cover rescan intent semantics, planning coverage/decay decisions, and rescan cleanup table preservation.
- Variant C remains the owner for any real rescan runtime evidence.

## N6 Dimension Plan

Recorded at: `2026-05-30 15:50 CST`
Status used by plan: `pass`
Evidence mode: existing TestMode unit plus pure frozen-dimension probe; no session/task creation, Agent runtime, daemon, AI, delivery, or report writes.

### Source Facts

- `AlembicCore/src/workflows/cold-start/ColdStartPlan.ts`: `selectColdStartDimensions()` returns all active dimensions when no requested ids are present; otherwise it filters active dimensions by a `Set` built from `intent.dimensionIds`.
- `AlembicCore/src/shared/test-mode.ts`: `applyTestDimensionFilter()` only filters when `ALEMBIC_TEST_MODE` is enabled and the mode-specific dimension list is configured.
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`: cold-start applies `selectColdStartDimensions()` before `applyTestDimensionFilter()` and before session/task creation.
- `AlembicCore/src/workflows/capabilities/execution/external/MissionBriefingSupport.ts`: `buildInternalNextSteps()` reflects selected dimension count and skill-worthy dimension ids.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/TestMode.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 1 file passed; 18 tests passed | test-mode dimension filtering, cross-mode isolation, and tier preservation |
| `node --input-type=module -e "... selectColdStartDimensions / applyTestDimensionFilter / buildInternalNextSteps assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | first run failed due wrong `dist/shared.js` import; corrected run exit 0 | pure frozen-dimension selection probe |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N6 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N6 |

### Dimension Probe Summary

```json
{
  "requested": ["code-pattern", "missing", "architecture", "architecture"],
  "selected": [
    {
      "id": "architecture",
      "skillWorthy": true,
      "tierHint": 1
    },
    {
      "id": "code-pattern",
      "skillWorthy": false,
      "tierHint": 2
    }
  ],
  "unknownDropped": true,
  "duplicatesCollapsed": true,
  "testFiltered": ["code-pattern"],
  "skillWorthy": ["architecture"],
  "candidateOnly": ["code-pattern"],
  "nextStepsCountMentions": 1
}
```

### Covered Assertions

- Requested dimensions are evaluated against active dimensions in active-dimension order.
- Duplicate requested ids collapse through `Set` behavior.
- Unknown requested ids are dropped from the selection.
- Test-mode bootstrap filter can further reduce the selected dimension list while preserving tier metadata.
- Skill-worthy and candidate-only groupings are available from the selected dimensions before N7 task/session creation.

## N7 Session Task Manager

Recorded at: `2026-05-30 15:53 CST`
Status used by plan: `pass`
Evidence mode: focused TaskManager unit plus direct session/task fixture; no async dimension dispatch, Agent runtime, daemon, AI, delivery, or finalizer.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillDispatch.ts`: `buildTaskDefs()` maps `skillWorthy` dimensions to `skill` tasks and non-skill dimensions to `candidate` tasks.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionWorkflow.ts`: `startInternalDimensionExecutionSession()` builds task defs and starts the `BootstrapTaskManager` session.
- `Alembic/lib/service/bootstrap/BootstrapTaskManager.ts`: sessions start with skeleton tasks, emit `bootstrap:started`, aggregate task progress/tool calls, support abort/cancel, and ignore late task transitions after cancellation.
- `Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`: `skipAsyncFill` controls whether `dispatchInternalDimensionExecution()` is called after skeleton creation.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/BootstrapTaskManager.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 1 file passed; 3 tests passed | cancellation semantics, efficiency aggregation, and failed payload preservation |
| `node --input-type=module -e "... startInternalDimensionExecutionSession / BootstrapTaskManager assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct N7 skeleton session/task fixture with event emission, abort, late-transition check, and missing-manager degradation |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N7 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N7 |

### Session Probe Summary

```json
{
  "taskDefs": [
    {
      "id": "architecture",
      "type": "skill",
      "skillWorthy": true,
      "hasSkillMeta": true
    },
    {
      "id": "code-pattern",
      "type": "candidate",
      "skillWorthy": false,
      "hasSkillMeta": false
    }
  ],
  "startedEvents": 1,
  "completedEvents": 1,
  "allCompletedEvents": 1,
  "finalStatus": {
    "status": "aborted",
    "total": 2,
    "completed": 1,
    "cancelled": 1,
    "userCancelled": true,
    "totalToolCalls": 3,
    "summaryReason": "pcvm-n7-cancel"
  },
  "lateTransitionIgnored": true,
  "missingManagerWarnings": 1
}
```

### Covered Assertions

- Task definitions match selected dimensions and preserve `skillWorthy` / `skillMeta` semantics.
- Session starts with one skeleton task per selected dimension and emits backend/realtime start events.
- Completed task result contributes to session tool-call aggregate.
- Abort marks unfinished tasks cancelled, sets `userCancelled`, records reason, and ignores late completion.
- Missing `bootstrapTaskManager` degrades to a null session with a warning instead of throwing through the workflow boundary.

## N8 Stage Factory Tool Policy

Recorded at: `2026-05-30 16:04 CST`
Status used by plan: `pass`
Evidence mode: focused builder unit tests plus direct one-dimension runtime/stage fixture; no live Agent/model call, producer persistence, finalizer, delivery, daemon, Dashboard, or DB mutation.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/bootstrap/BootstrapSessionExecutionBuilder.ts`: builds the bootstrap-session parent input and carries dimension runtime options into child execution.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/bootstrap/BootstrapDimensionRuntimeBuilder.ts`: prepares the bootstrap-dimension runtime profile and PCV stage evidence for a single dimension.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/bootstrap/BootstrapInputBuilders.ts`: builds dimension params, stage prompt context, and message context used by analyze / quality / repair / produce stages.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/bootstrap/BootstrapPcvNodeLocalEvidence.ts`: provides local PCV node evidence and stage mapping for bootstrap dimension execution.
- `Alembic/test/unit/BootstrapTerminalToolset.test.ts`: validates bootstrap terminal-tool policy boundaries.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/BootstrapInputBuilder.test.ts test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts test/unit/BootstrapTerminalToolset.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 4 files passed; 15 tests passed | focused stage/input/runtime/tool-policy regression suite |
| `node --input-type=module -e "... BootstrapSessionExecutionBuilder / BootstrapDimensionRuntimeBuilder assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 after corrected one-based tier expectation | direct N8 fixture proving parent profile, dimension profile, stage order, producer terminal-tool restriction, and PCV map projection |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N8 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N8 |

### Direct Fixture Summary

```json
{
  "parentProfile": "bootstrap-session",
  "dimensionParam": {
    "id": "api",
    "tier": 1,
    "hasPromptMap": true
  },
  "runtimeProfile": "bootstrap-dimension",
  "starts": ["api"],
  "childExecutionState": ["api"],
  "n8": {
    "status": "linked",
    "stageOrder": ["analyze", "quality_gate", "produce", "rejection_gate"],
    "producerNoTerminal": true,
    "terminalToolIds": []
  },
  "messageMapKeys": ["analyze", "quality_gate", "record_repair", "produce"],
  "strategySharedStateHasMaps": true,
  "recordRepair": {
    "status": "not-applicable",
    "chainNodeId": "pcvm:cold-start:n9:repair"
  }
}
```

### Covered Assertions

- Bootstrap-session parent input and bootstrap-dimension runtime profile are produced from the current builders rather than a handwritten plan assumption.
- Dimension param carries a PCV prompt map and uses one-based tier metadata resolved by the bootstrap dimension tier helper.
- Stage policy includes analyze, quality gate, producer, and rejection gate nodes before live model execution.
- Producer stage has no terminal tools in this fixture.
- PCV maps are visible through prompt context/message context and strategy shared state.
- Record-repair identity is projected to the N9 repair node even when record repair is not applicable at N8.

## N9 Agent Analyze Quality

Recorded at: `2026-05-30 16:07 CST`
Status used by plan: `pass`
Evidence mode: existing focused unit tests plus direct frozen Agent-result projection probe; no live Agent/model call, producer persistence, finalizer, delivery, daemon start, Dashboard, or broad cold-start.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`: merges N9 grounding ledger, quality gate, and record-repair projection evidence into dimension `pcvNodeEvidence`.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.ts`: builds analyze grounding summaries, N9 stage projections, and record-repair stage-map identity.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts`: projects developer-safe LLM input/output events and carries PCV evidence metadata.
- `Alembic/lib/daemon/DaemonJobRunner.ts`: attaches PCV N9 observability carry to retained job process events.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapProcessEvents.test.ts test/unit/DaemonJobRunner.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 3 files passed; 27 tests passed | focused N9 consumer, process-event, and job-event observability coverage |
| `node --input-type=module -e "... buildPcvAnalyzeGroundingLedgerSummary / buildPcvN9StageProjectionEvidence assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct frozen N9 projection probe with linked analyze, quality_gate, and record_repair evidence |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N9 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N9 |

### Direct Projection Summary

```json
{
  "grounding": {
    "status": "linked",
    "burnCount": 2,
    "evidenceProducedCount": 1,
    "deterministicEvidenceConsumedCount": 1,
    "missingLinkReasons": [],
    "nodeId": "pcvm:n9:analyze"
  },
  "quality": {
    "status": "linked",
    "nodeId": "pcvm:n9:quality_gate",
    "pass": true,
    "action": "pass"
  },
  "repair": {
    "status": "linked",
    "nodeId": "pcvm:n9:record_repair",
    "action": "record_repair_incomplete",
    "projectionSource": "phase"
  },
  "repairMap": {
    "status": "not-applicable",
    "nodeId": "pcvm:n9:record_repair",
    "projectionSource": "stage-map"
  }
}
```

### Covered Assertions

- Analyze grounding ledger can pass with evidence-produced and deterministic-evidence-consumed burns and no missing-link reasons.
- Quality gate phase projects to canonical `pcvm:n9:quality_gate` identity with pass action.
- Record-repair phase projects to canonical `pcvm:n9:record_repair` identity when repair evidence exists.
- Record-repair stage-map identity remains available when no repair phase execution is required.
- Job/process event tests cover artifact, trace, metrics, source-ref linkage, nested PCV N9 evidence, and precise missing-link reasons.

## N10 Evolve Prescreen

Recorded at: `2026-05-30 16:08 CST`
Status used by plan: `pass`
Evidence mode: focused rescan-state/admission/runtime-builder unit tests plus direct composition probe; no broad rescan, live Agent/model call, producer persistence, finalizer, delivery, daemon start, or Dashboard.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapRescanState.ts`: builds existing/decaying recipe context, occupied trigger set, coverage counts, execution decisions, and prompt-facing audit hints.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`: resolves dimension candidate needs from base dimension type plus rescan execution decision and create budget.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionAdmission.ts`: applies incremental and checkpoint admission decisions while allowing rescan execution decisions to force selected dimensions to run.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/BootstrapRescanState.test.ts test/unit/BootstrapDimensionAdmission.test.ts test/unit/BootstrapDimensionRuntimeBuilder.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 3 files passed; 10 tests passed | focused N10 rescan state, admission, and runtime-plan coverage |
| `node --input-type=module -e "... prepareBootstrapRescanState / resolveBootstrapDimensionAdmissions composition assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct branch probe for cold-start no-context, rescan recipe visibility, create budget, and forced admission |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N10 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N10 |

### Direct Composition Summary

```json
{
  "cold": {
    "rescanContext": null,
    "needsCandidates": true,
    "hasExistingRecipes": false
  },
  "rescan": {
    "existing": ["healthy", "decaying"],
    "occupiedTriggers": ["healthy_trigger", "decaying_trigger"],
    "executionMode": "produce",
    "createBudget": 2,
    "shouldExecute": true,
    "planNeedsCandidates": true,
    "prescreenDone": true
  },
  "admission": {
    "custom": {
      "dimId": "custom-dual-dim",
      "status": "run",
      "reason": "rescan execution decision requires run",
      "forcedByRescan": true
    },
    "ui": {
      "dimId": "ui",
      "status": "incremental-restored",
      "reason": "no-change-detected"
    },
    "skipped": ["ui"]
  }
}
```

### Covered Assertions

- Pure cold-start has no rescan context and therefore cannot silently inherit stale recipe state.
- Healthy recipes seed dedup titles/triggers; decaying recipes do not seed healthy-title dedup but remain visible for the dimension context.
- Rescan execution decisions surface execution mode, create budget, shouldExecute, and prescreenDone before producer execution.
- Rescan-forced dimensions remain runnable at the composition layer even when file diff would otherwise skip them.
- Non-forced unchanged dimensions can still be incremental-restored with explicit completion events.

## N11 Produce Candidates

Recorded at: `2026-05-30 16:10 CST`
Status used by plan: `pass`
Evidence mode: focused producer/sourceRef unit tests plus direct frozen producer-only cut; no live Agent/model call, consumer persistence, finalizer, delivery, daemon start, Dashboard, or broad cold-start.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.ts`: builds N11 producer-cut evidence, accepted/rejected counts, terminal-tool detection, and sourceRef validity.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`: carries N11 evidence through dimension result consumption and keeps invalid sourceRefs visible.
- `Alembic/test/unit/PcvN11SourceRefReplay.test.ts`: replays a historical invalid-sourceRef baseline through the deterministic N11 evidence builder.
- `Alembic/test/unit/BootstrapProcessEvents.test.ts`: surfaces N11 sourceRef validity gaps in output event metadata.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/PcvN11SourceRefReplay.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapProcessEvents.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 3 files passed; 19 tests passed | focused producer replay, consumer visibility, and process-event metadata coverage |
| `node --input-type=module -e "... buildPcvN11ProduceEvidence assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct frozen N11 producer-only cut with accepted/rejected counts, valid sourceRef, and no terminal tools |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N11 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N11 |

### Direct Producer-Cut Summary

```json
{
  "status": "linked",
  "nodeId": "pcvm:n11:produce",
  "acceptedCount": 1,
  "rejectedCount": 1,
  "submittedCount": 2,
  "noTerminalProof": true,
  "terminalToolCallCount": 0,
  "sourceRefs": ["src/api.ts"],
  "sourceRefValidityStatus": "valid",
  "validSourceRefCount": 1,
  "invalidSourceRefCount": 0,
  "missingLinkReasons": [],
  "producerToolCalls": [
    { "action": "submit", "status": "created", "tool": "knowledge" },
    { "action": "submit", "status": "error", "tool": "knowledge" }
  ]
}
```

### Covered Assertions

- Producer-only cut is present through `produceResult.toolCalls`.
- Accepted, rejected, and submitted counts are internally consistent with projection counts.
- Accepted candidate sourceRef resolves as valid against the supplied file index.
- No terminal tools are present in producer tool calls.
- Rejected candidate reason remains visible through the tool result.
- Historical invalid sourceRef replay remains deterministic and visible as a blocked observability gap rather than being silently treated as pass evidence.

## N12 Consumers Persistence

Recorded at: `2026-05-30 16:13 CST`
Status used by plan: `pass`
Evidence mode: focused consumer/checkpoint/relation unit tests plus direct N12 persistence evidence probe; no finalizer, delivery, report/history write, daemon start, Dashboard, live Agent/model call, or broad cold-start.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`: stores dimension reports, submitted candidates, dimension digests, and N12 PCV evidence through explicit dependencies.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.ts`: builds N12 consumer-persistence evidence from accepted producer tool calls and `SessionStore.toJSON()`.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/DimensionRestoreState.ts`: restores active checkpoints, emits checkpoint/incremental completion events, and reapplies restored state.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`: extracts candidate relation payloads and populates graph relations when repositories are available.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/BootstrapDimensionConsumer.test.ts test/unit/DimensionRestoreState.test.ts test/unit/BootstrapCandidateRelationConsumer.test.ts test/unit/BootstrapSessionConsumer.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 4 files passed; 17 tests passed | focused dimension consumer, checkpoint/restore, relation consumer, and session projection coverage |
| `node --input-type=module -e "... buildPcvN12ConsumerPersistenceEvidence / buildPcvN12ErrorEvidence assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct N12 evidence probe for accepted-title findability and failure-detail retention |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N12 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N12 |

### Direct Persistence Summary

```json
{
  "success": {
    "status": "linked",
    "nodeId": "N12-consumers-persistence",
    "acceptedCandidateTitles": ["API Contract Candidate"],
    "findableCandidateTitles": ["API Contract Candidate"],
    "sessionStoreSnapshotAvailable": true,
    "missingLinkReasons": [],
    "failureDetailsPersisted": true
  },
  "failure": {
    "status": "linked",
    "nodeId": "N12-consumers-persistence",
    "persistedFailureReason": "producer failed before persistence",
    "failureDetailsPersisted": true,
    "missingLinkReasons": []
  }
}
```

### Covered Assertions

- Accepted producer candidate titles are findable through the SessionStore snapshot for the same dimension.
- Missing-link reasons remain empty when accepted titles are findable.
- Failure-only path preserves a non-empty persisted failure reason.
- Checkpoint/incremental restore tests cover restored dimension side effects without running finalizer.
- Candidate relation consumer extracts producer candidate relations and populates graph relations when repositories are present; missing repositories degrade to null.

## N13 Finalizer Policy

Recorded at: `2026-05-30 16:16 CST`
Status used by plan: `pass`
Evidence mode: focused no-delivery/finalizer/skill/semantic unit tests plus direct summary and delivery-receipt augmentation probe; no real delivery/wiki/skill export, daemon start, Dashboard, live Agent/model call, broad cold-start, or expansion run.

### Source Facts

- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.ts`: delegates completion side effects to `runWorkflowCompletionFinalizer()`, skips delivery/wiki/memory in rescan mode, and augments reports with efficiency, skill delivery receipts, and PCV node-local evidence.
- `Alembic/lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts`: supports explicit delivery/wiki skip, scheduled wiki/semantic-memory boundaries, and completion summaries.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`: consumes skill-worthy dimensions, records ProjectSkillDeliveryReceipt data, emits process events, and respects abort checks.
- `Alembic/lib/workflows/capabilities/completion/CompletionSteps.ts`: consolidates SessionStore into semantic memory through injected dependencies and returns null on unavailable dependencies/failure.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/WorkflowCompletionFinalizer.test.ts test/unit/BootstrapSkillConsumer.test.ts test/unit/SemanticMemoryCompletionStep.test.ts test/unit/InternalDimensionFillFinalizer.test.ts test/unit/WorkflowSkillCompletionCapability.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 5 files passed; 22 tests passed | focused finalizer, no-delivery, skill receipt, semantic memory, and write-zone capability coverage |
| `node --input-type=module -e "... buildInternalDimensionCompletionSummary / augmentWorkflowReportWithSkillDeliveryReceipts assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct no-delivery summary plus ProjectSkillDeliveryReceipt report augmentation probe |
| `npm test -- test/ProjectSkillDeliveryContracts.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | terminated after no output; excluded from pass evidence | process issue recorded in `records/issues.md#i-016-alembiccore-projectskilldeliverycontracts-vitest-hang` |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N13 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N13 |

### Direct Finalizer-Policy Summary

```json
{
  "summary": {
    "mode": "bootstrap",
    "delivery": "skipped",
    "wiki": "skipped",
    "semanticMemory": "skipped"
  },
  "receipt": {
    "changed": true,
    "receiptCount": 1,
    "dimensionSkill": "project-api",
    "runtimeExportStatus": "pending",
    "totalReceipts": 1
  }
}
```

### Covered Assertions

- Bootstrap no-delivery finalizer summary explicitly reports skipped delivery, wiki, and semantic memory.
- Rescan finalizer isolation and bootstrap full-completion summaries are covered by focused tests.
- ProjectSkillDeliveryReceipt data augments workflow reports with receipt count, dimension skill name, and runtime export pending status without exporting a real Codex skill.
- Skill consumer emits delivery receipt process-event payloads and respects abort checks.
- Semantic memory consolidation uses injected dependencies and degrades to null when database/consolidation is unavailable.
- Real delivery/wiki/skill export was not opened in N13.

## N14 Report History

Recorded at: `2026-05-30 16:22 CST`
Status used by plan: `pass`
Evidence mode: focused report/history/job tests plus direct report/history/job-event fixture; no broad cold-start, daemon start, Dashboard, live Agent/model call, real delivery/wiki/skill export, or expansion/full run.

### Source Facts

- `AlembicCore` host-agent workflow persistence builds bootstrap reports, report histories, session artifact manifests, snapshots, terminal/tool summaries, and comparison hints.
- `Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.ts`: augments workflow reports with PCV node-local scorecards and writes latest/history reports through write-zone or runtime data root.
- `Alembic/lib/daemon/DaemonJobRunner.ts`: carries bootstrap job status, result artifact refs, process events, PCV observability metadata, and compact/cancelled job response semantics.
- `Alembic/lib/daemon/JobProcessEventRecorder.ts`: records bounded developer-visible process event views and artifact references.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/WorkflowResultPersistence.test.ts test/unit/JobProcessEventRecorder.test.ts test/unit/JobsRoute.test.ts test/unit/DaemonJobRunner.test.ts test/unit/InternalDimensionFillFinalizer.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 5 files passed; 33 tests passed | focused report/history, job recorder, jobs route, daemon runner, and PCV scorecard coverage |
| `node --input-type=module -e "... buildWorkflowReport / augmentWorkflowReportWithPcvNodeLocalBaseline / writeWorkflowReportHistory / JobProcessEventRecorder assertions ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0 | direct N14 fixture linking report scorecard, history index, and job artifact trace |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; no output | no Alembic product source mutation after N14 |
| `git status --short` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; no output | no AlembicCore product source mutation after N14 |

### Direct Report/Job Summary

```json
{
  "report": {
    "sessionId": "session-n14",
    "pcvNodeLocalLinkedNodes": 2,
    "n11NodeId": "pcvm:n11:produce",
    "n12NodeId": "N12-consumers-persistence",
    "comparisonHints": {
      "durationMs": 12,
      "candidates": 1,
      "toolCalls": 1,
      "terminalEnabled": false,
      "terminalSuccessRate": 0,
      "pcvNodeLocalBlockedNodes": 0,
      "pcvNodeLocalLinkedNodes": 2
    }
  },
  "history": {
    "reportCount": 1,
    "sessionIds": ["session-n14"]
  },
  "jobEvent": {
    "artifactRef": "/api/v1/jobs/job_n14/artifacts/llm-input-api.md",
    "pcvNodeId": "pcvm:n11:produce"
  }
}
```

### Covered Assertions

- Report `pcvScorecard` surfaces canonical N11 and N12 node ids with linked status.
- Report totals and comparison hints include PCV linked/blocked node counts.
- Report history index stores the session id for the fixture report.
- Job process event recorder preserves artifact refs and trace envelope PCV node id in developer-visible event data.
- Jobs route / daemon runner focused tests cover compact status, cancelled session handling, PCV N9 observability carry, nested evidence, missing-link reasons, and record-repair process events.

## EXP Two Dimensions

Recorded at: `2026-05-30 16:31 CST`
Status used by plan: `pass`
Evidence mode: focused existing tests plus direct two-dimension no-live report/history fixture; no broad cold-start, daemon, Dashboard, AI provider, delivery, DB mutation, or product source edit.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/InternalDimensionFillFinalizer.test.ts test/unit/WorkflowResultPersistence.test.ts test/unit/BootstrapSessionConsumer.test.ts test/unit/BootstrapDimensionConsumer.test.ts test/unit/BootstrapCandidateRelationConsumer.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 5 files passed; 22 tests passed | report augmentation, workflow report/history, session missing-dimension handling, dimension consumer evidence, candidate relation extraction |
| `npm test -- test/unit/BootstrapDedup.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; 1 file passed; 10 tests passed | session-level duplicate and cross-dimension duplicate guard behavior |
| `node --input-type=module -e "... two dimension report/history fixture ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; emitted summary JSON below; temporary `/private/tmp/pcvm-exp-two-*` removed | direct EXP two-dimension comparison with two dimensions and PCV node-local report/history surfaces |

### Direct Probe Summary

```json
{
  "changed": true,
  "dimensions": ["api", "architecture"],
  "acceptedCandidateTitles": [
    "API Contract Candidate",
    "Architecture Boundary Candidate"
  ],
  "pcvSummary": {
    "blockedNodes": 0,
    "dimensionCount": 2,
    "linkedNodes": 10,
    "nodeCount": 10
  },
  "n11SourceRefValidity": {
    "invalidSourceRefCount": 0,
    "invalidSourceRefRatio": 0,
    "statuses": {
      "valid": 2
    },
    "totalSourceRefCount": 2,
    "validSourceRefCount": 2
  },
  "comparisonHints": {
    "durationMs": 30,
    "candidates": 2,
    "toolCalls": 2,
    "terminalEnabled": false,
    "pcvNodeLocalBlockedNodes": 0,
    "pcvNodeLocalLinkedNodes": 10
  },
  "historySessionIds": ["session-exp-two"],
  "manifestSnapshot": {
    "status": "saved",
    "id": "snapshot-exp-two",
    "fileCount": 2,
    "dimensionCount": 2
  }
}
```

### Covered Assertions

- Two dimensions (`api`, `architecture`) are present in `report.dimensions` and in `pcvScorecard.summary.dimensionCount`.
- Each dimension preserves linked N8, N9 quality, N9 record repair, N11, and N12 evidence; aggregate node count is 10 and blocked node count is 0.
- N11 sourceRef aggregation stays valid across dimensions: 2 total refs, 2 valid refs, 0 invalid refs.
- Accepted candidate titles are dimension-local and not duplicated across the two-dimension fixture.
- `comparisonHints` carries the PCV linked/blocked node counts for before/after comparison.
- Report history index records `session-exp-two` once, and the history manifest preserves snapshot `dimensionCount: 2`.

## EXP Full Dimensions

Recorded at: `2026-05-30 16:37 CST`
Status used by plan: `pass`
Evidence mode: focused existing tests plus direct full TypeScript active-dimension no-live report/history fixture; no broad cold-start, daemon, Dashboard, AI provider, delivery, DB mutation, or product source edit.

### Command Evidence

| Command | Result | Node relevance |
| --- | --- | --- |
| `npm run test:unit -- test/unit/TestMode.test.ts test/unit/BootstrapTaskManager.test.ts test/unit/BootstrapSessionConsumer.test.ts test/unit/InternalDimensionFillFinalizer.test.ts test/unit/WorkflowResultPersistence.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; 5 files passed; 33 tests passed | dimension filtering, task/session lifecycle, session missing-dimension handling, PCV report augmentation, report/history persistence |
| `npm test -- test/unit/BootstrapDedup.test.ts` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` | exit 0; 1 file passed; 10 tests passed | cross-dimension duplicate guard behavior under full active-dimension expansion risk |
| `node --input-type=module -e "... full active dimension report/history fixture ..."` in `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic` | exit 0; emitted summary JSON below; temporary `/private/tmp/pcvm-exp-full-*` removed | direct EXP full-dimension comparison with all TypeScript active dimensions and PCV node-local report/history surfaces |

### Direct Probe Summary

```json
{
  "changed": true,
  "activeDimensionIds": [
    "architecture",
    "coding-standards",
    "design-patterns",
    "error-resilience",
    "concurrency-async",
    "data-event-flow",
    "networking-api",
    "ui-interaction",
    "testing-quality",
    "security-auth",
    "performance-optimization",
    "observability-logging",
    "agent-guidelines",
    "ts-js-module"
  ],
  "skillOnlyDimensions": [
    "architecture",
    "coding-standards",
    "agent-guidelines"
  ],
  "candidateDimensions": [
    "design-patterns",
    "error-resilience",
    "concurrency-async",
    "data-event-flow",
    "networking-api",
    "ui-interaction",
    "testing-quality",
    "security-auth",
    "performance-optimization",
    "observability-logging",
    "ts-js-module"
  ],
  "acceptedCandidateTitleCount": 11,
  "pcvSummary": {
    "blockedNodes": 0,
    "dimensionCount": 14,
    "linkedNodes": 67,
    "nodeCount": 70
  },
  "n11Statuses": {
    "not-applicable": 3,
    "linked": 11
  },
  "n11SourceRefValidity": {
    "invalidSourceRefCount": 0,
    "invalidSourceRefRatio": 0,
    "statuses": {
      "not-applicable": 3,
      "valid": 11
    },
    "totalSourceRefCount": 11,
    "validSourceRefCount": 11
  },
  "analyzeGrounding": {
    "dimensionsWithEvidence": 14,
    "burnCount": 28,
    "evidenceProducedCount": 14,
    "deterministicEvidenceConsumedCount": 14
  },
  "comparisonHints": {
    "durationMs": 240,
    "candidates": 11,
    "toolCalls": 11,
    "terminalEnabled": false,
    "pcvNodeLocalBlockedNodes": 0,
    "pcvNodeLocalLinkedNodes": 67
  },
  "historySessionIds": ["session-exp-full"],
  "manifestSnapshot": {
    "status": "saved",
    "id": "snapshot-exp-full",
    "fileCount": 14,
    "dimensionCount": 14
  }
}
```

### Covered Assertions

- TypeScript full active-dimension set contains 14 dimensions, matching the N4/N6 source-derived dimension boundary.
- Skill-only dimensions (`architecture`, `coding-standards`, `agent-guidelines`) keep N11 as explicit `not-applicable`; candidate dimensions keep N11 linked.
- Full report preserves 70 node-local entries, 67 linked nodes, and 0 blocked nodes.
- N11 sourceRef aggregation stays valid across all candidate dimensions: 11 total refs, 11 valid refs, 0 invalid refs.
- Analyze grounding evidence exists for all 14 dimensions with 28 total burns, split evenly between deterministic evidence consumed and evidence produced.
- Accepted candidate titles remain unique across all 11 candidate-producing dimensions.
- Report history index records `session-exp-full` once, and the history manifest preserves snapshot `dimensionCount: 14`.

## R2 Engineering Repair: P0-P3 Deterministic Pass

Recorded at: `2026-05-30 17:40 CST`
Status used by records: `completed(scope=unit+source)`
Evidence mode: product-source design/repair plus focused unit/type checks; no live AI, daemon, Dashboard, delivery, or runtime cold-start execution.

### Source Changes

| Package | Repo | Files | Result |
| --- | --- | --- | --- |
| P0 | `PCVM` | `scripts/validate-pcvm-run.mjs`, `config/pcvm-flow-control.json`, `README.md`, `docs/pcvm-usage.md`, `report/plan.md`, `records/issues.md`, `report/artifacts/README.md` | Added artifact validator, artifact directory contract, scoped verdict vocabulary, and issue classes. |
| P1 | `AlembicCore`, `Alembic` | `ColdStartPlan.ts`, `ColdStartPresenters.ts`, `InternalColdStartWorkflow.ts`, `test/ColdStartSelectionSummary.test.ts` | Added typed `ColdStartSelectionSummary`, report/response diagnostics for selected/unknown/skipped/duplicate dimensions, and skeleton response coverage. |
| P2 | `AlembicCore` | `ProjectIntelligenceRunner.ts`, `test/ProjectIntelligenceFileCollectionWarnings.test.ts` | Converted unreadable-file and target collection failures into explicit Phase 1 warnings with deterministic fixture coverage. |
| P3 | `Alembic` | `BootstrapPcvNodeLocalEvidence.ts`, `BootstrapConsumers.ts`, `InternalDimensionFillFinalizer.ts`, `BootstrapDimensionConsumer.test.ts`, `InternalDimensionFillFinalizer.test.ts` | Introduced `PcvNodeEvidenceEnvelope`, writes envelope beside legacy evidence, and lets report augmentation prefer the envelope while preserving compatibility. |

### Command Evidence

| Command | Result |
| --- | --- |
| `node PCVM/scripts/validate-pcvm-run.mjs pcv-20260530-1515-alembic-cold-start` in `/Users/gaoxuefeng/Documents/AlembicWorkspace` | exit 0; `ok=true`, `flowStates=9`, `rounds=7`, `issueCount=17` |
| `npx vitest run test/ColdStartSelectionSummary.test.ts test/ProjectIntelligenceFileCollectionWarnings.test.ts` in `AlembicCore` | exit 0; 2 files passed; 3 tests passed |
| `npx vitest run test/unit/BootstrapDimensionConsumer.test.ts test/unit/InternalDimensionFillFinalizer.test.ts` in `Alembic` | exit 0; 2 files passed; 11 tests passed |
| `npm run build:check` in `AlembicCore` | exit 0; TypeScript no-emit check passed |
| `npm run build:check` in `Alembic` | exit 0; local Core build plus TypeScript no-emit check passed |
| `./node_modules/.bin/biome check ...` for changed Alembic files | exit 0; 6 files checked; no fixes needed |
| `./node_modules/.bin/biome check ...` for changed AlembicCore files | exit 0 when run per file; the combined multi-file Core invocation was killed after hanging without diagnostics |

### Covered Assertions

- PCVM plan verdicts now carry explicit scope strings and issue records carry issue classes.
- Unknown requested dimension ids, duplicate requested ids, selected ids, skipped ids, and selection counts are visible in cold-start diagnostics.
- Internal cold-start skeleton response exposes session id, pending async fill status, selected dimensions, and dimension-selection diagnostics before AI work starts.
- Phase 1 file collection no longer silently drops unreadable files or target collection failures; both produce warnings with reasons.
- PCV node evidence now has a contract/version/source/scope envelope while existing report `pcvScorecard`, totals, comparison hints, and dimension-level `pcvNodeEvidence` remain compatible.

### Residual Scope

- P2 N4 analyzer degradation and `ProjectSkillDeliveryContracts` hang investigation were not completed in this pass; keep them as deterministic follow-up before live AI.
- P4/P5 responsibility split and P6 AI round preparation remain open.
- No R3 live AI/Test round has been started.
