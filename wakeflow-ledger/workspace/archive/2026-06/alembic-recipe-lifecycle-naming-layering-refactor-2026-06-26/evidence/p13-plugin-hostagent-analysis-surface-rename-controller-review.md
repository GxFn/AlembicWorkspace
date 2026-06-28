# P13 AlembicPlugin HostAgentAnalysis Surface Rename Controller Review

Reviewed at: 2026-06-28

Dispatch group: `p13-plugin-hostagent-analysis-surface-rename-p1`

Target task: `p13-plugin-hostagent-analysis-surface-rename-t1`

Decision: accept target result; P13 remains open for BiliDili REAL-TEST and later G6 cleanup decisions.

## Scope Reviewed

- Target report: `evidence/p13-plugin-hostagent-analysis-surface-rename-t1-report.md`.
- Target result: `target-results/tr-p13-plugin-hostagent-analysis-surface-rename-t1-evidence-repair.json`.
- Task package: `task-packages/p13-plugin-hostagent-analysis-surface-rename-p1.json`.
- AlembicPlugin commit: `91eebc9f88fdd073aad161fc63aa129ffe9c5630` (`refactor: rename host agent analysis surface`).
- AlembicPlugin worktree: clean at review time.
- Core vendor/source pin observed from AlembicPlugin: `vendor/AlembicCore` and `build:check` both used Core `edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.

## Raw Evidence Reviewed

- `git show --stat --oneline --name-status --no-renames 91eebc9f88fdd073aad161fc63aa129ffe9c5630` showed only the intended P13 Plugin surface files:
  - `lib/runtime/host-agent/HostAgentAnalysisSurface.ts`
  - `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`
  - host-agent workflow consumers for cold-start, knowledge-rescan, and dimension-completion
  - MCP output/tool/schema surfaces
  - focused unit tests for surface aliasing, workflow fields, clean output, and linkage.
- `lib/runtime/host-agent/HostAgentAnalysisSurface.ts` is now the real implementation and exports HostAgent-named surface/progress builders.
- `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts` is a compatibility shim that re-exports the HostAgent implementation and aliases old `IDEAgent*` builder/type names to the same objects.
- Cold-start and knowledge-rescan import Core `buildHostAgentAnalysisPacketFromProjectContext` and Plugin `buildHostAgentAnalysisSurface`; both attach `hostAgentAnalysis` and `ideAgentAnalysis` as identity aliases, plus matching meta summaries.
- Dimension completion exposes `hostAgentAnalysisProgress` and preserves `ideAgentAnalysisProgress` as the same object in response data and checkpoints.
- Submit knowledge exposes `hostAgentAnalysisLinkage` and preserves `ideAgentAnalysisLinkage` as the same object.
- Clean-output allowlists include both new and old alias fields for bootstrap, rescan, dimension-complete, and submit-knowledge outputs.
- `moduleMiningRoutes` was not removed; remaining references are the known deferred evolution compatibility field and tests.

## Controller Verification

- `npm run test:unit -- test/unit/HostAgentAnalysisSurface.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/SubmitKnowledgeRouter.test.ts test/unit/HostAgentProjectContextDirectSwitch.test.ts test/unit/McpCleanOutputContract.test.ts`
  - PASS: 6 files, 54 tests.
- `npm run build:check`
  - PASS; Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run lint:repo-boundary`
  - PASS.
- `npm run lint:core-import-boundary`
  - PASS; scanned 441 files and 445 `@alembic/core` imports.
- `npx biome check` on the 14 touched files
  - PASS.
- `git diff HEAD^ HEAD --check && git diff --check`
  - PASS.
- `rg -n "buildIDEAgentAnalysisPacketFromProjectContext|#codex/ide-agent/IDEAgentAnalysisSurface" lib test --glob '!vendor/**' || true`
  - PASS: no old Core builder and no old production import from the shim path.
- AlembicPlugin `git status --short`
  - clean.

## Compatibility And Boundary Findings

- New HostAgent vocabulary is active at the Plugin runtime surface and workflow consumer layer.
- Old IDEAgent names are retained only as R1 compatibility aliases, old response fields, and focused alias tests.
- Frozen public MCP tool names, input fields, response `tool` values, PlanStageId values, job/source/lifecycle strings, coverage ledger schemas, file-change route/source, package versions, release assets, provider config, BiliDili data, Core implementation, and thread ids were not changed by this package.
- `checkpointKind: "ide-agent-analysis-unit-progress"` remains unchanged inside progress payloads. This is treated as a compatibility/frozen payload value rather than a P13 Plugin rename blocker because the task required adding HostAgent-named output fields while preserving old progress compatibility.
- `moduleMiningRoutes` remains deferred to G6 cleanup and is not a P13 Plugin blocker.

## Risks And Residuals

- Alembic `alembic_code_guard` was attempted by the target and failed with the known MCP internal schema error (`unrecognized_keys:data`); no source diagnostic was produced by that tool.
- No real BiliDili or installed Codex plugin runtime scenario was run in this target window. P13 phase acceptance still needs Test coverage for the real host-agent bootstrap/rescan scenario if required by the state root.
- This review accepts only the AlembicPlugin target result. It does not accept the whole P13 phase, G4/G6, P14, or whole demand completion.

## Controller Acceptance

- User goal: continue the Recipe lifecycle naming/layering refactor through P13.
- Scope reviewed: AlembicPlugin runtime HostAgentAnalysis surface rename and compatibility aliases.
- Original requirement authority: state-root P13 task package plus accepted Core and Alembic P13 producer/consumer reviews.
- Target/window: AlembicPlugin / `p13-plugin-hostagent-analysis-surface-rename-t1`.
- Evidence reviewed: target result/report, commit, raw source, grep classification, controller-run focused tests, build, boundary checks, biome, diff checks, clean status.
- Implementation reality: Plugin runtime now uses HostAgentAnalysis implementation/fields while preserving old IDEAgent alias paths and response fields as identity aliases.
- Validation result: controller verification passed.
- Blockers: none for this target package.
- Missing evidence: real BiliDili/plugin runtime scenario remains outside this target package and belongs to the next Test package.
- Residual risks: guard MCP tool internal error; old compatibility fields intentionally remain until G6.
- TODO/backlog rollup: create/dispatch P13 BiliDili REAL-TEST after accepting this target result.
- Decision: accept-target-result.
- Next action: create-next-package for Test P13 BiliDili HostAgentAnalysis runtime parity/real scenario.
