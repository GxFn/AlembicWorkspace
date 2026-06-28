# P14 AlembicAgent ProjectIndex Module Mining Folder Evidence

Task: `p14-agent-project-index-module-mining-folder-t1`
Dispatch group: `p14-agent-project-index-module-mining-folder-p1`
Target window: `AlembicAgent`
Status: completed
Commit: `e26f04414b71e36c72bc0f29b787579279d18f25`

## Scope Completed

P14 moved the module-mining Agent-run implementation and profile definitions into focused
`module-mining/` namespaces while preserving the frozen runtime values and R1 import
compatibility required by the task package.

Changed-file map:

- `src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts`
  - New implementation home.
  - Adds `ProjectIndexScopedModule`, `RunProjectIndexScopedModuleMiningInput`, and
    `runProjectIndexScopedModuleMining`.
  - Keeps `runModuleMining`, `ModuleMiningModule`, and `RunModuleMiningInput` as R1 aliases.
- `src/agent/runs/module/ModuleMiningAgentRun.ts`
  - R1 shim that re-exports the new module-mining implementation, preserving direct old imports.
- `src/agent/runs/index.ts`
  - Public run index now points at the new module-mining implementation while still exporting
    `runModuleMining`.
- `src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts`
  - New profile home using ProjectIndex scoped-module wording.
  - Frozen ids and fan-out keys remain byte-stable.
- `src/agent/profiles/definitions/module.profile.ts`
  - R1 shim that re-exports the new profile constants.
- `src/agent/profiles/definitions/index.ts`
  - Built-in profile registry now imports the new profile namespace.
- `src/agent/coordination/AgentRunCoordinator.ts`
  - Internal function names now use `ProjectIndexScoped*` / scoped-index vocabulary.
  - Registered partitioner and merger keys remain `projectContextModules` and `moduleMiningResults`.
- `test/module-mining-agent-run.test.ts`
  - Adds compatibility assertions proving old direct path, run index, and new namespace resolve to
    the same function.
  - Adds profile alias proof that old `MODULE_MINING_PROFILES` is the same object as the new
    `PROJECT_INDEX_MODULE_MINING_PROFILES`.

## Grep Classification

Before edit:

- `ModuleMiningAgentRun` lived at `src/agent/runs/module/ModuleMiningAgentRun.ts`, and
  `src/agent/runs/index.ts` exported from that old path.
- `MODULE_MINING_PROFILES` lived directly in `src/agent/profiles/definitions/module.profile.ts`.
- Frozen values appeared in the run implementation, coordinator, profile definition, and tests:
  `moduleMining`, `module-mining-session`, `module-mining-dimension`,
  `projectContextModules`, and `moduleMiningResults`.
- `ProjectIndex` / `scopedIndex` vocabulary was not present in the module-mining Agent-run/profile
  implementation surface.

After edit (`rg -n "ModuleMiningAgentRun|moduleMining|module-mining-session|module-mining-dimension|projectContextModules|moduleMiningResults|ProjectIndex|scopedIndex" src test package.json tsconfig.json config`):

- `ModuleMiningAgentRun` remains only as the R1 compatibility path:
  `src/agent/runs/module/ModuleMiningAgentRun.ts` and one compatibility test import.
- New implementation/profile namespace carries ProjectIndex/scoped-index names:
  `src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts`,
  `src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts`,
  `src/agent/coordination/AgentRunCoordinator.ts`, and focused tests.
- Frozen stage/profile/fan-out values are unchanged:
  - `moduleMining` remains the generation stage literal.
  - `module-mining-session` remains the parent profile id.
  - `module-mining-dimension` remains the child profile id.
  - `projectContextModules` remains the partitioner key.
  - `moduleMiningResults` remains the merge key.

## Validation

AlembicAgent:

- `npm run build:check` => PASS.
- `npm run lint:core-import-boundary` => PASS; scanned 247 files and 47 `@alembic/core` imports.
- `npm test -- module-mining-agent-run.test.ts plan-agent-run.test.ts` => PASS; 2 files, 16 tests.
- `npx biome check` on changed files => PASS after mechanical formatting.
- `git diff --check` => PASS.
- `git diff --cached --check` before commit => PASS.
- `git status --short` after commit => clean.

Read-only consumer check:

- In `../Alembic`, `npm run build:check` => PASS.

Alembic guard:

- `alembic_status` for `AlembicAgent` returned degraded/not initialized with host project mismatch
  to the active Alembic project.
- Scoped `alembic_code_guard` was attempted on the changed files and failed with the known internal
  tool-surface error `unrecognized key "data"`. No source finding was produced by Guard.

## Boundaries

- No AlembicCore, AlembicPlugin, Alembic main source, BiliDili, provider config, package version,
  release asset, thread-id, P15 doc, G6 cleanup, or REAL-TEST work was changed.
- No public/frozen stage, profile, partitioner, merger, job/tool/source/lifecycle/schema value was
  renamed.
- No push was performed.

## Residual Risks And Recommendation

- Guard could not run because of the local MCP schema error; repository validation and raw grep/source
  evidence are the acceptance evidence for this target.
- This target did not run BiliDili REAL-TEST by design; P11 already covered moduleMining behavior,
  and P14 is a naming/folder isolation task.
- Recommendation: P15 final freeze review should include this commit in the terminal frozen-token
  audit and verify that only R1 aliases keep the old direct module/profile paths alive.
