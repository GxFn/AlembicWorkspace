# P10 AlembicPlugin Project-Index Workflow Unify Report

Date: 2026-06-28
Window: AlembicPlugin
Task: `p10-plugin-run-project-index-workflow-unify-t1`
Commit: `95bf4578ec3e2b9d19db8c548b8bfd6a98814b8e`

## Result

Completed the AlembicPlugin-only P10 implementation package.

The host-agent cold-start and knowledge-rescan entrypoints now share a Plugin-local
`runProjectIndexWorkflow(ctx, args, { mode })` entry:

- `mode: 'full'` dispatches to the existing cold-start implementation.
- `mode: 'incremental'` dispatches to the existing knowledge-rescan implementation.
- Old public names remain thin compatibility wrappers.
- MCP handler exports still expose `bootstrapForHostAgent` and `rescanForHostAgent`.
- `McpServer` and `HostMcpServer` public tool/job dispatch remains on
  `alembic_bootstrap`, `alembic_rescan`, `bootstrap`, and `rescan`.

No Core, vendor, Alembic main, AlembicAgent, BiliDili, package version, release
asset, public tool name, PlanStageId, table/schema, lifecycle value, or thread-id
change was made.

## Changed Files

- `lib/recipe-generation/host-agent-workflows/project-index.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/runtime/mcp/handlers/host-agent/bootstrap.ts`
- `lib/runtime/mcp/handlers/host-agent/rescan.ts`
- `lib/runtime/mcp/host-agent-workflows/project-index.ts`
- `test/unit/HostAgentProjectIndexWorkflow.test.ts`
- `test/unit/HostAgentProjectIndexCompat.test.ts`

## Implementation Evidence

- `lib/recipe-generation/host-agent-workflows/project-index.ts:23-52` defines
  `runProjectIndexWorkflow` and the old wrapper names with explicit
  `{ mode: 'full' }` / `{ mode: 'incremental' }`.
- `lib/recipe-generation/host-agent-workflows/cold-start.ts:102-107` keeps
  `runHostAgentColdStartWorkflow` as a thin wrapper and moves the prior body to
  `runHostAgentProjectIndexFullWorkflow`.
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:122-130`
  keeps `runHostAgentKnowledgeRescanWorkflow` as a thin wrapper and moves the
  prior body to `runHostAgentProjectIndexIncrementalWorkflow`.
- `lib/runtime/mcp/handlers/host-agent/bootstrap.ts:8-12` re-exports
  `bootstrapForHostAgent` and `runProjectIndexWorkflow` from the new unified
  Plugin-local entry.
- `lib/runtime/mcp/handlers/host-agent/rescan.ts:8-11` re-exports
  `rescanForHostAgent` and `runProjectIndexWorkflow` from the same entry.
- `lib/runtime/mcp/McpServer.ts:416-424` still routes `alembic_bootstrap` to
  `bootstrapForHostAgent` and `alembic_rescan` to `rescanForHostAgent`.
- `lib/runtime/mcp/HostMcpServer.ts:787-792` still maps job kind `bootstrap` to
  the bootstrap handler and all other local job rescan calls to the rescan handler.

## Characterization

`test/unit/HostAgentProjectIndexWorkflow.test.ts` proves:

- explicit `mode: 'full'` dispatches only to the cold-start implementation;
- explicit `mode: 'incremental'` dispatches only to the rescan implementation;
- old public names exported from the unified module keep the same fixed modes.

`test/unit/HostAgentProjectIndexCompat.test.ts` proves:

- the old `cold-start.ts` public name forwards to `runProjectIndexWorkflow(..., { mode: 'full' })`;
- the old `knowledge-rescan.ts` public name forwards to
  `runProjectIndexWorkflow(..., { mode: 'incremental' })`;
- bootstrap/rescan MCP handler re-exports are attached to the unified module.

## Validation

Passed:

```text
npm run build:check
Core build used ../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08.
```

```text
npm run lint:repo-boundary
Repository boundary check passed; @escape-hatch count 0 / 75.
```

```text
npx vitest run test/unit/HostAgentProjectIndexWorkflow.test.ts test/unit/HostAgentProjectIndexCompat.test.ts test/unit/HostMcpServerPlanSelectionJobForwarding.test.ts
3 files passed, 8 tests passed.
```

```text
npx biome check <8 changed files>
passed.
```

```text
git diff --check
passed.

