# RG5 AlembicPlugin Controller Review

- stateRoot: `.wakeflow-active/current/alembic-recipe-evolution-optimization-2026-06-21`
- dispatchGroup: `rg5-plugin-project-context-anchored-creation-p1`
- targetTask: `rg5-plugin-project-context-anchored-creation-t1`
- targetResult: `target-results/tr-rg5-plugin-project-context-anchored-creation-t1.json`
- reviewedCommit: `AlembicPlugin@f76d10efb781507ca394beb8a054f51b0ed75259`
- upstreamCoreBuildInput: `AlembicCore@9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`
- controllerDecision: `accept-ready`

## Raw Evidence Reviewed

`git show --stat --summary --oneline f76d10e` reports 12 files changed, 688 insertions, 33 deletions, and a new shared helper `lib/recipe-generation/project-context-anchoring.ts`.

Changed files reviewed:

- `lib/recipe-generation/project-context-anchoring.ts`
- `lib/recipe-generation/plan-tool.ts`
- `lib/runtime/mcp/host-agent-workflows/cold-start.ts`
- `lib/runtime/mcp/host-agent-workflows/knowledge-rescan.ts`
- `lib/runtime/mcp/handlers/tool-router.ts`
- `lib/runtime/status/OnboardingContract.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `lib/runtime/mcp/core-tools/output.ts`
- `test/unit/AlembicPlanTool.test.ts`
- `test/unit/PlanDrivenGenerationGate.test.ts`
- `test/unit/SubmitKnowledgeRouter.test.ts`
- `test/unit/McpCoreToolsCleanOutputContract.test.ts`

Implementation findings:

- RG5 is connected behavior, not docs-only. `project-context-anchoring.ts` builds a versioned creation guide, ProjectContext tool chain, nextActions, confirmed Plan boundary, relationship-claim policy, and submit-time grounding assessment.
- `alembic_plan` draft/get outputs expose `projectContextCreationGuide`; draft planning brief carries the same guide; get nextActions now include ProjectContext MCP chaining when coverage gaps remain.
- Bootstrap and rescan Mission Briefings attach the guide and structured `recipeCreationNextActions`, carrying generation stage, selected dimensions, module scope, projectRoot, and testMode.
- OnboardingContract activates the existing static SOP by putting ProjectContext recipe_map/graph/search/prime guidance in domain SOP, submit contract, guidance floor, and tool sequence surfaces.
- `alembic_submit_knowledge` now returns `relationshipGrounding` warnings/grounded status for relationship-heavy claims, with `sourceGraphRefs` / `graphRefs` accepted in the public schema.
- Clean-output whitelist was extended for `alembic_plan`, `alembic_bootstrap`, `alembic_rescan`, and `alembic_submit_knowledge`, preserving clean public tool output compatibility.

Test coverage reviewed:

- `test/unit/AlembicPlanTool.test.ts` checks draft and get ProjectContext creation guide / nextActions and no Plugin-only Plan store leakage.
- `test/unit/PlanDrivenGenerationGate.test.ts` checks bootstrap and rescan Mission Briefing guide wiring in Plan-driven test mode.
- `test/unit/SubmitKnowledgeRouter.test.ts` checks relationship-heavy claims warn when graph refs are missing and are grounded when `sourceGraphRefs` are supplied.
- `test/unit/McpCoreToolsCleanOutputContract.test.ts` checks new clean-output fields survive projection.

## Controller Validation

All commands ran in `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`.

- `npm run build:check`: PASS. Build used `../AlembicCore @ 9eec6303549c3678bc1b0910d5d7fd3b7d3b992f`.
- `npm run test:unit -- test/unit/AlembicPlanTool.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/SubmitKnowledgeRouter.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`: PASS, 4 files / 23 tests.
- `npm run test:unit -- test/unit/HostAgentRecipeEvidenceGate.test.ts`: PASS, 1 file / 14 tests.
- `npm run lint`: PASS with existing warnings only; no RG5 error and exit code 0.
- `npm run lint:repo-boundary`: PASS.
- `npm run lint:layer-boundary`: PASS.
- `npm run lint:core-import-boundary`: PASS.
- `npm run verify:release-package-boundary`: PASS.
- `git diff --check`: PASS.
- `alembic_code_guard` over 12 changed files: PASS, guard result `guard-public-mqo5reo2-3`, 0 violations.
- `git status --short --branch`: clean, `main...origin/main [ahead 5]`.

## Risks / Non-Blocking Notes

- `alembic_status` for AlembicPlugin is ready and knowledge usable, but onboarding reports selected-project mismatch because the selected Alembic project is the workspace root. Guard still completed successfully against the explicit AlembicPlugin files.
- Target result notes full `test/unit/HostMcpServer.test.ts` has existing baseline failures unrelated to RG5; controller did not use that suite as RG5 acceptance evidence.

## Acceptance Conclusion

RG5 satisfies the task package: creation-time ProjectContext anchoring is wired into Plan, Mission Briefing, OnboardingContract/SOP, submit grounding, schema, and clean-output surfaces; confirmed Plan authority is preserved; no RG6/RG7/RG8 scope was introduced. Accept RG5 and allow downstream phases that depend on RG5 to proceed.
