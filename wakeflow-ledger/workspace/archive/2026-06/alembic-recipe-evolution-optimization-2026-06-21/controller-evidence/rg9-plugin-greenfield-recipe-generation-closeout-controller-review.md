# RG-9 Plugin Green-Field Recipe Generation Closeout Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg9-plugin-greenfield-recipe-generation-closeout-p1`
Task: `rg9-plugin-greenfield-recipe-generation-closeout-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: complete RG-9 Plugin green-field recipe-generation closeout after RG0-RG8, moving Recipe generation implementation ownership under `lib/recipe-generation/` while preserving public MCP/tool behavior and leaving only justified old-path compatibility adapters.
- Scope reviewed: AlembicPlugin commit `13c52f18c3a5e5411f838277c9ccc0636b43ba7c` on top of accepted AlembicCore producer `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Original requirement authority: RG-9 is a closeout/rebaseline slice for the Plugin green-field generation subsystem. It does not claim RG-10 real BiliDili scenario acceptance, does not change the public four-tool semantics, does not delete evidence/proposals/vector structures, and does not add Plan double-writes.
- Target/window: AlembicPlugin only. AlembicCore remained at `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Evidence reviewed: target result `tr-rg9-plugin-greenfield-recipe-generation-closeout-t1-20260622015755.json`; commit stat/name-status; `lib/recipe-generation/` tree; old runtime/service path adapters; `RecipeGenerationSkeleton.test.ts`; import scans; controller rerun validations below.
- Implementation reality: Recipe generation implementation files now live under `lib/recipe-generation/bootstrap`, `lib/recipe-generation/evolution`, `lib/recipe-generation/evolution/git-diff-checkpoint`, `lib/recipe-generation/host-agent-workflows`, and `lib/recipe-generation/vector`. MCP handlers, diagnostics, CLI/DI, presenter, and tests now import `#recipe-generation/*` for the moved behavior.
- Compatibility reality: old paths under `lib/runtime/mcp/host-agent-workflows`, `lib/runtime/evolution`, `lib/service/bootstrap`, `lib/service/evolution`, and `lib/service/vector` remain as documented compatibility adapters. Controller spot checks show the adapters contain RG9 owner/removal notes plus a single `export * from '#recipe-generation/...';` executable line.
- Import boundary reality: a controller scan for active imports from `#service/bootstrap`, `#service/evolution`, `#service/vector`, `#codex/evolution`, and `#codex/mcp/host-agent-workflows` in `lib` and `test` returned no matches. Remaining old-path mentions are adapter comments and the skeleton test's path list/assertions.
- Test coverage reality: `RecipeGenerationSkeleton.test.ts` now asserts moved implementation paths exist, old adapter paths are thin, adapters contain the RG9 compatibility marker and `#recipe-generation/`, and moved implementation files do not import the old service/runtime workflow aliases.
- Validation result: controller reruns passed for build, the 13 RG4-RG9 focused unit files, full repository `npm run check`, repo boundary, release package boundary, diff whitespace, Alembic status review, and Alembic Guard over all 65 changed files.
- Blockers: none for the RG-9 Plugin closeout slice.
- Missing evidence: no missing controller evidence for RG-9. RG-10/Test remains required for the final real BiliDili scenario chain and vector-degraded observation.
- Residual risks: Alembic status still reports selected-project/host-project mismatch for the local host selection, but explicit AlembicPlugin `projectRoot` Guard passed. Old adapters intentionally remain until compatibility consumers can be removed in a later authorized cleanup.
- TODO/backlog rollup: RG-9 closes. RG-10 Test/BiliDili final scenario validation is next eligible if reducer acceptance succeeds.
- Decision: accept-target-result.
- Next action: reduce and accept this review candidate, then create/dispatch RG-10 Test final scenario validation if the state root has no hard gate.

## Raw Evidence

