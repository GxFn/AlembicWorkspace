# Controller Review: DeepSeek-config Test run

Date: 2026-06-27

## Controller Acceptance

- User goal: finish `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26` by proving the direct BiliDili mainbody lifecycle loop after the coverage-ledger writeback fix.
- Scope reviewed: Test target result `verify-test-bilidili-mainbody-realverify-deepseek-config-t1`.
- Original requirement authority: direct BiliDili verification remains required; DeepSeek is the generation/planning provider for this run; Ollama/Qwen is only for embedding/vector semantics; anti-fabrication and quality gates must not be relaxed.
- Target/window: Test.
- Evidence reviewed:
  - `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-deepseek-config-t1.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/deepseek-coldstart-blocker-summary.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/provider-split-redacted-before-restart.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/job-bootstrap-deepseek.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/job-events-bootstrap-deepseek.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/job-display-snapshot-bootstrap-deepseek.http.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/after-coldstart-deepseek-failure-db-snapshot.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-deepseek-config-t1/evidence/bootstrap-files/combined.log`
- Implementation reality: Test corrected the provider split. The daemon started with `DeepSeekProvider` for generation/planning and dedicated Ollama embedding. The coldStart plan-selection LLM call attempted `deepseek:deepseek-v4-pro`, then failed with DeepSeek API `401` authentication failure for the configured key. The downstream `Invalid PlanSelection` hard-gate failure is a consequence of the failed AI call and forced-summary path, not a proven valid-DeepSeek PlanSelection behavior defect.
- Validation result: the intended DeepSeek-based coldStart did not actually execute with a valid provider response. Generated tables remained zero, including `knowledge_entries`, `coverage_ledger`, `deep_mining_rounds`, `recipe_source_refs`, `evolution_proposals`, `lifecycle_transition_events`, `semantic_memories`, `sessions`, and `token_usage`.
- Blockers: valid DeepSeek authentication/configuration is missing. This is an external/user configuration blocker for the real verification loop.
- Missing evidence: no successful DeepSeek generation/planning call; no coldStart output; no coverage-ledger/deepMining/moduleMining/evolution/anti-fab proof.
- Residual risks: Alembic/AlembicAgent currently surfaces the auth failure as an invalid PlanSelection hard-gate error after forced summary, which is diagnostically weak. That may deserve a product follow-up, but it is not the next verification step until DeepSeek authentication is valid.
- TODO/backlog rollup: keep the demand blocked for user/config repair. Do not dispatch another product-code rework from this run; first obtain a valid DeepSeek key/config and rerun the same direct Test.
- Decision: mark-blocked.
- Next action: user or local operator must provide/fix the DeepSeek API key for BiliDili/Alembic runtime; then rerun the same Test package under the corrected provider split.
