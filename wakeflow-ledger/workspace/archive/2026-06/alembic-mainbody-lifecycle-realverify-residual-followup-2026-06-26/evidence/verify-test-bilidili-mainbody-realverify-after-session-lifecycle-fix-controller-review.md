# Controller Review: verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix

## Conclusion

Decision: accept Test's blocked evidence, not the demand. The direct BiliDili run proves the previous completed-coldStart session lifecycle blocker is fixed: fresh coldStart completed, active bootstrap sessions were empty after coldStart, and the following deepMining job completed without `Bootstrap already in progress` or an active-session lease failure.

The real verification chain still fails the original demand. DeepMining produced zero recipes and left every coverage ledger cell `grade=empty` / `covered_count=0`, so the finding#1 completion gate is still unmet. The run then continued to moduleMining and hit a second product/runtime blocker in AlembicAgent: `Cannot read properties of undefined (reading 'name')` from the moduleMining child path.

## Reviewed Evidence

- `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/session-lifecycle-realverify-summary.md`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/job-deepmining-after-session-lifecycle-fix.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/job-events-deepmining-after-session-lifecycle-fix.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/after-deepmining-after-session-lifecycle-fix-db-snapshot.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/bootstrap-active-sessions-after-coldstart.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/bootstrap-active-sessions-after-deepmining.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/modulemining-after-session-lifecycle-fix-job-run.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/job-modulemining-after-session-lifecycle-fix.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-session-lifecycle-fix-t1/evidence/job-events-modulemining-after-session-lifecycle-fix.json`
- Source check: `Alembic/lib/daemon/DaemonJobRunner.ts`
- Source check: `AlembicAgent/src/agent/runs/module/ModuleMiningAgentRun.ts`
- Source check: `AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts`
- Source check: `AlembicAgent/src/agent/profiles/definitions/module.profile.ts`
- Source check: `AlembicAgent/src/agent/profiles/AgentStageFactoryRegistry.ts`

## Facts Verified

- Test used the direct BiliDili project as authorized, with DeepSeek for generation/planning and Ollama `qwen3-embedding:0.6b` for embeddings.
- Alembic live runtime was rebuilt from commit `e88cc82f9f35b952db89aa4d04ebf84cdb2afb95` and restarted.
- ColdStart job `bootstrap_mqwlpn4i_90db78fa` completed with classification `pass`.
- DB after coldStart: `knowledge_entries=8`, `recipe_source_refs=12`, `semantic_memories=17`, `coverage_ledger=0`, `deep_mining_rounds=0`, `token_usage=29`.
- `bootstrap-active-sessions-after-coldstart.json` contains an empty `sessions` array.
- DeepMining job `rescan_mqwlzifz_af8b574d` completed with `error=null`, selected 10 execution dimensions and 6 module-scope paths, and did not reproduce the prior active-session lease failure.
- DeepMining DB after the run: `coverage_ledger=32`, `deep_mining_rounds=1`, `knowledge_entries=8`, `semantic_memories=0`, `token_usage=33`.
- The deepMining round recorded `newRecipesThisRound=0`, `stopReason=diminishing-returns`, and sampled coverage rows all had `covered_count=0`, `grade=empty`, `covered_source_refs=[]`.
- After deepMining, a new active bootstrap session remained with no completed dimensions. It did not block this run, but it is lifecycle residue that should be reviewed after the primary coverage failure is repaired.
- ModuleMining job `rescan_mqwm14ji_be97e391` failed after the plan gate with `Module mining agent failed with status error: Cannot read properties of undefined (reading 'name')`.
- The moduleMining stack points to `AlembicAgent/dist/agent/runs/module/ModuleMiningAgentRun.js` and then `Alembic/dist/lib/daemon/DaemonJobRunner.js`.
- Source check shows Alembic mainbody passes selected module payloads with canonical `moduleName`, `moduleId`, `modulePath`, `ownedFiles`, and dimensions.
- Source check shows AlembicAgent `module-mining-dimension` currently reuses `bootstrapDimensionPipeline`, which expects dimension-style context; this matches the `.name` child-path failure.
- Test secret scan reported no matches, and Test reported clean `git status --short` for BiliDili, Alembic, AlembicCore, AlembicAgent, and AlembicPlugin.

## Controller Judgment

The session lifecycle fix is proven by live BiliDili evidence and can stay accepted. The demand is not complete because the original finding#1 gate is still failing in the true run: coverage rows exist but no useful recipe coverage is written, and the run stops as diminishing-returns instead of producing partial/covered cells or converging.

There are two in-scope repair tracks:

1. Alembic mainbody deepMining coverage/production repair: determine why `runKnowledgeRescanWorkflow` produced zero recipes and left the ledger empty in a real BiliDili deepMining round. Repair only inside the confirmed mainbody lifecycle path unless raw evidence proves the root cause is in Core or Agent. Respect the earlier FIX boundary: do not casually change `ensureCoverageLedgerCells` or `adviseCoverageLedger`; if the only viable fix requires those previously excluded primitives, stop and return a hard gate for controller/user/Design decision.
2. AlembicAgent moduleMining child profile repair: fix moduleMining fan-out child context so canonical `moduleName` module payloads from Alembic mainbody run without `.name` crashes. Do not ask Alembic mainbody to rename fields as a compatibility crutch when Agent can normalize/own the child profile contract.

## Forbidden Conclusions

- Do not mark the overall demand complete.
- Do not send Test to rerun the same chain before product fixes land.
- Do not treat `coverage_ledger=32` as success; all sampled cells are still empty with zero covered refs.
- Do not treat moduleMining failure as the only remaining blocker; deepMining finding#1 remains the primary completion blocker.
