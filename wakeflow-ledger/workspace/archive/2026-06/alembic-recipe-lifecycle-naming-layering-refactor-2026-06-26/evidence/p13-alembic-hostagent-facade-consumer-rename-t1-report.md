# P13 Alembic HostAgent Facade Consumer Rename Target Report

## Scope

- Window: Alembic
- Task: `p13-alembic-hostagent-facade-consumer-rename-t1`
- Dispatch group: `p13-alembic-hostagent-facade-consumer-rename-p1`
- Source evidence: accepted Core P13 producer review in `evidence/p13-core-hostagent-facade-packet-split-controller-review.md`
- Starting point verified:
  - Alembic HEAD before edit: `f79a67fa2be64c3b7ba4371f6643fcb14a07ddf6`
  - `vendor/AlembicCore` tree points to Core commit `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`

## Result

- Commit: `0d60018d7f6c9e2bb4a660b8ed18c303aa6af8ad`
- Commit summary: `refactor: use host agent project context packet`
- Changed files:
  - `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `test/unit/ProjectContextWorkflowFacts.test.ts`

## Implementation Notes

- `buildProjectContextMissionArtifacts` now imports and calls Core's `buildHostAgentAnalysisPacketFromProjectContext`.
- `ProjectContextMissionArtifacts` now exposes `hostAgentPacket`.
- `ProjectContextMissionArtifacts.ideAgentPacket` remains as an R1 compatibility alias pointing to the exact same packet object.
- Cold-start and knowledge-rescan reports now write `projectContextMissionBriefing.hostAgentProfile`.
- `projectContextMissionBriefing.ideAgentProfile` remains as an R1 compatibility field and is sourced from `hostAgentPacket.profile`.
- Focused test coverage proves `artifacts.hostAgentPacket.profile === 'rescan'` and `artifacts.ideAgentPacket === artifacts.hostAgentPacket`.

## Remaining IDEAgent Grep Classification

Command:

```sh
rg -n "IDEAgent|ideAgent" lib test --glob '!vendor/**' -S
```

Remaining hits are intentional R1 compatibility aliases only:

- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts:118` `ideAgentPacket` compatibility field type.
- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts:561` `ideAgentPacket: hostAgentPacket` identity alias.
- `lib/workflows/cold-start/ColdStartWorkflow.ts:232` `ideAgentProfile` compatibility report field.
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:616` `ideAgentProfile` compatibility report field.
- `test/unit/ProjectContextWorkflowFacts.test.ts:683` identity-compatible alias assertion.

## Frozen And Boundary Proof

- `git diff -U0` showed changed lines only for the HostAgent packet import/type/field, report `hostAgentProfile` additions, and focused test assertions.
- No changed lines touched `PlanStageId`, response tool names, lifecycle strings, `coverage_ledger`, `deep_mining_rounds`, `/api/v1/file-changes`, `file-change`, `cleanup.projectRoot`, `runProjectIndexWorkflow`, package versions, release assets, BiliDili config, Test surfaces, `moduleMiningRoutes`, AlembicCore implementation, or AlembicPlugin runtime surface.
- No push was performed.

## Validation

- PASS: `npx vitest run --config vitest.unit.config.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ColdStartPlanSelection.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/KnowledgeRescanIntent.test.ts`
  - 4 files passed, 29 tests passed.
- PASS: `npm run build:check`
  - `npm run build:core` used local AlembicCore source, then `tsc --noEmit` passed.
- PASS: `npm run lint:repo-boundary`
  - Repository boundary check passed; `@escape-hatch` count 1 / 75 threshold.
- PASS: `npx biome check lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts test/unit/ProjectContextWorkflowFacts.test.ts`
  - Checked 4 files. No fixes applied.
- PASS: `git diff --check`
- PASS: `git diff --cached --check`
- PASS: `git diff HEAD^ HEAD --check`
- PASS: `git status --short --branch`
  - Output after commit: `## main...origin/main [ahead 3]`

## Tooling Note

- Alembic status showed this project is initialized but has no usable local knowledge yet and the selected/active Alembic project points to BiliDili; raw source and repository validation were used.
- `alembic_code_guard` was attempted on the explicit changed files and failed with the known local MCP schema error: `unrecognized key "data"`. This is not used as acceptance evidence.

## Risks And Next Step

- Residual compatibility fields intentionally keep old `ideAgent*` names until downstream report/runtime consumers are migrated or proven absent.
- P13 is not complete from this Alembic source package alone. Recommended next package: AlembicPlugin runtime surface rename and response compatibility handling, followed by BiliDili REAL-TEST for end-to-end P13 behavior.
