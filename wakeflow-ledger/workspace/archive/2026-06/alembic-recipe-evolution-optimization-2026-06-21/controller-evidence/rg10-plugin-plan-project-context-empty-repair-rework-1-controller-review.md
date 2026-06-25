# RG-10 Plugin Plan ProjectContext Empty Repair Rework 1 Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-plugin-plan-project-context-empty-repair-rework-1-p1`
Task: `rg10-plugin-plan-project-context-empty-repair-rework-1-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: unblock RG-10 BiliDili real-scenario acceptance after Test found `PLAN_PROJECT_CONTEXT_EMPTY`, and after the first Plugin repair still lacked proof that focused Swift `draft` can pass default strict `confirm`.
- Scope reviewed: AlembicPlugin commit `d193daec9d5c9c87222bc9e72c528831907973b6`, target result `tr-rg10-plugin-plan-project-context-empty-repair-rework-1-t1`, changed `lib/recipe-generation/plan-tool.ts`, changed `test/unit/AlembicPlanTool.test.ts`, and controller rerun validation.
- Original requirement authority: RG-10 still requires confirmed Plan as hard prerequisite. This repair may not bypass Plan confirmation, weaken stale-signature protection, or use `allowSignatureMismatch` as the normal path.
- Implementation reality: The Plan draft now persists the normalized focused ProjectContext signature scope in `planningBrief.projectContext.signatureScope`; strict confirm reads that scope from the draft and recomputes the current signature with equivalent `focusModules`.
- Strict confirm continuity: `validateConfirmCurrentSignature` now calls `computeCurrentSignature(projectRoot, buildPlanProjectContextHintsFromDraft(draft))`, so a focused draft is not compared against an unfocused recomputation.
- Stale protection: The new regression mutates a focused Swift source file after draft and confirms that default strict confirm returns `PLAN_PROJECT_CONTEXT_STALE` with `signature.matches=false`.
- Bootstrap gate: `PlanDrivenGenerationGate` tests still pass, preserving `PLAN_REQUIRED` behavior before a confirmed Plan.
- Target/window: AlembicPlugin only. Core remains the accepted dependency at `a156e0d796d396e02d815ca22147c83d59bf880b`. Full RG-10 BiliDili scenario remains Test-owned.
- Validation result: Controller reran the target unit slice and got PASS, 2 files / 9 tests. Controller also reran `npm run build:check`, `npx biome check lib/recipe-generation/plan-tool.ts test/unit/AlembicPlanTool.test.ts`, and `git diff --check`; all passed.
- Residual risk: Existing focused draft records created before this commit may need to be redrafted because they do not contain `planningBrief.projectContext.signatureScope`. This is acceptable for RG-10 redispatch because Test will create fresh drafts.
- TODO/backlog rollup: The Plugin blocker is resolved for redispatch. Do not mark the full demand complete until Test reruns the BiliDili four-step scenario.
- Decision: accept-target-result.
- Next action: reduce this target result, accept the review candidate, and dispatch a fresh RG-10 Test retry package.

## Raw Evidence

- `git -C AlembicPlugin show --stat --summary --oneline d193daec9d5c9c87222bc9e72c528831907973b6`: `Fix strict Plan confirm for focused ProjectContext`; 2 files changed, 222 insertions, 5 deletions.
- `git -C AlembicPlugin diff --name-status d193daec9d5c9c87222bc9e72c528831907973b6^ d193daec9d5c9c87222bc9e72c528831907973b6`: modified `lib/recipe-generation/plan-tool.ts` and `test/unit/AlembicPlanTool.test.ts`.
- `lib/recipe-generation/plan-tool.ts:592-599`: `buildPlanProjectContextHintsFromDraft` reads `planningBrief.projectContext.signatureScope.focusModules` from the stored draft.
- `lib/recipe-generation/plan-tool.ts:609-617`: strict confirm recomputes current ProjectContext signature with draft-derived focus hints.
- `lib/recipe-generation/plan-tool.ts:1595-1609`: `computeCurrentSignature(projectRoot, hints)` passes hints into `collectPlanProjectContext`.
- `lib/recipe-generation/plan-tool.ts:1625-1627`: focused signatures include `signatureScope`, keeping focused and unfocused signatures distinct.
- `lib/recipe-generation/plan-tool.ts:1915-1917`: planning brief summary includes `signatureScope` for focused plans.
- `test/unit/AlembicPlanTool.test.ts:90-198`: focused Swift draft persists signature scope and then default strict confirm succeeds without `allowSignatureMismatch`.
- `test/unit/AlembicPlanTool.test.ts:200-257`: focused Swift source mutation after draft causes default strict confirm to fail with `PLAN_PROJECT_CONTEXT_STALE`.
- Controller validation: `npx vitest run --config vitest.unit.config.ts test/unit/AlembicPlanTool.test.ts test/unit/PlanDrivenGenerationGate.test.ts` passed, 2 files / 9 tests.
- Controller validation: `npm run build:check` passed; Core build used `../AlembicCore @ a156e0d796d396e02d815ca22147c83d59bf880b`.
- Controller validation: `npx biome check lib/recipe-generation/plan-tool.ts test/unit/AlembicPlanTool.test.ts` passed.
- Controller validation: `git diff --check` passed.

## Redispatch Boundary

Redispatch RG-10 Test with fresh state. Test should verify the original four-step BiliDili scenario:

- Planning truthfulness with focused Swift `draft` followed by default strict `confirm`.
- Scoped Recipe generation anchored to ProjectContext and immediately retrievable.
- Real commit-driven evolution classification and routing.
- Observable vector degradation when Ollama is stopped.

Test should not implement product fixes. Any new product defect should return as blocked evidence to the owning repository.
