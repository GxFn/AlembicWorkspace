# Controller Review: fix-agent-deepmining-planselection-modulebindings

- Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Dispatch group: `fix-agent-deepmining-planselection-modulebindings-p1`
- Target task: `fix-agent-deepmining-planselection-modulebindings-t1`
- Target window: `AlembicAgent`
- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-agent-deepmining-planselection-modulebindings-t1.json`
- Target evidence: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/fix-agent-deepmining-planselection-modulebindings-t1-evidence.md`
- Accepted commit under review: `afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf` (`Require module bindings in plan selection`)

## Raw Evidence Reviewed

- `git -C AlembicAgent show --stat --oneline afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf`
- `git -C AlembicAgent show --unified=80 -- src/agent/profiles/definitions/plan.profile.ts src/agent/runs/plan/PlanAgentRun.ts test/plan-agent-run.test.ts`
- `rg -n "assertPlanSelectionStageRequirements|moduleBindings|expectedStage|projectMapModules|moduleSeeds" AlembicAgent/src/agent/profiles/definitions/plan.profile.ts AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts AlembicAgent/test/plan-agent-run.test.ts`
- `git -C AlembicAgent status --short`
- `node --version`
- `npm run test -- test/plan-agent-run.test.ts`
- `npm run build:check`
- `git diff --check afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf^ afe4c2b48ece5475f9fbfdcdd1ac974ad61fedcf`
- `npm run check`

## Controller Findings

The Agent-side repair matches the assigned producer/parser boundary.

- `PlanAgentRun.ts` now imports and uses `assertPlanSelectionStageRequirements(...)` from `@alembic/core/plans`.
- `runPlanAgent(...)` parses LLM output with `{ expectedStage: generationStage }`, so `deepMining` and `moduleMining` no longer accept empty/non-target-producing `moduleBindings` from the Agent producer.
- The plan-selection prompt now supplies bounded ProjectContext module candidates from `projectMapModules`, `moduleSeeds`, `presenterInput.modules`, and `presenterInput.map.modules`, while instructing the model not to invent paths.
- `plan.profile.ts` no longer presents `"moduleBindings": []` as the general example; it explicitly requires real bindings for `deepMining` and `moduleMining` while preserving `coldStart` empty-binding compatibility.
- `test/plan-agent-run.test.ts` adds coverage for real module candidate guidance, valid binding acceptance, empty binding rejection, unknown-dimension rejection, coldStart compatibility, and no-tool runtime behavior.

No adjacent repository files were modified by this target. `AlembicAgent` worktree is clean after controller verification.

## Verification Result

- Node: `v22.22.1`
- Focused test: `npm run test -- test/plan-agent-run.test.ts` passed, 1 file / 10 tests.
- Type check: `npm run build:check` passed.
- Whitespace check: commit diff check passed.
- Repository check: `npm run check` passed, including build, lint/boundary gates, public signature smoke, validation floor, and full Vitest suite (41 files / 294 tests). Biome reported the same existing script warnings already named by target evidence.

The full test run printed fixture prompt-injection/nudge strings as part of existing tests; those strings are not copied here because they are not required acceptance evidence.

## Verdict

Accepted for this package. This fixes the Agent producer/parser side of the plan-selection module-binding contract.

Remaining authorized work is downstream:

- The Alembic mainbody consumer must still enforce the same stage-aware plan-selection gate at the execution boundary before retrying direct BiliDili verification.
- After mainbody repair is accepted, Test must rerun the direct BiliDili chain with DeepSeek as generation provider and Ollama/Qwen as embedding provider.
