# Controller Review: fix-agent-modulemining-child-profile-context

Reviewed at: 2026-06-27T17:34:35Z

## Scope

- Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Target: `AlembicAgent / fix-agent-modulemining-child-profile-context-t1`
- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-agent-modulemining-child-profile-context-t1.json`
- Relevant prior blocker: direct BiliDili moduleMining failed with `Cannot read properties of undefined (reading 'name')` in the module child path after mainbody session-lifecycle repair.

## Raw Evidence Reviewed

- AlembicAgent commit: `99b8b33a591b0199f47cb8fc40bc939fe4a4dee5` (`Fix module mining child context`)
- Changed files:
  - `AlembicAgent/src/agent/runs/module/ModuleMiningAgentRun.ts`
  - `AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts`
  - `AlembicAgent/test/module-mining-agent-run.test.ts`
- `git -C AlembicAgent status --short` had no output at review time.
- `git -C AlembicAgent show --stat --name-only 99b8b33` confirms only the three files above changed.

## Implementation Finding

The fix stays inside AlembicAgent and does not require Alembic callers to rename `moduleName` to `name`.

- `ModuleMiningAgentRun.ts` normalizes selected module payloads before fan-out, preserving canonical `moduleName` while adding internal aliases needed by legacy prompt/profile paths.
- `AgentRunCoordinator.ts` now builds module-specific `projectInfo`, `dimConfig`, `moduleContext`, and prompt context for `projectContextModules` child inputs before sending them through the existing `module-mining-dimension` / `bootstrapDimensionPipeline` child profile.
- The new test uses the real `AgentRuntimeBuilder` and provider prompt path, so it exercises the prompt builders that previously failed on missing `.name` / missing project-info context. It is not only a fake runtime smoke.

## Validation Run By Controller

From `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`:

- `npm run test -- test/module-mining-agent-run.test.ts test/contract-surface.test.ts`
  - Result: 2 files passed, 11 tests passed.
- `npm run build:check`
  - Result: passed.
- `npm run check`
  - Result: passed.
  - Included: build, lint and boundary gates, public signature smoke, validation floor, and full vitest.
  - Test summary: 41 files passed, 295 tests passed.
  - Lint reported existing warnings in scripts (`codemod-rename.mjs`, smoke/validation-floor console output); command exit code was 0.

## Decision

AlembicAgent target result is technically acceptable for its assigned scope: it fixes the moduleMining child context failure path, preserves the caller-side `moduleName` canonical contract, and has targeted plus full repository validation.

This does not complete the demand and does not authorize Test rerun yet, because the sibling open repair `Alembic / fix-main-deepmining-real-coverage-production-t1` is still missing. The original demand's primary blocker remains deepMining real coverage production until Alembic returns and controller reviews it.

## Next Action

- Record this review evidence in the state root.
- Reduce/decide if Wakeflow permits accepting the single AlembicAgent target.
- If the state machine requires open-review group completion, wait for Alembic result instead of dispatching more work or rerunning Test.
