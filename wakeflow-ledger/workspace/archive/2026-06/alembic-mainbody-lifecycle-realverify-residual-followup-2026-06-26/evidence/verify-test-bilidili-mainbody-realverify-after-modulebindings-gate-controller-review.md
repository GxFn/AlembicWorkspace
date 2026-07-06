# Controller Review: verify-test-bilidili-mainbody-realverify-after-modulebindings-gate

## Conclusion

Decision: accept blocked evidence and route product rework. The direct BiliDili run consumed the Core/Agent/Alembic moduleBindings repairs: deepMining no longer failed on empty `moduleBindings`, and the plan gate selected real deepMining dimensions plus non-empty module scope. The next blocker is a bootstrap session lease lifecycle defect across fresh coldStart -> rescan/deepMining.

## Reviewed Evidence

- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/modulebindings-gate-realverify-summary.md`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/deepmining-after-modulebindings-gate-job-run.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/job-deepmining-after-modulebindings-gate.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/job-events-deepmining-after-modulebindings-gate.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/after-fresh-coldstart-after-modulebindings-gate-db-snapshot.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/after-deepmining-failure-after-modulebindings-gate-db-snapshot.json`
- `Test/tmp/verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1/evidence/bootstrap-active-sessions-after-deepmining-failure.json`
- `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-modulebindings-gate-t1.json`

## Facts

- Test used the intended provider split: DeepSeek for generation/planning and Ollama `qwen3-embedding:0.6b` for embeddings, with secrets redacted in evidence.
- Fresh coldStart completed on direct BiliDili:
  - job `bootstrap_mqwkgtp2_dea5ce50`
  - classification `pass`
  - retained events: 61
  - post-coldStart DB counts: `knowledge_entries=4`, `recipe_source_refs=15`, `semantic_memories=10`, `coverage_ledger=0`, `deep_mining_rounds=0`, `token_usage=21`
- DeepMining job `rescan_mqwkmo3x_01cc3a43` reached plan gate and recorded:
  - `generationStage=deepMining`
  - 6 execution dimensions: `architecture`, `coding-standards`, `networking-api`, `ui-interaction`, `data-event-flow`, `error-resilience`
  - non-empty module scope for `Sources/Infrastructure/Networking`, `Sources/Features/Home`, `Sources/Features/LiveChat`, and `Packages/AOXFoundationKit/Sources/AOXFoundationKit`
- The previous blocker, `deepMining requires plan moduleBindings with modulexdimension targets`, was not reproduced.
- DeepMining then failed when `runKnowledgeRescanWorkflow` attempted to create a bootstrap workflow session while a fresh coldStart active session still existed for the same BiliDili project.
- Error stack points through:
  - `AlembicCore/dist/workflows/capabilities/host-agent/BootstrapSession.js`
  - `Alembic/dist/lib/workflows/project-context/ProjectContextWorkflowFacts.js`
  - `Alembic/dist/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.js`
  - `Alembic/dist/lib/daemon/DaemonJobRunner.js`
- Post-failure DB counts show partial progress but not the full verification chain:
  - `coverage_ledger=14`
  - `deep_mining_rounds=1`
  - `knowledge_entries=4`
  - `semantic_memories=0`
  - `token_usage=22`
- Active-session evidence after failure contains a still-active session for BiliDili with an expiry in the future, proving the direct chain still has a lease lifecycle blocker.

## Controller Judgment

The Test callback is valid. It ran the intended direct BiliDili path far enough to prove the moduleBindings gate repair was consumed by the live runtime. Test correctly stopped at the first remaining product/runtime blocker. This is not a Test environment issue and not a BiliDili source issue.

The owner path is cross-repository:

- AlembicCore owns `BootstrapSessionManager` lease lifecycle semantics.
- Alembic mainbody owns the workflow call sites that create/use bootstrap workflow sessions during coldStart and rescan/deepMining.

## Required Rework Direction

- Core: repair bootstrap session lease lifecycle so a completed coldStart does not leave a same-project active session that blocks subsequent rescan/deepMining, or expose a safe complete/release/replace path for workflow callers.
- Alembic mainbody: consume the repaired Core lifecycle at `ProjectContextWorkflowFacts`, `KnowledgeRescanWorkflow`, and/or `DaemonJobRunner.runDeepMiningRounds` so direct coldStart -> deepMining can proceed without manual active-session deletion.
- Preserve quality gates, anti-fabrication, plan-selection stage validation, coverage-ledger writeback, and no-fallback-to-full semantics.
- Add tests proving completed bootstrap workflow sessions are released/closed and same-project deepMining can proceed after coldStart without deleting test data by hand.
- Rerun direct BiliDili verification after repair, continuing to moduleMining, evolution/maintenance, and anti-fabrication rejection once this blocker is removed.

## Forbidden Conclusion

Do not accept the overall mainbody lifecycle follow-up yet. The real BiliDili chain has not reached moduleMining, evolution/maintenance, or anti-fabrication probes. The current result only closes the previous moduleBindings blocker and opens a narrower bootstrap session lifecycle rework.
