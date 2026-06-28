# P6 BiliDili DeepMining Rerun After Full Reset Repair Controller Review

Reviewed at: 2026-06-28T07:58:00+08:00
Controller window: AlembicWorkspace
Dispatch group: p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-p1
Target result: tr-p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1

## Verdict

Accept the Test completed result as fresh P6 in-process real-test evidence.

This closes the specific repair rerun loop opened by the earlier P6 blocker: Alembic full reset now clears stale `coverage_ledger` and `deep_mining_rounds`, and the following real BiliDili in-process deepMining run opens/closes fresh rounds, writes measured coverage, and terminates through the advisor.

This does not accept host-agent parity, P7+, or whole-demand completion.

## Evidence Reviewed

- Target result: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1.json`
- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-summary.json`
- Raw qwen-fixed bootstrap reset: `Test/tmp/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-qwen-fixed-bootstrap-reset.json`
- Raw qwen-fixed deepMining run: `Test/tmp/p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-t1-qwen-fixed-deepmining.json`
- Runtime log: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log`
- Requirement authority: `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` §A.2, §A.3, §12.2 P6, §12.3 Chain 3/G4.

## Findings

- Test reran real BiliDili against Alembic commit `9d703a3fa8a6f7cbabb1d02ec5d968e2c399a3d1`.
- Runtime provider routing matches the user-approved direct-test setup: DeepSeek for in-process generation and local Qwen/Ollama for embeddings. The corrected daemon restart showed 0 Ollama 404 warnings after cutoff.
- R-2/root guard was checked before the destructive reset. The report records BiliDili project root, data root, DB path, and unchanged sibling data-root stats.
- Before the final qwen-fixed reset, Test observed stale measured state: `coverage_ledger=30` rows and `deep_mining_rounds=2`.
- After the qwen-fixed bootstrap/full reset, `coverage_ledger=0` and `deep_mining_rounds=0`, proving the Alembic reset repair cleared the two tables that blocked the earlier P6 run.
- The following deepMining job `rescan_mqx0clkl_7f1b2743` completed with two fresh daemon-job-runner rounds: round 1 produced 3 recipes and continued, round 2 produced 0 recipes and stopped with `diminishing-returns`.
- Post-deepMining DB evidence shows `coverage_ledger=50`, including 15 fresh measured rows with `last_round` evidence, and `deep_mining_rounds=2` with max round 2.
- No product code edits or manual DB mutation were performed by Test.

## Controller Decision

Decision: `accept-target-result` for the assigned Test rerun.

P6 in-process/G4 evidence is now green for the repaired reset-plus-deepMining path: reset clears stale state, fresh rounds advance, measured coverage is non-empty, and advisor termination is observed on the real BiliDili workspace.

Host-agent parity was not rerun in this dispatch. That absence is explicitly reported and is acceptable for this repair rerun because §12.2 P6's stage gate is in-process deepMining round plus G4 coverage preservation. It is not acceptable as a substitute for the broader §12.3/§A completion definition: Chain 3 parity still requires host-vs-in-process comparison, with documented allowance for round-driving differences.

Next action: keep progressing the P1-P15 sequence, but do not mark final 6-chain parity or whole-demand completion from this result. Host-agent Chain 3 parity must be proven at the later parity gate or by an explicit dedicated package before any twin/shim removal or final demand acceptance.
