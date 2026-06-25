# P4 Plugin Checkpoint Routing SOP Briefing Evidence

## Result

- Window: AlembicPlugin
- Task: p4-plugin-checkpoint-routing-sop-briefing-t1
- Commit: `1d17f0f833ee2704d30f7b1bd9cf9816f982b54b`
- Core dependency evidence: `npm run build` reported `../AlembicCore @ 1bac46009524e03ce6b90bf69367a608613c750c`.

## Changed Files

- `lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/recipe-generation/plan-generation-gate.ts`
- `test/unit/GitDiffCheckpoint.test.ts`
- `test/unit/PlanSelectionGateStateless.test.ts`

## Implementation Summary

- Plugin durable git-diff checkpoint runtime now consumes Core `createCurrentGitHeadBaselineProvider()` instead of carrying a local `execFileSync` HEAD reader.
- `PlanGenerationGateReady` now carries normalized `planSelection` as an internal executor authority.
- Generation intent and mission briefing dimensions derive from `planSelection.dimensions`, not caller `dimensions`, test-mode dimension filters, active confirmed Plan state, or module-binding-derived substitutions.
- Cold-start and rescan generation paths both consume `planSelection.dimensions` when preparing execution/briefing dimensions.
- `alembic_plan` draft/confirm output remains stateless and does not include SOP or missionBriefing payloads.

## Verification

- `npm run test:unit -- test/unit/GitDiffCheckpoint.test.ts test/unit/PlanSelectionGateStateless.test.ts test/unit/PlanDraftTwoBlockProjector.test.ts test/unit/PlanConfirmStatelessSelection.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 5 files, 37 tests.
  - Includes real temporary git repository route through `createPluginGitDiffCheckpointRuntime`; HEAD exists and checkpoint initializes with `initializationSource: current-head`, not `empty`.
  - Includes cold-start workflow test where caller passes `dimensions: ["architecture"]` but `planSelection.dimensions` contains `["architecture", "swift-objc-idiom"]`; returned briefing includes both dimensions and each has SOP `analysisGuide.steps`.
  - Includes plan draft/confirm clean-output tests proving `missionBriefing`, `sop`, `analysisGuide`, and `sourceReports` are not part of `alembic_plan` output.
- `npm run check`
  - Passed.
  - Biome emitted existing warnings in unrelated host-adapter/script files, but command exited 0.
- `npm run build`
  - Passed.
  - Reported Core commit `1bac46009524e03ce6b90bf69367a608613c750c`.
- `npm run smoke:codex-plugin`
  - Passed with runtime package boundary, startup runtime, install, shell bootstrap, and stdio all passed.
- `git diff --check`
  - Passed.
- Residue scan:
  - `rg -n "getActiveConfirmed|PlanRepository|active confirmed|activeConfirmed|baselineProvider: \\{|readCurrentHeadCommit|routePlanTool" lib/recipe-generation/evolution lib/recipe-generation/host-agent-workflows lib/recipe-generation/plan-generation-gate.ts lib/runtime/mcp/handlers/host-agent lib/runtime/mcp/host`
  - No matches.
  - Plan-output scan found `missionBriefing`, `sop`, `analysisGuide`, and `sourceReports` only in tests that assert they are forbidden from draft output.

## Guard

- `alembic_code_guard` was attempted twice against the six changed files.
- Both attempts failed inside the MCP surface with `CODEX_MCP_ERROR` / `core.failure.internal-error` and message `Unrecognized key: "data"`.
- This is recorded as a guard-surface blocker; no code findings were returned by the guard.

## Risks

- The repository still has unrelated Biome warning noise in existing files, but `npm run check` exits 0.
- Guard MCP surface requires repair before it can provide scoped guard findings for this change.
