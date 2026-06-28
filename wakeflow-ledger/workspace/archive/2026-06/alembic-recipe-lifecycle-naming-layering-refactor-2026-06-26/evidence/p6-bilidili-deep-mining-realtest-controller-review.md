# P6 BiliDili DeepMining Real-Test Controller Review

Reviewed at: 2026-06-28T07:03:00+08:00
Controller window: AlembicWorkspace
Dispatch group: p6-bilidili-deep-mining-realtest-p1
Target result: tr-p6-bilidili-deep-mining-realtest-t1

## Verdict

Accept the Test blocked result as valid negative evidence. Do not treat P6 as real-test green.

The Test backfill is complete and reviewable: the controller-return delivery was sent with readback OK, all listed evidence refs exist, and the raw JSON/report evidence proves the assigned P6 real-test gate did not pass. This is not a Test execution failure or missing-evidence case.

## Evidence Reviewed

- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p6-bilidili-deep-mining-realtest-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p6-bilidili-deep-mining-realtest-t1-summary.json`
- Raw initial deepMining run: `Test/tmp/p6-bilidili-deep-mining-realtest-t1-run.json`
- Raw documented bootstrap reset: `Test/tmp/p6-bilidili-deep-mining-realtest-t1-bootstrap-reset.json`
- Raw post-reset deepMining run: `Test/tmp/p6-bilidili-deep-mining-realtest-t1-after-bootstrap-run.json`
- Target result envelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p6-bilidili-deep-mining-realtest-t1.json`

## Findings

- Test ran real BiliDili against accepted Alembic commit `80fa6a5b518847138fbe79acc4e26e551ba356a6`, with DeepSeek generation and local Qwen embedding configuration preserved.
- R-2 safety was reviewed before destructive reset; sibling workspace data-root mtimes were unchanged.
- Initial P6 deepMining job `rescan_mqwycq52_0e7e37ac` completed, but `deepMining.rounds=[]`, API `apiRoundCount=0`, and DB `max(round_index)` stayed `1 -> 1`.
- The documented bootstrap reset job `bootstrap_mqwydoh2_c36cfae3` completed and regenerated recipe/ref state, but DB still had `coverageNonEmpty=15`, `roundRows=1`, and `maxRound=1`.
- Post-reset P6 deepMining job `rescan_mqwyll2m_466afc4e` again completed with advisor `stopReason='diminishing-returns'`, `apiRoundCount=0`, and DB `max(round_index)` stayed `1 -> 1`.
- Core advisor behavior explains the early stop: latest old round had `newRecipesThisRound=2`, while D2 L-tier `k=3`, so `CoverageLedgerAdvisor` returns `diminishing-returns` before a new round opens.
- Alembic `CleanupService.fullReset()` claims DB full reset, but its `ALL_DATA_TABLES` list does not include Core's newer `coverage_ledger` or `deep_mining_rounds` tables. That leaves stale measured coverage and old round state across the documented bootstrap rebuild flow.

## Controller Decision

Decision: `accept-target-result` for the Test blocked evidence only.

P6 real-test remains blocked. The next action is an Alembic repair package for full-reset cleanup coverage of `coverage_ledger` and `deep_mining_rounds`, followed by a P6 Test rerun. This is within the original §12.3/G4/P6 gate because the reset contract and real-test gate are already part of the confirmed execution design; it is not a scope expansion or a Design product decision.
