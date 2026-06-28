# P11 Alembic ModuleMining Binding-Rich Selector Report

Task: `p11-alembic-module-mining-binding-rich-selector-t1`
Window: `Alembic`
Commit: `25a86ee` (`fix: converge module mining selectors`)

## Summary

Implemented the Alembic-only P11 source change. The two in-process moduleMining
selectors now share `selectProjectIndexModuleMiningModules`, so Entry A
(`ModuleMiningWorkflow`) stays compatible and Entry B
(`KnowledgeRescanWorkflow` Step 7) now feeds module target bindings into the
same binding-rich selector.

The selected module payload now carries:

- `dimensions`: existing AlembicAgent consumer field.
- `dimensionIds`: compatibility alias for downstream partitioning/config.
- `plannedDimensions`: explicit audit field for P11 POST evidence.

## Changed Files

- `lib/daemon/ModuleMiningSelection.ts`
- `lib/daemon/ModuleMiningWorkflow.ts`
- `lib/daemon/DaemonJobWorkflowTypes.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- `test/unit/ModuleMiningSelection.test.ts`
- `test/unit/DaemonJobRunnerPlanGate.test.ts`

## Entry B Downstream Audit

- `KnowledgeRescanWorkflow` Step 7 now calls
  `selectProjectIndexModuleMiningModules({ bindings, executionDimensions, facts, moduleScope })`.
- `buildKnowledgeRescanMiningPlanOptions` derives `moduleMiningBindings` from
  `moduleDimensionTargets`, mapping each `{ moduleId?, moduleName?, dimensionId }`
  to one per-module planned dimension.
- AlembicAgent read-only audit found no `plannedDimensions` field consumer.
  `ModuleMiningAgentRun` preserves module input and `AgentRunCoordinator`
  consumes `moduleRecord.dimensions || moduleRecord.dimensionIds`; therefore the
  Alembic payload keeps those fields while also adding `plannedDimensions`.
- No AlembicAgent source change is required for P11 source acceptance.

## Freeze Proof

- The `moduleMining` enum literal remains in the HTTP route schema and daemon /
  workflow call sites.
- No Core, Plugin, Test, BiliDili, release, version, vendor, or thread-id files
  were modified.
- Plugin host-agent briefing-only split and per-host `runProjectIndexWorkflow`
  mode wrapper remain untouched.

## Validation

```text
npm run test:unit -- ModuleMiningSelection.test.ts DaemonJobRunnerPlanGate.test.ts
✓ test/unit/ModuleMiningSelection.test.ts (2 tests)
✓ test/unit/DaemonJobRunnerPlanGate.test.ts (23 tests)
Test Files 2 passed; Tests 25 passed
```

```text
npm run build:check
> npm run build:core && tsc --noEmit
Using local AlembicCore source: ../AlembicCore
exit 0
```

```text
npm run lint
Checked 207 files. No fixes applied.
Found 5 warnings in pre-existing noExplicitAny locations.
exit 0
```

```text
npm run lint:repo-boundary
Repository boundary check passed
@escape-hatch count: 1 / 75 threshold
exit 0
```

```text
npm run lint:agent-extraction-boundary
Agent extraction boundary check passed
exit 0
```

```text
cd ../AlembicAgent && npm test -- module-mining-agent-run.test.ts
Test Files 1 passed; Tests 5 passed
```

```text
cd ../AlembicAgent && npm run lint:core-import-boundary
Core import boundary OK: scanned 245 files and 47 @alembic/core imports.
```

```text
git diff --check
exit 0
```

```text
alembic_code_guard
failed with internal MCP schema error:
Unrecognized key: "data"
```

## Next Recommendation

Proceed to direct P11 REAL-TEST in the Test window for real BiliDili
moduleMining. No AlembicAgent follow-up package is recommended from source audit.

## Residual Risks

- P11 real BiliDili moduleMining still needs independent Test evidence.
- Alembic Guard could not run because the MCP tool returned an internal schema
  error; repository build, focused tests, boundary checks, and read-only Agent
  checks passed.