git diff --check HEAD~1 HEAD
passed.
```

Post-commit state:

```text
git status --short --branch
## main...origin/main [ahead 6]

git ls-files -s vendor/AlembicCore
160000 99a7cf10d82056cd860eb0a1d9544662e3735b08 0 vendor/AlembicCore
```

## Frozen Token And R-2 Proof

Frozen public tool/schema strings remain present:

- `lib/runtime/mcp/tools.ts:291` `alembic_bootstrap`
- `lib/runtime/mcp/tools.ts:306` `alembic_rescan`
- `lib/runtime/mcp/tools.ts:352` `alembic_dimension_complete`
- `lib/shared/schemas/mcp-tools.ts:773` `coldStart`, `deepMining`, `moduleMining`
- `lib/shared/schemas/mcp-tools.ts:1416-1418` schema exports for
  `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`

Plugin workflow strings remain present at the unchanged behavior seams:

- `lib/recipe-generation/plan-generation-gate.ts:160-185` keeps
  `alembic_bootstrap`/`alembic_rescan` stage rules.
- `lib/recipe-generation/plan-confirm.ts:398-399` keeps next tool mapping
  `coldStart -> alembic_bootstrap`, otherwise `alembic_rescan`.
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:626` still
  gates deepMining round opening on `generationStage === 'deepMining'`.
- `lib/recipe-generation/host-agent-workflows/dimension-completion.ts:609`
  still documents/write-bounds `coverage_ledger`.

R-2 cleanup root is unchanged in Core:

- `../AlembicCore/src/workflows/project-index/ProjectIndexPlan.ts:68` keeps
  `projectRoot: intent.executor === 'host-agent' ? input.dataRoot : input.projectRoot`.
- `../AlembicCore/src/workflows/project-index/ProjectIndexPlan.ts:75` keeps
  host-agent `dataRoot` attached only on that branch.
- `../AlembicCore/src/workflows/project-index/KnowledgeRescanWorkflowPlan.ts:47`
  keeps rescan response tool `alembic_rescan`.
- `../AlembicCore/src/workflows/project-index/ColdStartPlan.ts:65` keeps cold-start
  response tool `alembic_bootstrap`.

Job/source/lifecycle/table strings remain at their Core anchors:

- `../AlembicCore/src/daemon/JobStore.ts:13` `bootstrap | rescan`
- `../AlembicCore/src/daemon/JobStore.ts:15` `codex | dashboard | http | system`
- `../AlembicCore/src/domain/knowledge/Lifecycle.ts:20,22` `evolving`, `decaying`
- `../AlembicCore/src/infrastructure/database/drizzle/schema.ts:671,708`
  `coverage_ledger`, `deep_mining_rounds`

## Guard

`alembic_code_guard` was attempted on the eight changed files. It failed before
returning code findings with the existing MCP internal schema error:

```text
unrecognized_keys: data
```

This is the same tool-surface failure class observed in earlier accepted phases;
repository validation passed and no guard findings were returned.

## Risks And Recommendations

- P10 REAL-TEST was intentionally not run in this AlembicPlugin implementation
  package. Controller should wait for the Alembic main P10 package before
  dispatching P10 dual-host REAL-TEST.
- This package did not perform P11 moduleMining selector behavior changes, P12
  FileChangeHandler rename, P13 HostAgent facade rename, or BiliDili runtime work.
- No push was performed.
