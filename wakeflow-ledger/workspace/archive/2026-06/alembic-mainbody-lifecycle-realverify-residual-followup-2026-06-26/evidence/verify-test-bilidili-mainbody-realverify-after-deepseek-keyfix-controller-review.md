# Controller Review: verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix

## Conclusion

Decision: rework required. Test did run the direct BiliDili verification after DeepSeek key repair. The DeepSeek provider path is no longer blocked, coldStart completed, and the next blocker is a product/Agent integration contract gap before deepMining can create rounds or write coverage ledger cells.

## Reviewed Evidence

- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/deepseek-key-reconfig-realverify-summary.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/provider-split-redacted-after-key-reconfig.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/job-bootstrap-after-key-reconfig.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/job-events-bootstrap-after-key-reconfig.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/after-coldstart-after-key-reconfig-db-snapshot.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/job-deepmining-after-key-reconfig.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/job-events-deepmining-after-key-reconfig.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/deepmining-files-after-key-reconfig/rescan_mqwikcmc_4c1a3f6c.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-deepseek-keyfix-t1/evidence/deepmining-files-after-key-reconfig/snapshot.json`
- `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts`
- `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts`
- `AlembicAgent/test/plan-agent-run.test.ts`
- `AlembicCore/src/service/planIntent/planIntent.ts`
- `Alembic/lib/daemon/DaemonJobRunner.ts`

## Facts

- Provider split is correct after key repair: generation and planning use DeepSeek; embedding remains Ollama/Qwen.
- Test cleared generated BiliDili Alembic tables before the fresh run.
- coldStart completed and persisted real generated data for BiliDili:
  - `knowledge_entries=8`
  - `recipe_source_refs=21`
  - `semantic_memories=14`
  - `token_usage=26`
- deepMining was then triggered through `/api/v1/jobs/rescan` with `generationStage=deepMining` and `miningMode=deepMining`.
- deepMining failed before any round or coverage writeback:
  - job status: `failed`
  - error: `deepMining requires plan moduleBindings with module×dimension targets.`
  - direct DB evidence after failure still has `coverage_ledger=0` and `deep_mining_rounds=0`.
- Mainbody plan gate selected executable dimensions but produced empty module scope / no module bindings.

## Code Evidence

- `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts:25-27` shows the plan-selection profile example output with `"moduleBindings": []`.
- `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts:61-67` parses the Agent reply and only calls `assertPlanSelectionShape`.
- `AlembicAgent/test/plan-agent-run.test.ts:24-30` constructs test PlanSelection payloads with `moduleBindings: []`, and tests at lines 50-70 accept that shape.
- `AlembicCore/src/service/planIntent/planIntent.ts:40-73` validates stage, dimensions, and scale, but does not require non-empty `moduleBindings`.
- `Alembic/lib/daemon/DaemonJobRunner.ts:1043-1051` runs the deepMining plan gate and immediately builds the deepMining round plan context.
- `Alembic/lib/daemon/DaemonJobRunner.ts:1793-1814` converts `selection.moduleBindings` into module-dimension targets and throws when the resulting target list is empty.

## Controller Judgment

The Test callback is valid. It was not a failure to use DeepSeek; it was the first deepMining execution blocker discovered after DeepSeek became usable. Test cannot patch AlembicCore, AlembicAgent, or Alembic mainbody, and should not keep retrying the same BiliDili run until the owning product windows repair the plan-selection contract.

## Required Rework Direction

- Core: expose/strengthen a deepMining/moduleMining PlanSelection contract so the shape cannot pass without valid module bindings and module-dimension targets when the stage requires them.
- AlembicAgent: update plan-selection prompt/profile/tests so deepMining and moduleMining replies must produce real module bindings from ProjectContext facts, not `moduleBindings: []`.
- Alembic mainbody: consume the stricter contract at the plan gate and fail before claiming plan-gate success when stage-required module bindings are absent; keep diagnostics actionable.
- After the repairs land, rerun direct BiliDili verification with DeepSeek for generation/planning and Ollama/Qwen for embeddings, continuing from coldStart -> deepMining -> moduleMining -> evolution -> anti-fabrication evidence.

## Forbidden Conclusion

Do not accept the mainbody lifecycle follow-up based on coldStart success. The core finding#1 gate remains unproven until direct BiliDili deepMining writes coverage ledger cells, produces deep mining rounds, and reaches the designed coverage behavior without relaxing quality gates.
