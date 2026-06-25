# RG-10 Plugin Commit-Driven Evolution SourceRef Repair Controller Review

Date: 2026-06-22
Controller: AlembicWorkspace
Dispatch group: `rg10-plugin-commit-driven-evolution-source-ref-repair-p1`
Task: `rg10-plugin-commit-driven-evolution-source-ref-repair-t1`
Target: AlembicPlugin

## Controller Acceptance

- User goal: remove the product blocker found by RG-10 Test retry-2 so the real BiliDili acceptance chain can be rerun.
- Scope reviewed: AlembicPlugin TargetResultEnvelope, evidence repair result, task package, Test retry-2 controller review, commit diff, changed implementation files, changed tests, and controller-rerun validation.
- Original requirement authority: RG-10 still requires the real BiliDili four-step Test acceptance. This Plugin repair can only remove the commit-driven unified evolution blocker; it is not final demand completion.
- Target/window: AlembicPlugin stayed inside Plugin public MCP workflow and orchestration surfaces. It did not edit Test, and did not claim final Test acceptance.
- Evidence reviewed: target result `tr-rg10-plugin-commit-driven-evolution-source-ref-repair-t1.json`, evidence repair result `tr-rg10-plugin-commit-driven-evolution-source-ref-repair-t1-evidence-repair-1.json`, AlembicPlugin commit `26361f24e006915cb5e83004aa81f7c192471b45`, and the eight changed files in `AlembicPlugin/`.
- Implementation reality: `alembic_rescan` now routes git-diff evidence through Plugin unified evolution. The workflow records `gitDiffEvidence`, routes events to `FileChangeHandler`, projects `unifiedEvolution`, `pendingProposals`, `generationChangeLog`, and `recommendations` through clean MCP output, preserves module-mining module scope across requested scope, Plan actions, bindings, and gaps, and removes the prior test-mode single-module truncation.
- Behavior evidence: `FileChangeHandler` now emits lifecycle/change-log entries for source-ref repair, source-modified review/reference events, stale refs, deprecation proposals, and new-module recommendations. It returns pending proposal signals for modified/deleted/low-confidence rename routes. High-confidence rename repairs source refs to the new path and records a `source-ref-repaired` change-log entry.
- Behavior evidence: `PlanDrivenGenerationGate.test.ts` adds an RG-10 style moduleMining rescan fixture that initializes git, renames a source file, adds a new module, confirms a Plan with module bindings and planned module paths, seeds a Recipe sourceRef, runs `alembic_rescan`, verifies moduleScope preserves both planned modules, verifies unified evolution is routed, verifies sourceRef moved from the old path to the new path, and verifies the new-module recommendation appears in `generationChangeLog`.
- Validation result: Controller reran `npm run test -- test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts` -> 3 files / 36 tests passed. Controller reran `npm run test -- test/unit/McpCoreToolsCleanOutputContract.test.ts` -> 1 file / 7 tests passed. Controller reran `npm run build:check` -> passed with Core `b18754d1ff238613af8619c294787f6a4ca6d4d8`. Controller reran `git diff --check HEAD~1..HEAD` -> passed. Controller reran changed-file Biome -> 8 files passed. Controller reran `npm run lint` -> exit 0 with pre-existing unrelated warnings. Controller ran Alembic Guard `guard-public-mqos6qqg-1` -> 8 files, 0 violations.
- Evidence repair: the original TargetResultEnvelope used command strings as `evidenceRefs` and included a long commit-hash typo (`26361f21...`). Controller verified the real commit is `26361f24e006915cb5e83004aa81f7c192471b45` and recorded evidence repair with reviewable file refs. This is a backfill hygiene issue, not a code blocker.
- Blockers: None for this AlembicPlugin repair package.
- Missing evidence: Full real BiliDili RG-10 acceptance has not been rerun after this Plugin repair.
- Residual risks: `npm run lint` still prints pre-existing unrelated warnings in `ClaudeCodeHostAdapter` and scripts while exiting 0. The real BiliDili chain must still prove that the public MCP runtime sees rename repair, logic proposal/changeLog, new-module recommendation, moduleScope preservation, and vector degradation together.
- TODO/backlog rollup: Accept this Plugin repair. Create a new Test retry package using accepted AlembicPlugin commit `26361f24e006915cb5e83004aa81f7c192471b45` and accepted AlembicCore commit `b18754d1ff238613af8619c294787f6a4ca6d4d8`; Test should rerun the real BiliDili four-step chain and stop on first blocker with raw evidence.
- Decision: accept-target-result.
- Next action: create-next-package for RG-10 Test BiliDili acceptance retry after this product repair.

## Raw Evidence Notes

- Commit: `26361f24e006915cb5e83004aa81f7c192471b45` (`26361f2 fix rg10 rescan commit evolution routing`).
- Changed implementation files: `lib/recipe-generation/evolution/FileChangeHandler.ts`, `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts`, `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`, `lib/recipe-generation/plan-generation-gate.ts`, `lib/runtime/mcp/core-tools/output.ts`.
- Changed test files: `test/unit/FileChangeHandler.test.ts`, `test/unit/PlanDrivenGenerationGate.test.ts`, `test/unit/PluginOpportunisticEvolution.test.ts`.
- Controller-rerun focused tests: 36/36 passed; clean-output contract 7/7 passed.
- Controller-rerun build and checks: `build:check`, `git diff --check`, changed-file Biome, `npm run lint`, and Alembic Guard all non-blocking.
