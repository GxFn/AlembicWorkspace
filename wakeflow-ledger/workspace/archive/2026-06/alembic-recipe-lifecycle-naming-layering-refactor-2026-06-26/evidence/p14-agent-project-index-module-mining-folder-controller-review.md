# P14 Agent ProjectIndex Module-Mining Folder Controller Review

Date: 2026-06-29
State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
Dispatch group: `p14-agent-project-index-module-mining-folder-p1`
Target result: `target-results/tr-p14-agent-project-index-module-mining-folder-t1.json`

## Decision

Accept the AlembicAgent P14 target result.

P14 was scoped to AlembicAgent naming/folder isolation only. The evidence proves the module-mining Agent-run implementation moved under a `module-mining/` namespace with ProjectIndex/scoped-index internal vocabulary, while the frozen public/runtime values and R1 compatibility imports remain stable.

## Evidence Reviewed

- Target result: `target-results/tr-p14-agent-project-index-module-mining-folder-t1.json`
- Target report: `evidence/p14-agent-project-index-module-mining-folder-t1-report.md`
- AlembicAgent commit: `e26f04414b71e36c72bc0f29b787579279d18f25`
- Source files reviewed:
  - `AlembicAgent/src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts`
  - `AlembicAgent/src/agent/runs/module/ModuleMiningAgentRun.ts`
  - `AlembicAgent/src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts`
  - `AlembicAgent/src/agent/profiles/definitions/module.profile.ts`
  - `AlembicAgent/src/agent/profiles/definitions/index.ts`
  - `AlembicAgent/src/agent/runs/index.ts`
  - `AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts`
  - `AlembicAgent/test/module-mining-agent-run.test.ts`

## Implementation Reality

- New implementation home:
  - `src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts`
  - `src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts`
- R1 shims:
  - `src/agent/runs/module/ModuleMiningAgentRun.ts` re-exports the new implementation.
  - `src/agent/profiles/definitions/module.profile.ts` re-exports the new profile constants.
- Public run registry:
  - `src/agent/runs/index.ts` now exports `runModuleMining` from the new namespace, keeping the old exported name.
- Built-in profile registry:
  - `src/agent/profiles/definitions/index.ts` consumes `PROJECT_INDEX_MODULE_MINING_PROFILES`.
- Coordinator:
  - Existing partitioner key `projectContextModules` now maps to `partitionProjectIndexScopedModules`.
  - Existing merge key `moduleMiningResults` now maps to `mergeProjectIndexScopedModuleResults`.
- Frozen values retained:
  - `moduleMining`
  - `module-mining-session`
  - `module-mining-dimension`
  - `projectContextModules`
  - `moduleMiningResults`
- Scope boundaries held:
  - Commit touched only 8 AlembicAgent source/test files.
  - No package/version/config changes.
  - No AlembicCore, AlembicPlugin, Alembic main source, BiliDili, provider config, release asset, P15 doc, or G6 cleanup change.

## Controller-Rerun Validation

Controller reran the high-signal checks on 2026-06-29:

- `cd AlembicAgent && npm run build:check` => PASS.
- `cd AlembicAgent && npm run lint:core-import-boundary` => PASS; 247 files and 47 `@alembic/core` imports scanned.
- `cd AlembicAgent && npm test -- module-mining-agent-run.test.ts plan-agent-run.test.ts` => PASS; 2 files, 16 tests.
- `cd AlembicAgent && git diff --check` => PASS.
- `cd Alembic && npm run build:check` => PASS as read-only consumer check.
- `git -C AlembicAgent status --short` => clean.
- `git -C Alembic status --short`, `git -C AlembicPlugin status --short`, and `git -C AlembicCore status --short` => clean.

## Controller Findings

- The P14 naming/folder isolation is real code movement, not a type-only or dead shim.
- Old direct imports remain available through R1 shims, and tests assert identity between old paths and the new ProjectIndex namespace.
- The module-mining behavior path is preserved at the Agent seam: profile registration, child profile selection, fan-out, merge key, scaleCap, and zero-fanout rejection are covered by focused tests.
- No BiliDili REAL-TEST is required for P14 because the design explicitly assigns behavior proof to P11 and defines P14 as naming/folder isolation plus characterization.
- The local Alembic guard failure is not a P14 blocker because the failure is the known MCP tool-shape issue (`unrecognized key "data"`), while repository validation and raw source evidence are sufficient for this scoped refactor.

## Residual Risks / Next Action

- P15 final freeze review should include AlembicAgent commit `e26f04414b71e36c72bc0f29b787579279d18f25` in the frozen-token audit.
- P15 should confirm the old module/profile paths are only R1 aliases and that CG-5 isolation gates still hold.
- This acceptance does not complete P15, G6, archive, or the whole demand.
