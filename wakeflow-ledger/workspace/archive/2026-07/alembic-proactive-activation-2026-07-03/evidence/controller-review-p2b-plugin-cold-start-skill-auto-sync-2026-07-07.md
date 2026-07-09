# Controller Review: P2b Plugin Cold-Start Skill Auto-Sync

Demand: `alembic-proactive-activation-2026-07-03`
Task: `p2b-plugin-cold-start-skill-auto-sync-t1`
Target: `AlembicPlugin`
Decision candidate: `tc-20260707091217-0029`
Reviewed at: 2026-07-07

## Scope Reviewed

- Task package: `.wakeflow-active/current/alembic-proactive-activation-2026-07-03/task-packages/p2b-plugin-cold-start-skill-auto-sync-p1.json`
- Target result: `.wakeflow-active/current/alembic-proactive-activation-2026-07-03/target-results/tr-p2b-plugin-cold-start-skill-auto-sync-t1.json`
- Product commit: `0762c95dcffbffc81bcaf243220ebde6d3243e85` (`Wire cold-start skill auto-sync`)
- Product files:
  - `AlembicPlugin/lib/recipe-pipeline/generate/dimension-completion.ts`
  - `AlembicPlugin/test/unit/HostAgentDimensionCompletionWorkflow.test.ts`

## Raw Evidence Reviewed

- `persistAndBroadcastDimensionCompletion` now calls `refreshKnowledgeSkillsAfterFinalCompletion` only when `session.isComplete` is true.
- `refreshKnowledgeSkillsAfterFinalCompletion` skips refresh when `updated` is false, returning `{ attempted: false, reason: 'already-complete' }`.
- Default refresh uses `createProjectSkillService(ctx).refreshKnowledgeSkills({ authorizeProjectSkillExport: true })`, so the accepted WS-2 host-aware skill root and WS-5 managed host guidance block path are reused.
- Success response includes additive `knowledgeSkillAutoSync` diagnostics; four knowledge-tool schema/contract tests remained green.
- Tests cover:
  - final completion triggers one refresh after finalizer;
  - partial completion does not refresh;
  - repeated final completion does not refresh twice;
  - Codex exports to `.agents/skills` and writes `AGENTS.md`;
  - Claude Code exports to `.claude/skills` and writes `CLAUDE.md`;
  - no-knowledge and ghost/external dataRoot keep project-root host guidance silent.
- The same commit also mechanically split coverage-ledger helper logic in the touched file. Existing coverage-ledger tests in `HostAgentDimensionCompletionWorkflow.test.ts` still pass, so no behavior regression was found.

## Controller Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts` passed: 19 tests.
- `npx vitest run --config vitest.unit.config.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/ProjectSkillService.test.ts test/unit/ClaudeCodeHostAdapter.test.ts test/unit/McpToolSchemaHonesty.test.ts test/unit/CodexToolPolicy.test.ts test/unit/KnowledgeContextPublicSurfaceGuidance.test.ts` passed: 57 tests.
- `npx vitest run test/integration/ZodToMcpSchema.test.ts` passed: 19 tests.
- `npm run build:check` passed; Core build used `../AlembicCore @ 783b9f52aaa83767f4564ac8489cdfaf445bab35`.
- `npm run check` passed; existing unrelated Biome warnings only, exit 0.
- `git diff --check` passed.
- `git show --check --format=short 0762c95dcffbffc81bcaf243220ebde6d3243e85` passed.

## Evidence Repair

The target result originally contained a stale path-like evidence ref to a non-existent `.md` task package. Wakeflow rejected reduction with `evidence-repair-required`. Controller repaired only that stale ref to the existing task-package JSON path; no product evidence, result status, commit, verification, or risk text was changed. After repair, `wakeflow_review_pack` reported `missingEvidenceRefs: []`, and `wakeflow_reduce_results --apply` created candidate `tc-20260707091217-0029`.

## Decision

Accept target result.

Residual risks remain in later phases:

- P3 SourcePresenceProbe/onboarding is still pending.
- P4 true Codex/Claude Code host-session validation is still pending.
