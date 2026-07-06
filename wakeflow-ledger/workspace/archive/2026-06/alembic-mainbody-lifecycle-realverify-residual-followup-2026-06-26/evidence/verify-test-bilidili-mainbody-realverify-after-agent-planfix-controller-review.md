# Controller Review: after-agent-planfix Test run

Date: 2026-06-27

## Controller Acceptance

- User goal: finish `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26` by proving the direct BiliDili mainbody lifecycle loop after the coverage-ledger writeback fix.
- Scope reviewed: Test target result `verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1`.
- Original requirement authority: direct BiliDili verification remains required; anti-fabrication and quality gates must not be relaxed; Ollama/Qwen is for vector embeddings, not the generation/planning LLM for this verification run.
- Target/window: Test.
- Evidence reviewed:
  - `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1/evidence/fresh-coldstart-blocker-summary-after-agent-planfix.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1/evidence/job-bootstrap-fresh-after-agent-planfix.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1/evidence/job-events-bootstrap-fresh-after-agent-planfix.json`
  - `Test/tmp/verify-test-bilidili-mainbody-realverify-after-agent-planfix-t1/evidence/db-after-agent-planfix-fresh-coldstart-failure.json`
- Implementation reality: AlembicAgent model-ref split fix was present and Test rebuilt Agent at `a98a228`, but the verification daemon was restarted with generation provider `ollama` and model `gemma3:4b`. The run reached one LLM call, then failed at the coldStart plan gate with `Plan agent returned generationStage=deepMining for coldStart`.
- Validation result: this result does not prove the intended DeepSeek-based coldStart behavior. It proves only that the misconfigured Ollama/gemma3 generation run fails before any generated data exists.
- Blockers: Test environment/provider selection was wrong for generation/planning. The direct BiliDili verification must be rerun with DeepSeek for generation/planning and Ollama/Qwen only for embeddings.
- Missing evidence: no valid DeepSeek run evidence yet; no coverage-ledger/deepMining/moduleMining/evolution/anti-fab proof yet because the invalid run stopped before coldStart completed.
- Residual risks: the missing LLM IO/final session payload warning remains a diagnosability weakness, but it is not the current acceptance gate.
- TODO/backlog rollup: do not create an AlembicAgent product rework from this invalid environment run. Reroute to Test with corrected provider configuration first.
- Decision: request-rework for the Test verification package, scoped to rerun under the corrected provider split.
- Next action: dispatch `verify-test-bilidili-mainbody-realverify-deepseek-config-p1` to Test.
