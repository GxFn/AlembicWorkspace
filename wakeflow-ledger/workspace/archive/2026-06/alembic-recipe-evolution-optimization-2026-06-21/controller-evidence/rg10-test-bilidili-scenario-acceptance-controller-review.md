# RG-10 Test BiliDili Scenario Acceptance Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-test-bilidili-scenario-acceptance-p1`
Task: `rg10-test-bilidili-scenario-acceptance-t1`
Target: Test

## Controller Acceptance

- User goal: complete RG-10 final real-scenario acceptance for `alembic-recipe-evolution-optimization-2026-06-21`, proving the BiliDili test-mode four-step chain: Plan truthfulness, scoped ProjectContext-anchored generation, commit-driven unified evolution, and vector degradation observability.
- Scope reviewed: Test target result `tr-rg10-test-bilidili-scenario-acceptance-t1`, all listed Test evidence artifacts, RG-10 task package, accepted RG-9 controller evidence, and the Plugin/Core Plan-to-ProjectContext call-chain source.
- Original requirement authority: RG-10 requires a real BiliDili Swift project, small scoped test mode, and a confirmed Plan as the hard prerequisite for the downstream generation/evolution chain. `alembic_bootstrap` may not be used to bypass the Plan gate, and Test does not implement Plugin/Core fixes.
- Target/window: Test only. Test used accepted source baselines `AlembicPlugin` commit `13c52f18c3a5e5411f838277c9ccc0636b43ba7c` and `AlembicCore` commit `a156e0d796d396e02d815ca22147c83d59bf880b`.
- Evidence reviewed: target result JSON, `Test/tmp/rg10-test-bilidili-scenario-acceptance-20260622/evidence/rg10-target-result-summary.md`, four fresh MCP probe JSON files, `rg10-fresh-mcp-probe.mjs`, BiliDili git cleanliness notes, and source references below.
- Implementation reality: Test built a fresh local MCP from accepted Plugin/Core sources and verified that the tool list includes `alembic_plan`. `alembic_plan draft` returned `PLAN_PROJECT_CONTEXT_EMPTY` for BiliDili in Ghost-mode Test/tmp, Ghost-mode sibling, and standard-mode sibling worktrees even though both isolated worktrees contain Swift files. A valid-input `alembic_bootstrap testMode` probe returned `PLAN_REQUIRED`, confirming the downstream chain is intentionally Plan-gated.
- Source reality: `AlembicPlugin/lib/recipe-generation/plan-tool.ts:152` calls `collectPlanProjectContext(...)` and hard-blocks when file and module counts are both zero. `AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts:93` and `:101` gather `space` and `repo` ProjectContext envelopes through `ProjectContextCapabilities.execute(...)`. `AlembicCore/src/service/project-context/repo/repo.ts:166` implements the repo handler, and `:283` through `:315` show it should collect discoverer files or fallback source files from the real project root.
- Validation result: Controller review confirms Test produced a legitimate blocker at RG-10 step 1. No evidence proves the RG-10 chain can proceed, and no supported alternate Plan route was authorized by the requirement.
- Blockers: `alembic_plan draft` cannot build a non-empty ProjectContext-grounded draft for a visible Swift BiliDili checkout in fresh MCP routes. This blocks Plan confirmation, scoped generation, commit-driven evolution, and vector degradation validation.
- Missing evidence: none for proving the current blocker. RG-10 completion evidence remains missing because downstream steps cannot run without bypassing the confirmed Plan gate.
- Residual risks: The current Codex host Alembic surface is stale and lacks `alembic_plan`, but Test avoided that by running a fresh local MCP. The sibling BiliDili worktree remains as named evidence with untracked `.asd/` and `Alembic/`; original BiliDili was not dirtied by Test.
- TODO/backlog rollup: RG-10 Test result is valid blocked evidence, not final acceptance. Create a Plugin repair package for the Plan ProjectContext-empty failure, with permission to return a precise Core repair request if the Core ProjectContext public capability is proven insufficient or broken.
- Decision: create-next-package.
- Next action: reduce this Test result as requiring rework/repair, then dispatch `rg10-plugin-plan-project-context-empty-repair-p1` to AlembicPlugin before retrying RG-10 Test.

## Raw Evidence

- Test target result summary: `RG-10 Test acceptance is blocked at required step 1... alembic_plan draft returns PLAN_PROJECT_CONTEXT_EMPTY... alembic_bootstrap testMode with valid input returns PLAN_REQUIRED`.
- `fresh-mcp-plan-sequence.json`: Ghost-mode isolated Test/tmp BiliDili worktree; `alembic_plan draft` failed with ProjectContext empty.
- `fresh-mcp-plan-after-bootstrap-sequence.json`: valid scoped bootstrap input failed with `PLAN_REQUIRED`.
- `fresh-mcp-plan-sequence-sibling.json`: Ghost-mode sibling worktree outside `Test/tmp`; same ProjectContext-empty Plan draft.
- `fresh-mcp-plan-sequence-sibling-standard-fresh-home.json`: standard-mode sibling worktree with fresh `ALEMBIC_HOME`; init succeeded, Plan draft still returned ProjectContext empty.
- Test verified Swift source files under `BiliDili/`, `Sources/Features`, `Sources/Infrastructure`, and `Sources/Core`; the failure is not explained by an empty checkout.
- Original BiliDili checkout was already dirty before Test and Test did not edit it; isolated Test/tmp worktree stayed clean.

## Next Repair Boundary

The next package must repair the Plugin/Core Plan ProjectContext call chain without weakening confirmed Plan semantics:

- `alembic_plan draft` on a fresh initialized real project must collect non-empty file/module facts from ProjectContext or a bounded, factual ProjectContext-compatible fallback before saving a draft.
- BiliDili Plan draft must show dimensions/scale grounded in real Swift project signals, not language-only guessing.
- `alembic_bootstrap` must continue to block with `PLAN_REQUIRED` until a Plan is confirmed.
- If the Plugin proves Core `ProjectContextCapabilities.execute(...)` itself cannot return repo facts for a fresh Swift project, the Plugin result must include a concrete Core repair request with raw evidence instead of faking Plan contents.
