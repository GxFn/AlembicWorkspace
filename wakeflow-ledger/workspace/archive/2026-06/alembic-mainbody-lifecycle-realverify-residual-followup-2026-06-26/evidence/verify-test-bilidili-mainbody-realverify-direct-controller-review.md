# Controller Review: verify-test-bilidili-mainbody-realverify-direct-p1

Date: 2026-06-27
Controller: AlembicWorkspace
Demand: alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26
Dispatch group: verify-test-bilidili-mainbody-realverify-direct-p1
Target task: Test / verify-test-bilidili-mainbody-realverify-direct-t1

## Decision

Do not accept or archive. Reduce the Test result as product rework.

The direct BiliDili verification honored the user's scope change to run against
the real BiliDili test project instead of a sandbox, but the chain stopped before
fresh recipes, coverage ledger writes, deep mining rounds, module mining, or
evolution could run. This is a product-code blocker, not a Test ownership
blocker.

## Raw Evidence Reviewed

- Test blocked report:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-direct-t1/evidence/direct-realverify-blocked-report.md`
- Final DB/runtime snapshot:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-direct-t1/evidence/final-sql-and-runtime-snapshot.json`
- Cold-start timelines:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-direct-t1/evidence/cold-start-process-timeline.json`
  `Test/tmp/verify-test-bilidili-mainbody-realverify-direct-t1/evidence/cold-start-process-timeline-llama3.json`
- Daemon error tail:
  `Test/tmp/verify-test-bilidili-mainbody-realverify-direct-t1/evidence/daemon-error-tail.log`
- Target result envelope:
  `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-direct-t1.json`

## Facts

- Direct boundary was applied to the real BiliDili test project:
  project root `BiliDili`, data root `.asd/workspaces/02a25032`.
- Old generated Alembic data was cleared for a fresh run.
- BiliDili source remained clean and unedited.
- Repositories were clean at the tested commits:
  BiliDili `6f1bf34cf1b6daca4e08895db211939115dac868`,
  Alembic `4c2ef77647e33789f0a3052c13b11e4996763197`,
  AlembicCore `c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3`,
  AlembicPlugin `99315965f77dc6ffb6e6102c97629a953a3f0acf`.
- First cold-start attempt failed before generation because the configured
  `gemma3:4b` Ollama model tag was routed as `gemma3`, producing
  `model 'gemma3' not found`.
- Second cold-start attempt with `ALEMBIC_AI_MODEL=llama3` reached Ollama and
  wrote one token usage row, but failed the plan-selection gate with:
  `Invalid PlanSelection: generationStage must be coldStart, deepMining, or moduleMining; dimensions must be an array; scale.totalRecipeBudget must be > 0`.
- Final direct DB counts remained zero for `knowledge_entries`,
  `coverage_ledger`, `deep_mining_rounds`, `recipe_source_refs`,
  `evolution_proposals`, `recipe_warnings`, `lifecycle_transition_events`, and
  `semantic_memories`; `token_usage` had one row.
- Timelines show `AgentService` ran profile `plan-selection`, then
  `ExitController` hit `policy_stop` / max iterations and `ForcedSummary`
  produced a non-contract output. No valid PlanSelection reached the Alembic
  cold-start gate.

## Source Attribution

The blocker belongs first to AlembicAgent:

- `AlembicAgent/src/ai/gateway/LLMGateway.ts` parses provider/model refs with
  a split that drops Ollama model tag suffixes such as `:4b`.
- `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts` relies on the
  `plan-selection` profile returning parseable PlanSelection JSON.
- `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts` configures
  the `plan-selection` profile with `maxIterations: 1`; the direct run evidence
  shows this path stopped before a valid no-tool LLM PlanSelection was produced.
- `Alembic/lib/daemon/DaemonJobRunner.ts` correctly hard-fails invalid
  PlanSelection at the cold-start gate. That gate must not be weakened.

## Required Next Step

Create a rework package for AlembicAgent to fix:

1. Model ref parsing so `ollama:gemma3:4b` preserves `gemma3:4b` as the Ollama
   model id while preserving existing provider-prefixed refs.
2. The `plan-selection` runtime/profile path so `runPlanAgent` performs a real
   no-tool LLM call and returns a parseable PlanSelection JSON object that
   passes `assertPlanSelectionShape`.

Do not synthesize a fake plan, do not loosen `assertPlanSelectionShape`, and do
not weaken Alembic's plan-selection gate.