- `git -C AlembicPlugin show --stat --summary --oneline 13c52f18c3a5e5411f838277c9ccc0636b43ba7c`: 65 files changed, 6747 insertions, 6355 deletions; added implementation files under `lib/recipe-generation/bootstrap`, `lib/recipe-generation/evolution`, `lib/recipe-generation/host-agent-workflows`, and `lib/recipe-generation/vector`.
- `git -C AlembicPlugin diff --name-status 13c52f18c3a5e5411f838277c9ccc0636b43ba7c^ 13c52f18c3a5e5411f838277c9ccc0636b43ba7c`: added the new recipe-generation implementation files and modified old runtime/service paths into adapters.
- `find AlembicPlugin/lib/recipe-generation -type f -print`: confirmed `contracts.ts`, `index.ts`, `plan-generation-gate.ts`, `plan-tool.ts`, `project-context-anchoring.ts`, plus new bootstrap/evolution/git-diff-checkpoint/host-agent-workflows/vector implementation files.
- Old adapter spot checks: `lib/runtime/mcp/host-agent-workflows/dimension-completion.ts`, `lib/runtime/evolution/PluginOpportunisticEvolution.ts`, `lib/service/bootstrap/BootstrapTaskManager.ts`, `lib/service/evolution/FileChangeHandler.ts`, and `lib/service/vector/LocalEmbedding.ts` are compatibility comments plus a single `export * from '#recipe-generation/...';`.
- Active old-import scan: `rg -n "from ['\"](#service/(bootstrap|evolution|vector)|#codex/mcp/host-agent-workflows|#codex/evolution)|import\\(['\"](#service/(bootstrap|evolution|vector)|#codex/mcp/host-agent-workflows|#codex/evolution)" lib test` exited 1 with no matches.
- Adapter marker scan: `rg -n "RG9 compatibility|RG9|export \\* from '#recipe-generation"` over the old runtime/service paths found only documented RG9 adapters and their `#recipe-generation` re-exports.
- `git -C AlembicPlugin status --short --branch`: `## main...origin/main [ahead 9]`, no dirty files after controller validation.
- `git -C AlembicCore status --short --branch`: `## main...origin/main [ahead 5]`, no dirty files after controller validation.

## Controller Validation

- `npm run build:check`: PASS. Core build used `../AlembicCore @ a156e0d796d396e02d815ca22147c83d59bf880b`; `tsc --noEmit` passed.
- `npx vitest run --config vitest.unit.config.ts test/unit/RecipeGenerationSkeleton.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/HostAgentRecipeEvidenceGate.test.ts test/unit/HostAgentProjectDataRoot.test.ts test/unit/HostAgentProjectContextDirectSwitch.test.ts test/unit/RecipeRegionVectorAvailability.test.ts test/unit/LocalEmbedding.test.ts test/unit/GitDiffCheckpoint.test.ts test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/DataLossWorkflowGates.test.ts`: PASS, 13 files / 102 tests.
- `npm run check`: PASS exit 0. Includes typecheck, Biome lint, core import boundary, layer boundary, shared asset drift, cross-shell drift, doctrine lint, and naming lint. Biome still emitted 17 existing warnings in unrelated host-adapter/script files.
- `npm run lint:repo-boundary`: PASS, escape-hatch count 0 / 75.
- `npm run verify:release-package-boundary`: PASS, `ok: true`, marketplace-shell release boundary intact.
- `git -C AlembicPlugin diff --check 13c52f18c3a5e5411f838277c9ccc0636b43ba7c^ 13c52f18c3a5e5411f838277c9ccc0636b43ba7c`: PASS.
- `alembic_status(projectRoot=AlembicPlugin)`: ready/knowledge_ready; daemon removed/stopped as expected; selected-project mismatch noted as non-blocking for explicit-root Guard.
- `alembic_code_guard` explicit 65-file scope: PASS, guard result `guard-public-mqoklz1k-1`, 0 violations / 0 warnings.
