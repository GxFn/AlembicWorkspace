# RG-10 Plugin Plan ProjectContext Empty Repair Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-plugin-plan-project-context-empty-repair-p1`
Task: `rg10-plugin-plan-project-context-empty-repair-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: unblock RG-10 BiliDili real-scenario acceptance by repairing the `alembic_plan draft` ProjectContext-empty failure found by Test, then redispatch Test for the full four-step chain.
- Scope reviewed: AlembicPlugin commit `7d23765eac371209e40e8aa374ef2f116ad1b6cc`, target result `tr-rg10-plugin-plan-project-context-empty-repair-t1`, changed `lib/recipe-generation/plan-tool.ts`, changed `test/unit/AlembicPlanTool.test.ts`, RG-10 Test probe script, and controller rerun validation.
- Original requirement authority: RG-10 requires a confirmed Plan as the hard prerequisite. The Plugin repair package was not allowed to bypass Plan confirmation; it needed to provide enough evidence for controller to safely redispatch RG-10 Test.
- Target/window: AlembicPlugin only. Core remained at accepted commit `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Evidence reviewed: target result JSON, `git show --stat`, `git diff --name-status`, focused source reads for `collectPlanProjectContext`, fallback construction, signature computation, and Plan tests. Controller also reviewed the original Test probe's `alembic_plan confirm` call.
- Implementation reality: The commit adds a repo-fact-gated local fallback in `plan-tool.ts`. It calls Core ProjectContext `space`/`repo`, then builds fallback file/module facts only when repo language file counts are positive and presenter file/module facts are empty or sparse. It adds Swift/SwiftUI/UIKit/networking/async signals and a focused Swift draft unit test. This addresses the original `PLAN_PROJECT_CONTEXT_EMPTY` symptom at draft time.
- Validation result: Controller reran `npx vitest run --config vitest.unit.config.ts test/unit/AlembicPlanTool.test.ts test/unit/PlanDrivenGenerationGate.test.ts`: PASS, 2 files / 8 tests. The target-reported build/check/biome/Guard evidence is plausible and no missing evidence refs were reported by Wakeflow.
- Blockers: The repair does not yet prove the RG-10 first step can complete, because it tests focused Swift `draft` only. The Test probe immediately calls strict `alembic_plan confirm` with the draft `projectContextSignature` and no `allowSignatureMismatch`. Current `computeCurrentSignature(projectRoot)` recomputes ProjectContext with `hints=undefined`, while the focused draft path computes its signature with `hints.focusModules`. Since signatures include files, modules, frameworks, metadata, and module snapshots, this can cause focused Swift draft->confirm to fail with stale ProjectContext even though draft now succeeds.
- Missing evidence: No focused Swift/BiliDili-like regression proves `draft` followed by default strict `confirm` succeeds. No evidence proves `alembic_bootstrap` can proceed after that confirmed Plan on the repaired path.
- Residual risks: The fallback is synchronous and local-file based, but bounded and gated on Core repo facts; that is acceptable for this slice if the full Plan chain is proven. The current remaining risk is chain continuity, not the fallback concept itself.
- TODO/backlog rollup: Do not redispatch RG-10 Test yet. Create one AlembicPlugin rework package to preserve draft focus/signature context or otherwise make strict confirm succeed for focused Swift fallback drafts, with a test that mirrors the Test probe's draft->confirm sequence.
- Decision: request-rework.
- Next action: reduce this target result, mark rework, and dispatch `rg10-plugin-plan-project-context-empty-repair-rework-1-p1` to AlembicPlugin.

## Raw Evidence

- `git -C AlembicPlugin show --stat --summary --oneline 7d23765eac371209e40e8aa374ef2f116ad1b6cc`: 2 files changed, 903 insertions, 14 deletions.
- `git -C AlembicPlugin diff --name-status 7d23765eac371209e40e8aa374ef2f116ad1b6cc^ 7d23765eac371209e40e8aa374ef2f116ad1b6cc`: modified `lib/recipe-generation/plan-tool.ts` and `test/unit/AlembicPlanTool.test.ts`.
- `plan-tool.ts:745-823`: `collectPlanProjectContext(projectRoot, hints)` uses `hints.focusModules` for module seeds and fallback, then computes effective file/module facts.
- `plan-tool.ts:1542-1553`: `computeCurrentSignature(projectRoot)` recomputes with `collectPlanProjectContext(projectRoot, undefined)`.
- `plan-tool.ts:1561-1575`: signature input includes frameworks, fileCount, moduleCount, projectType, requestKinds, module snapshots, and file summaries, so a focused draft and unfocused current recomputation are not safely interchangeable.
- `test/unit/AlembicPlanTool.test.ts:90-153`: new Swift regression proves focused draft success and grounded signals, but stops before confirm.
- `Test/tmp/rg10-test-bilidili-scenario-acceptance-20260622/rg10-fresh-mcp-probe.mjs:110-126`: RG-10 Test probe calls `alembic_plan confirm` with `projectContextSignature`, selectedDimensions, scale, and moduleBindings, without `allowSignatureMismatch`.
- Controller rerun: `npx vitest run --config vitest.unit.config.ts test/unit/AlembicPlanTool.test.ts test/unit/PlanDrivenGenerationGate.test.ts` passed, 2 files / 8 tests.

## Rework Boundary

The rework should remain narrow:

- Prove a BiliDili-like focused Swift `alembic_plan draft` can be immediately confirmed with the default strict signature path.
- Preserve Plan stale-signature protection; do not weaken it globally and do not use `allowSignatureMismatch` as the normal path.
- If preserving focus hints in Plan draft metadata is required for current-signature recomputation, persist only the minimal factual scope needed for deterministic recompute.
- Keep bootstrap `PLAN_REQUIRED` behavior unchanged before confirmation.
- Do not run the full RG-10 Test chain in Plugin; return enough evidence for controller to redispatch Test.
