# Controller Acceptance: fix-agent-planselection-runtime-modelref-p1

Date: 2026-06-27
Controller: AlembicWorkspace
Demand: alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26
Dispatch group: fix-agent-planselection-runtime-modelref-p1
Target task: AlembicAgent / fix-agent-planselection-runtime-modelref-t1

## User Goal

Continue the mainbody lifecycle real verification follow-up after direct
BiliDili verification exposed an AlembicAgent cold-start blocker. The final
demand is not complete until BiliDili runs the true end-to-end chain again and
the DB evidence proves coverage ledger writeback plus downstream lifecycle
behavior.

## Scope Reviewed

This acceptance only covers the AlembicAgent rework package created from the
direct BiliDili blocker:

- preserve tagged Ollama model ids such as `ollama:gemma3:4b`;
- make `plan-selection` perform a real no-tool LLM call and return valid
  PlanSelection JSON;
- do not synthesize fake plans;
- do not loosen `assertPlanSelectionShape`;
- do not weaken Alembic's hard plan gate.

## Raw Evidence Reviewed

- Target result envelope:
  `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-agent-planselection-runtime-modelref-t1.json`
- Target evidence:
  `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/fix-agent-planselection-runtime-modelref-t1-evidence.md`
- AlembicAgent commit:
  `a98a22871a7ff883da69cb9b691845a6789eadb5 Fix plan selection model routing`
- Changed files:
  `AlembicAgent/src/ai/gateway/LLMGateway.ts`
  `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts`
  `AlembicAgent/test/LLMGateway.test.ts`
  `AlembicAgent/test/plan-agent-run.test.ts`

## Implementation Reality

- `LLMGateway` now splits model refs at the first colon only, so
  `ollama:gemma3:4b` keeps `gemma3:4b` as the provider model id.
- `plan-selection` budget changed from `maxIterations: 1` to `maxIterations: 2`.
  Based on the runtime failure evidence, this allows one real first LLM turn
  before the BudgetPolicy pre-iteration stop, avoiding the previous zero-LLM
  forced-summary path.
- Tests cover:
  - tagged Ollama model id in the outbound request body;
  - a real `AgentService` + `AgentRuntimeBuilder` run that returns valid
    PlanSelection JSON from exactly one no-tool provider call;
  - invalid JSON / invalid shape rejection through the existing parser path.
- Core PlanSelection assertion and Alembic's consumer gate were not modified.

## Controller Validation

Ran locally in `AlembicAgent` with Node `v22.22.1`:

- `npm run test -- test/LLMGateway.test.ts test/plan-agent-run.test.ts`
  - result: 2 files passed, 11 tests passed.
- `npm run build:check`
  - result: passed.
- `npm run check`
  - result: passed; 41 test files passed, 291 tests passed.
  - note: existing four Biome warnings in scripts remained warnings.
- `git diff --check`
  - result: passed.
- `git status --short --branch`
  - result: `main...origin/main [ahead 1]`, no unstaged or uncommitted changes.

The full test output includes prompt-injection fixture strings from existing
tests; those are treated as test data and are not copied into progress text.

## Decision

Accept target result for AlembicAgent rework.

## Remaining Gap

The demand is still not complete. The next required loop is Test direct BiliDili
real verification after rebuilding/restarting the consumer process so it picks
up AlembicAgent commit `a98a22871a7ff883da69cb9b691845a6789eadb5`.
