# P10 Controller Review - Project-index workflow unify

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch groups:
- p10-alembic-run-project-index-workflow-unify-p1
- p10-plugin-run-project-index-workflow-unify-p1
Target tasks:
- Alembic / p10-alembic-run-project-index-workflow-unify-t1
- AlembicPlugin / p10-plugin-run-project-index-workflow-unify-t1

## Decision

Accept the P10 code backfill for the Alembic and AlembicPlugin implementation
packages.

This is not the P10 REAL-TEST gate. The next controller action is to dispatch the
P10 BiliDili dual-host REAL-TEST package after Wakeflow reduction/decision records
this code-phase acceptance.

## Authority Checked

- Requirement design §12.2 P10 requires per-host orchestrator unification behind
  `runProjectIndexWorkflow(mode)`, not a cross-host orchestrator.
- Old names remain thin wrappers with explicit mode selection.
- Alembic consumers must be updated in the same commit, including CLI bootstrap
  and rescan, daemon bootstrap/rescan, and the P6 deepMining round gate caller.
- AlembicPlugin MCP handler/re-export names must remain stable for
  `alembic_bootstrap`, `alembic_rescan`, `bootstrap`, and `rescan`.
- R-2 remains mandatory: Core plan builders keep the cleanup root ternary and
  host-agent full reset cleans under `dataRoot`, while in-process full reset cleans
  under `projectRoot`.
- Frozen values are not renamed: public MCP tool names, PlanStageId values,
  lifecycle/job/source values, coverage table names, and response tool strings
  remain unchanged.
- P11 selector behavior change, P12 FileChangeHandler rename, P13 facade rename,
  BiliDili REAL-TEST, versioning, release, push, and vendor/Core changes are out
  of these implementation packages.

## Raw Evidence Reviewed

- Alembic target result:
  `target-results/tr-p10-alembic-run-project-index-workflow-unify-t1.json`
- AlembicPlugin target result:
  `target-results/tr-p10-plugin-run-project-index-workflow-unify-t1.json`
- AlembicPlugin target report:
  `evidence/p10-plugin-run-project-index-workflow-unify-t1-report.md`
- Alembic commit:
  `aa7aeb9605f7b3f9a5a0584d1a40b06d095c1813`
- AlembicPlugin commit:
  `95bf4578ec3e2b9d19db8c548b8bfd6a98814b8e`

## Alembic Implementation Findings

- `lib/workflows/project-index/ProjectIndexWorkflow.ts` defines the Alembic-local
  `runProjectIndexWorkflow` dispatcher with explicit `full` and `incremental`
  modes and lazy registration of per-mode implementations.
- `runColdStartWorkflow` is now a fixed `mode: 'full'` compatibility wrapper.
- `runKnowledgeRescanWorkflow` is now a fixed `mode: 'incremental'` compatibility
  wrapper.
- `bin/cli.ts` bootstrap and rescan call the unified entry with explicit full and
  incremental modes.
- `lib/daemon/DaemonJobRunner.ts` bootstrap and default rescan call the unified
  entry with explicit modes.
- `lib/daemon/DeepMiningRoundGate.ts` remains the round-loop caller and invokes the
  unified entry in incremental mode with `runAsyncFillInline: true`; the round loop
  is not absorbed into the orchestrator.
- Session release ordering is preserved: workflow session creation and
  `registerProjectContextWorkflowSessionReleaseOnBootstrapCompletion` still occur
  before async fill dispatch in cold-start and rescan paths.
- R-2 cleanup behavior still flows through Core plan builders and uses
  `plan.cleanup.projectRoot`; the implementation did not rederive cleanup roots.

## AlembicPlugin Implementation Findings

- `lib/recipe-generation/host-agent-workflows/project-index.ts` defines the
  Plugin-local `runProjectIndexWorkflow` dispatcher with explicit `full` and
  `incremental` modes.
- `runHostAgentColdStartWorkflow` remains a fixed full-mode wrapper.
- `runHostAgentKnowledgeRescanWorkflow` remains a fixed incremental-mode wrapper.
- `bootstrap.ts` and `rescan.ts` continue to export `bootstrapForHostAgent` and
  `rescanForHostAgent` from the unified project-index entry.
- `McpServer.ts` still routes `alembic_bootstrap` to `bootstrapForHostAgent` and
  `alembic_rescan` to `rescanForHostAgent`.
- `HostMcpServer.ts` still maps daemon/local job kind `bootstrap` to the bootstrap
  handler and other local job calls to the rescan handler.
- `vendor/AlembicCore` remains pinned to
  `99a7cf10d82056cd860eb0a1d9544662e3735b08`.

## Independent Controller Validation

Alembic:

```text
npm run build:check
passed, using local AlembicCore source ../AlembicCore

npm run lint:repo-boundary
passed, @escape-hatch count 1 / 75

npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ColdStartPlanSelection.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/ProjectIndexWorkflow.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts
5 files passed, 39 tests passed

git diff --check HEAD~1 HEAD
passed
```

AlembicPlugin:

```text
npm run build:check
passed, Core build used ../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08

npm run lint:repo-boundary
passed, @escape-hatch count 0 / 75

npx vitest run test/unit/HostAgentProjectIndexWorkflow.test.ts test/unit/HostAgentProjectIndexCompat.test.ts test/unit/HostMcpServerPlanSelectionJobForwarding.test.ts
3 files passed, 8 tests passed

npx biome check lib/recipe-generation/host-agent-workflows/project-index.ts lib/recipe-generation/host-agent-workflows/cold-start.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts lib/runtime/mcp/handlers/host-agent/bootstrap.ts lib/runtime/mcp/handlers/host-agent/rescan.ts lib/runtime/mcp/host-agent-workflows/project-index.ts test/unit/HostAgentProjectIndexWorkflow.test.ts test/unit/HostAgentProjectIndexCompat.test.ts
checked 8 files, no fixes applied

git diff --check HEAD~1 HEAD
passed
```

## Evidence Repair Note

The original target result envelopes included several prose proof strings in
`evidenceRefs`. Wakeflow correctly treated those path-like prose refs as missing
files and blocked reduction. Controller reviewed those claims against real source
files and validations above. The repaired TargetResultEnvelope records now point
only at real source, test, report, and controller-review files; the original target
results remain preserved as raw audit input.

## TODO / Risk Rollup

- No product-code rework is required for the P10 code phase.
- No new TODO is authorized from this review.
- `alembic_code_guard` remained unavailable in both target reports due the existing
  MCP schema error class; repository build/lint/test validation passed.
- P10 remains open until the required BiliDili REAL-TEST proves both host flows,
  R-2 cleanup roots, session release, and parity conditions.

## Next Controller Action

Run Wakeflow result reduction and accept the P10 code backfill. Then create and
dispatch the P10 BiliDili dual-host REAL-TEST package to Test.
